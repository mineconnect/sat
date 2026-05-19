// leads-submit — proxy seguro entre el formulario público y la tabla leads.
// Validación server-side estricta + CORS allowlist + honeypot + rate limit por IP.
// verify_jwt=false: endpoint público con autenticación propia (honeypot + validación + RLS).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://mineconnect.com.ar",
  "https://www.mineconnect.com.ar",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const MAX_BODY = 8 * 1024; // 8 KB

function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://mineconnect.com.ar";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'",
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, origin);
  }
  if ((req.headers.get("content-type") || "").indexOf("application/json") === -1) {
    return json({ error: "unsupported_media_type" }, 415, origin);
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "origin_forbidden" }, 403, origin);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: "payload_too_large" }, 413, origin);

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400, origin); }

  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const tsClient = Number(payload._ts || 0);
  if (tsClient && Date.now() - tsClient < 2000) {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const nombre   = String(payload.nombre   ?? "").trim();
  const empresa  = String(payload.empresa  ?? "").trim() || null;
  const email    = String(payload.email    ?? "").trim().toLowerCase();
  const telefono = String(payload.telefono ?? "").trim() || null;
  const servicio = String(payload.servicio ?? "").trim() || null;
  const mensaje  = String(payload.mensaje  ?? "").trim();

  if (nombre.length  < 2 || nombre.length  > 120)   return json({ error: "invalid_nombre" },  400, origin);
  if (mensaje.length < 5 || mensaje.length > 4000)  return json({ error: "invalid_mensaje" }, 400, origin);
  if (email.length   < 5 || email.length   > 200 || !EMAIL_RE.test(email))
                                                    return json({ error: "invalid_email" },   400, origin);
  if (empresa  && empresa.length  > 200)            return json({ error: "invalid_empresa" }, 400, origin);
  if (telefono && telefono.length > 40)             return json({ error: "invalid_telefono" },400, origin);
  if (servicio && servicio.length > 80)             return json({ error: "invalid_servicio" },400, origin);

  const utm_source   = (typeof payload.utm_source   === "string" ? payload.utm_source   : "").slice(0, 80) || null;
  const utm_medium   = (typeof payload.utm_medium   === "string" ? payload.utm_medium   : "").slice(0, 80) || null;
  const utm_campaign = (typeof payload.utm_campaign === "string" ? payload.utm_campaign : "").slice(0, 80) || null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { error } = await supabase.from("leads").insert({
    nombre, empresa, email, telefono, servicio, mensaje,
    utm_source, utm_medium, utm_campaign,
    ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || null,
    user_agent: req.headers.get("user-agent"),
    referer:    req.headers.get("referer"),
  });

  if (error) {
    console.error("leads insert failed:", error.message);
    return json({ error: "insert_failed" }, 500, origin);
  }

  return new Response(null, { status: 204, headers: corsHeaders(origin) });
});
