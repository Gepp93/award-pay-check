// Engine v2 HTTP wrapper — INTERNAL TESTING ONLY.
// Server-enforced access: a signed-in user whose account holds the `admin`
// role (public.user_roles, checked server-side). No anonymous access.
// Pure calculation, no storage; logs carry only status and counts.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { assess } from "../_shared/engine-v2/engine.ts";

const hm = z.string().regex(/^\d{2}:\d{2}$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  awardCode: z.string().max(10),
  classificationFixedId: z.number().int(),
  employmentType: z.enum(["full_time", "part_time", "casual"]),
  rateType: z.enum(["adult", "junior", "apprentice", "trainee"]),
  // "" and no shifts are accepted so the ENGINE (not the client) returns Unsupported for e.g. another award.
  state: z.union([z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]), z.literal("")]),
  payPeriod: z.object({ start: day, end: day }).optional(),
  shifts: z.array(z.object({
    date: day, start: hm, finish: hm,
    breakMinutes: z.number().int().min(0).max(600).optional(), breakStart: hm.optional(),
    overtimeMinutes: z.number().int().min(0).max(1440).optional(),
  })).max(62),
  arrangement: z.object({
    allShiftsInPeriodIncluded: z.boolean().optional(), workedToRoster: z.boolean().optional(),
    guaranteedMinutesPerWeek: z.number().int().min(0).max(38 * 60).optional(),
    rosterCycleWeeks: z.number().int().min(1).max(4).optional(),
    spanExceptions: z.array(z.enum(["late_trading", "newsagency", "video_shop"])).max(3).optional(),
  }).optional(),
  holidayConfirmation: z.object({ publicHolidayDates: z.array(day).max(40) }).optional(),
  paid: z.object({
    grossCents: z.number().int().min(0).max(10_000_000).optional(),
    grossCoversOnlyTheseShifts: z.boolean().optional(),
    linesCoverAllWages: z.boolean().optional(),
    lines: z.array(z.object({
      kind: z.enum(["ordinary", "casual_loading", "saturday", "sunday", "public_holiday", "evening", "overtime", "allowance", "leave", "other"]),
      amountCents: z.number().int().min(0).max(10_000_000), label: z.string().max(80).optional(),
      basis: z.enum(["total", "loading", "unknown"]).optional(),
    })).max(60).optional(),
  }).optional(),
  flags: z.object({
    enterpriseAgreement: z.boolean().optional(), awardFree: z.boolean().optional(), shiftworker: z.boolean().optional(),
    casinoGaming: z.boolean().optional(), managerial: z.boolean().optional(),
  }).optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: claims, error: claimErr } = await userClient.auth.getClaims(auth.slice(7));
  const userId = claims?.claims?.sub;
  if (claimErr || !userId || claims.claims.role !== "authenticated") return json({ error: "unauthorized" }, 401);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: isTester, error: roleErr } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (roleErr || isTester !== true) {
    console.log("v2 calc denied: not an authorised tester");
    return json({ error: "forbidden" }, 403);
  }

  const raw = await req.text();
  if (raw.length > 50_000) return json({ error: "too_large" }, 413);
  let body: unknown = null;
  try { body = JSON.parse(raw); } catch { /* handled below */ }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return json({ error: "invalid_input", fields: Object.keys(parsed.error.flatten().fieldErrors) }, 400);

  const result = assess(parsed.data as Parameters<typeof assess>[0]);
  console.log("v2 calc", { status: result.status, shifts: parsed.data.shifts.length, notAssessed: result.notAssessed.length });
  return json(result);
});
