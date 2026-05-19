# Seguridad — MineConnect Web

## Resumen de hardening aplicado (2026-05-19)

### Base de datos Supabase (proyecto `MineConnectSAT` / `mgeukotlgrjyauwgdjxv`)

Migraciones aplicadas:

1. **`security_hardening_2026_05_19`**
   - Vista `public.leads_inbox`: convertida a `security_invoker = on`.
   - `REVOKE ALL` sobre `leads_inbox` a `anon`/`authenticated`; `SELECT` solo a `service_role`.
   - `REVOKE SELECT, UPDATE` sobre `public.leads` a `authenticated` (no había política que lo permita; los GRANTs sí exponían el objeto vía GraphQL/pg_graphql).
   - `SET search_path = pg_catalog, public` en `is_superadmin`, `get_my_company_id`, `update_vehicle_from_logs` (mitiga search_path hijacking).
   - `REVOKE EXECUTE` a `PUBLIC, anon, authenticated` para `is_superadmin`, `get_my_company_id`, `leads_rate_limit`, `leads_set_meta`, `mark_lead_status`. Las trigger functions no necesitan ser RPC.
   - `ALTER DEFAULT PRIVILEGES IN SCHEMA public` quitando privilegios a `anon`/`authenticated` para futuras tablas/funciones.
   - `ENABLE` + `FORCE ROW LEVEL SECURITY` en `public.leads`.

2. **`keepalive_setup`** — ver sección Keep-alive abajo.

### Política de RLS resultante en `public.leads`

| Rol            | INSERT | SELECT | UPDATE | DELETE |
|----------------|--------|--------|--------|--------|
| `anon`         | ✅ con validación de longitud/email | ❌ | ❌ | ❌ |
| `authenticated`| ❌     | ❌     | ❌     | ❌    |
| `service_role` | ✅ (bypass RLS) | ✅ | ✅ | ✅ |

Triggers activos sobre `leads`:
- `leads_set_meta` (BEFORE INSERT): captura IP/UA/referer y marca spam si hay ≥3 URLs en el mensaje.
- `leads_rate_limit` (BEFORE INSERT): bloquea más de 5 inserts/IP/60min.

## Keep-alive contra pausa por inactividad

Supabase pausa proyectos free-tier tras ~7 días sin actividad. Mitigación implementada:

- Tabla `public._keepalive` (RLS forzada, sin acceso a roles públicos).
- Función `public._keepalive_beat()` (SECURITY DEFINER, sin EXECUTE para anon/authenticated).
- Job `pg_cron`:

```
jobname:  mineconnect_keepalive
schedule: 17 */6 * * *   (cada 6 h)
command:  SELECT public._keepalive_beat();
```

Verificar manualmente:

```sql
SELECT last_beat, beats FROM public._keepalive;
SELECT * FROM cron.job WHERE jobname = 'mineconnect_keepalive';
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

## Headers de seguridad HTTP

Aplicados en tres archivos para cubrir distintos hosts:

- `site/_headers` (Cloudflare Pages / Netlify)
- `netlify.toml` (Netlify alternativo con build config)
- `vercel.json` (Vercel)

Cabeceras incluidas:

| Header | Valor |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | bloqueo de cámara, micrófono, geo, sensores, pagos, USB, FLoC |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `Content-Security-Policy` | ver abajo |

### CSP activa

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self' https://wa.me;
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com data:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
script-src 'self' 'unsafe-inline';
connect-src 'self' https://mineconnect-chat-api.vercel.app
            https://*.supabase.co https://*.supabase.in wss://*.supabase.co;
manifest-src 'self';
worker-src 'self';
upgrade-insecure-requests
```

> `'unsafe-inline'` en script/style queda por los JSON-LD y los estilos inline del CSS.
> Próximo paso: migrar a `nonce-...` cuando exista un build pipeline server-side.

## Edge Function: `leads-submit`

Endpoint público para enviar leads sin exponer la `anon key` ni la lógica de inserción:

