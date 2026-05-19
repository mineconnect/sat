# Deploy & External Security Layers

Guía para llevar el hardening del repo a producción y agregar las capas externas que el repo no puede controlar por sí solo. **Costo total: $0** — 100% en planes gratuitos.

---

## ✅ Estado actual (2026-05-19 — deploy live)

| Componente | Estado | Detalle |
|---|---|---|
| Host `www.mineconnect.com.ar` | **Cloudflare Pages** | `server: cloudflare`, proyecto `mineconnect`, deploy `75e46a8d` |
| Proyecto Pages | Live | https://mineconnect.pages.dev (alias estable) |
| Custom Domain | Active | DNS `www CNAME mineconnect.pages.dev` proxied |
| TLS / SSL | Full (strict), TLS 1.3 min | Cert emitido por CF Pages |
| HSTS edge | ON | max-age 2 años, includeSubDomains, preload |
| WAF rules | 5/5 active | scrapers, paths sensibles, POSTs, UA vacíos, métodos raros |
| Rate Limit | 1/1 active | 2 req/10s/IP en `/contacto.html POST` |
| DMARC | `p=none` monitor mode | rua=contacto@mineconnect.com.ar |
| `verify-security.sh` | **18/18 PASS** | corrido contra `https://www.mineconnect.com.ar` |
| Edge functions Supabase | 2 active | `leads-submit` v1, `csp-report` v1 |
| Cron jobs Supabase | 3 active | keepalive 6h, anomaly 15min, purges daily |
| `_security_dashboard` Supabase | populated | `authenticated_grants=0`, `leads_rls_forced=true` |
| Costo mensual | **$0** | CF Pages + DNS + WAF + RL + Supabase free |

### URLs de producción

```
https://www.mineconnect.com.ar/                  ← sitio principal
https://mineconnect.com.ar/                       ← apex (301 a www, sigue en Vercel)
https://mineconnect.pages.dev/                    ← alias estable CF
https://www.mineconnect.com.ar/.well-known/security.txt
https://mgeukotlgrjyauwgdjxv.supabase.co/functions/v1/leads-submit
https://mgeukotlgrjyauwgdjxv.supabase.co/functions/v1/csp-report
```

### Próximos pasos opcionales

1. Revocar los 3 tokens CF temporales en https://dash.cloudflare.com/profile/api-tokens.
2. HSTS preload submission tras 1-2 semanas: https://hstspreload.org/?domain=mineconnect.com.ar.
3. Monitorear reportes DMARC en `contacto@mineconnect.com.ar`; escalar a `p=quarantine` cuando los reportes muestren alineación clean.
4. Dashboard CF Pages tiene "GitHub auto-deploy" — vincular el repo para que cada push a master redeployee solo.
5. Activar Bot Fight Mode + AI Labyrinth manualmente en Security → Bots (1 toggle).
6. Branch protection master (Settings → Branches).
7. Supabase Auth HIBP password protection (Auth → Policies).


---

## 1. Migrar a Cloudflare Pages — único host elegido

**Decisión**: Cloudflare Pages, plan **free** permanente. Razones:

| Criterio | Cloudflare Pages | Vercel Hobby | Netlify Free | GitHub Pages |
|---|---|---|---|---|
| Ancho de banda | **Ilimitado** | 100 GB/mes | 100 GB/mes | 100 GB/mes |
| Requests | **Ilimitados** | 100K/día | 300/min | Soft cap |
| Custom headers | ✅ `_headers` nativo | ✅ `vercel.json` | ✅ `_headers` | ❌ |
| Custom domain | ✅ gratis | ✅ gratis | ✅ gratis | ✅ gratis |
| Uso comercial | ✅ permitido | ❌ TOS prohíbe | ✅ permitido | ✅ permitido |
| SSL | ✅ auto | ✅ auto | ✅ auto | ✅ auto |
| Build minutes | 500/mes | 100 hr/mes | 300/mes | — |
| DNS ya en este proveedor | ✅ **sí** | ❌ | ❌ | ❌ |
| Lee `_headers` | ✅ | ❌ | ✅ | ❌ |

