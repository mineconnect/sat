# MineConnect — Marketing Playbook

Plan ordenado para maximizar visibilidad sin gastar plata inicialmente.
**Triple objetivo**: leads B2B + inscripciones cursos + autoridad de marca NOA/LATAM.

---

## Lo que ya está hecho (técnico, listo en código)

Inventario rápido para que cuando hagas los pasos manuales sepas qué te encuentra Google/Bing:

- ✅ **CSP estricta + HSTS + WAF + Rate Limit** — el sitio carga seguro y rápido.
- ✅ **Sitemap.xml** completo con `lastmod`, `priority`, `changefreq` y `hreflang`.
- ✅ **robots.txt** que permite Googlebot/Bingbot/DuckDuckBot y bloquea scrapers SEO ruidosos.
- ✅ **Structured data (JSON-LD)** en cada página:
  - Index: `Organization`, `LocalBusiness` con geo, `WebSite` con SearchAction, `ItemList` de servicios, `FAQPage` con 6 Q&A.
  - Cursos: `Course` schema individual + `BreadcrumbList`.
  - Servicios: `Service` schema + `BreadcrumbList`.
  - SAT: `SoftwareApplication`.
  - Contacto/Nosotros: `ContactPage`/`AboutPage` + breadcrumbs.
- ✅ **Meta tags completos**: OG (con dimensions), Twitter Cards, `geo.region AR-K`, `og:locale es_AR`, `hreflang`.
- ✅ **security.txt** RFC 9116 + DMARC quarantine + SPF + DKIM.
- ✅ **Performance**: CSP `script-src` strict via hashes, Brotli/HTTP3/0-RTT activos en CF, cache TTL configurado.
- ✅ **CF Pages free** sirviendo apex + www (server: cloudflare).
- ✅ **PageSpeed**: Lighthouse CI con budget best-practices ≥ 0.95, SEO ≥ 0.90.

---

## Fase 1 — Acciones gratis (orden de prioridad)

### 🥇 1. Google Search Console (la #1 prioridad)

**URL**: https://search.google.com/search-console/welcome

1. Agregar propiedad **Dominio** → `mineconnect.com.ar` (cubre apex + www + subdominios).
2. Verificar via DNS: copiar el TXT que te da Google y pegarlo como TXT record en Cloudflare DNS (campo `@`, content `google-site-verification=xxxxx`). Verifica en 5-30 min.
3. **Sitemaps → Añadir** → `https://mineconnect.com.ar/sitemap.xml`. Google empieza a crawlearlo en 1-3 días.
4. **Settings → International targeting**: `Argentina` (default por hreflang pero confirmá).
5. **URL Inspection** para `mineconnect.com.ar/` → click *Request Indexing*. Acelera primera indexación a horas.
6. Hacer lo mismo con: `/cursos.html`, `/contacto.html`, `/sat.html`, los 4 servicios.

**Resultado esperado**: en 1-7 días aparecés en Google buscando `MineConnect Catamarca` y `mineconnect.com.ar`. En 2-4 semanas, queries genéricas (`radios Motorola Catamarca`, `curso n8n online`).

### 🥈 2. Bing Webmaster Tools

**URL**: https://www.bing.com/webmasters

1. **Add site** → `https://mineconnect.com.ar/`.
2. Verificar vía DNS (TXT) o subir archivo HTML.
3. **Sitemaps** → submit `https://mineconnect.com.ar/sitemap.xml`.
4. Bing alimenta DuckDuckGo, Yahoo, ChatGPT search (`search` mode), Microsoft Copilot. Tráfico chico pero valioso B2B.

### 🥉 3. Google Business Profile (Catamarca)

**URL**: https://www.google.com/business/

1. **Manage now** → buscar `MineConnect Catamarca` → si no existe, **Add your business**.
2. Categoría: **IT services and computer repair** + secundarias: **Software company**, **Telecommunications service provider**.
3. **Service area**: San Fernando del Valle de Catamarca + Salta + Jujuy + Tucumán + Argentina entera (servicios online).
4. **Add photos**: logo, fotos de instalaciones, fotos de equipos Motorola/Hytera, screenshots de SAT.
5. **Add services**: cada uno con descripción (copy-paste de las páginas del sitio).
6. **Add posts**: cuando termines un proyecto, postear con foto.
7. **Verify**: Google manda postal a Catamarca (~7 días) o llamada / video.

