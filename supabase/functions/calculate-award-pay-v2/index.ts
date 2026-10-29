// Engine v2 HTTP wrapper. NOT deployed and not called by any page: v2 stays
// off for customers until the owner approves it. Pure calculation, no storage.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { assess } from "../_shared/engine-v2/engine.ts";

const hm = z.string().regex(/^\d{2}:\d{2}$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.object({
  awardCode: z.string().max(10),
  classificationFixedId: z.number().int(),
  employmentType: z.enum(["full_time", "part_time", "casual"]),
  rateType: z.enum(["adult", "junior", "apprentice", "trainee"]),
  state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]),
  payPeriod: z.object({ start: day, end: day }).optional(),
  shifts: z.array(z.object({
    date: day, start: hm, finish: hm,
    breakMinutes: z.number().int().min(0).max(600).optional(), breakStart: hm.optional(),
    overtimeMinutes: z.number().int().min(0).max(1440).optional(),
  })).min(1).max(62),
  holidayConfirmation: z.object({ publicHolidayDates: z.array(day).max(40) }).optional(),
  paid: z.object({
    grossCents: z.number().int().min(0).optional(),
    grossCoversOnlyTheseShifts: z.boolean().optional(),
    lines: z.array(z.object({
      kind: z.enum(["ordinary", "saturday", "sunday", "public_holiday", "evening", "overtime", "allowance", "leave", "other"]),
      amountCents: z.number().int().min(0), label: z.string().max(80).optional(),
    })).max(60).optional(),
  }).optional(),
  flags: z.object({
    enterpriseAgreement: z.boolean().optional(), awardFree: z.boolean().optional(), shiftworker: z.boolean().optional(),
    casinoGaming: z.boolean().optional(), managerial: z.boolean().optional(),
  }).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify(assess(parsed.data)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
