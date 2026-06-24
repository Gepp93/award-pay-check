// Shared abuse-protection helpers for public Edge Functions.
// Returns a Response on failure (which the handler should return immediately),
// or null when the request is allowed to proceed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_HOST_SUFFIXES = [
  "awardpay.com.au",
  ".lovable.app",
  ".lovable.dev",
  "localhost",
  "127.0.0.1",
];

function hostFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

export function assertAllowedOrigin(req: Request): Response | null {
  const host =
    hostFromHeader(req.headers.get("origin")) ??
    hostFromHeader(req.headers.get("referer"));

  // No origin/referer at all → likely server-to-server or curl. Block to be safe.
  if (!host) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) =>
      host === suffix ||
      host === suffix.replace(/^\./, "") ||
      (suffix.startsWith(".") ? host.endsWith(suffix) : host.endsWith("." + suffix)),
  );

  if (!allowed) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return null;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

let _admin: ReturnType<typeof createClient> | null = null;
function admin() {
  if (_admin) return _admin;
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

export interface RateLimitOpts {
  fn: string;
  limit: number;
  windowSeconds: number;
}

export async function enforceRateLimit(
  req: Request,
  opts: RateLimitOpts,
): Promise<Response | null> {
  const ip = clientIp(req);
  const bucket = `${opts.fn}:${ip}`;

  try {
    const { data, error } = await admin().rpc("increment_rate_limit", {
      _bucket: bucket,
      _window_seconds: opts.windowSeconds,
      _limit: opts.limit,
    });
    if (error) {
      // Fail open on infrastructure errors — don't break the user flow.
      console.error("rate limit check failed:", error.message);
      return null;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.allowed === false) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(row.retry_after ?? opts.windowSeconds),
          },
        },
      );
    }
  } catch (e) {
    console.error("rate limit exception:", e);
  }
  return null;
}

export async function guardPublicFunction(
  req: Request,
  opts: RateLimitOpts,
): Promise<Response | null> {
  const originBlock = assertAllowedOrigin(req);
  if (originBlock) return originBlock;
  return await enforceRateLimit(req, opts);
}