- URL: `https://mgeukotlgrjyauwgdjxv.supabase.co/functions/v1/leads-submit`
- `verify_jwt: false` (endpoint público; autenticación propia vía honeypot + validación + RLS).
- CORS allowlist: `mineconnect.com.ar`, `www.mineconnect.com.ar`, `localhost:5173`.
- Validación estricta server-side (longitudes, regex email, content-type, body cap 8 KB).
- Honeypot `website` y min-time `_ts` (2s): si fallan, devuelve 204 silencioso para no dar pistas al bot.
- UTMs sanitizados (slice 80 chars).
- Inserta con `service_role` y captura IP/UA/referer del request real (no del payload).

Código fuente versionado en `supabase/functions/leads-submit/index.ts`.

Para enchufar el form a este endpoint:

```js
await fetch("https://mgeukotlgrjyauwgdjxv.supabase.co/functions/v1/leads-submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nombre, email, mensaje, website: hp.value, _ts: ts }),
});
```

## Backups y recuperación

- **Backups automáticos diarios** los gestiona Supabase en el plan free (7 días de retención).
- **PITR (Point-in-Time Recovery)** requiere plan Pro+; pendiente de evaluación con cliente.
- Verificación manual: `Dashboard → Database → Backups`.
- Para exportar manualmente:
  ```sql
  -- Ejemplo: dump de leads en formato CSV (vía Dashboard SQL Editor)
  COPY (SELECT * FROM public.leads) TO STDOUT WITH CSV HEADER;
  ```
- Para restaurar desde backup automático: solicitar via Dashboard support en plan free, o vía CLI en Pro+.

## Monitoring + alerting

### Vista `public._security_dashboard` (service_role)

Snapshot consolidado del estado de seguridad. Consultar con:

```sql
SELECT row_to_json(d) FROM public._security_dashboard d;
```

Devuelve: cantidad de tablas/funciones públicas, estado de RLS en `leads`, grants a `anon`/`authenticated`, métricas de leads (total, 24h, 1h, spam), heartbeat del keep-alive, eventos críticos/warn en 24h, cron jobs activos.

### Tabla `public._security_events`

Persiste alertas detectadas por el anomaly check. Solo `service_role` lee/escribe.

```sql
SELECT severity, kind, occurred_at, detail
  FROM public._security_events
 WHERE occurred_at > now() - interval '7 days'
 ORDER BY occurred_at DESC;
```

### Anomaly detection automático

Cron `mineconnect_anomaly_check` corre cada 15 minutos y registra alertas si:

| Regla | Severity | Threshold |
|---|---|---|
| Burst de leads en 1h | `critical` | > 30 inserts/h |
| Ratio de spam alto en 24h | `warn` | ≥ 50% spam con ≥ 10 leads |
| Keep-alive estancado | `critical` | > 12h sin beat |

### Retención

Cron `mineconnect_events_purge` borra eventos > 90 días una vez por día a las 03:42.

### Cron jobs activos (verificar)

```sql
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
-- mineconnect_anomaly_check  | */15 * * * *
-- mineconnect_events_purge   | 42 3 * * *
-- mineconnect_keepalive      | 17 */6 * * *
```

### CSP violation reporting

- Edge function: `csp-report` v1 ACTIVE (`/functions/v1/csp-report`).
- Tabla: `public._csp_reports` (RLS forzada, service_role only).
- Acepta legacy `application/csp-report` y Reporting API (`application/reports+json`).
- Inserta hasta 20 reports por request; body cap 64 KB.
- Cron `mineconnect_csp_reports_purge` borra reports > 30 días a las 04:37.
- Configurado en CSP de los 4 backends: `report-uri https://...supabase.co/functions/v1/csp-report`.

Consultar violaciones recientes:
```sql
SELECT violated, blocked_uri, count(*)
  FROM public._csp_reports
 WHERE occurred_at > now() - interval '7 days'
 GROUP BY 1,2 ORDER BY count(*) DESC LIMIT 20;
```

### Alerter para eventos críticos (manual setup pendiente)

`_security_events` ya captura alertas. Para notificación push:
1. Crear Incoming Webhook en Slack/Discord/Teams.
2. Setear como secret en Supabase Dashboard: `Project Settings → Edge Functions → ALERTER_WEBHOOK_URL`.
3. Deployar edge function `alerter` (template en `supabase/functions/alerter/README.md` cuando se configure).
4. Schedule via `pg_cron`: `*/5 * * * *` que invoque la function vía `pg_net`.

### Logs de Supabase (Dashboard)