**Resultado**: aparecés en Maps + side panel en búsquedas. Local SEO **enorme** para Catamarca.

### 4. Cloudflare Web Analytics (privacy-friendly, gratis)

**URL**: https://dash.cloudflare.com/e4d1ba09b7504b8833c61627491ecf98/web-analytics

1. Si CF Pages ya está conectado al proyecto `mineconnect`, debería aparecer auto. Si no:
2. **Add a site** → host: `mineconnect.com.ar` → enable.
3. Opcional: snippet de JS en `<head>` para tracking RUM (ya cubierto si activás "Automatic Setup" en CF Pages).

No requiere cookie banner (GDPR-friendly), free unlimited.

### 5. LinkedIn Company Page

**URL**: https://www.linkedin.com/company/setup/new/

1. Create company page → name `MineConnect`.
2. Sector: **Information Technology & Services**.
3. Tamaño: 2-10 employees.
4. Tagline: *"Tecnología, IA, radiocomunicaciones y cursos. Catamarca, Argentina."*
5. About: copy del Hero del sitio + lista de servicios.
6. Website: `https://mineconnect.com.ar`.
7. Logo + cover (usar `logo-robot-transparent.png` + `og.svg`).
8. **Showcase pages** (subpáginas): MineConnect SAT, MineConnect Cursos.

**Estrategia**:
- Posteá 2-3 veces/semana: caso terminado, tip de IA/automatización, novedad de Motorola/Hytera.
- Etiquetá a Motorola Solutions Argentina (`@motorolasolutions`), Hytera AR.
- LinkedIn Pulse: 1 artículo largo/mes sobre IA aplicada a mining.

### 6. Instagram Business (`@mineconnect.ar`)

- Más para marca/cursos que B2B.
- Reels: tutoriales rápidos de n8n, ChatGPT, automatizaciones. 30-60 seg.
- Posts: casos de éxito, behind-the-scenes en instalaciones de radios.
- Stories: día a día, eventos NOA, lanzamientos.

### 7. Directorios y listings (todos gratis)

Postear el sitio + descripción + servicios en:

**Argentina business directories**:
- https://www.paginasamarillas.com.ar
- https://www.guiaempresa.com.ar
- https://www.argbusiness.com.ar
- https://www.solonegocios.com.ar
- https://negociosconargentina.com

**Cámaras NOA / regionales**:
- Cámara de Comercio de Catamarca
- FAMM (Federación Argentina de Mining)
- Cámara Argentina de Empresas Mineras (CAEM)
- AMCHAM (Cámara Argentino-Americana de Comercio)
- CESSI (Cámara de Empresas de Software y Servicios Informáticos)
- IDITS (Instituto de Desarrollo Industrial, Tecnológico y de Servicios)

**Plataformas técnicas / IA**:
- ProductHunt (cuando lancen MineConnect SAT como producto)
- IndieHackers
- BetaList
- BootstrapList

**Cursos**:
- Hotmart (productor)
- Udemy (instructor)
- Tutellus, Crehana, Domestika (LATAM-focused)
- LinkedIn Learning (proposal)

**Mining-specific**:
- Mining.com Argentina
- Panorama Minero
- Revista Minería Argentina

### 8. Backlinks de partners (alto valor SEO)

Pedile a Motorola Solutions Argentina y Hytera Argentina que te listen como **Partner Oficial Catamarca** en su web. Eso da un backlink de alta autoridad que pesa mucho en SEO B2B.

Email template:
```
Asunto: Solicitud de listing como Partner Oficial Catamarca

Hola [Account Manager],

Somos MineConnect (Catamarca, Argentina), partner oficial de [Motorola/Hytera] 
para la región NOA desde [año].

¿Podrían listarnos en la sección "Partners locales" / "Distribuidores autorizados"
de la web argentina con un enlace a https://mineconnect.com.ar/servicios/radiocomunicaciones.html?

Esto ayuda a clientes de Catamarca/Salta/Jujuy a encontrar soporte oficial local.

Quedo a disposición,
Facundo Barros Marengo
+54 9 383 432-7244
```

### 9. Content marketing (blog)

**Recomendación fuerte**: agregar un **/blog** al sitio con 1 artículo cada 2 semanas. Cada artículo es:
- 1500-2500 palabras
- Target: una keyword long-tail real (ej *"Cómo automatizar facturación con n8n en una pyme argentina"*)
- Caso real desidentificado
- Schema Article + author

