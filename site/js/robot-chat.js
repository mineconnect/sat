(function () {
  'use strict';

  // Chat NO persiste entre cargas — historia solo en memoria de esta página.
  let HISTORY = [];
  const VOICE_KEY   = 'mc-chat-voice';
  const WA_NUMBER   = '5493834327244';
  const WA_BASE     = `https://wa.me/${WA_NUMBER}?text=`;
  const API_URL     = 'https://mineconnect-chat-api.vercel.app/api/chat';
  const API_TIMEOUT = 15000;

  // -------- frases del bocadillo del robot (rotan) --------
  const SPEECH_PHRASES = [
    '👋 ¡Hola! Soy MC. Tocame si querés que te ayude.',
    '¿Querés automatizar algo en tu empresa? Pregúntame.',
    '¿Buscás radios Motorola o Hytera? Soy partner oficial.',
    '¿Necesitás un sistema, app o web a medida? Charlemos.',
    '¿Te interesa un curso de IA para tu equipo?',
    '¿Tenés una idea y querés cotizar? Estoy acá.',
    '¿Soporte técnico SAT? Decime qué pasa.',
  ];

  // -------- saludos iniciales del chat --------
  const GREETINGS = [
    '¡Hola! Soy MC, asistente de MineConnect. ¿En qué te ayudo hoy? Contame qué necesitás resolver — radios, automatizar con IA, desarrollar algo a medida, cursos, soporte… lo que sea.',
    '¡Buenas! 👋 Soy MC. ¿Estás buscando algo puntual o querés que te cuente qué hacemos en MineConnect?',
    '¡Hola! ¿Te ayudo a encontrar la solución que necesitás? Decime brevemente tu situación y vemos.',
  ];

  // -------- router local: muchísimas reglas, respuestas humanas --------
  // Cada intent puede tener {follow: '...'} para preguntar de vuelta.
  const INTENTS = [
    // === Saludos / smalltalk ===
    {
      tag: 'hi',
      match: /^\s*(hola|holi|holaa+|buenas|buen d[ií]a|buenos d[ií]as|buenas tardes|buenas noches|hey|qu[eé] tal|qu[eé] onda|saludos|ola)\b/i,
      reply: '¡Hola! Bienvenido a MineConnect 👋 Soy MC. Contame, ¿en qué andás? Puede ser un proyecto que quieras desarrollar, automatizar algo repetitivo, comprar radios, capacitar a tu equipo o algo de soporte técnico.',
    },
    {
      tag: 'who',
      match: /(qui[eé]n sos|qui[eé]n eres|qu[eé] sos|sos un? bot|sos humano|sos una persona|sos real)/i,
      reply: 'Soy MC, el asistente virtual de MineConnect. Te puedo orientar y derivarte al equipo humano por WhatsApp cuando haga falta. ¿Qué necesitás?',
    },
    {
      tag: 'thanks',
      match: /(gracias|muchas gracias|mil gracias|genial|perfecto|excelente|b[aá]rbaro|joya|copado|de diez)/i,
      reply: '¡De nada! Si querés avanzar con algo concreto, podemos seguir por WhatsApp así te atiende una persona directamente.',
      actions: [{ label: 'Seguir por WhatsApp', wa: 'Hola MineConnect, vengo del chat: ' }],
    },
    {
      tag: 'bye',
      match: /(chau|hasta luego|nos vemos|me voy|adi[oó]s|saludos finales)/i,
      reply: '¡Hasta luego! Si te queda una duda más adelante, escribime acá o tocá WhatsApp 👋',
      actions: [{ label: 'WhatsApp', wa: 'Hola MineConnect 👋' }],
    },

    // === DISCOVERY: el usuario expresa una intención general ===
    {
      tag: 'want-build',
      match: /(quiero|necesito|busco|me gustar[ií]a).*(crear|hacer|armar|desarrollar|construir|levantar|montar).*(plataforma|sistema|app|aplicaci[oó]n|web|sitio|portal|herramienta|software|programa|dashboard|panel)/i,
      reply: 'Buenísimo, eso es justo lo que hacemos. Para cotizarte bien necesito entender un poco: ¿es algo interno para tu empresa o para clientes finales? ¿Tenés una idea de funcionalidades clave o arrancamos desde cero juntos?',
      actions: [
        { label: 'Cotizar mi proyecto', wa: 'Hola, quiero crear ' },
        { label: 'Ver desarrollo', href: 'servicios/desarrollo.html' },
      ],
    },
    {
      tag: 'want-automate',
      match: /(quiero|necesito|busco|me gustar[ií]a).*(automatiz|sacar.*manual|dejar de hacer|optimiz|ahorr.*tiempo|liberar.*horas)/i,
      reply: 'Perfecto, ahí es donde más impacto generamos. Contame: ¿qué proceso te está comiendo más tiempo hoy? (facturación, reportes, seguimiento de clientes, scraping, atención WhatsApp, integraciones entre sistemas…)',
      actions: [
        { label: 'Cotizar automatización', wa: 'Hola, quiero automatizar este proceso: ' },
        { label: 'Casos de automatización', href: 'servicios/automatizaciones-ia.html' },
      ],
    },
    {
      tag: 'want-learn',
      match: /(quiero|necesito|busco|me gustar[ií]a).*(aprender|capacitar|formar|estudiar|saber.*ia|curso)/i,
      reply: 'Tenemos cursos para todos los niveles: desde "ChatGPT/Claude desde cero" hasta "Agentes IA con n8n". También damos formaciones in-company a medida. ¿Es para vos solo o para un equipo?',
      actions: [
        { label: 'Ver todos los cursos', href: 'cursos.html' },
        { label: 'Curso in-company', wa: 'Hola, quiero un curso para mi equipo: ' },
      ],
    },

    // === SERVICIOS específicos ===
    {
      tag: 'radios',
      match: /(radio|radios|motorola|hytera|handy|walkie|talkie|repetidor|antena|comunicaci[oó]n.*terreno|tetra|dmr|trunking)/i,
      reply: 'Somos Partner Oficial de Motorola Solutions y Hytera. Hacemos venta, instalación, configuración y soporte técnico (SAT) de radios y sistemas de comunicación profesional. Trabajamos mucho con minería, seguridad, logística y obras civiles. ¿Para qué tipo de operación los necesitás?',
      actions: [
        { label: 'Radiocomunicaciones', href: 'servicios/radiocomunicaciones.html' },
        { label: 'Cotizar equipos', wa: 'Hola, necesito radios para ' },
      ],
    },
    {
      tag: 'sat',
      match: /(sat|servicio t[eé]cnico|reparaci[oó]n|reparar|no funciona|se rompi[oó]|fall[oó]|no anda|no enciende|mantenimiento)/i,
      reply: 'Nuestro SAT atiende equipos Motorola y Hytera (radios, repetidoras, accesorios). Hacemos diagnóstico, reparación y mantenimiento preventivo. Contame qué modelo es y qué le pasa, y te decimos los próximos pasos.',
      actions: [
        { label: 'Conocer el SAT', href: 'sat.html' },
        { label: 'Pedir soporte', wa: 'Hola, necesito SAT para este equipo: ' },
      ],
    },
    {
      tag: 'ia',
      match: /(\bia\b|inteligencia artificial|gpt|chatgpt|claude|llm|machine learning|ml\b|agente ia|agent[ie]s|copilot)/i,
      reply: 'IA aplicada es uno de nuestros fuertes. Hacemos chatbots inteligentes, agentes autónomos (n8n + Claude/GPT), automatización de procesos con LLMs, análisis de documentos, asistentes internos para empresas. ¿Tenés un caso específico en mente?',
      actions: [
        { label: 'Automatizaciones IA', href: 'servicios/automatizaciones-ia.html' },
        { label: 'Hablar con un experto', wa: 'Hola, quiero aplicar IA en: ' },
      ],
    },
    {
      tag: 'n8n',
      match: /(n8n|make\b|zapier|workflow|integraci[oó]n entre|webhook|automation)/i,
      reply: 'n8n es nuestra herramienta favorita para automatizar. Conectamos casi cualquier cosa: WhatsApp, Sheets, CRMs, APIs internas, OpenAI/Claude, Slack, email, Stripe… ¿Qué sistemas necesitás conectar?',
      actions: [
        { label: 'Curso n8n', href: 'cursos/n8n.html' },
        { label: 'Cotizar automatización', wa: 'Hola, quiero conectar estos sistemas con n8n: ' },
      ],
    },
    {
      tag: 'chatbot',
      match: /(chatbot|bot.*whatsapp|asistente virtual|atenci[oó]n autom[aá]tica|responder autom)/i,
      reply: 'Armamos chatbots de WhatsApp con IA real (no menúes rígidos): entienden lenguaje natural, consultan tu base de datos, derivan a humanos cuando corresponde. Ideal para atención al cliente, reservas o ventas. ¿Es para qué uso?',
      actions: [
        { label: 'Curso Chatbots WhatsApp', href: 'cursos/chatbots-whatsapp.html' },
        { label: 'Quiero mi chatbot', wa: 'Hola, necesito un chatbot WhatsApp para: ' },
      ],
    },
    {
      tag: 'webapp',
      match: /(p[aá]gina web|sitio web|landing|web corporativa|dise[ñn]o web|wordpress|webflow|web nueva)/i,
      reply: 'Diseñamos y desarrollamos sitios web a medida: corporativos, landings de campaña, ecommerce, portales con login. Nada de templates genéricos. ¿Qué tipo de sitio necesitás?',
      actions: [
        { label: 'Ver desarrollo', href: 'servicios/desarrollo.html' },
        { label: 'Cotizar mi sitio', wa: 'Hola, necesito un sitio web: ' },
      ],
    },
    {
      tag: 'app',
      match: /(app m[oó]vil|aplicaci[oó]n m[oó]vil|android|ios|iphone|aplicaci[oó]n para celular|react native|flutter)/i,
      reply: 'Hacemos apps móviles nativas e híbridas (React Native, PWAs). Desde MVPs hasta apps con sincronización offline, mapas, push notifications. ¿Para qué la necesitás?',
      actions: [
        { label: 'Ver desarrollo', href: 'servicios/desarrollo.html' },
        { label: 'Contar mi app', wa: 'Hola, quiero desarrollar una app: ' },
      ],
    },
    {
      tag: 'dev-generic',
      match: /(desarroll|software|sistema interno|crm|erp|gesti[oó]n|backend|api|integraci[oó]n con|conectar.*sistema)/i,
      reply: 'Desarrollo a medida es nuestro core: sistemas internos, integraciones, backends, dashboards, APIs. Equipo técnico propio en Catamarca, trabajamos para clientes en todo el país. ¿Qué tenés en mente?',
      actions: [
        { label: 'Ver desarrollo', href: 'servicios/desarrollo.html' },
        { label: 'Contar mi proyecto', wa: 'Hola, tengo este proyecto: ' },
      ],
    },
    {
      tag: 'hardware',
      match: /(hp\b|lenovo|epson|impresora|servidor|notebook|computadora|pc|hardware|equipamiento)/i,
      reply: 'Vendemos equipamiento HP Enterprise, Lenovo, Epson y otras marcas para empresas: notebooks, servidores, impresoras, periféricos. Asesoramos sobre qué conviene según tu uso. ¿Qué necesitás?',
      actions: [
        { label: 'Tecnología empresarial', href: 'servicios/tecnologia.html' },
        { label: 'Cotizar equipos', wa: 'Hola, necesito cotizar equipos: ' },
      ],
    },

    // === CURSOS específicos ===
    {
      tag: 'curso-gpt',
      match: /(curso.*chatgpt|curso.*claude|chatgpt desde cero|aprender chatgpt|curso.*gpt)/i,
      reply: 'Tenemos un curso de ChatGPT y Claude pensado para personas sin background técnico. Aprendés a usar IA para tareas reales del trabajo: redacción, análisis, planificación, automatización básica. Es en vivo y queda grabado.',
      actions: [
        { label: 'Curso ChatGPT/Claude', href: 'cursos/chatgpt-claude.html' },
        { label: 'Inscribirme', wa: 'Hola, quiero info del curso ChatGPT/Claude' },
      ],
    },
    {
      tag: 'curso-agentes',
      match: /(curso.*agente|agentes? ia|construir agentes|agent[ie]s autonomos|crew\s?ai|autogen)/i,
      reply: 'Nuestro curso de Agentes IA enseña a construir agentes autónomos reales con n8n + Claude/GPT. Salís con casos funcionando: agente que atiende WhatsApp, agente que arma reportes, agente que procesa documentos.',
      actions: [
        { label: 'Curso Agentes IA', href: 'cursos/agentes-ia.html' },
        { label: 'Inscribirme', wa: 'Hola, quiero info del curso Agentes IA' },
      ],
    },
    {
      tag: 'curso-n8n',
      match: /(curso.*n8n|aprender n8n|n8n desde cero)/i,
      reply: 'El curso de n8n te enseña a automatizar procesos sin programar pesado. Conectás APIs, IA, bases de datos, mensajería… ideal para freelancers y equipos que quieren producir más con menos.',
      actions: [
        { label: 'Curso n8n', href: 'cursos/n8n.html' },
        { label: 'Inscribirme', wa: 'Hola, quiero info del curso n8n' },
      ],
    },
    {
      tag: 'curso-python',
      match: /(python|curso.*python|aprender python|python sin programar|python para no)/i,
      reply: 'Tenemos un curso de Python pensado para personas que no programan pero quieren entender y usar IA y automatización a un nivel más profundo. Enfocado en casos prácticos.',
      actions: [
        { label: 'Curso Python', href: 'cursos/python-no-programadores.html' },
        { label: 'Inscribirme', wa: 'Hola, quiero info del curso Python' },
      ],
    },
    {
      tag: 'curso-ventas',
      match: /(ia.*ventas|ia.*marketing|prompt.*ventas|copy con ia|marketing con ia)/i,
      reply: 'El curso "IA para Ventas y Marketing" es para equipos comerciales: prospección con IA, copy persuasivo, automatización de seguimiento, análisis de objeciones. Ahorrás horas y vendés más.',
      actions: [
        { label: 'Curso IA Ventas', href: 'cursos/ia-ventas-marketing.html' },
        { label: 'Inscribirme', wa: 'Hola, quiero info del curso IA Ventas' },
      ],
    },
    {
      tag: 'cursos-generic',
      match: /(curso|cursos|formaci[oó]n|capacitaci[oó]n|aprender|estudiar|certificaci[oó]n)/i,
      reply: 'Tenemos 6 cursos activos: ChatGPT/Claude, Agentes IA, n8n, Python para no programadores, Chatbots WhatsApp, IA para Ventas y Marketing. Todos en vivo, en español, con casos reales. ¿Alguno te llama la atención?',
      actions: [
        { label: 'Ver todos los cursos', href: 'cursos.html' },
        { label: 'Curso para mi equipo', wa: 'Hola, quiero un curso in-company: ' },
      ],
    },

    // === CASOS de uso por industria ===
    {
      tag: 'mineria',
      match: /(miner[ií]a|mina|yacimiento|cantera|operaci[oó]n minera)/i,
      reply: 'Trabajamos mucho con minería en Catamarca y la región: comunicaciones en sitio, automatización de reportes, integraciones con sistemas de gestión, soporte 24/7. ¿De qué operación estamos hablando?',
      actions: [{ label: 'Hablar con especialista', wa: 'Hola, trabajo en minería y necesito: ' }],
    },
    {
      tag: 'seguridad',
      match: /(seguridad|vigilancia|custodia|guardia|monitoreo|c[aá]maras)/i,
      reply: 'Para empresas de seguridad hacemos: dotación de radios Motorola/Hytera, integración con sistemas de monitoreo, automatizaciones de reporte. ¿Querés que armemos una propuesta?',
      actions: [{ label: 'Cotizar', wa: 'Hola, soy de una empresa de seguridad: ' }],
    },
    {
      tag: 'logistica',
      match: /(log[ií]stica|flota|transporte|reparto|delivery|cami[oó]n)/i,
      reply: 'Para logística combinamos: comunicaciones por radio para flota, tracking GPS, automatización de ruteo y reportes. ¿Cuántas unidades manejás?',
      actions: [{ label: 'Hablar de mi flota', wa: 'Hola, tengo una flota de: ' }],
    },

    // === PRECIO / COMERCIAL ===
    {
      tag: 'pricing',
      match: /(precio|cu[aá]nto sale|cu[aá]nto cuesta|cu[aá]nto vale|costo|presupuesto|cotiz|tarifa|honorarios|valor)/i,
      reply: 'Cada proyecto se cotiza según alcance — no manejamos precio cerrado porque cada cliente tiene una realidad distinta. Si me contás brevemente qué necesitás, te paso una estimación inicial por WhatsApp en menos de 24 hs.',
      actions: [
        { label: 'Pedir cotización', wa: 'Hola, quiero cotizar: ' },
        { label: 'Formulario detallado', href: 'contacto.html' },
      ],
    },
    {
      tag: 'time',
      match: /(cu[aá]nto tarda|cu[aá]nto demora|tiempo de entrega|plazo|cu[aá]ndo|deadline)/i,
      reply: 'Depende mucho del proyecto. Un MVP web simple: 2-4 semanas. Una automatización con n8n: 1-2 semanas. Un sistema más grande: 1-3 meses. Te paso un cronograma concreto cuando vea el alcance.',
      actions: [{ label: 'Contar mi proyecto', wa: 'Hola, necesito esto y quiero saber plazos: ' }],
    },
    {
      tag: 'urgent',
      match: /(urgente|para ya|para hoy|para ma[ñn]ana|apuro|r[aá]pido|express|emergencia)/i,
      reply: '¡Entendido, es urgente! Lo más rápido es WhatsApp directo, así te atiende alguien del equipo ya mismo.',
      actions: [{ label: 'WhatsApp urgente', wa: 'Hola, tengo algo urgente: ' }],
    },

    // === CONTACTO / EMPRESA ===
    {
      tag: 'contact',
      match: /(contacto|tel[eé]fono|n[uú]mero|email|mail|whatsapp|d[oó]nde est[aá]n|ubicaci[oó]n|direcci[oó]n|catamarca|of?icinas?)/i,
      reply: 'Estamos en Catamarca, Argentina, y trabajamos para clientes en todo el país. Contacto rápido:\n• WhatsApp: +54 9 3834 32-7244\n• Email: contacto@mineconnect.com.ar',
      actions: [
        { label: 'WhatsApp', wa: 'Hola MineConnect 👋' },
        { label: 'Formulario completo', href: 'contacto.html' },
      ],
    },
    {
      tag: 'about',
      match: /(qu[eé] hacen|de qu[eé] se trata|qu[eé] es mineconnect|empresa|equipo|historia|fundador)/i,
      reply: 'MineConnect es una empresa técnica de Catamarca que combina tres mundos: radiocomunicaciones profesionales (Motorola/Hytera), desarrollo de software a medida e implementación de IA. No tercerizamos: el equipo que cotiza es el que ejecuta.',
      actions: [{ label: 'Conocernos más', href: 'nosotros.html' }],
    },
    {
      tag: 'partner',
      match: /(partner|oficial|distribuidor|representante|autorizado)/i,
      reply: 'Sí, somos Partner Oficial de Motorola Solutions y Hytera — eso significa precios y soporte directos de fábrica, garantía oficial, acceso a equipos no disponibles en el mercado gris.',
      actions: [{ label: 'Radiocomunicaciones', href: 'servicios/radiocomunicaciones.html' }],
    },
    {
      tag: 'work-with',
      match: /(trabajan con|clientes|referencias|casos de [eé]xito|portfolio|portafolio)/i,
      reply: 'Trabajamos con empresas de minería, seguridad, logística, agropecuarias, gobierno y pymes en general. Por privacidad no listamos clientes públicamente, pero te puedo contar casos concretos si me decís tu rubro.',
      actions: [{ label: 'Contame tu rubro', wa: 'Hola, soy de la industria: ' }],
    },
  ];

  // Cuando nada matchea, en vez de listar palabras clave, devolvemos
  // una respuesta CONVERSACIONAL distinta cada vez, basada en lo que dijo
  // el usuario, e intentamos hacer un follow-up.
  const FALLBACK_VARIANTS = [
    {
      reply: 'Te leo. Para orientarte mejor, ¿podés contarme un poco más? ¿Es algo para vos personalmente, para tu trabajo, o para una empresa que manejás?',
      actions: [{ label: 'Hablar con humano', wa: 'Hola, vengo del chat: ' }],
    },
    {
      reply: 'Mmm, no me queda 100% claro qué necesitás. ¿Es un tema de comunicaciones (radios), de software (apps/sistemas), de automatizar con IA, de capacitarte, o algo de soporte técnico?',
      actions: [
        { label: 'Es otra cosa, abrime WhatsApp', wa: 'Hola, quiero consultar algo: ' },
      ],
    },
    {
      reply: 'Para darte una respuesta útil necesito un poco más de contexto. Por ejemplo: ¿qué problema querés resolver hoy, o qué te gustaría que tu empresa pueda hacer y hoy no puede?',
      actions: [{ label: 'Mejor lo charlamos', wa: 'Hola, quiero contarte algo: ' }],
    },
    {
      reply: 'Si es algo específico que no encaja en lo "típico", lo mejor es que lo charles directo con alguien del equipo. ¿Te conecto con WhatsApp?',
      actions: [{ label: 'Sí, WhatsApp', wa: 'Hola, MC me derivó: ' }],
    },
  ];

  let fallbackIndex = 0;

  function pickGreeting() {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }

  function answerLocal(text) {
    const t = text || '';
    for (const intent of INTENTS) {
      if (intent.match.test(t)) {
        return { reply: intent.reply, actions: intent.actions || [] };
      }
    }
    const f = FALLBACK_VARIANTS[fallbackIndex % FALLBACK_VARIANTS.length];
    fallbackIndex++;
    return { reply: f.reply, actions: f.actions };
  }

  function toAnthropic(history) {
    return history
      .filter(m => m.role === 'user' || m.role === 'bot')
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
  }

  function actionsFor(text, userText) {
    const lower = (text + ' ' + userText).toLowerCase();
    const acts = [];
    if (/(whatsapp|hablar con|coordin|asesor|humano|persona|t[eé]cnico|llamar)/i.test(lower)) {
      acts.push({ label: 'Abrir WhatsApp', wa: 'Hola, vengo del chat de la web: ' });
    }
    if (/(curso|formaci|capacit)/i.test(lower)) acts.push({ label: 'Ver cursos', href: 'cursos.html' });
    if (/(radio|motorola|hytera)/i.test(lower)) acts.push({ label: 'Radiocomunicaciones', href: 'servicios/radiocomunicaciones.html' });
    if (/(automat|n8n|agente|ia\b)/i.test(lower)) acts.push({ label: 'Automatizaciones', href: 'servicios/automatizaciones-ia.html' });
    if (/(desarroll|software|app|sistema|web|sitio)/i.test(lower)) acts.push({ label: 'Desarrollo', href: 'servicios/desarrollo.html' });
    if (/(cotiz|presupuesto|precio|costo)/i.test(lower)) acts.push({ label: 'Cotizar', wa: 'Hola, quiero cotizar: ' });
    if (/(sat|soporte t[eé]cnico|reparaci)/i.test(lower)) acts.push({ label: 'SAT', href: 'sat.html' });
    return acts.slice(0, 3);
  }

  async function answerRemote(history, userText) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), API_TIMEOUT);
    try {
      const messages = toAnthropic(history);
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: ctl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) return null;
      const data = await r.json();
      if (!data || !data.reply) return null;
      return { reply: data.reply, actions: actionsFor(data.reply, userText) };
    } catch {
      clearTimeout(timer);
      return null;
    }
  }

  async function answer(text, history) {
    const remote = await answerRemote(history, text);
    return remote || answerLocal(text);
  }

  function pathPrefix() {
    return (/\/(cursos|servicios)\//.test(location.pathname)) ? '../' : '';
  }

  function loadHistory() { return HISTORY.slice(); }
  function saveHistory(h) { HISTORY = h.slice(-30); }
  function clearHistory() { HISTORY = []; }

  function voiceEnabled() {
    return localStorage.getItem(VOICE_KEY) === '1';
  }
  function setVoice(on) {
    localStorage.setItem(VOICE_KEY, on ? '1' : '0');
  }

  let voicesCached = [];
  function getVoice() {
    if (!('speechSynthesis' in window)) return null;
    if (!voicesCached.length) voicesCached = window.speechSynthesis.getVoices();
    // prefer Spanish (es-AR > es-MX > es-ES > any es)
    const score = (v) => {
      const l = (v.lang || '').toLowerCase();
      if (l.startsWith('es-ar') || l.startsWith('es_ar')) return 100;
      if (l.startsWith('es-mx') || l.startsWith('es_mx')) return 80;
      if (l.startsWith('es-us')) return 70;
      if (l.startsWith('es-es') || l.startsWith('es_es')) return 60;
      if (l.startsWith('es')) return 50;
      return 0;
    };
    return voicesCached.slice().sort((a, b) => score(b) - score(a))[0] || null;
  }

  function speak(text) {
    if (!voiceEnabled() || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[\*_`#>]+/g, ''));
      const v = getVoice(); if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'es-AR'; }
      u.rate = 1.05; u.pitch = 1.05; u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
  }

  function buildPanel() {
    const prefix = pathPrefix();
    const root = el('div', { class: 'mc-chat', role: 'dialog', 'aria-label': 'Chat MineConnect' });

    const voiceBtn = el('button', {
      class: 'mc-chat-voice', 'aria-label': 'Activar/desactivar voz', title: 'Voz',
    }, [voiceEnabled() ? '🔊' : '🔇']);
    voiceBtn.addEventListener('click', () => {
      const on = !voiceEnabled();
      setVoice(on);
      voiceBtn.textContent = on ? '🔊' : '🔇';
      if (!on) try { window.speechSynthesis.cancel(); } catch {}
    });

    const resetBtn = el('button', {
      class: 'mc-chat-voice', 'aria-label': 'Limpiar chat', title: 'Limpiar',
    }, ['🗑']);
    resetBtn.addEventListener('click', () => {
      clearHistory();
      body.innerHTML = '';
      seedGreeting();
    });

    const header = el('div', { class: 'mc-chat-head' }, [
      el('div', { class: 'mc-chat-avatar' }, [
        el('img', { src: `${prefix}assets/logo-robot-96.webp`, alt: 'MC', onerror: function(){this.src=`${prefix}assets/logo-robot-96.png`;} }),
      ]),
      el('div', { class: 'mc-chat-id' }, [
        el('strong', {}, ['MC · Asistente']),
        el('span', { class: 'mc-chat-status' }, ['en línea · responde rápido']),
      ]),
      voiceBtn,
      resetBtn,
      el('button', { class: 'mc-chat-close', 'aria-label': 'Cerrar', onclick: () => toggle(false) }, ['✕']),
    ]);

    const body = el('div', { class: 'mc-chat-body' });
    const form = el('form', { class: 'mc-chat-form' });
    const input = el('input', { type: 'text', placeholder: 'Escribí tu consulta…', 'aria-label': 'Mensaje', autocomplete: 'off' });
    const submit = el('button', { type: 'submit', 'aria-label': 'Enviar' }, ['→']);
    form.appendChild(input); form.appendChild(submit);
    form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });

    root.appendChild(header); root.appendChild(body); root.appendChild(form);

    function bubble(role, text, actions) {
      const wrap = el('div', { class: `mc-msg mc-msg-${role}` });
      if (role === 'bot') {
        wrap.appendChild(el('div', { class: 'mc-msg-avatar' }, [
          el('img', { src: `${prefix}assets/logo-robot-96.webp`, alt: '', onerror: function(){this.src=`${prefix}assets/logo-robot-96.png`;} }),
        ]));
      }
      const p = el('p', {}, [text]);
      const content = el('div', { class: 'mc-msg-content' }, [p]);
      if (actions && actions.length) {
        const acts = el('div', { class: 'mc-msg-actions' });
        for (const a of actions) {
          if (a.wa) {
            acts.appendChild(el('a', {
              class: 'mc-act mc-act-wa', target: '_blank', rel: 'noopener',
              href: WA_BASE + encodeURIComponent(a.wa),
            }, [a.label]));
          } else if (a.href) {
            acts.appendChild(el('a', { class: 'mc-act', href: prefix + a.href }, [a.label]));
          }
        }
        content.appendChild(acts);
      }
      wrap.appendChild(content);
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
      return wrap;
    }

    async function send(text) {
      text = (text || '').trim();
      if (!text) return;
      bubble('user', text);
      input.value = ''; input.disabled = true;
      const history = loadHistory();
      history.push({ role: 'user', text });
      saveHistory(history);
      const typing = bubble('bot', '●●●');
      typing.querySelector('p').classList.add('mc-typing');
      try {
        const { reply, actions } = await answer(text, history);
        typing.remove();
        bubble('bot', reply, actions);
        speak(reply);
        const h2 = loadHistory(); h2.push({ role: 'bot', text: reply }); saveHistory(h2);
      } finally {
        input.disabled = false; input.focus();
      }
    }

    function seedGreeting() {
      const greet = pickGreeting();
      bubble('bot', greet, [
        { label: 'Quiero cotizar', wa: 'Hola, quiero cotizar: ' },
        { label: 'Quiero un curso', href: 'cursos.html' },
        { label: 'WhatsApp directo', wa: 'Hola MineConnect 👋' },
      ]);
      const h = loadHistory(); h.push({ role: 'bot', text: greet }); saveHistory(h);
    }
    const history = loadHistory();
    if (history.length) {
      for (const m of history) bubble(m.role, m.text);
    } else {
      seedGreeting();
    }

    root._send = send;
    root._input = input;
    return root;
  }

  function picture(prefix, baseName, alt, w, h, extra) {
    const pic = el('picture');
    pic.appendChild(el('source', { srcset: `${prefix}assets/${baseName}.webp`, type: 'image/webp' }));
    const img = el('img', Object.assign({ src: `${prefix}assets/${baseName}.png`, alt }, extra || {}));
    if (w) img.setAttribute('width', String(w));
    if (h) img.setAttribute('height', String(h));
    pic.appendChild(img);
    return pic;
  }

  function buildLauncher() {
    const prefix = pathPrefix();
    return el('button', {
      class: 'mc-launcher', 'aria-label': 'Abrir chat con MC',
      onclick: () => toggle(),
    }, [
      picture(prefix, 'logo-robot-96', '', 42, 42),
      el('span', { class: 'mc-launcher-dot' }),
    ]);
  }

  let panel, launcher, open = false;
  function toggle(force) {
    open = (typeof force === 'boolean') ? force : !open;
    document.body.classList.toggle('mc-chat-open', open);
    if (open) {
      setTimeout(() => panel._input?.focus(), 250);
      if ('speechSynthesis' in window) { voicesCached = window.speechSynthesis.getVoices(); }
    } else {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }

  // Inyecta el robot CSS puro flotante (vive en TODAS las páginas)
  function injectFloatingRobot() {
    // Si había un robot viejo del hero, lo escondemos (sigue existiendo para no romper layout)
    const oldHero = document.querySelector('.hero-logo, .mc-hero-stage');
    if (oldHero) oldHero.style.display = 'none';

    const robot = el('div', { id: 'mc-robot', 'aria-label': 'MC, asistente de MineConnect' }, [
      el('div', { class: 'mc-body', role: 'button', tabindex: '0', onclick: () => toggle(true), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(true); } } }, [
        // Drones
        el('div', { class: 'mc-dron', style: 'animation-delay:0s; top: 0; left: 30%;' }),
        el('div', { class: 'mc-dron', style: 'animation-delay:1.7s; top: 20%; left: 10%;' }),
        el('div', { class: 'mc-dron', style: 'animation-delay:3.4s; top: 10%; right: 10%;' }),
        // Sombra
        el('div', { class: 'mc-floor-shadow', 'aria-hidden': 'true' }),
        // Casco
        el('div', { class: 'mc-casco' }, [
          el('div', { class: 'mc-antena izq', 'aria-hidden': 'true' }),
          el('div', { class: 'mc-antena der', 'aria-hidden': 'true' }),
          el('div', { class: 'mc-linterna', 'aria-hidden': 'true' }),
          el('div', { class: 'mc-ojos' }, [
            el('div', { class: 'mc-ojo' }),
            el('div', { class: 'mc-ojo' }),
          ]),
        ]),
        // Chaleco con M
        el('div', { class: 'mc-chaleco' }, [
          el('div', { class: 'mc-logo-m' }, ['M']),
        ]),
        // Mano saludando
        el('div', { class: 'mc-mano', 'aria-hidden': 'true' }, ['✋']),
      ]),
    ]);

    // Bocadillo separado (también animado con mismo timing para "seguir" al robot)
    const balloon = el('div', { id: 'mc-speech-balloon', 'aria-hidden': 'true' }, [
      el('div', { class: 'mc-speech-inner', onclick: () => toggle(true) }, [SPEECH_PHRASES[0]]),
    ]);

    document.body.appendChild(robot);
    document.body.appendChild(balloon);

    // Rotar emoji de la mano (saluda, pulgar, laptop, antena)
    const handIcons = ['✋', '👍', '💻', '📡', '👋', '🤖'];
    const handEl = robot.querySelector('.mc-mano');
    setInterval(() => {
      handEl.textContent = handIcons[Math.floor(Math.random() * handIcons.length)];
    }, 3200);

    // Rotar frase del bocadillo
    const inner = balloon.querySelector('.mc-speech-inner');
    let i = 0;
    setInterval(() => {
      i = (i + 1) % SPEECH_PHRASES.length;
      inner.style.transition = 'opacity .25s';
      inner.style.opacity = 0;
      setTimeout(() => { inner.textContent = SPEECH_PHRASES[i]; inner.style.opacity = 1; }, 250);
    }, 5500);
  }

  function init() {
    panel = buildPanel();
    launcher = buildLauncher();
    document.body.appendChild(panel);
    document.body.appendChild(launcher);
    injectFloatingRobot();

    if ('speechSynthesis' in window) {
      // load voices async
      window.speechSynthesis.onvoiceschanged = () => { voicesCached = window.speechSynthesis.getVoices(); };
    }

    window.MineConnectChat = {
      open: () => toggle(true),
      close: () => toggle(false),
      reset: () => { sessionStorage.removeItem(STORAGE_KEY); location.reload(); },
      voice: (on) => { setVoice(!!on); },
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
