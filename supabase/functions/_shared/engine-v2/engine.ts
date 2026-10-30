// AwardPay calculation engine v2 — award-specific, dated, integer cents.
// Pure module: no network, no Deno/Node APIs, so tests run it directly.
// v1 (`calculate-shift-pay`) is untouched; nothing routes customers here yet.
import retail from "./data/MA000004.json" with { type: "json" };
import hospitality from "./data/MA000009.json" with { type: "json" };
import fastFood from "./data/MA000003.json" with { type: "json" };
import construction from "./data/MA000020.json" with { type: "json" };
import electrical from "./data/MA000025.json" with { type: "json" };
import restaurant from "./data/MA000119.json" with { type: "json" };
import clubs from "./data/MA000058.json" with { type: "json" };
import pharmacy from "./data/MA000012.json" with { type: "json" };
import hairBeauty from "./data/MA000005.json" with { type: "json" };
import holidaysData from "./data/public-holidays.json" with { type: "json" };
import { RULE_PACKS, type Dow, type Employment, type OrdinaryRules, type OvertimeRules, type PenaltyRef } from "./rulepacks.ts";

export const ENGINE_VERSION = "v2.3.0";

/** Award-text penalty record for awards the Fair Work pay database doesn't cover (MA000020). See scripts/engine-v2/inline_penalties.json. */
interface InlinePenalty { id: string; rate: number; description: string; clause: string; operativeFrom: string; operativeTo: string | null; sourceUrl: string; verifiedOn: string }
type Snapshot = typeof retail & { inlinePenalties?: InlinePenalty[] };
const SNAPSHOTS: Record<string, Snapshot> = { MA000004: retail, MA000009: hospitality as Snapshot, MA000003: fastFood as Snapshot, MA000020: construction as Snapshot, MA000025: electrical as Snapshot, MA000119: restaurant as Snapshot, MA000058: clubs as Snapshot, MA000012: pharmacy as Snapshot, MA000005: hairBeauty as Snapshot };
const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;
export type State = typeof STATES[number];

export interface ShiftInput {
  date: string; // YYYY-MM-DD the shift starts
  start: string; // HH:MM
  finish: string; // HH:MM; at or before start means next day
  /** Unpaid break minutes. Undefined = not stated (0 = no unpaid break). */
  breakMinutes?: number;
  /** HH:MM the unpaid break started. Needed whenever the break's position changes the pay. */
  breakStart?: string;
  /** Minutes of this shift the employer treated as overtime (last minutes of the shift). Undefined = not stated. */
  overtimeMinutes?: number;
}

export type PaidKind = "ordinary" | "casual_loading" | "saturday" | "sunday" | "public_holiday" | "evening" | "overtime" | "allowance" | "leave" | "other";
/** basis: "total" = the whole payment for those hours (default); "loading" = only the extra on top of ordinary pay, whose base is paid in the ordinary line; "unknown" = the user isn't sure. */
export type PaidBasis = "total" | "loading" | "unknown";
export interface PaidLine { kind: PaidKind; amountCents: number; label?: string; basis?: PaidBasis }

/** Facts about the work arrangement that decide whether overtime can be ruled out. */
export interface Arrangement {
  /** Every shift worked in the pay period is included. */
  allShiftsInPeriodIncluded?: boolean;
  /** Every hour not listed as overtime was rostered ordinary time (no extra or changed hours). */
  workedToRoster?: boolean;
  /** Part-time guaranteed/agreed hours per week, in minutes. */
  guaranteedMinutesPerWeek?: number;
  /** Roster cycle length in weeks when hours are averaged (1 = no averaging). */
  rosterCycleWeeks?: number;
  /** Span-of-hours exceptions that apply at the workplace (Retail cl 15.2). Undefined = not known; [] = none apply. */
  spanExceptions?: string[];
  /** Awards with an RDO accrual system (MA000020 cl 16.2): is the employee on it? Undefined = not known. */
  rdoAccrual?: boolean;
}

export interface AssessmentInput {
  awardCode: string;
  classificationFixedId: number;
  employmentType: Employment;
  rateType: "adult" | "junior" | "apprentice" | "trainee";
  state: State;
  payPeriod?: { start: string; end: string };
  shifts: ShiftInput[];
  arrangement?: Arrangement;
  paid?: {
    grossCents?: number; lines?: PaidLine[];
    /** The user confirmed the lines are every wage payment for these hours. */
    linesCoverAllWages?: boolean;
    /** The user confirmed gross covers only these hours (no allowances, leave or other pay). Gives an indicative figure only. */
    grossCoversOnlyTheseShifts?: boolean;
  };
  /** For years the official holiday list doesn't cover, or regional holidays: the user's confirmed public holiday dates where they work. */
  holidayConfirmation?: { publicHolidayDates: string[] };
  flags?: { enterpriseAgreement?: boolean; awardFree?: boolean; shiftworker?: boolean; casinoGaming?: boolean; managerial?: boolean };
}

export interface Source { type: "penalty" | "pay_rate" | "wage_allowance" | "public_holiday"; id: number | string; description: string; operativeFrom?: string; clause?: string; url?: string }

export type LineKind = "ordinary" | "evening" | "saturday" | "sunday" | "public_holiday" | "overtime";
export interface Line {
  shiftIndex: number; date: string; category: string; kind: LineKind; minutes: number;
  percent?: number; hourlyCents?: number; units?: number; unitCents?: number; amountCents: number;
  sources: Source[]; explanation: string;
}

export interface NotAssessed { item: string; reason: string; shiftIndex?: number; material: boolean; question?: string }

