#!/usr/bin/env node
// Servidor estático mínimo para Railway / cualquier host Node.
// Sirve `site/`, parsea `_headers` (formato Cloudflare Pages / Netlify)
// y soporta clean URLs (vercel.json: cleanUrls=true).
// Sin dependencias externas.

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.join(__dirname, '..', 'site');
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.webmanifest': 'application/manifest+json',
    '.map': 'application/json; charset=utf-8',
};

function parseHeadersFile(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    const rules = [];
    let current = null;
    for (const line of raw.split('\n')) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        if (!line.startsWith(' ') && !line.startsWith('\t')) {
            if (current) rules.push(current);
            current = { pattern: line.trim(), headers: [] };
        } else if (current) {
            const idx = line.indexOf(':');
            if (idx > 0) {
                const name = line.slice(0, idx).trim();
                const value = line.slice(idx + 1).trim();
                current.headers.push([name, value]);
            }
        }
    }
    if (current) rules.push(current);
    return rules.map(r => ({
        regex: globToRegex(r.pattern),
        headers: r.headers,
    }));
}

function globToRegex(glob) {
    const escaped = glob
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
    return new RegExp('^' + escaped + '$');
}

const HEADER_RULES = parseHeadersFile(path.join(ROOT, '_headers'));

function applyHeaders(res, urlPath) {
    for (const rule of HEADER_RULES) {
        if (rule.regex.test(urlPath)) {
            for (const [name, value] of rule.headers) {
                res.setHeader(name, value);
            }
        }
    }
}

function safeJoin(root, requested) {
    const normalized = path.normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, '');
    const full = path.join(root, normalized);
    if (!full.startsWith(root)) return null;
    return full;
}

function resolveFile(reqPath) {
    let p = safeJoin(ROOT, reqPath);
    if (!p) return null;
    try {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            const idx = path.join(p, 'index.html');
            if (fs.existsSync(idx)) return idx;
            return null;
        }
        return p;
    } catch {
        // clean URLs: /contacto -> /contacto.html
        if (!path.extname(p)) {
            const html = p + '.html';
            if (fs.existsSync(html)) return html;
        }
        return null;
    }
}

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url);
    let pathname = parsed.pathname || '/';

    // trailing slash redirect (vercel: trailingSlash=false)
    if (pathname.length > 1 && pathname.endsWith('/')) {
        res.writeHead(308, { Location: pathname.replace(/\/+$/, '') + (parsed.search || '') });
        return res.end();
    }

    const file = resolveFile(pathname);

    if (!file) {
        const notFound = path.join(ROOT, '404.html');
        applyHeaders(res, pathname);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        if (fs.existsSync(notFound)) {
            return fs.createReadStream(notFound).pipe(res);
        }
        return res.end('Not Found');
    }

    applyHeaders(res, pathname);
    const ext = path.extname(file).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.writeHead(200);
    fs.createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
    console.log(`[serve] sirviendo ${ROOT} en http://${HOST}:${PORT}`);
    console.log(`[serve] ${HEADER_RULES.length} reglas cargadas desde _headers`);
});
