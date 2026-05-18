(function () {
    function mulberry32(seed) {
        let a = seed | 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    document.querySelectorAll('.topo').forEach(function (host) {
        const seed = parseInt(host.dataset.topo || '7', 10);
        const hot = parseInt(host.dataset.hot || '4', 10);
        const rand = mulberry32(seed * 9973);
        const cx = 800, cy = 380, segs = 90;
        const paths = [];
        for (let i = 0; i < 22; i++) {
            const baseRx = 120 + i * 56;
            const baseRy = 80 + i * 38;
            const pts = [];
            for (let s = 0; s <= segs; s++) {
                const a = (s / segs) * Math.PI * 2;
                const noise = (rand() - 0.5) * 40 * (1 + i * 0.08);
                const rx = baseRx + noise;
                const ry = baseRy + noise * 0.6;
                pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
            }
            const d = pts.map((p, idx) => (idx === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + ' Z';
            const cls = (i === hot || i === hot + 6) ? ' class="hot"' : '';
            paths.push('<path d="' + d + '"' + cls + '/>');
        }
        host.innerHTML = '<svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice">' + paths.join('') + '</svg>';
    });
})();