export interface Component { kind: LineKind; entitledCents: number; paidCents: number; differenceCents: number; basis?: "total" | "loading" }

export interface AssessmentResult {
  engine: "v2"; engineVersion: string;
  rulePack?: { awardCode: string; name: string; version: string };
  snapshot?: { fetched: string; source: string };
  status: "complete" | "partial" | "unsupported";
  reasons: string[];
  classification?: string;
  rate?: { hourlyCents: number; operativeFrom: string; operativeTo: string | null; publishedYear: number; referenceDate: string; rule: string };
  lines: Line[];
  notAssessed: NotAssessed[];
  exclusions: string[];
  assessedEntitlementCents: number;
  paid: {
    grossCents: number | null; comparableCents: number | null; excludedCents: number; note: string;
    comparison: "none" | "complete" | "partial";
    /** Gross-only figure the user said covers only these hours. Never an underpayment total. */
    indicativeDifferenceCents: number | null;
    components: Component[] | null;
  };
  /** Only when status is complete and a reliable comparable paid amount exists. */
  differenceCents: number | null;
  underpaymentCents: number | null;
  /** Sum of component shortfalls, ignoring overpaid components (whether overpayments offset shortfalls depends on the arrangement). */
  componentShortfallCents: number | null;
  notes: string[];
}

// ---------- integer helpers ----------
function baseCentsOf(l: Line): number { return l.sources[0]?.type === "pay_rate" && l.hourlyCents != null && l.percent ? Math.round(l.hourlyCents * 100 / l.percent) : 0; }
function divRound(num: number, den: number): number {
  return Math.floor((2 * num + den) / (2 * den));
}
const pctHundredths = (rate: number) => Math.round(rate * 100);
export function penaltyRateCents(baseCents: number, percent: number): number {
  return divRound(baseCents * pctHundredths(percent), 10000);
}
const toCents = (dollars: number) => Math.round(dollars * 100);
const parseHm = (s: string) => { const [a, b] = s.split(":").map(Number); return a * 60 + b; };
const dateValid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));
function addDays(d: string, n: number) {
  const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10);
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const dowOf = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay() as Dow;
const hrs = (m: number) => (m / 60).toFixed(2);

function pick<T extends { operativeFrom: string; operativeTo: string | null }>(records: T[], ref: string): T | undefined {
  return records.filter(r => r.operativeFrom <= ref).sort((a, b) => b.operativeFrom.localeCompare(a.operativeFrom))[0];
}

// ---------- public holidays ----------
type Scope = "statewide" | "part_day" | "regional" | "restricted";
type Holiday = { date: string; name: string; jurisdiction: string; info: string; source: string; scope: Scope; fromMinute?: number };
const HOLIDAYS = holidaysData.holidays as Holiday[];
const COVERED_YEARS = new Set(holidaysData.coveredYears.map(String));
interface HolidayStatus { kind: "none" | "full" | "part" | "regional" | "restricted" | "unknown_year"; fromMinute?: number; holiday?: Holiday }
export function holidayStatus(date: string, state: State): HolidayStatus {
  if (!COVERED_YEARS.has(date.slice(0, 4))) return { kind: "unknown_year" };
  const list = HOLIDAYS.filter(x => x.date === date && x.jurisdiction === state);
  const h = list.find(x => x.scope === "statewide") ?? list.find(x => x.scope === "part_day") ?? list.find(x => x.scope === "regional") ?? list[0];
  if (!h) return { kind: "none" };
  if (h.scope === "statewide") return { kind: "full", holiday: h };
  if (h.scope === "part_day") return { kind: "part", fromMinute: h.fromMinute ?? 1440, holiday: h };
  if (h.scope === "regional") return { kind: "regional", holiday: h };
  return { kind: "restricted", holiday: h };
}

// ---------- main ----------
const EXCLUSIONS = [
  "Allowances (for example meal, laundry, travel or tool allowances) are not assessed by engine v2.",
  "Leave, leave loading, superannuation and termination payments are not assessed.",
  "Paid rest-break entitlements and penalties for missed meal breaks are not assessed.",
];

function base(input: Partial<AssessmentInput>): AssessmentResult {
  return {
    engine: "v2", engineVersion: ENGINE_VERSION, status: "unsupported", reasons: [], lines: [], notAssessed: [],
    exclusions: EXCLUSIONS, assessedEntitlementCents: 0,
    paid: { grossCents: input.paid?.grossCents ?? null, comparableCents: null, excludedCents: 0, note: "", comparison: "none", indicativeDifferenceCents: null, components: null },
    differenceCents: null, underpaymentCents: null, componentShortfallCents: null, notes: [],
  };
}
function unsupported(input: Partial<AssessmentInput>, ...reasons: string[]): AssessmentResult {
  const r = base(input); r.reasons = reasons; return r;
}

