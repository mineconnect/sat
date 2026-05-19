document.addEventListener('DOMContentLoaded', () => {
    // Scroll progress bar (throttled with rAF)
    const progress = document.querySelector('.scroll-progress');
    if (progress) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const h = document.documentElement;
                    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
                    progress.style.transform = `scaleX(${pct / 100})`;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // Mobile menu
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav-links');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('open'));
    }

    // Reveal on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Animated counters
    const counters = document.querySelectorAll('[data-count]');
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObs.observe(c));

    function animateCounter(el) {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1400;
        const start = performance.now();
        function step(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // Form → leads-submit (DB) + WhatsApp, con anti-bot honeypot + min-time
    const LEADS_ENDPOINT = 'https://mgeukotlgrjyauwgdjxv.supabase.co/functions/v1/leads-submit';

    const utmFromUrl = () => {
        const p = new URLSearchParams(location.search);
        return {
            utm_source:   p.get('utm_source')   || null,
            utm_medium:   p.get('utm_medium')   || null,
            utm_campaign: p.get('utm_campaign') || null,
        };
    };

    document.querySelectorAll('form[data-wa]').forEach(form => {
        const tsField = form.querySelector('input[name="_ts"]');
        if (tsField) tsField.value = String(Date.now());

        form.addEventListener('submit', e => {
            e.preventDefault();

            const hp = form.querySelector('input[name="website"]');
            if (hp && hp.value.trim() !== '') return;

            const ts = Number(form.querySelector('input[name="_ts"]')?.value || 0);
            if (ts && Date.now() - ts < 2000) return;

            const data = new FormData(form);
            const get = (k) => (data.get(k) || '').toString().trim();

            const payload = {
                nombre:   get('Nombre'),
                empresa:  get('Empresa'),
                email:    get('Email'),
                telefono: get('Telefono'),
                servicio: get('Servicio'),
                mensaje:  get('Mensaje'),
                website:  hp ? hp.value : '',
                _ts:      ts,
                ...utmFromUrl(),
            };

            // Fire-and-forget al edge function (no bloquea la apertura de WhatsApp).
            // keepalive=true permite que el POST sobreviva la navegación a wa.me.
            try {
                fetch(LEADS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true,
                    mode: 'cors',
                    credentials: 'omit',
                    referrerPolicy: 'no-referrer',
                }).catch(() => { /* silencio: WhatsApp sigue siendo el canal primario */ });
            } catch (_) { /* idem */ }

            const lines = [];
            for (const [key, value] of data.entries()) {
                if (key === 'website' || key === '_ts') continue;
                if (value) lines.push(`${key}: ${value}`);
            }
            const msg = encodeURIComponent(
                `Hola MineConnect, te escribo desde el sitio:\n\n${lines.join('\n')}`
            );
            window.open(`https://wa.me/5493834327244?text=${msg}`, '_blank');
        });
    });

});
