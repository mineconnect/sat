// Lightweight constellation — optimized for 60fps
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    let w, h, particles = [];

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 22 : 45;
    const LINK_DIST = isMobile ? 110 : 130;
    const SPEED = 0.18;
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST * DPR * DPR;

    function resize() {
        w = canvas.width = window.innerWidth * DPR;
        h = canvas.height = window.innerHeight * DPR;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < COUNT; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * SPEED * DPR,
                vy: (Math.random() - 0.5) * SPEED * DPR,
                r: (Math.random() * 1.2 + 0.5) * DPR
            });
        }
    }

    // Pause when tab is hidden or canvas is offscreen
    let running = true;
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) requestAnimationFrame(draw);
    });

    function draw() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 229, 153, 0.55)';
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = p.x - q.x;
                const dy = p.y - q.y;
                const dsq = dx * dx + dy * dy;
                if (dsq < LINK_DIST_SQ) {
                    const alpha = (1 - dsq / LINK_DIST_SQ) * 0.18;
                    ctx.strokeStyle = `rgba(106, 163, 255, ${alpha})`;
                    ctx.lineWidth = DPR * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(init, 200);
    });

    init();
    requestAnimationFrame(draw);
})();