Ideas de primeros 10 artículos:
1. *"Cómo elegir radios Motorola para una mina en altura (Catamarca/Salta)"*
2. *"n8n vs Zapier vs Make: cuál conviene en Argentina 2026"*
3. *"Casos reales de IA en pymes argentinas: 3 ejemplos con ROI medido"*
4. *"Por qué tu estudio contable debería automatizar la lectura de facturas"*
5. *"ChatGPT vs Claude: cuál usar para tareas de negocio en español"*
6. *"Repetidoras VHF en terreno irregular: errores comunes y cómo evitarlos"*
7. *"Construir tu primer chatbot WhatsApp para una pyme en 1 día"*
8. *"GPS fleet management: qué pedirle a tu proveedor"*
9. *"Cursos de IA en español: cómo elegir uno que no sea humo"*
10. *"Caso de éxito: cómo le ahorramos 12 hs/semana a un estudio jurídico con n8n"*

### 10. Schema.org enhancement continuo

Cada mes:
- Sumá un `Review` schema cuando un cliente te de testimonio (con su permiso).
- Si lanzás un curso nuevo, agregar `Course` + `Offer` con precio.
- Cuando hagas evento (webinar de IA), agregá `Event` schema.

---

## Fase 2 — Cuando tengas presupuesto

### Google Ads — Search Network

**Setup mínimo**:
- **Budget**: USD 5-10/día → ~$150-300/mes.
- **Campaign type**: Search Network.
- **Geo**: Argentina (todo el país).
- **Languages**: Spanish.
- **Bid strategy**: *Maximize Conversions* (después de 30 días de data).

**Ad groups y keywords iniciales**:

Group 1 — *Radios Motorola*
```
+radios +motorola +catamarca
"comprar radios motorola argentina"
"partner motorola catamarca"
[radios para mineria argentina]
```

Group 2 — *Automatización IA*
```
+automatizacion +ia +argentina
"agente ia pyme"
"n8n consultor argentina"
[automatización procesos argentina]
```

Group 3 — *Cursos IA*
```
+curso +chatgpt +español
+curso +n8n
"aprender ia argentina"
[curso agentes ia online]
```

Group 4 — *Desarrollo software*
```
+desarrollo +software +argentina
"app a medida pyme"
"software empresa catamarca"
```

### Meta Ads (Facebook + Instagram)

- **Objetivo 1**: Leads (form de contacto en FB/IG sin salir de la app).
- **Objetivo 2**: Tráfico al sitio para retargeting.
- **Audiencias**:
  - Argentina, 25-55 años, interés en: tecnología, minería, automatización, software, IA.
  - LookalikeAudience del 1% de tu lista de clientes actuales.
- **Creative**: 3-5 videos cortos + 5-10 imágenes de casos.
- **Budget**: USD 5-10/día.

### LinkedIn Ads (alto CPC pero target B2B perfecto)

- **Audience**: cargos *Operations Manager, Plant Manager, CFO, CTO* en empresas Argentina + Bolivia/Chile mining.
- **Industry**: Mining, Metals, Construction, Logistics, Manufacturing.
- **Budget**: USD 10/día.
- **Format**: Sponsored Content (post con CTA → form de contacto MineConnect).

### Microsoft Ads (Bing)

- Mismas keywords que Google Ads. CPC ~30-50% más barato.
- Audience: usuarios corporativos (Windows + Edge = decisionmakers).

---

## Fase 3 — Long-term (3-6 meses)

### Email marketing

1. Setup en Resend (ya tenés DKIM configurado).
2. Lead magnet: *"Guía PDF: 10 procesos que tu pyme puede automatizar con IA en 2026"* a cambio del email.
3. Newsletter mensual con 1 caso + 1 tip + 1 anuncio.

### Webinars / cursos abiertos

Cada 2 meses, 1 webinar gratis de 45 min con tema actual de IA. Captás 200-500 emails por webinar. Conversiones a curso pago = 5-10%.

### Partnerships estratégicos

- Cámara de Comercio de Catamarca: charla de IA para socios (~50 personas).
- Universidad Nacional de Catamarca: workshop de automatización para egresados.
- Cluster minero NOA: presentación de MineConnect SAT.

