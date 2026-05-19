# LinkedIn — 5 posts drafts listos para programar

Tono: rioplatense, profesional pero accesible. Sin emojis excesivos (1-2 max).
Long-form (1500-2500 chars) para LinkedIn.

---

## Post #1 — "Caso real" (publicar primero, día 1)

```
Pyme catamarqueña automatiza facturación con IA y ahorra 12 hs/semana.

Estudio contable de Catamarca, 30 empleados. Procesaban a mano 200+
facturas de proveedores que llegan en PDF por email. Una persona dedicada
4 hs/día solo a eso.

Diseñamos un agente con n8n + GPT-4 Vision:

→ Cada 5 min revisa Gmail
→ Detecta facturas PDF
→ OCR + extracción de datos (CUIT, monto, IVA, conceptos)
→ Valida en AFIP que la factura sea real
→ Carga al sistema contable Bejerman vía API
→ Mensaje WhatsApp al responsable con resumen

Resultado:
- 12 hs semanales liberadas
- ROI en el primer mes
- USD 33/mes de infraestructura total
- Cero atadura al dólar oficial (cliente paga en pesos)

¿La parte interesante? Es 6x más barato que la alternativa con Zapier.

¿Tu pyme tiene un proceso que se podría automatizar? Comentario o DM.

---
MineConnect — Catamarca, Argentina
Tecnología que conecta tu operación.

#IA #Automatización #PymesArgentina #n8n #ChatGPT
```

---

## Post #2 — "Educativo" (día 4)

```
3 errores que vemos todo el tiempo al elegir radios Motorola para minería.

Después de ~40 proyectos de radiocomunicaciones en el NOA, estos son
los errores que más se repiten al cotizar equipamiento:

1. PEDIR LA RADIO MÁS POTENTE "POR LAS DUDAS"
   La potencia no resuelve terreno irregular. En sierras catamarqueñas
   con desniveles, una radio de 5W con repetidora elevada cubre 3x más
   que una de 10W sin repetidora.

2. NO PROGRAMAR CTCSS/DCS POR GRUPO
   Sin tonos de squelch, todos los equipos escuchan a todos. Para una
   minera con 30 portátiles, eso significa ruido constante. Los operadores
   apagan el volumen y dejan de usar las radios.

3. COMPRAR ANTENA GENÉRICA
   La radio puede ser Motorola top-tier pero si la antena del repetidor
   es genérica China, perdés 6dB. Eso son 4 km menos de cobertura.

¿Estás pensando en armar o renovar tu red de radios? El primer paso debería
ser un relevamiento de terreno, no una cotización de equipos. En MineConnect
hacemos el relevamiento gratis para empresas del NOA.

---
MineConnect — Partner Oficial Motorola y Hytera
Catamarca, Argentina

#Motorola #Hytera #Radiocomunicaciones #Minería #NOA
```

---

## Post #3 — "Pregunta a la audiencia" (día 7)

```
Pregunta para founders y operations de pymes argentinas:

¿Cuál es el proceso de tu empresa que MÁS te gustaría automatizar pero
todavía no lo hiciste?

En MineConnect llevamos 40+ proyectos de automatización terminados, y
estos son los top 5 que más nos piden:

1. Lectura y carga de facturas de proveedores (estudio contable, constructora)
2. Atención automática por WhatsApp con derivación a humano cuando aplica
3. Generación de reportes diarios desde múltiples fuentes (ERP, planilla, email)
4. Onboarding de empleados nuevos (firma documentos, asignación accesos)
5. Seguimiento de cuentas por cobrar con recordatorios automáticos

¿El tuyo está en la lista o es otro? Comentarios o DM. Si describís bien el
proceso, te paso una idea de cómo lo automatizaríamos sin compromiso.

---
MineConnect — Catamarca, Argentina

#Automatización #PymesArgentina #IA
```

---

## Post #4 — "Behind-the-scenes" (día 11)

```
Spoiler de cómo armamos un agente IA que atiende clientes por WhatsApp.

Esta semana terminamos uno para una empresa de logística NOA. Stack:

→ WhatsApp Cloud API (Meta) — recepción de mensajes
→ n8n (self-hosted Hetzner) — orquestación
→ Claude (Anthropic) — comprensión del mensaje + respuesta
→ Postgres (Supabase) — historial conversación + clientes
→ Google Maps API — cuando piden seguimiento de envío
→ Twilio voice — cuando piden ser llamados

El agente:
- Atiende 24/7 en español rioplatense (sí, le pasamos ejemplos de tono)
- Reconoce 30+ intenciones (estado de envío, cotización, reclamo, etc.)
- Si detecta enojo o complejidad, deriva a humano con resumen del caso
- Aprende de cada conversación (los humanos corrigen, vuelve a contexto)

Métricas primera semana:
- 340 conversaciones atendidas
- 88% resueltas sin humano
- 12% derivadas al equipo (con contexto)
- Tiempo promedio respuesta: 2.4 segundos

Costo total: USD 0.06 por conversación. Cliente pagaba USD 1.20 antes
por conversación humana (contact center).

20x más barato.

¿Tu empresa necesita un asistente por WhatsApp? DM.

---
MineConnect — Catamarca, AR
#IA #WhatsApp #Automatización #Claude
```

---

## Post #5 — "Recurso gratuito" (día 14)

```
Te regalo un PDF con 10 procesos que tu pyme puede automatizar con IA
hoy mismo en 2026.

Después de armar 40+ automatizaciones para pymes argentinas en MineConnect,
identifiqué los 10 procesos que más ROI dan, con tiempo estimado de
implementación y costo en pesos.

Está en:
https://mineconnect.com.ar/recursos/automatizar-ia-2026.html

Cubre:
1. Carga automática de facturas a sistema contable
2. Atención WhatsApp con IA + derivación
3. Generación de reportes ejecutivos diarios
4. Onboarding de empleados automatizado
5. Seguimiento de leads inactivos
6. Conciliación bancaria automática
7. Clasificación de emails entrantes
8. Generación de propuestas comerciales con IA
9. Monitoreo de menciones de marca
10. Análisis de feedback de clientes

Cada proceso tiene:
- Stack recomendado
- Tiempo de implementación (días/semanas)
- Costo en pesos
- ROI esperado
- Caso real (cuando aplica)

Si querés armarlo solo, en el PDF está el cómo. Si querés que lo armemos
nosotros, contactanos directo: https://mineconnect.com.ar/contacto.html

---
#IA #Automatización #Pymes #Argentina #n8n #ChatGPT
```

---

## Content calendar — primeros 30 días

| Día | Post | Tipo |
|---|---|---|
| 1 | Post #1: Caso real (facturación) | Caso |
| 4 | Post #2: 3 errores radios Motorola | Educativo |
| 7 | Post #3: Pregunta a la audiencia | Engagement |
| 11 | Post #4: WhatsApp con IA | Behind-the-scenes |
| 14 | Post #5: PDF lead magnet | Conversión |
| 18 | Caso real curso (alumno terminó) | Caso |
| 21 | Educativo: ChatGPT vs Claude | Educativo |
| 25 | Pregunta: "qué herramienta IA usás?" | Engagement |
| 28 | Behind-the-scenes (un proyecto en curso) | BTS |
| 30 | Anuncio + lanzamiento (curso nuevo, evento) | Promo |

**Frecuencia ideal**: 2-3 posts/semana. Después de 30 días, evaluar
qué tipo generó más impressions/engagement y duplicar.
