import { z } from "npm:zod@3.23.8";
const hm = z.string().regex(/^\d{2}:\d{2}$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const AssessmentBody = z.object({
  eligibility: z.object({ enterpriseAgreement: z.enum(["yes","no","unknown"]), shiftworker: z.enum(["yes","no","unknown"]), specialArrangement: z.enum(["yes","no","unknown"]), awardConfirmed: z.boolean(), classificationConfirmed: z.boolean(), rateConfirmed: z.boolean() }).optional(),
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
    rdoAccrual: z.boolean().optional(),
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

