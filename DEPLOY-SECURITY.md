# Deploy & External Security Layers

Guía para llevar el hardening del repo a producción y agregar las capas externas que el repo no puede controlar por sí solo.

---

## 1. Migrar de GitHub Pages a un host con headers

**Diagnóstico actual**: `www.mineconnect.com.ar` responde con `server: GitHub.com` + `x-github-request-id`. GitHub Pages **NO soporta custom headers**, lo que vuelve inertes `_headers`, `netlify.toml`, `vercel.json` y `.htaccess`.

El apex `mineconnect.com.ar` (vía Vercel) redirige 301 a `www.` (GitHub Pages). Hay que mover `www.` a un host con soporte para headers.

### Opción A — Cloudflare Pages (recomendada)

**Por qué**: el DNS ya está en Cloudflare; Pages se integra sin cambios de nameservers; lee `_headers` automáticamente; ancho de banda ilimitado en plan free.

Pasos:

1. Dashboard Cloudflare → **Workers & Pages → Create application → Pages → Connect to Git**.
2. Seleccionar el repo `mineconnect/sat`, branch `master`.
3. Build settings:
   - **Framework preset**: None
   - **Build command**: `bash scripts/build-dist.sh`
   - **Build output directory**: `dist`
4. Deploy. Una vez OK, Cloudflare entrega un dominio `*.pages.dev`.
5. Custom domains → agregar `www.mineconnect.com.ar` → Cloudflare apunta DNS automáticamente.
6. Subir TTL temporalmente y verificar con `curl -I https://www.mineconnect.com.ar`.

### Opción B — Vercel (apex ya en Vercel)

El apex ya redirige a www; mover www al mismo proyecto Vercel evita la doble dependencia.

Pasos:
1. `https://vercel.com/dashboard` → proyecto del apex → **Settings → Domains** → agregar `www.mineconnect.com.ar`.
2. Sustituir el DNS de `www` en Cloudflare por el CNAME que Vercel pida.
3. Subir `vercel.json` (ya está en este repo) y `dist/`.
4. Vercel respeta `vercel.json` (ya con todos los headers).

### Opción C — Netlify

Mismo flujo que Cloudflare Pages, build command idéntico. Lee `_headers` y `netlify.toml`.

### Opción D — Quedarse en GitHub Pages

GitHub Pages no permite headers custom. Únicas defensas posibles:
- `<meta>` tags (ya aplicados en 18 páginas).
- HSTS preload submission (depende de un primer set por algún host).
- Subir el sitio a Cloudflare en modo proxy (orange cloud) → ver sección 2.

**No recomendado para producción seria.**

---

## 2. Cloudflare como WAF/proxy (si no migrás de host)

Si por algún motivo conservás GitHub Pages, activar Cloudflare proxy (orange cloud) y agregar Transform Rules permite inyectar headers de seguridad sin tocar el origen.

### Pasos