### SEO técnico continuo

- Internal linking: cada nueva página, linkear desde 3+ páginas existentes.
- Page experience: mantener Core Web Vitals > 90 en Lighthouse.
- Backlink building: 5+ backlinks de calidad/mes (guest posts, menciones, partnerships).

### Reputation management

- Monitorear menciones de "MineConnect" en Google Alerts.
- Pedir review en Google Business Profile a cada cliente satisfecho (objetivo: 5★ promedio, 50+ reviews en 1 año).
- Responder TODA review (positiva o negativa) en <24h.

---

## KPIs a trackear desde día 1

| Métrica | Tool | Frecuencia | Target 6 meses |
|---|---|---|---|
| Visitantes únicos / mes | CF Web Analytics | Semanal | 2.000-5.000 |
| Conversiones form contacto | Supabase `leads` table | Diario | 30-60/mes |
| Posición Google "radios motorola catamarca" | GSC | Semanal | Top 3 |
| Posición Google "curso n8n online" | GSC | Semanal | Top 10 |
| Backlinks dofollow | Ahrefs free / GSC | Mensual | 20+ |
| Reseñas Google Business | Google | Mensual | 25+ con ≥4.8★ |
| Engagement LinkedIn | LinkedIn Analytics | Semanal | 500+ followers |
| Email subscribers | Resend | Semanal | 500+ |

---

## Quick wins en las próximas 48 hs

Si solo querés hacer 3 cosas YA para máximo impacto:

1. **Google Search Console** + sitemap submit (30 min)
2. **Google Business Profile** verificado (15 min + 7 días postal)
3. **LinkedIn Company Page** con primer post (45 min)

Esos 3 te ponen en el mapa literal y figurado en menos de 2 horas de tu tiempo.

---

## Cuando decidas pagar ads, este es el orden de ROI esperado

Argentina B2B 2026 ranking de canales:
1. **Google Ads Search** — high intent, immediate ROI.
2. **LinkedIn Ads Sponsored Content** — caro pero llega al decisionmaker.
3. **Meta Ads retargeting** — bajo costo si tenés audiencia base.
4. **Microsoft Ads** — sleeper hit, CPC bajo, conversiones decentes.
5. **Programmatic / display** — solo si tenés budget grande, no recomendado start.

---

## Recursos gratuitos para gestionar todo

- **GSC** (Google Search Console)
- **Bing Webmaster Tools**
- **CF Web Analytics**
- **Notion** o **Airtable** para tracking de SEO/leads
- **Ahrefs Webmaster Tools** (free para tu propio sitio): https://ahrefs.com/webmaster-tools
- **Ubersuggest** (3 búsquedas/día gratis)
- **AnswerThePublic** (3 búsquedas/día gratis)
- **PageSpeed Insights** (ya lo tenemos en CI)
- **Screaming Frog SEO Spider** (free hasta 500 URLs)
- **Schema Markup Validator**: https://validator.schema.org
- **Rich Results Test**: https://search.google.com/test/rich-results

---

## Tracker de tareas marketing

| # | Tarea | Estado | Tu mano | ETA |
|---|---|---|---|---|
| 1 | Google Search Console + sitemap | Pendiente | ✋ | 30 min |
| 2 | Bing Webmaster Tools | Pendiente | ✋ | 15 min |
| 3 | Google Business Profile | Pendiente | ✋ + 7 días postal | 15 min + espera |
| 4 | CF Web Analytics toggle | Pendiente | ✋ | 5 min |
| 5 | LinkedIn Company Page | Pendiente | ✋ | 45 min |
| 6 | Instagram Business `@mineconnect.ar` | Pendiente | ✋ | 30 min |
| 7 | Solicitud listing Motorola/Hytera | Pendiente | ✋ email | 1 hora |
| 8 | Registro 5 directorios AR | Pendiente | ✋ | 1 hora |
| 9 | Primer post LinkedIn + IG | Pendiente | ✋ | 30 min |
| 10 | Blog setup (estructura) | Pendiente | Yo asisto | 2 horas |
| 11 | Primer artículo blog | Pendiente | Conversa con vos | 2 horas |
| 12 | Email lead magnet PDF | Pendiente | Diseño + copy | 4 horas |

Cuando estés listo para arrancar con (10), (11), (12), avisame y armamos el blog completo con CMS simple sobre el repo actual.