Vercel Hobby queda descartado porque su TOS prohíbe uso comercial. Netlify free tiene cap de 100 GB que puede agotarse en una campaña. CF Pages no tiene caps de transferencia/requests y el DNS ya vive en Cloudflare.

**Diagnóstico del estado actual**: `www.mineconnect.com.ar` responde con `server: GitHub.com` + `x-github-request-id`. GitHub Pages **NO soporta custom headers**, lo que vuelve inertes `_headers`, `netlify.toml`, `vercel.json` y `.htaccess`. El apex (`mineconnect.com.ar`) redirige 301 a `www.` desde Vercel.

### Pasos exactos para deployar en Cloudflare Pages

#### 1.1 — Crear el proyecto

1. Abrir https://dash.cloudflare.com → **Workers & Pages** (sidebar izquierdo).
2. Click **Create application** → tab **Pages** → **Connect to Git**.
3. Si es la primera vez: **Connect GitHub** → autorizar el org `mineconnect`.
4. Seleccionar repo `mineconnect/sat` → **Begin setup**.

#### 1.2 — Build settings (copiá tal cual)

| Campo | Valor |
|---|---|
| **Project name** | `mineconnect` (genera dominio `mineconnect.pages.dev`) |
| **Production branch** | `master` |
| **Framework preset** | None |
| **Build command** | `bash scripts/build-dist.sh` |
| **Build output directory** | `dist` |
| **Root directory (advanced)** | `/` (default) |
| **Environment variables (Production)** | ninguna requerida |

Click **Save and Deploy**. CF clona el repo, corre `build-dist.sh`, genera `dist/`, y publica.

#### 1.3 — Verificar primer deploy en el dominio temporal

Pasados 1–2 min, abrir `https://mineconnect.pages.dev` → debe cargar el sitio.

```bash
curl -sI https://mineconnect.pages.dev/ | head -20
```

Esperás ver:
```
HTTP/2 200
strict-transport-security: max-age=63072000; ...
content-security-policy: default-src 'self'; ... 'sha256-...' ...
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: ...
reporting-endpoints: ...
```

Si todo OK, seguí. Si algún header falta: revisar **Logs** del deploy en CF dashboard.

#### 1.4 — Conectar el dominio custom `www.mineconnect.com.ar`

1. En el proyecto CF Pages → tab **Custom domains** → **Set up a custom domain**.
2. Ingresá `www.mineconnect.com.ar` → **Continue** → **Activate domain**.
3. Cloudflare crea automáticamente un CNAME `www → mineconnect.pages.dev` en la zona DNS. **No tenés que tocar nada manualmente** porque el DNS ya vive en la misma cuenta CF.
4. ⚠️ Si existe un registro DNS previo para `www` (que apuntaba a GitHub Pages: `185.199.108.153` etc.), **bórralo**. CF te avisa si lo detecta.
5. Esperar 2–5 minutos para propagación y SSL.
6. Verificar:
   ```bash
   ./scripts/verify-security.sh
   # o bien:
   URL=https://www.mineconnect.com.ar ./scripts/verify-security.sh
   ```
   Esperás `9/9 PASS`.

#### 1.5 — Decidir qué hacer con el apex `mineconnect.com.ar`

Hoy el apex está en Vercel y redirige 301 a `www`. Dos rutas:

**A) Mover apex también a CF Pages** (recomendado — un solo host):
- En CF Pages → **Custom domains** → agregar `mineconnect.com.ar`.
- Crear page rule (Rules → Redirect Rules): `mineconnect.com.ar/*` → `https://www.mineconnect.com.ar/$1` (301).
- Eliminar el proyecto Vercel del apex (opcional, evita doble facturación implícita).

**B) Dejar el apex en Vercel**:
- `vercel.json` ya tiene los headers correctos; el redirect 301 ya funciona.
- Vercel free no factura mientras no superes 100GB.

#### 1.6 — Activar features de Cloudflare incluidas en free

Una vez el sitio sirve desde CF Pages, en el dashboard de la zona `mineconnect.com.ar`:

**Speed → Optimization**:
- ☑ Auto Minify: HTML / CSS / JavaScript
- ☑ Brotli compression
- ☑ Early Hints
- ☑ Rocket Loader: OFF (rompe CSP estricta; dejarlo en OFF)

**Caching → Configuration**:
- Browser Cache TTL: Respect Existing Headers (los `_headers` ya tienen TTL óptimo)
- Crawler Hints: ON

**Security → Settings**:
- Security Level: **Medium**
- Browser Integrity Check: ON
- Challenge Passage: 30 minutes
- Privacy Pass Support: ON
- Replace insecure JavaScript libraries: ON

**Security → Bots → Configure Super Bot Fight Mode**:
- Bot Fight Mode: **ON** (free tier)
- Static Resource Protection: OFF (rompería cache; usar default)
- Block AI scrapers: **ON** (cubre GPTBot, ClaudeBot, PerplexityBot, etc. — además del robots.txt)

**Security → DDoS**:
- HTTP DDoS Attack Protection: **Sensitivity = High**
- Action: Managed Challenge

**Network**:
- HTTP/3 (with QUIC): ON
- 0-RTT Connection Resumption: ON
- WebSockets: ON (necesario para Supabase Realtime futuro)
- Onion Routing: ON (opcional, no daña)

**SSL/TLS → Edge Certificates**:
- Always Use HTTPS: ON
- Minimum TLS Version: **TLS 1.3**
- Opportunistic Encryption: ON
- TLS 1.3: ON
- Automatic HTTPS Rewrites: ON
- Certificate Transparency Monitoring: ON

#### 1.7 — Cloudflare WAF Custom Rules (free permite 5)

**Security → WAF → Custom rules → Create rule**:

**Rule 1** — Bloquear scrapers SEO/IA (refuerza robots.txt):
```
Name: Block known scrapers
Match: (http.user_agent contains "AhrefsBot")
    or (http.user_agent contains "SemrushBot")
    or (http.user_agent contains "MJ12bot")
    or (http.user_agent contains "DotBot")
    or (http.user_agent contains "PetalBot")
    or (http.user_agent contains "Bytespider")
    or (http.user_agent contains "GPTBot")
    or (http.user_agent contains "ClaudeBot")
    or (http.user_agent contains "anthropic-ai")
    or (http.user_agent contains "CCBot")
Action: Block
```

**Rule 2** — Bloquear paths sensibles:
```
Name: Block sensitive paths
Match: (http.request.uri.path contains "/.git")
    or (http.request.uri.path contains "/.env")
    or (http.request.uri.path contains "/wp-admin")
    or (http.request.uri.path contains "/wp-login")
    or (http.request.uri.path contains "/phpmyadmin")
    or (http.request.uri.path contains "/.htaccess")
    or (http.request.uri.path contains "/node_modules")
Action: Block
```

**Rule 3** — Challenge en POSTs sospechosos (refuerzo del form):
```
Name: Challenge non-form POSTs
Match: (http.request.method eq "POST" and not http.request.uri.path matches "^/contacto" and not http.request.uri.path matches "^/functions/v1/")
Action: Managed Challenge
```

**Rule 4** — Block requests sin User-Agent (bots crudos):
```
Name: Block empty user agents
Match: (http.user_agent eq "")
Action: Block
```

**Rule 5** — Block métodos HTTP raros:
```
Name: Block weird HTTP methods
Match: not http.request.method in {"GET" "POST" "HEAD" "OPTIONS"}
Action: Block
```

#### 1.8 — Cloudflare Rate Limiting (free permite 1 regla, 10k requests/mes)

**Security → Rate Limit Rules → Create**:
```
Name: Form abuse protection
Match: http.request.uri.path eq "/contacto.html" and http.request.method eq "POST"
Rate: 10 requests per 1 minute per IP
Action: Block (1 hour)
```

Esto **complementa** el rate-limit del trigger DB (5/h IP). Acá filtramos antes de que llegue a la base, ahorrando egress.

---

## 2. Cloudflare como WAF/proxy adicional (sección legacy — ya no necesaria)

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