1. Cloudflare DNS → registro `www` → switch a **proxied (orange cloud)**.
2. **SSL/TLS → Overview** → Full (strict) si GitHub Pages soporta HTTPS (sí lo hace).
3. **Rules → Transform Rules → Modify Response Header → Create rule**:
   - Match: `Hostname equals www.mineconnect.com.ar`
   - Set static headers (uno por rule o todos en una):

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Content-Security-Policy: <copiar el valor de site/_headers línea 11>
```

### WAF rules (plan free incluye 5 custom rules)

Cloudflare → **Security → WAF → Custom rules → Create**:

1. **Bloquear países fuera del scope** (opcional):
   ```
   (ip.geoip.country ne "AR" and ip.geoip.country ne "US" and ip.geoip.country ne "ES")
   → Action: Managed Challenge
   ```
2. **Rate limit por IP** (Security → Rate Limit Rules):
   ```
   Path: /functions/v1/leads-submit
   Threshold: 10 requests / 60 seconds per IP
   → Action: Block
   ```
3. **Bloquear User-Agents de scrapers conocidos**:
   ```
   (http.user_agent contains "AhrefsBot" or http.user_agent contains "SemrushBot"
    or http.user_agent contains "MJ12bot" or http.user_agent contains "GPTBot"
    or http.user_agent contains "ClaudeBot")
   → Action: Block
   ```
4. **Bloquear paths sensibles**:
   ```
   (http.request.uri.path contains "/.git" or http.request.uri.path contains ".env"
    or http.request.uri.path contains "/wp-admin" or http.request.uri.path contains "/.env")
   → Action: Block
   ```
5. **Managed Challenge en form submission**:
   ```
   (http.request.uri.path eq "/contacto.html" and http.request.method eq "POST")
   → Action: Managed Challenge
   ```

### Activar Cloudflare features incluidos

- **Speed → Optimization**:
  - Auto Minify: HTML/CSS/JS = ON
  - Brotli = ON
  - Early Hints = ON
- **Security → Settings**:
  - Security Level: Medium
  - Browser Integrity Check: ON
  - Challenge Passage: 30 minutes
  - Privacy Pass Support: ON
- **Security → Bots**: Bot Fight Mode = ON (free).
- **Security → DDoS**: Sensitivity = High.
- **Network**:
  - HTTP/3 (with QUIC): ON
  - 0-RTT: ON (perf)
  - WebSockets: ON (necesario para Supabase Realtime futuro)

---

## 3. Turnstile (Cloudflare CAPTCHA invisible)

Para reforzar el form anti-bot más allá del honeypot + min-time.

1. Dashboard CF → **Turnstile → Add Site** → mode `Managed` (recomendado).
2. Copiar **Site key** y **Secret key**.
3. Frontend: incluir el widget en `site/contacto.html` antes del `</form>`:
   ```html
   <div class="cf-turnstile" data-sitekey="0xAA..." data-callback="onTurnstilePass"></div>
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
   ```
4. Actualizar `script-src` en CSP para incluir `https://challenges.cloudflare.com`.
5. `connect-src` también: `https://challenges.cloudflare.com`.
6. Recalcular hashes con `scripts/compute-csp-hashes.sh`.
7. Edge function `leads-submit`: agregar verificación del token con la Secret key:
   ```ts
   const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
     method: "POST",
     headers: { "Content-Type": "application/x-www-form-urlencoded" },
     body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: payload["cf-turnstile-response"] }),
   });
   if (!verify.ok || !(await verify.json()).success) return json({error:"captcha"}, 403, origin);
   ```
8. Setear `TURNSTILE_SECRET` en Supabase: **Project Settings → Edge Functions → Secrets**.

---

## 4. Monitoring externo (uptime + alerting)

### UptimeRobot (free, recomendado)

- Crear monitor HTTP(s) cada 5 min sobre `https://www.mineconnect.com.ar/`.
- Crear monitor sobre `https://mgeukotlgrjyauwgdjxv.supabase.co/functions/v1/leads-submit` (OPTIONS).
- Configurar alerta por email/Telegram cuando down > 2 min.

### Better Stack (alternativa con SSL expiry monitor)

- Plan free incluye 10 monitors, 3 minute intervals, alerts via email/Slack/Telegram.
- Monitorea expiry de certificado SSL automáticamente.

### Cloudflare Health Checks (si el sitio queda en CF Pages)

- Dashboard → Traffic → Health Checks → crear monitor sobre el dominio.
- Free tier: 1 health check, 1 minute interval.

---

## 5. Sentry (error tracking frontend)

Captura JS errors no manejados que pasan desapercibidos. Plan free 5K eventos/mes.

1. Crear proyecto JavaScript browser en Sentry.io.
2. Agregar al final del `<head>` de todas las páginas (o solo index para empezar):
   ```html
   <script src="https://browser.sentry-cdn.com/8.0.0/bundle.min.js" crossorigin="anonymous"></script>
   <script>
     Sentry.init({
       dsn: "https://<key>@oXXXXXX.ingest.sentry.io/<proj>",
       sampleRate: 1.0,
       tracesSampleRate: 0.1,
     });
   </script>
   ```
3. Actualizar CSP `script-src` con el hash y `connect-src` con `https://*.ingest.sentry.io`.
4. Recalcular hashes con `scripts/compute-csp-hashes.sh`.

---

## 6. GitHub branch protection (vía Dashboard)

`Settings → Branches → Add rule → master`:

- ☑ Require a pull request before merging
  - ☑ Require approvals: 1
  - ☑ Dismiss stale pull request approvals when new commits are pushed
