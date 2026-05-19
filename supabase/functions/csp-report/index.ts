// csp-report — endpoint que captura violaciones CSP del navegador (report-to/report-uri).
// Acepta application/csp-report y application/reports+json. Público (sin JWT).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_BODY = 64 * 1024;
const ALLOWED_ORIGINS = new Set([
  "https://mineconnect.com.ar",
  "https://www.mineconnect.com.ar",
]);

function cors(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://mineconnect.com.ar";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: cors(origin) });
  }

  const raw = await req.text();
  if (raw.length === 0 || raw.length > MAX_BODY) {
    return new Response(null, { status: 400, headers: cors(origin) });
  }

  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return new Response(null, { status: 400, headers: cors(origin) }); }

  // Soporta dos formatos:
  //  - Legacy report-uri:  { "csp-report": { ... } }
  //  - Reporting API:      [ { type: "csp-violation", body: { ... } }, ... ]
  const reports: Array<Record<string, unknown>> = [];
  if (Array.isArray(parsed)) {
    for (const r of parsed as Array<Record<string, unknown>>) {
      if (r && typeof r === "object" && (r as any).type === "csp-violation") {
        reports.push((r as any).body ?? {});
      }
    }
  } else if (parsed && typeof parsed === "object" && "csp-report" in (parsed as any)) {
    reports.push((parsed as any)["csp-report"] ?? {});
  } else {
    reports.push(parsed as any);
  }

  if (reports.length === 0) {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
  const ua = req.headers.get("user-agent");

  const rows = reports.slice(0, 20).map((r) => ({
    document_uri: String((r as any)["document-uri"] ?? (r as any).documentURL ?? "").slice(0, 2000) || null,
    violated:     String((r as any)["violated-directive"] ?? (r as any).effectiveDirective ?? "").slice(0, 200) || null,
    blocked_uri:  String((r as any)["blocked-uri"] ?? (r as any).blockedURL ?? "").slice(0, 2000) || null,
    source_file:  String((r as any)["source-file"] ?? (r as any).sourceFile ?? "").slice(0, 2000) || null,
    line_number:  Number.isFinite(Number((r as any)["line-number"] ?? (r as any).lineNumber))
                  ? Number((r as any)["line-number"] ?? (r as any).lineNumber) : null,
    raw:          r,
    ip_address:   ip,
    user_agent:   ua,
  }));

  const { error } = await supabase.from("_csp_reports").insert(rows);
  if (error) {
    console.error("csp-report insert failed:", error.message);
    return new Response(null, { status: 500, headers: cors(origin) });
  }

  return new Response(null, { status: 204, headers: cors(origin) });
});
