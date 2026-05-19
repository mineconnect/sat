(function () {
  'use strict';

  const STORAGE_KEY = 'mc-chat-history';
  const WA_NUMBER   = '5493834327244';
  const WA_BASE     = `https://wa.me/${WA_NUMBER}?text=`;
  const API_URL     = 'https://mineconnect-chat-api.vercel.app/api/chat';
  const API_TIMEOUT = 15000;

  const GREETINGS = [
    '¡Hola! Soy MC 🤖 — ¿en qué puedo ayudarte?',
    '¡Buenas! Contame qué problema querés resolver.',
    '¡Hey! ¿Buscás automatizar algo, radios o un sistema a medida?',
    '¡Hola! Puedo orientarte con cursos, servicios o cotizaciones.',
  ];

  const INTENTS = [
    {
      match: /(precio|costo|cotiza|cuanto|cuánto|presupuesto|tarifa)/i,
      reply: 'Cada proyecto se cotiza según alcance. Decime brevemente qué necesitás y lo derivamos a un especialista por WhatsApp.',
      actions: [
        { label: 'Cotizar por WhatsApp', wa: 'Hola, quiero cotizar un proyecto: ' },
        { label: 'Formulario de contacto', href: 'contacto.html' },
      ],
    },
    {
      match: /(radio|motorola|hytera|comunicaci|antena|repetidor)/i,
      reply: 'Somos Partner Oficial Motorola y Hytera. Hacemos venta, instalación y soporte técnico (SAT) en todo el NOA.',
      actions: [
        { label: 'Ver servicios de radio', href: 'servicios/radiocomunicaciones.html' },
        { label: 'Hablar por WhatsApp', wa: 'Hola, necesito radios/comunicaciones: ' },
      ],
    },
    {
      match: /(automat|ia\b|inteligencia|n8n|agente|bot|workflow)/i,
      reply: 'Automatizamos procesos repetitivos con IA y n8n: facturación, reportes, scraping, chatbots, integraciones. Ahorramos horas de trabajo manual.',
      actions: [
        { label: 'Ver automatizaciones', href: 'servicios/automatizaciones-ia.html' },
        { label: 'Cotizar automatización', wa: 'Hola, quiero automatizar un proceso: ' },
      ],
    },
    {
      match: /(curso|formaci|capacit|aprender|clase|profesor)/i,
      reply: 'Tenemos cursos en vivo y a medida: ChatGPT/Claude, Agentes IA, n8n, Python sin programación, Chatbots WhatsApp, IA para ventas.',
      actions: [
        { label: 'Ver todos los cursos', href: 'cursos.html' },
        { label: 'Curso para mi empresa', wa: 'Hola, quiero un curso in-company: ' },
      ],
    },
    {
      match: /(desarrollo|software|app|aplicaci|sistema|web|programa)/i,
      reply: 'Desarrollamos software a medida: apps móviles, sistemas internos, dashboards, integraciones. Trabajamos rápido y sin tercerizar.',
      actions: [
        { label: 'Ver desarrollo', href: 'servicios/desarrollo.html' },
        { label: 'Contar mi proyecto', wa: 'Hola, tengo un proyecto de desarrollo: ' },
      ],
    },
    {
      match: /(sat|servicio t[eé]cnico|soporte|reparaci)/i,
      reply: 'Nuestro SAT atiende clientes con equipos Motorola y Hytera. Diagnóstico, reparación y mantenimiento preventivo.',
      actions: [
        { label: 'Conocer el SAT', href: 'sat.html' },
        { label: 'Pedir soporte', wa: 'Hola, necesito soporte técnico SAT: ' },
      ],
    },
    {
      match: /(contacto|tel[eé]fono|email|mail|whatsapp|donde|dónde|ubicaci|catamarca)/i,
      reply: 'Estamos en Catamarca y trabajamos en todo Argentina. Email: contacto@mineconnect.com.ar · WhatsApp directo abajo.',
      actions: [
        { label: 'WhatsApp ahora', wa: 'Hola, quiero contactarme con MineConnect.' },
        { label: 'Ir a contacto', href: 'contacto.html' },
      ],
    },
    {
      match: /(quien|quién|nosotros|empresa|equipo|historia)/i,
      reply: 'Somos un equipo técnico de Catamarca que combina radiocomunicaciones, software e IA. Resolvemos lo que tu operación necesita, sin tercerizar.',
      actions: [
        { label: 'Conocernos', href: 'nosotros.html' },
      ],
    },
    {
      match: /(hola|buenas|buen d|buen t|hey|holi)/i,
      reply: '¡Hola! ¿Qué necesitás resolver? Decime una palabra clave: "radios", "automatización IA", "cursos", "desarrollo a medida", "soporte"…',
      actions: [],
    },
    {
      match: /(gracias|genial|perfecto|bárbaro|barbaro|ok|dale)/i,
      reply: '¡A vos! Si necesitás algo más, escribime o tocá WhatsApp para hablar con una persona.',
      actions: [
        { label: 'Abrir WhatsApp', wa: 'Hola, MC me derivó. ' },
      ],
    },
  ];

  const FALLBACK = {
    reply: 'No estoy seguro de entenderte 🤔. Probá con palabras como: "cotizar", "radios", "automatizar con IA", "cursos", "desarrollo" o "soporte". O tocá WhatsApp para hablar con un humano.',
    actions: [
      { label: 'Hablar por WhatsApp', wa: 'Hola, vengo del chat de la web: ' },
      { label: 'Formulario completo', href: 'contacto.html' },
    ],
  };

  function pickGreeting() {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }

  function answerLocal(text) {
    for (const intent of INTENTS) {
      if (intent.match.test(text)) return { reply: intent.reply, actions: intent.actions };
    }
    return FALLBACK;
  }

  // Map our internal history into Anthropic-style messages
  function toAnthropic(history) {
    return history
      .filter(m => m.role === 'user' || m.role === 'bot')
      .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
  }

  // Heuristic: pick actions for an LLM reply based on its content
  function actionsFor(text, userText) {
    const lower = (text + ' ' + userText).toLowerCase();
    const acts = [];
    if (/(whatsapp|hablar|contact|coordin|coordinar|asesor|humano|persona|t[eé]cnico)/i.test(lower)) {
      acts.push({ label: 'Abrir WhatsApp', wa: 'Hola, vengo del chat de la web: ' });
    }
    if (/(curso|formaci|capacit)/i.test(lower)) acts.push({ label: 'Ver cursos', href: 'cursos.html' });
    if (/(radio|motorola|hytera)/i.test(lower)) acts.push({ label: 'Radiocomunicaciones', href: 'servicios/radiocomunicaciones.html' });
    if (/(automat|n8n|agente|ia\b)/i.test(lower)) acts.push({ label: 'Automatizaciones', href: 'servicios/automatizaciones-ia.html' });
    if (/(desarroll|software|app|sistema)/i.test(lower)) acts.push({ label: 'Desarrollo', href: 'servicios/desarrollo.html' });
    if (/(cotiz|presupuesto|precio|costo)/i.test(lower)) acts.push({ label: 'Cotizar', wa: 'Hola, quiero cotizar un proyecto: ' });
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
    // detect if we're inside /cursos/ or /servicios/ subdir
    const p = location.pathname;
    return (/\/(cursos|servicios)\//.test(p)) ? '../' : '';
  }

  function loadHistory() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveHistory(h) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(-30))); } catch {}
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

    const header = el('div', { class: 'mc-chat-head' }, [
      el('div', { class: 'mc-chat-avatar' }, [
        el('img', { src: `${prefix}assets/logo-robot-96.png`, alt: 'MC' }),
      ]),
      el('div', { class: 'mc-chat-id' }, [
        el('strong', {}, ['MC · Asistente']),
        el('span', { class: 'mc-chat-status' }, ['en línea · responde rápido']),
      ]),
      el('button', { class: 'mc-chat-close', 'aria-label': 'Cerrar', onclick: () => toggle(false) }, ['✕']),
    ]);

    const body = el('div', { class: 'mc-chat-body' });

    const form = el('form', { class: 'mc-chat-form', onsubmit: (e) => { e.preventDefault(); send(input.value); } });
    const input = el('input', { type: 'text', placeholder: 'Escribí tu consulta…', 'aria-label': 'Mensaje', autocomplete: 'off' });
    const submit = el('button', { type: 'submit', 'aria-label': 'Enviar' }, ['→']);
    form.appendChild(input); form.appendChild(submit);

    root.appendChild(header); root.appendChild(body); root.appendChild(form);

    function bubble(role, text, actions) {
      const wrap = el('div', { class: `mc-msg mc-msg-${role}` });
      if (role === 'bot') {
        wrap.appendChild(el('div', { class: 'mc-msg-avatar' }, [
          el('img', { src: `${prefix}assets/logo-robot-96.png`, alt: '' }),
        ]));
      }
      const content = el('div', { class: 'mc-msg-content' }, [el('p', {}, [text])]);
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
      input.value = '';
      input.disabled = true;
      const history = loadHistory();
      history.push({ role: 'user', text });
      saveHistory(history);
      const typing = bubble('bot', '…');
      typing.querySelector('p').classList.add('mc-typing');
      try {
        const { reply, actions } = await answer(text, history);
        typing.remove();
        bubble('bot', reply, actions);
        const h2 = loadHistory(); h2.push({ role: 'bot', text: reply }); saveHistory(h2);
      } finally {
        input.disabled = false;
        input.focus();
      }
    }

    // render history or greeting
    const history = loadHistory();
    if (history.length) {
      for (const m of history) bubble(m.role, m.text);
    } else {
      const greet = pickGreeting();
      bubble('bot', greet, [
        { label: 'Cotizar proyecto', wa: 'Hola, quiero cotizar: ' },
        { label: 'Ver cursos', href: 'cursos.html' },
        { label: 'Hablar por WhatsApp', wa: 'Hola MineConnect 👋' },
      ]);
      const h = loadHistory(); h.push({ role: 'bot', text: greet }); saveHistory(h);
    }

    root._send = send;
    root._input = input;
    return root;
  }

  function buildLauncher() {
    const prefix = pathPrefix();
    const btn = el('button', {
      class: 'mc-launcher', 'aria-label': 'Abrir chat con MC',
      onclick: () => toggle(),
    }, [
      el('img', { src: `${prefix}assets/logo-robot-96.png`, alt: '' }),
      el('span', { class: 'mc-launcher-dot' }),
    ]);
    return btn;
  }

  let panel, launcher, open = false;
  function toggle(force) {
    open = (typeof force === 'boolean') ? force : !open;
    document.body.classList.toggle('mc-chat-open', open);
    if (open) {
      setTimeout(() => panel._input?.focus(), 250);
    }
  }

  function bindHeroRobot() {
    const hero = document.querySelector('.hero-logo');
    if (!hero) return;
    hero.classList.add('mc-hero-robot');
    hero.setAttribute('role', 'button');
    hero.setAttribute('tabindex', '0');
    hero.setAttribute('aria-label', 'Hablar con MC, asistente de MineConnect');
    hero.style.cursor = 'pointer';
    hero.addEventListener('click', () => toggle(true));
    hero.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(true); } });

    // speech bubble
    const phrases = [
      '👋 ¡Hola! Tocame si querés que te ayude.',
      '¿Necesitás integrar IA en tu empresa? Pregúntame.',
      '¿Buscás radios, automatizar o desarrollar algo? Hablemos.',
      'Soy MC, tu asistente. Tocame para empezar.',
      '¿Querés cotizar un proyecto? Estoy acá.',
    ];
    const bubble = el('div', { class: 'mc-speech', onclick: () => toggle(true) }, [
      el('span', { class: 'mc-speech-text' }, [phrases[0]]),
      el('span', { class: 'mc-speech-tail', 'aria-hidden': 'true' }),
    ]);
    hero.parentElement?.insertBefore(bubble, hero.nextSibling);

    let i = 0;
    setInterval(() => {
      i = (i + 1) % phrases.length;
      const t = bubble.querySelector('.mc-speech-text');
      t.style.opacity = 0;
      setTimeout(() => { t.textContent = phrases[i]; t.style.opacity = 1; }, 250);
    }, 5200);

    // hide bubble while chat open
    const obs = new MutationObserver(() => {
      bubble.style.display = document.body.classList.contains('mc-chat-open') ? 'none' : '';
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    panel = buildPanel();
    launcher = buildLauncher();
    document.body.appendChild(panel);
    document.body.appendChild(launcher);
    bindHeroRobot();

    // expose for future API integration
    window.MineConnectChat = {
      open: () => toggle(true),
      close: () => toggle(false),
      reset: () => { sessionStorage.removeItem(STORAGE_KEY); location.reload(); },
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
