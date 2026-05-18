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

    // Form → WhatsApp
    document.querySelectorAll('form[data-wa]').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const data = new FormData(form);
            const lines = [];
            for (const [key, value] of data.entries()) {
                if (value) lines.push(`${key}: ${value}`);
            }
            const msg = encodeURIComponent(
                `Hola MineConnect, te escribo desde el sitio:\n\n${lines.join('\n')}`
            );
            window.open(`https://wa.me/5493834327244?text=${msg}`, '_blank');
        });
    });

});