export function assess(input: AssessmentInput): AssessmentResult {
  const pack = RULE_PACKS[input.awardCode];
  if (input.flags?.enterpriseAgreement) return unsupported(input, "You're covered by an enterprise agreement. AwardPay can't assess enterprise agreement pay — your agreement's rates and rules apply instead of the award.");
  if (input.flags?.awardFree) return unsupported(input, "You're award-free. AwardPay's award calculator can't assess your pay.");
  if (!pack) return unsupported(input, `Award ${input.awardCode} isn't supported by engine v2 yet. Only these awards can be assessed: ${Object.values(RULE_PACKS).map(p => `${p.name} (${p.awardCode})`).join(", ")}.`);
  const snap = SNAPSHOTS[pack.awardCode];
  for (const flag of pack.unsupportedFlags) if (input.flags?.[flag]) {
    const what = { shiftworker: "shiftworker rates (separate award tables)", casinoGaming: "casino gaming employee rates", managerial: "managerial staff (hotels) salaries" }[flag];
    return unsupported(input, `Engine v2 doesn't assess ${what} for the ${pack.name} yet.`);
  }
  if (input.rateType !== "adult") {
    const why = {
      junior: "Junior rates aren't assessed: the Fair Work pay database returns junior classifications for these awards without dollar amounts, and AwardPay won't substitute adult rates or assume an age percentage.",
      apprentice: "Apprentice rates aren't assessed: they depend on the apprenticeship start date, year and schooling, which engine v2 doesn't support yet.",
      trainee: "Trainee (national training wage) rates aren't assessed by engine v2.",
    }[input.rateType];
    return unsupported(input, why);
  }
  const cls = pack.classifications[input.classificationFixedId];
  if (!cls) return unsupported(input, "This classification isn't supported for this award in engine v2. Choose one of the listed levels, or AwardPay can't assess this check.");
  if (!STATES.includes(input.state)) return unsupported(input, "A valid state or territory is needed to check public holidays.");
  if (!input.shifts?.length) return unsupported(input, "Add at least one dated shift.");
  for (const s of input.shifts) {
    if (!dateValid(s.date) || !/^\d{2}:\d{2}$/.test(s.start) || !/^\d{2}:\d{2}$/.test(s.finish)) return unsupported(input, "Every shift needs a date, a start time and a finish time.");
    if (s.breakStart != null && !/^\d{2}:\d{2}$/.test(s.breakStart)) return unsupported(input, "Break start times must be HH:MM.");
  }

  const result = base(input);
  result.rulePack = { awardCode: pack.awardCode, name: pack.name, version: pack.version };
  result.snapshot = { fetched: snap.fetched, source: snap.source };
  result.classification = cls.label;
  const material = (item: string, reason: string, shiftIndex?: number, question?: string) => result.notAssessed.push({ item, reason, shiftIndex, material: true, question });
  const emp = input.employmentType;
  const arr = input.arrangement ?? {};

  // ---- rate reference date (full pay period rule) ----
  const dates = input.shifts.map(s => s.date).sort();
  const adultRates = snap.payRates.filter(r => r.classificationFixedId === input.classificationFixedId && r.employeeRateType === "AD" && r.calculatedRateType === "Hourly" && r.calculatedRate != null);
  let ref: string;
  let rule: string;
  if (input.payPeriod) {
    if (!dateValid(input.payPeriod.start) || !dateValid(input.payPeriod.end) || input.payPeriod.end < input.payPeriod.start) return unsupported(input, "The pay period dates aren't valid.");
    if (dates[0] < input.payPeriod.start || dates[dates.length - 1] > input.payPeriod.end) return unsupported(input, "Some shifts fall outside the pay period. Assess one pay period at a time.");
    ref = input.payPeriod.start;
    rule = `Rates in force at the start of the pay period (${ref}); a new rate applies from the first full pay period starting on or after its operative date.`;
  } else {
    const a = pick(adultRates, addDays(dates[0], -31)); const b = pick(adultRates, dates[dates.length - 1]);
    if (!a || !b || a.operativeFrom !== b.operativeFrom) {
      return { ...result, status: "unsupported", reasons: ["A pay rate change happened near these dates. Enter the pay period start date so the right rate can be used."] };
    }
    ref = dates[dates.length - 1];
    rule = "Pay period start not given; the same rate applied for every possible pay period start covering these shifts.";
  }
  const rateRec = pick(adultRates, ref);
  if (!rateRec || ref < "2023-07-01") return { ...result, status: "unsupported", reasons: ["These dates are outside the rate history AwardPay holds (1 July 2023 onwards)."] };
  const baseCents = toCents(rateRec.calculatedRate as number);
  result.rate = { hourlyCents: baseCents, operativeFrom: rateRec.operativeFrom, operativeTo: rateRec.operativeTo, publishedYear: rateRec.publishedYear, referenceDate: ref, rule };
  const rateSource: Source = { type: "pay_rate", id: input.classificationFixedId, description: `${cls.label} adult minimum hourly rate`, operativeFrom: rateRec.operativeFrom, clause: pack.clauses.minimumRates, url: pack.awardUrl };

  const penalty = (id: PenaltyRef) => {
    if (typeof id === "string") {
      // Inline penalty: percentage copied from the award text (pay database has no records for this award).
      const rec = pick((snap.inlinePenalties ?? []).filter(p => p.id === id), ref);
      if (!rec) throw new Error(`Missing inline penalty ${id} for ${ref}`);
      return { penaltyFixedId: id as unknown as number, rate: rec.rate, clauseDescription: rec.description, penaltyDescription: `${rec.clause} (award text, verified ${rec.verifiedOn})`, operativeFrom: rec.operativeFrom };
    }
    const rec = pick(snap.penalties.filter(p => p.penaltyFixedId === id), ref);
    if (!rec) throw new Error(`Missing penalty ${id} for ${ref}`);
    return rec;
  };
  const isCasual = emp === "casual";
  const ord: OrdinaryRules = isCasual ? pack.ordinary.casual : pack.ordinary.ftpt;
  const ot: OvertimeRules | null = isCasual ? pack.overtime.casual : pack.overtime.ftpt;
  const dailyMax = pack.dailyMaxByEmployment?.[emp] ?? pack.dailyMaxOrdinaryMinutes;

  // ---- RDO accrual (MA000020 cl 16.2): never guessed ----
  const rdo = pack.rdoAccrual && emp !== "casual" ? pack.rdoAccrual : null;
  let rdoScale = 1;
  if (rdo) {
    if (arr.rdoAccrual === true) {
      rdoScale = rdo.paidPerWorked;
      result.notes.push(`RDO system confirmed (${rdo.clause}): each ordinary day is part paid, part accrued towards a rostered day off, which is paid when taken.`);
    } else if (arr.rdoAccrual !== false) {
      material("Rostered day off", `This award's standard hours system accrues part of each day towards a rostered day off (${rdo.clause}). Whether you're on it changes how many hours are paid each day.`, undefined, "Are you on the RDO system (for example, you work 8 hours and are paid 7.6, building up a paid day off)?");
    }
  }

  // Weeks: 7-day blocks from the pay period start.
  const weekOf = (d: string) => input.payPeriod ? Math.floor(daysBetween(input.payPeriod.start, d) / 7) : -1;
  const weeklyOrdinary = new Map<number, number>();
  const longDays = new Map<number, number>(); // week -> days with ordinary hours above the normal daily max (Retail cl 15.5)

  input.shifts.forEach((s, si) => {
    const start = parseHm(s.start); let finish = parseHm(s.finish);
    if (finish <= start) finish += 1440;
    const total = finish - start;
    const breakMin = Math.max(0, Math.round(s.breakMinutes ?? 0));
    if (breakMin >= total) { material("Shift", "The break is as long as the shift.", si); return; }

    type M = { date: string; tod: number; dow: Dow; day: "weekday" | "saturday" | "sunday" | "ph"; paid: boolean };
    const mins: M[] = [];
    const holidayNotes = new Set<string>();
    for (let m = start; m < finish; m++) {
      const date = m >= 1440 ? addDays(s.date, 1) : s.date; const tod = m % 1440; const dow = dowOf(date);
      const hs = holidayStatus(date, input.state);
      const confirmed = input.holidayConfirmation?.publicHolidayDates;
      let ph = false;
      if (hs.kind === "full") ph = true;
      else if (hs.kind === "part") ph = tod >= (hs.fromMinute ?? 1440);
      else if (hs.kind === "regional") {
        if (confirmed) { ph = confirmed.includes(date); holidayNotes.add(`regconf|${date}|${hs.holiday?.name}|${ph ? "yes" : "no"}`); }
        else holidayNotes.add(`regional|${date}|${hs.holiday?.name}`);
      } else if (hs.kind === "restricted") holidayNotes.add(`restricted|${date}|${hs.holiday?.name}`);
      else if (hs.kind === "unknown_year") {
        if (confirmed) { ph = confirmed.includes(date); holidayNotes.add(`user|${date}|${ph ? "yes" : "no"}`); }
        else holidayNotes.add(`unknown|${date}`);
      }
      if (ph && hs.holiday) holidayNotes.add(`official|${date}|${hs.holiday.name}|${hs.holiday.source}${hs.kind === "part" ? ` (from ${hrs(hs.fromMinute ?? 0).replace(".00", "")}:00 to midnight)` : ""}`);
      const day = ph ? "ph" : dow === 0 ? "sunday" : dow === 6 ? "saturday" : "weekday";
      mins.push({ date, tod, dow, day, paid: true });
    }
    for (const n of holidayNotes) {
      const [k, d, name, extra] = n.split("|");
      if (k === "regional") material("Public holiday", `${name} on ${d} applies only in part of ${input.state}.`, si, `Was ${d} a public holiday where you work?`);
      if (k === "regconf") result.notes.push(`Shift ${si + 1}: ${name} on ${d} is a regional holiday; you confirmed it ${extra === "yes" ? "applied" : "did not apply"} where you work.`);
      if (k === "restricted") result.notes.push(`Shift ${si + 1}: ${name} on ${d} is not a general public holiday (it applies only to some employers or employees), so it was treated as a normal day.`);
      if (k === "unknown") material("Public holiday", `AwardPay's official public holiday list doesn't cover ${d.slice(0, 4)} yet, so ${d} couldn't be checked.`, si, `Was ${d} a public holiday in ${input.state}?`);
      if (k === "user") result.notes.push(`Shift ${si + 1}: AwardPay's official list doesn't cover ${d.slice(0, 4)}; you confirmed ${d} ${name === "yes" ? "was" : "was not"} a public holiday in ${input.state}.`);
      if (k === "official") result.notes.push(`Shift ${si + 1}: ${d} is ${name} in ${input.state} (source: ${extra}).`);
    }

    // null = the award has no ordinary hours on that day (all weekend work is overtime).
    const ordId = (x: M): { id: PenaltyRef; label: string; kind: LineKind } | null => {
      if (x.day === "ph") return { id: ord.publicHoliday, label: "Public holiday", kind: "public_holiday" };
      if (x.day === "sunday") {
        const band = ord.sundayBands?.find(b => x.tod >= b.from && x.tod < b.to);
        if (band) return { id: band.penaltyId, label: band.label, kind: "sunday" };
        const id = ord.sunday == null ? null : typeof ord.sunday === "object" ? ord.sunday.byGroup[cls.sundayGroup ?? ""] : ord.sunday;
        return id == null ? null : { id, label: "Sunday", kind: "sunday" };
      }
      if (x.day === "saturday") {
        const band = ord.saturdayBands?.find(b => x.tod >= b.from && x.tod < b.to);
        if (band) return { id: band.penaltyId, label: band.label, kind: "saturday" };
        return ord.saturday == null ? null : { id: ord.saturday, label: "Saturday", kind: "saturday" };
      }
      const band = ord.weekdayBands.find(b => x.tod >= b.from && x.tod < b.to);
      return band ? { id: band.penaltyId, label: band.label, kind: "evening" } : { id: ord.weekday, label: "Weekday ordinary hours", kind: "ordinary" };
    };
    const inAddition = (x: M) => pack.additions.some(a => x.day === "weekday" && x.tod >= a.from && x.tod < a.to);

    // ---- breaks: never guessed ----
    const otStated = s.overtimeMinutes != null ? Math.max(0, Math.round(s.overtimeMinutes)) : null;
    if (s.breakMinutes == null && total > pack.unpaidBreakAfterMinutes) {
      material("Break", `Shift ${si + 1} is ${hrs(total)} hours, so an unpaid meal break may apply (${pack.breakClause}), but no break was entered. It was assessed as if no unpaid break was taken, which overstates the entitlement if one was.`, si, `How long was your unpaid break on ${s.date} (0 if none), and when did it start?`);
    }
    if (breakMin > 0) {
      if (s.breakStart) {
        let b = parseHm(s.breakStart); if (b < start) b += 1440;
        if (b + breakMin > finish) { material("Break", `The break on ${s.date} runs past the end of the shift.`, si); return; }
        for (let m = b; m < b + breakMin; m++) mins[m - start].paid = false;
      } else {
        const keys = new Set(mins.map(x => { const o = ordId(x); return `${o ? o.id : "weekend-overtime"}|${inAddition(x) ? pack.additions.find(a => x.tod >= a.from && x.tod < a.to)?.wageAllowanceId : ""}|${x.date}`; }));
        const uniform = keys.size === 1 && !(otStated && otStated > 0);
        if (uniform) {
          // Every minute of the shift is paid the same way, so the break's position can't change the result.
          for (let i = mins.length - 1, r = 0; r < breakMin; i--, r++) mins[i].paid = false;
        } else {
          material("Break", `Shift ${si + 1} has different pay rates at different times, so the start time of the ${breakMin}-minute unpaid break changes the result.`, si, `What time did your unpaid break start on ${s.date}?`);
          // Lower-bound figure only: remove the break from the highest-paid minutes.
          const order = mins.map((x, i) => { const o = ordId(x); return { i, r: o ? Number(penalty(o.id).rate) : 0 }; }).sort((a, b) => b.r - a.r || a.i - b.i);
          for (let r = 0; r < breakMin; r++) mins[order[r].i].paid = false;
          result.notes.push(`Shift ${si + 1}: until the break time is known, the figure shown removes the break from the highest-paid time, so it's a lower-bound estimate.`);
        }
      }
    }
    const worked = mins.filter(x => x.paid);

    // ---- minimum engagement ----
    const minEng = pack.minimumEngagement[emp];
    const phMin = worked.some(x => x.day === "ph") ? pack.publicHolidayMinimum?.[emp] : undefined;
    const needed = Math.max(minEng ?? 0, phMin ?? 0);
    if (needed && worked.length < needed) material("Minimum engagement", `Shift ${si + 1} is ${hrs(worked.length)} hours; the award's minimum payment for this shift may be ${hrs(needed)} hours (${pack.minimumClause}). AwardPay doesn't calculate minimum-engagement top-ups yet.`, si);

    // ---- overtime: stated minutes are the last N worked minutes ----
    const otMinutes = otStated == null ? 0 : Math.min(otStated, worked.length);
    const ordinaryWorkedAll = worked.slice(0, worked.length - otMinutes);
    const otWorked = worked.slice(worked.length - otMinutes);

    // Awards with no ordinary weekend hours (MA000020, MA000025): weekend minutes are
    // overtime. Unless they were entered as overtime they can't be priced — never pay
    // them at an ordinary rate.
    const ordinaryWorked = ordinaryWorkedAll.filter(x => ordId(x) != null);
    const weekendOvertime = ordinaryWorkedAll.filter(x => ordId(x) == null);
    if (weekendOvertime.length) {
      const days = [...new Set(weekendOvertime.map(x => x.day === "saturday" ? "Saturday" : "Sunday"))].join(" and ");
      material("Overtime", `Shift ${si + 1}: ${hrs(weekendOvertime.length)} hours on ${days} are overtime under this award (${pack.clauses.overtime}), but they weren't entered as overtime, so AwardPay can't price them.`, si, `How many minutes of the shift on ${s.date} were paid as overtime? Enter them as overtime minutes.`);
    }

    // Daily maximum (stated overtime does not excuse ordinary minutes still above the maximum).
    if (ordinaryWorked.length > dailyMax) {
      const long = pack.oneLongDayMinutes;
      const wk = weekOf(s.date);
      if (long && ordinaryWorked.length <= long && wk >= 0 && (longDays.get(wk) ?? 0) === 0) {
        longDays.set(wk, 1);
        result.notes.push(`Shift ${si + 1}: ${hrs(ordinaryWorked.length)} ordinary hours is allowed on one day a week (${pack.dailyMaxClause}).`);
      } else {
        material("Overtime", `Shift ${si + 1} has ${hrs(ordinaryWorked.length)} ordinary hours, more than the award's daily maximum (${pack.dailyMaxClause}). The extra hours are likely overtime.`, si, `How many hours on ${s.date} were paid as overtime?`);
      }
    }
    // Span of hours (with any confirmed award exceptions, e.g. Retail cl 15.2).
    if (pack.span && (pack.spanAppliesTo ?? ["full_time", "part_time"]).includes(emp)) {
      const span = pack.span;
      const known = arr.spanExceptions;
      const applied = (span.exceptions ?? []).filter(e => known?.includes(e.id));
      const spanFor = (dow: Dow): [number, number] => {
        let [a, b] = span.byDow[dow];
        for (const e of applied) { if (e.start != null) a = Math.min(a, e.start); if (e.end != null) b = Math.max(b, e.end); }
        return [a, b];
      };
      const outsideStd = ordinaryWorked.filter(x => { const [a, b] = span.byDow[x.dow]; return x.tod < a || x.tod >= b; });
      const outside = ordinaryWorked.filter(x => { const [a, b] = spanFor(x.dow); return x.tod < a || x.tod >= b; });
      if (outsideStd.length && !outside.length) {
        result.notes.push(`Shift ${si + 1}: hours outside the standard span are within the extended span you confirmed (${applied.map(e => `${e.label}, ${e.clause}`).join("; ")}).`);
      } else if (outside.length && known !== undefined) {
        material("Overtime", `Shift ${si + 1} includes ${hrs(outside.length)} hours outside the span of ordinary hours${applied.length ? " even with the exception you confirmed" : ""} (${span.clause}). Those hours are overtime, but they weren't entered as overtime, so AwardPay can't price them.`, si, `How many minutes of the shift on ${s.date} were outside the span? Enter them as overtime minutes.`);
      } else if (outside.length) {
        material("Overtime", `Shift ${si + 1} includes ${hrs(outside.length)} hours outside the standard span of ordinary hours (${span.clause}). Whether they are overtime depends on your workplace, and that isn't known.`, si, span.exceptions?.length ? `Does any of these apply at your workplace: ${span.exceptions.map(e => e.question).join("; ")}?` : `Were the hours outside ${s.date}'s span paid as overtime?`);
      }
    }
    for (const x of ordinaryWorked) { const w = weekOf(x.date); weeklyOrdinary.set(w, (weeklyOrdinary.get(w) ?? 0) + 1); }

    // ---- ordinary lines ----
    const groups = new Map<string, { id: PenaltyRef; label: string; kind: LineKind; minutes: number; date: string }>();
    for (const x of ordinaryWorked) {
      const o = ordId(x)!; const key = `${o.id}|${x.date}`;
      const g = groups.get(key) ?? { ...o, minutes: 0, date: x.date }; g.minutes++; groups.set(key, g);
    }
    for (const g of groups.values()) {
      const rec = penalty(g.id); const rate = penaltyRateCents(baseCents, Number(rec.rate));
      // RDO system: only part of each ordinary day is paid; the rest accrues towards the RDO.
      const paidMinutes = rdoScale !== 1 ? Math.round(g.minutes * rdoScale) : g.minutes;
      result.lines.push({
        shiftIndex: si, date: g.date, category: g.label, kind: g.kind, minutes: paidMinutes, percent: Number(rec.rate), hourlyCents: rate,
        amountCents: divRound(rate * paidMinutes, 60),
        sources: [rateSource, { type: "penalty", id: rec.penaltyFixedId, description: `${rec.clauseDescription}: ${rec.penaltyDescription}`, operativeFrom: rec.operativeFrom, clause: pack.clauses.penalties, url: pack.awardUrl }],
        explanation: rdoScale !== 1
          ? `${hrs(g.minutes)} h worked, ${hrs(paidMinutes)} h paid (RDO accrual, ${rdo!.clause}) × ${Number(rec.rate)}% of $${(baseCents / 100).toFixed(2)} = $${(rate / 100).toFixed(2)}/h`
          : `${hrs(g.minutes)} h × ${Number(rec.rate)}% of $${(baseCents / 100).toFixed(2)} = $${(rate / 100).toFixed(2)}/h`,
      });
    }
    for (const add of pack.additions) {
      const inBand = ordinaryWorked.filter(x => x.day === "weekday" && x.tod >= add.from && x.tod < add.to);
      if (!inBand.length) continue;
      const rec = pick(snap.wageAllowances.filter(w => w.wageAllowanceFixedId === add.wageAllowanceId), ref);
      if (!rec || rec.amount == null) { material(add.label, "The Fair Work amount for this period isn't in AwardPay's snapshot.", si); continue; }
      const units = Math.ceil(inBand.length / 60); const unit = toCents(Number(rec.amount));
      result.lines.push({
        shiftIndex: si, date: inBand[0].date, category: add.label, kind: "evening", minutes: inBand.length, units, unitCents: unit, amountCents: units * unit,
        sources: [{ type: "wage_allowance", id: rec.wageAllowanceFixedId, description: rec.allowance, operativeFrom: rec.operativeFrom, clause: `${pack.clauses.penalties}${rec.clauses ? `, cl ${rec.clauses}` : ""}`, url: pack.awardUrl }],
        explanation: `${units} × $${(unit / 100).toFixed(2)} (per hour or part of an hour, ${hrs(inBand.length)} h)`,
      });
    }

    // ---- overtime lines ----
    if (otWorked.length) {
      if (!ot) { material("Overtime", (isCasual && pack.overtimeMissingReason?.casual) || "Overtime isn't assessed for this employment type.", si); }
      else {
        let tierUsed = 0;
        const og = new Map<string, { id: PenaltyRef; label: string; minutes: number; date: string }>();
        for (const x of otWorked) {
          let id: PenaltyRef; let label: string;
          if (x.day === "ph") { id = ot.publicHoliday; label = "Overtime — public holiday"; }
          else if (ot.tierDays.includes(x.dow)) {
            const tr = ot.tierRates?.[x.dow];
            const firstId = tr?.first ?? ot.first, afterId = tr?.after ?? ot.after;
            if (ot.saturdayNoonAllAfter && x.dow === 6 && x.tod >= 720) { id = afterId; label = "Overtime — Saturday after 12 noon"; }
            else if (tierUsed < ot.tierMinutes) { id = firstId; label = `Overtime — first ${ot.tierMinutes / 60} hours`; } else { id = afterId; label = `Overtime — after ${ot.tierMinutes / 60} hours`; }
            tierUsed++;
          } else {
            const flat = x.dow === 0 ? ot.flat.sunday : ot.flat.saturday;
            if (flat == null) { material("Overtime", "No overtime rate mapped for this day.", si); continue; }
            id = flat; label = x.dow === 0 ? "Overtime — Sunday" : "Overtime — Saturday";
          }
          const key = `${id}|${x.date}`; const g = og.get(key) ?? { id, label, minutes: 0, date: x.date }; g.minutes++; og.set(key, g);
        }
        for (const g of og.values()) {
          const rec = penalty(g.id); const rate = penaltyRateCents(baseCents, Number(rec.rate));
          result.lines.push({
            shiftIndex: si, date: g.date, category: g.label, kind: "overtime", minutes: g.minutes, percent: Number(rec.rate), hourlyCents: rate,
            amountCents: divRound(rate * g.minutes, 60),
            sources: [rateSource, { type: "penalty", id: rec.penaltyFixedId, description: `${rec.clauseDescription}: ${rec.penaltyDescription}`, operativeFrom: rec.operativeFrom, clause: pack.clauses.overtime, url: pack.awardUrl }],
            explanation: `${hrs(g.minutes)} h × ${Number(rec.rate)}% of $${(baseCents / 100).toFixed(2)} = $${(rate / 100).toFixed(2)}/h`,
          });
        }
      }
    }
  });

  // ---- weekly and arrangement-based overtime: only ruled out when the facts are known ----
  const needs = pack.overtimeNeeds[emp];
  const clause = pack.overtimeNeedsClause[emp];
  if (needs.includes("roster") && arr.workedToRoster !== true) {
    material("Overtime", `For ${emp.replace("_", "-")} employees, overtime also depends on your roster (${clause}). AwardPay can't tell from shift times alone whether any hours were outside your rostered ordinary hours.`, undefined, "Apart from any hours listed as overtime, were all of these hours your normal rostered hours?");
  }
  if (needs.includes("guaranteed") && arr.guaranteedMinutesPerWeek == null) {
    material("Overtime", `Part-time hours beyond your agreed or guaranteed hours are overtime (${clause}).`, undefined, "How many hours a week are you guaranteed or agreed to work?");
  }
  if (!input.payPeriod || arr.allShiftsInPeriodIncluded !== true) {
    material("Overtime", "Weekly overtime (more than 38 ordinary hours a week) can't be ruled out without the pay period dates and every shift in it.", undefined, "Are these all the shifts you worked in this pay period?");
  } else {
    const days = daysBetween(input.payPeriod.start, input.payPeriod.end) + 1;
    if (days % 7 !== 0) material("Overtime", `The pay period is ${days} days, not whole weeks, so weekly overtime can't be checked reliably.`);
    // On a confirmed RDO system, worked minutes include accrual time: 38 paid hours = 40 worked.
    const weeklyLimit = rdoScale !== 1 ? Math.round(38 * 60 / rdoScale) : 38 * 60;
    for (const [w, m] of weeklyOrdinary) {
      const wkStart = addDays(input.payPeriod.start, w * 7);
      if (m > weeklyLimit) {
        material("Overtime", `${hrs(m)} ordinary hours in the week starting ${wkStart}, more than ${rdoScale !== 1 ? "40 worked (38 paid plus RDO accrual)" : "38"} (${clause}). Some of these hours are likely overtime${(arr.rosterCycleWeeks ?? 1) > 1 ? " unless hours are averaged across your roster cycle" : ""}.`, undefined, `How many hours in the week starting ${wkStart} were paid as overtime?`);
      }
      if (needs.includes("guaranteed") && arr.guaranteedMinutesPerWeek != null && m > arr.guaranteedMinutesPerWeek) {
        material("Overtime", `${hrs(m)} ordinary hours in the week starting ${wkStart}, more than your ${hrs(arr.guaranteedMinutesPerWeek)} guaranteed hours. Hours beyond guaranteed hours are overtime (${clause}).`, undefined, `How many hours in the week starting ${wkStart} were paid as overtime?`);
      }
    }
  }

  result.assessedEntitlementCents = result.lines.reduce((t, l) => t + l.amountCents, 0);

  // ---- paid comparison ----
  const wageKinds: PaidKind[] = ["ordinary", "casual_loading", "saturday", "sunday", "public_holiday", "evening", "overtime"];
  const lines = input.paid?.lines ?? [];
  const gross = input.paid?.grossCents ?? null;
  if (lines.length) {
    const comp = lines.filter(l => wageKinds.includes(l.kind)).reduce((t, l) => t + l.amountCents, 0);
    const excl = lines.filter(l => !wageKinds.includes(l.kind)).reduce((t, l) => t + l.amountCents, 0);
    result.paid = { ...result.paid, grossCents: gross, comparableCents: comp, excludedCents: excl, comparison: "complete", note: excl ? "Allowances, leave and other payments were left out of the comparison because they aren't assessed." : "Only wage lines for these hours were compared." };
    const problems: string[] = [];
    if (input.paid?.linesCoverAllWages !== true) problems.push("It isn't confirmed that these lines are every wage payment for these hours, so a missing pay line could make the shortfall look bigger than it is.");
    if (lines.some(l => l.kind === "other")) problems.push("Some pay lines couldn't be identified as wages or allowances.");
    if (lines.some(l => l.basis === "unknown")) problems.push("For some pay lines it isn't known whether the amount is the whole payment for those hours or only an extra loading.");
    if (lines.some(l => l.kind === "casual_loading") && !isCasual) problems.push("A casual loading line was entered for a non-casual employee.");
    if (gross != null && comp + excl > gross) problems.push("The pay lines add up to more than the gross pay, so a line may have been counted twice.");
    if (lines.some(l => l.amountCents < 0)) problems.push("Negative pay lines (adjustments) can't be matched to these hours.");
    if (problems.length) {
      result.paid.comparison = "partial";
      material("Pay comparison", problems.join(" "), undefined, "Please check the pay lines on your payslip for these hours.");
    } else if (!lines.some(l => l.kind === "casual_loading")) {
      // Per-category comparison. A "loading" line is compared with only the extra above ordinary pay for those
      // hours; the ordinary base of those same hours is then expected in the ordinary line. Nothing counts twice:
      // each entitlement line is split into base + loading exactly once.
      const kinds: LineKind[] = ["ordinary", "evening", "saturday", "sunday", "public_holiday", "overtime"];
      const basisOf = (k: LineKind) => {
        const ls = lines.filter(l => l.kind === k);
        const b = new Set(ls.map(l => l.basis ?? "total"));
        return b.size === 0 ? "none" : b.size === 1 ? [...b][0] : "mixed";
      };
      const mismatch: string[] = [];
      if (basisOf("ordinary") === "loading") mismatch.push("Ordinary pay can't be an extra loading.");
      const loadingKinds = kinds.filter(k => k !== "ordinary" && basisOf(k) === "loading");
      for (const k of kinds) if (basisOf(k) === "mixed") mismatch.push(`The ${k.replace("_", " ")} pay lines mix whole payments and extra loadings, so they can't be matched to the hours reliably.`);
      if (loadingKinds.length && !lines.some(l => l.kind === "ordinary")) mismatch.push("A pay line is an extra loading, but there is no ordinary pay line that would hold the base pay for those hours.");
      if (mismatch.length) {
        result.paid.comparison = "partial";
        material("Pay comparison", mismatch.join(" "), undefined, "Please check how your payslip splits pay for these hours.");
      } else {
        const entitled = new Map<LineKind, number>(kinds.map(k => [k, 0]));
        for (const l of result.lines) {
          if (loadingKinds.includes(l.kind)) {
            const base = l.percent != null ? divRound(baseCents * l.minutes, 60) : 0;
            entitled.set("ordinary", entitled.get("ordinary")! + base);
            entitled.set(l.kind, entitled.get(l.kind)! + l.amountCents - base);
          } else entitled.set(l.kind, entitled.get(l.kind)! + l.amountCents);
        }
        const components = kinds.map(k => {
          const entitledCents = entitled.get(k)!;
          const paidCents = lines.filter(l => l.kind === k).reduce((t, l) => t + l.amountCents, 0);
          return { kind: k, entitledCents, paidCents, differenceCents: entitledCents - paidCents, basis: loadingKinds.includes(k) ? "loading" as const : "total" as const };
        }).filter(c => c.entitledCents || c.paidCents);
        result.paid.components = components;
        if (loadingKinds.length) result.notes.push(`Some lines are extra loadings only, so the ordinary line is compared with ordinary pay for all those hours (including the base pay for ${loadingKinds.map(k => k.replace("_", " ")).join(", ")} hours), and each loading line with only the extra on top.`);
        result.componentShortfallCents = components.reduce((t, c) => t + Math.max(0, c.differenceCents), 0);
        if (components.some(c => c.differenceCents < 0) && components.some(c => c.differenceCents > 0)) {
          result.notes.push("Some pay categories were paid above the award and others below. Whether an overpayment can make up for a shortfall depends on your employment arrangement, so a category shortfall isn't necessarily money owed.");
        }
      }
    } else {
      result.notes.push("Casual loading was paid as a separate line, so only the total of wage lines is compared (not each category).");
    }
  } else if (gross != null) {
    result.paid = { ...result.paid, grossCents: gross, comparableCents: null, comparison: "partial",
      note: "Only gross pay is known. Gross pay can include allowances, leave and other payments, so it can't establish an underpayment." };
    if (input.paid?.grossCoversOnlyTheseShifts) {
      result.paid.indicativeDifferenceCents = result.assessedEntitlementCents - gross;
      result.paid.note = "You said gross pay covers only these hours. The difference shown is indicative only, not an underpayment total, because the pay categories can't be checked from gross pay.";
    }
    material("Pay comparison", "Only gross pay was given, so the wage components can't be matched to the award.", undefined, "Enter the wage lines from your payslip (ordinary, penalty and overtime amounts).");
  }

  result.status = result.notAssessed.some(n => n.material) ? "partial" : "complete";
  if (result.status === "partial") result.reasons.push("Some hours or entitlements couldn't be assessed, so this is not your full entitlement and no underpayment total is shown.");
  if (result.status === "complete" && result.paid.comparison === "complete" && result.paid.comparableCents != null) {
    result.differenceCents = result.assessedEntitlementCents - result.paid.comparableCents;
    result.underpaymentCents = Math.max(0, result.differenceCents);
  } else {
    result.componentShortfallCents = result.status === "complete" ? result.componentShortfallCents : null;
  }
  return result;
}