- `Logs → Edge Functions → leads-submit`: ver invocaciones, errores 4xx/5xx.
- `Logs → Postgres`: queries lentas, errores de RLS, intentos de acceso fallidos.
- `Logs → API Gateway`: tráfico anómalo, rate-limit hits.

## Pasos manuales que el dashboard exige (no automatizables vía MCP)

1. **Activar Leaked Password Protection**:
   `Dashboard → Authentication → Policies → Password Security` → activar
   *Have I Been Pwned check*.
2. **Activar MFA / TOTP** para usuarios admin (cuando se cree `profiles.role='superadmin'`).
3. **Rotar la `anon` key** si alguna vez fue committeada a un repo público.
4. **Configurar Email Rate Limits** en `Auth → Rate Limits` (default es laxo).
5. **Activar Captcha (Cloudflare Turnstile)** en `Auth → Bot and Abuse Protection` si se habilita signup público.
6. **Habilitar PITR** (Point-in-Time Recovery) si el plan lo permite.
7. **Revisar Auth Hooks / Webhooks**: ninguno configurado actualmente.

## Estado consolidado (2026-05-19)

Verificado con SQL directo sobre DB:

| Check | Valor |
|---|---|
| `leads_inbox` view | `security_invoker=on` |
| `leads` RLS | `enabled=true / forced=true` |
| `leads` policies | 1 (`anon_can_insert_leads` con validación) |
| Funciones públicas | 4 (drop de 3 funciones huérfanas) |
| Grants a `anon` | 1 (`INSERT` en `leads`) |
| Grants a `authenticated` | 0 |
| Cron jobs activos | 1 (`mineconnect_keepalive`) |
| Extensiones seguridad | `pg_cron, pg_net, pgcrypto, supabase_vault` |

## Hardening web aplicado

- `_headers` (Cloudflare/Netlify), `netlify.toml`, `vercel.json`, `site/.htaccess` (Apache) — CSP idéntica entre los 4.
- 18 páginas HTML con `<meta name="referrer">`, `format-detection`, `nosniff`.
- Todos los enlaces externos con `rel="noopener noreferrer"`.
- Formulario de contacto: `novalidate` + honeypot (`input[name="website"]` oculto) + min-time de 2s.
- `.well-known/security.txt` RFC 9116.
- Cache busting v=202605190150 para invalidar CSS/JS antiguos.

## CI/CD security

- `.github/dependabot.yml` — actualización semanal de npm + actions.
- `.github/workflows/codeql.yml` — SAST con `security-extended` + `security-and-quality`.
- `.github/workflows/security-audit.yml` — `npm audit --audit-level=high` + gitleaks en cada push/PR + diario.

## CSP strict (sin `'unsafe-inline'` en script-src)

A partir de esta versión la CSP `script-src` lista 15 hashes SHA256 de los bloques inline JSON-LD (uno por structured data único) en lugar de `'unsafe-inline'`. Esto cierra el vector de XSS por inyección de `<script>` a pelo.

Mantenimiento:

```bash
# Cuando edites un JSON-LD o agregues uno nuevo, regenerá los hashes:
./scripts/compute-csp-hashes.sh site | sort -u
```

El workflow `csp-hashes-sync.yml` falla el CI si el set de hashes en los 4 backends (`_headers`, `netlify.toml`, `vercel.json`, `site/.htaccess`) no coincide con el computado desde el HTML.

## Verificación local

```bash
./scripts/verify-security.sh
```

Corre en orden: `npm audit --audit-level=high`, secret scan (gitleaks o grep), CSP hashes sync, headers de producción (si reachable), event handlers inline, `http://` hardcodeado. Devuelve exit 0 si todo pasa.

## Próximos refuerzos sugeridos

- Migrar JSON-LD a archivos `.json` cargados como `<script type="application/ld+json" src=...>` o usar nonces, eliminando `'unsafe-inline'` de `script-src`.
- Añadir SRI cuando se incorpore algún CDN externo (actualmente solo Google Fonts CSS, que no soporta SRI estable).
- Implementar logging a `pg_audit` si crece el catálogo de tablas.
- Implementar `pgsodium` Vault para guardar API keys de terceros (chat API, Motorola, etc.).
- Configurar GitHub `dependabot.yml` y `.github/workflows/codeql.yml` para escaneo continuo.