- ☑ Require status checks to pass before merging
  - ☑ Require branches to be up to date
  - Checks requeridos:
    - `CodeQL / Analyze (JavaScript)`
    - `Security audit / npm-audit`
    - `Security audit / gitleaks`
    - `Dependency Review`
    - `Headers regression check / audit`
    - `Mozilla Observatory / observatory`
    - `CSP hashes sync / verify`
    - `OSV-Scanner / scan-pr`
- ☑ Require conversation resolution before merging
- ☑ Require signed commits (opcional pero recomendado)
- ☑ Require linear history
- ☑ Do not allow bypassing the above settings

`Settings → Code security and analysis`:

- ☑ Dependency graph
- ☑ Dependabot alerts
- ☑ Dependabot security updates
- ☑ Secret scanning
- ☑ Push protection
- ☑ Code scanning → Default setup → languages: JavaScript

---

## 7. Supabase Auth + Vault (pasos manuales)

Dashboard del proyecto `mgeukotlgrjyauwgdjxv`:

1. **Authentication → Policies → Password Security**:
   - ☑ Have I Been Pwned check
   - Minimum password length: 12
   - Required: Lower + Upper + Number + Symbol
2. **Authentication → Rate Limits**:
   - Token requests: 30/hour
   - Sign-up requests: 5/hour
   - Email OTP: 3/hour
3. **Authentication → Bot Protection** → activar Turnstile (con la misma Site/Secret key del paso 3 de arriba).
4. **Project Settings → Database → SSL Enforcement**: enabled.
5. **Project Settings → API → JWT Settings**: secret rotation cada 90 días.
6. **Vault → New Secret**: guardar las API keys de terceros (chat API, Motorola, etc.) en lugar de hardcodearlas en código.
7. **Database → Backups**: verificar política diaria; evaluar PITR si plan Pro+.

---

## 8. Alerter de _security_events → Slack/Discord/Telegram

1. Crear Incoming Webhook en Slack/Discord:
   - Slack: `Apps → Incoming Webhooks → Add to Slack` → copiar URL.
   - Discord: `Server Settings → Integrations → Webhooks → New`.
   - Telegram: `@BotFather → /newbot` + chat ID via `getUpdates`.
2. Setear secret en Supabase: **Edge Functions → Secrets** → `ALERTER_WEBHOOK_URL=<url>`.
3. Deployar edge function `alerter`:
   ```ts
   Deno.serve(async () => {
     const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
     const { data: events } = await sb
       .from("_security_events")
       .select("id, severity, kind, detail, occurred_at")
       .eq("severity", "critical")
       .gt("occurred_at", new Date(Date.now() - 5*60*1000).toISOString())
       .order("occurred_at", { ascending: false });
     if (!events?.length) return new Response(null, { status: 204 });
     const text = events.map(e => `🚨 ${e.kind}: ${JSON.stringify(e.detail)}`).join("\n");
     await fetch(env.ALERTER_WEBHOOK_URL, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ text }),
     });
     return new Response(null, { status: 204 });
   });
   ```
4. Schedule vía `pg_cron` + `pg_net`:
   ```sql
   SELECT cron.schedule('mineconnect_alerter', '*/5 * * * *',
     $$ SELECT net.http_post(
          url := 'https://mgeukotlgrjyauwgdjxv.supabase.co/functions/v1/alerter',
          headers := '{"Authorization":"Bearer <ANON_KEY>"}'::jsonb
        ); $$);
   ```

---

## 9. Checklist post-merge

- [ ] Mergear PR #2 a `master`.
- [ ] Migrar `www` a Cloudflare Pages / Vercel (opción A o B de la sección 1).
- [ ] Confirmar headers en producción: `./scripts/verify-security.sh URL=https://www.mineconnect.com.ar`.
- [ ] Activar Cloudflare proxy (orange cloud) si conservás GitHub Pages.
- [ ] Configurar WAF rules (sección 2).
- [ ] Activar Turnstile (sección 3).
- [ ] Crear monitor de uptime (sección 4).
- [ ] Activar Sentry (opcional, sección 5).
- [ ] Configurar GitHub branch protection (sección 6).
- [ ] Aplicar pasos manuales de Auth en Supabase (sección 7).
- [ ] Deployar alerter cuando haya webhook (sección 8).
- [ ] Submission a [HSTS Preload list](https://hstspreload.org) tras 1 mes de HSTS estable.
