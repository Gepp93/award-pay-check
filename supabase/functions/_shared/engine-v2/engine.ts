// AwardPay calculation engine v2 — award-specific, dated, integer cents.
// Pure module: no network, no Deno/Node APIs, so tests run it directly.
// v1 (`calculate-shift-pay`) is untouched; nothing routes customers here yet.
import retail from "./data/MA000004.json" with { type: "json" };
import hospitality from "./data/MA000009.json" with { type: "json" };
import fastFood from "./data/MA000003.json" with { type: "json" };
import holidaysData from "./data/public-holidays.json" with { type: "json" };
import { RULE_PACKS, type Dow, type Employment, type OrdinaryRules, type OvertimeRules, type RulePack } from "./rulepacks.ts";

export const ENGINE_VERSION = "v2.0.0";

type Snapshot = typeof retail;
const SNAPSHOTS: Record<string, Snapshot> = { MA000004: retail, MA000009: hospitality as Snapshot, MA000003: fastFood as Snapshot };
const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;
export type State = typeof STATES[number];

export interface ShiftInput {
  date: string; // YYYY-MM-DD the shift starts
  start: string; // HH:MM
  finish: string; // HH:MM; at or before start means next day
  breakMinutes?: number; // unpaid
  breakStart?: string; // HH:MM, optional; without it the break is removed from the highest-rate minutes (conservative)
  /** Minutes of this shift the employer treated as overtime (last minutes of the shift). Undefined = not stated. */
  overtimeMinutes?: number;
}

export type PaidKind = "ordinary" | "saturday" | "sunday" | "public_holiday" | "evening" | "overtime" | "allowance" | "leave" | "other";
export interface PaidLine { kind: PaidKind; amountCents: number; label?: string }

export interface AssessmentInput {
  awardCode: string;
  classificationFixedId: number;
  employmentType: Employment;
  rateType: "adult" | "junior" | "apprentice" | "trainee";
  state: State;
  payPeriod?: { start: string; end: string };
  shifts: ShiftInput[];
  paid?: { grossCents?: number; lines?: PaidLine[]; grossCoversOnlyTheseShifts?: boolean };
  /** For years the official holiday list doesn't cover: the user's confirmed list of public holiday dates in their state (empty = none). */
  holidayConfirmation?: { publicHolidayDates: string[] };
  flags?: { enterpriseAgreement?: boolean; awardFree?: boolean; shiftworker?: boolean; casinoGaming?: boolean; managerial?: boolean };
}

export interface Source { type: "penalty" | "pay_rate" | "wage_allowance" | "public_holiday"; id: number | string; description: string; operativeFrom?: string; clause?: string; url?: string }

export interface Line {
  shiftIndex: number; date: string; category: string; minutes: number;
  percent?: number; hourlyCents?: number; units?: number; unitCents?: number; amountCents: number;
  sources: Source[]; explanation: string;
}

export interface NotAssessed { item: string; reason: string; shiftIndex?: number; material: boolean }

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
  paid: { grossCents: number | null; comparableCents: number | null; excludedCents: number; note: string };
  /** Only when status is complete and a comparable paid amount exists. */
  differenceCents: number | null;
  underpaymentCents: number | null;
  notes: string[];
}

// ---------- integer helpers ----------
/** Round half up for non-negative rationals num/den, integer inputs only. */
function divRound(num: number, den: number): number {
  return Math.floor((2 * num + den) / (2 * den));
}
/** Percent from the API (e.g. 137.5) as hundredths of a percent (13750). */
const pctHundredths = (rate: number) => Math.round(rate * 100);
/** Hourly rate in cents at `percent` of `baseCents`, rounded to the nearest cent. */
export function penaltyRateCents(baseCents: number, percent: number): number {
  return divRound(baseCents * pctHundredths(percent), 10000);
}
const toCents = (dollars: number) => Math.round(dollars * 100);
const parseHm = (s: string) => { const [a, b] = s.split(":").map(Number); return a * 60 + b; };
const dateValid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));
function addDays(d: string, n: number) {
  const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10);
}
const dowOf = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay() as Dow;
function isoWeek(d: string) { const t = new Date(`${d}T00:00:00Z`); const day = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - day); return t.toISOString().slice(0, 10); }

// ---------- dated record selection ----------
/** Latest record whose operativeFrom <= ref (Fair Work: applies from the first full pay period starting on or after operativeFrom). */
function pick<T extends { operativeFrom: string; operativeTo: string | null }>(records: T[], ref: string): T | undefined {
  return records.filter(r => r.operativeFrom <= ref).sort((a, b) => b.operativeFrom.localeCompare(a.operativeFrom))[0];
}

// ---------- public holidays ----------
type Holiday = { date: string; name: string; jurisdiction: string; info: string; source: string };
const HOLIDAYS = holidaysData.holidays as Holiday[];
const COVERED_YEARS = new Set(holidaysData.coveredYears.map(String));
interface HolidayStatus { kind: "none" | "full" | "part" | "uncertain" | "unknown_year"; fromMinute?: number; holiday?: Holiday }
export function holidayStatus(date: string, state: State): HolidayStatus {
  if (!COVERED_YEARS.has(date.slice(0, 4))) return { kind: "unknown_year" };
  const h = HOLIDAYS.find(x => x.date === date && x.jurisdiction === state);
  if (!h) return { kind: "none" };
  const text = `${h.name} ${h.info}`;
  const part = text.match(/(\d{1,2})\s*pm\s*(?:to|-|–)\s*midnight/i);
  if (part) return { kind: "part", fromMinute: (Number(part[1]) % 12 + 12) * 60, holiday: h };
  if (/\b(only|some areas|regional|region|parts? of)\b/i.test(text.replace(/part of easter/ig, ""))) return { kind: "uncertain", holiday: h };
  return { kind: "full", holiday: h };
}

// ---------- main ----------
const EXCLUSIONS = [
  "Allowances (for example meal, laundry, travel or tool allowances) are not assessed by engine v2.",
  "Leave, leave loading, superannuation and termination payments are not assessed.",
  "Minimum engagement and break entitlements are not assessed.",
];

function base(input: Partial<AssessmentInput>): AssessmentResult {
  return {
    engine: "v2", engineVersion: ENGINE_VERSION, status: "unsupported", reasons: [], lines: [], notAssessed: [],
    exclusions: EXCLUSIONS, assessedEntitlementCents: 0,
    paid: { grossCents: input.paid?.grossCents ?? null, comparableCents: null, excludedCents: 0, note: "" },
    differenceCents: null, underpaymentCents: null, notes: [],
  };
}
function unsupported(input: Partial<AssessmentInput>, ...reasons: string[]): AssessmentResult {
  const r = base(input); r.reasons = reasons; return r;
}

export function assess(input: AssessmentInput): AssessmentResult {
  const pack = RULE_PACKS[input.awardCode];
  if (input.flags?.enterpriseAgreement) return unsupported(input, "You're covered by an enterprise agreement. AwardPay can't assess enterprise agreement pay — your agreement's rates and rules apply instead of the award.");
  if (input.flags?.awardFree) return unsupported(input, "You're award-free. AwardPay's award calculator can't assess your pay.");
  if (!pack) return unsupported(input, `Award ${input.awardCode} isn't supported by engine v2 yet. Only the General Retail (MA000004), Hospitality (MA000009) and Fast Food (MA000003) awards can be assessed.`);
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
  }

  const result = base(input);
  result.rulePack = { awardCode: pack.awardCode, name: pack.name, version: pack.version };
  result.snapshot = { fetched: snap.fetched, source: snap.source };
  result.classification = cls.label;
  const material = (item: string, reason: string, shiftIndex?: number) => result.notAssessed.push({ item, reason, shiftIndex, material: true });

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
    // Without the period start we only proceed when every possible start (up to 31 days before the first shift) gives the same rate.
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

  const penalty = (id: number) => {
    const rec = pick(snap.penalties.filter(p => p.penaltyFixedId === id), ref);
    if (!rec) throw new Error(`Missing penalty ${id} for ${ref}`);
    return rec;
  };
  const isCasual = input.employmentType === "casual";
  const ord: OrdinaryRules = isCasual ? pack.ordinary.casual : pack.ordinary.ftpt;
  const ot: OvertimeRules | null = isCasual ? pack.overtime.casual : pack.overtime.ftpt;

  const sundayId = typeof ord.sunday === "number" ? ord.sunday : ord.sunday.byGroup[cls.sundayGroup ?? ""];
  const weeklyOrdinary = new Map<string, number>();

  input.shifts.forEach((s, si) => {
    const start = parseHm(s.start); let finish = parseHm(s.finish);
    if (finish <= start) finish += 1440;
    const total = finish - start;
    const breakMin = Math.max(0, Math.round(s.breakMinutes ?? 0));
    if (breakMin >= total) { material("Shift", "The break is as long as the shift.", si); return; }

    // Per-minute classification, then grouped into lines.
    type M = { date: string; tod: number; dow: Dow; day: "weekday" | "saturday" | "sunday" | "ph"; paid: boolean };
    const mins: M[] = [];
    const holidayNotes = new Set<string>();
    for (let m = start; m < finish; m++) {
      const date = m >= 1440 ? addDays(s.date, 1) : s.date; const tod = m % 1440; const dow = dowOf(date);
      const hs = holidayStatus(date, input.state);
      let ph = false;
      if (hs.kind === "full") ph = true;
      else if (hs.kind === "part") ph = tod >= (hs.fromMinute ?? 1440);
      else if (hs.kind === "uncertain") {
        holidayNotes.add(`uncertain:${date}:${hs.holiday?.name}`);
      } else if (hs.kind === "unknown_year") {
        if (input.holidayConfirmation) { ph = input.holidayConfirmation.publicHolidayDates.includes(date); holidayNotes.add(`user:${date}:${ph ? "yes" : "no"}`); }
        else holidayNotes.add(`unknown:${date}`);
      }
      if (ph && hs.holiday) holidayNotes.add(`official:${date}:${hs.holiday.name}:${hs.holiday.source}`);
      const day = ph ? "ph" : dow === 0 ? "sunday" : dow === 6 ? "saturday" : "weekday";
      mins.push({ date, tod, dow, day, paid: true });
    }
    for (const n of holidayNotes) {
      const [k, d, name, src] = n.split(":");
      if (k === "uncertain") material("Public holiday", `${name} on ${d} applies only in part of ${input.state}. Confirm whether it applied where you work.`, si);
      if (k === "unknown") material("Public holiday", `AwardPay's official public holiday list doesn't cover ${d.slice(0, 4)} yet, so ${d} couldn't be checked.`, si);
      if (k === "user") result.notes.push(`Shift ${si + 1}: AwardPay's official list doesn't cover ${d.slice(0, 4)}; you confirmed ${d} ${name === "yes" ? "was" : "was not"} a public holiday in ${input.state}.`);
      if (k === "official") result.notes.push(`Shift ${si + 1}: ${d} is ${name} in ${input.state} (source: ${n.slice(n.indexOf("http"))}).`);
      void src;
    }

    // Ordinary percentage per minute (overtime handled later).
    const ordId = (x: M): { id: number; label: string } => {
      if (x.day === "ph") return { id: ord.publicHoliday, label: "Public holiday" };
      if (x.day === "sunday") return { id: sundayId, label: "Sunday" };
      if (x.day === "saturday") return { id: ord.saturday, label: "Saturday" };
      const band = ord.weekdayBands.find(b => x.tod >= b.from && x.tod < b.to);
      return band ? { id: band.penaltyId, label: band.label } : { id: ord.weekday, label: "Weekday ordinary hours" };
    };

    // Unpaid break.
    if (breakMin > 0) {
      if (s.breakStart && /^\d{2}:\d{2}$/.test(s.breakStart)) {
        let b = parseHm(s.breakStart); if (b < start) b += 1440;
        for (let m = b; m < b + breakMin; m++) { const i = m - start; if (i >= 0 && i < mins.length) mins[i].paid = false; }
      } else {
        // Conservative: remove the break from the highest-rate minutes so the entitlement is never overstated.
        const order = mins.map((x, i) => ({ i, r: Number(penalty(ordId(x).id).rate) })).sort((a, b) => b.r - a.r || a.i - b.i);
        let removed = 0;
        for (const { i, r } of order) {
          if (removed >= breakMin) break;
          // only take from the highest-rate group of a contiguous kind
          void r; mins[i].paid = false; removed++;
        }
        result.notes.push(`Shift ${si + 1}: break time not given, so the ${breakMin}-minute unpaid break was taken from the highest-paid part of the shift (this can only lower the entitlement).`);
      }
    }
    const worked = mins.filter(x => x.paid);

    // Overtime: the last N worked minutes, as stated by the employee/payslip.
    let otMinutes = 0;
    if (s.overtimeMinutes != null) otMinutes = Math.min(Math.max(0, Math.round(s.overtimeMinutes)), worked.length);
    const ordinaryWorked = worked.slice(0, worked.length - otMinutes);
    const otWorked = worked.slice(worked.length - otMinutes);

    if (s.overtimeMinutes == null && ordinaryWorked.length > pack.dailyMaxOrdinaryMinutes) {
      material("Overtime", `Shift ${si + 1} has ${(ordinaryWorked.length / 60).toFixed(2)} hours, more than the award's daily maximum ordinary hours (${pack.dailyMaxClause}). Tell us how many hours were paid as overtime.`, si);
    }
    if (pack.span && !isCasual && s.overtimeMinutes == null) {
      const outside = ordinaryWorked.filter(x => { const [a, b] = pack.span!.byDow[x.dow]; return x.tod < a || x.tod >= b; });
      if (outside.length) material("Overtime", `Shift ${si + 1} includes ${(outside.length / 60).toFixed(2)} hours outside the span of ordinary hours (${pack.span.clause}). These may be overtime unless your store's trading hours extend the span. Tell us how many hours were paid as overtime.`, si);
    }
    for (const x of ordinaryWorked) weeklyOrdinary.set(isoWeek(x.date), (weeklyOrdinary.get(isoWeek(x.date)) ?? 0) + 1);

    // Group ordinary minutes by penalty id.
    const groups = new Map<string, { id: number; label: string; minutes: number; date: string }>();
    for (const x of ordinaryWorked) {
      const o = ordId(x); const key = `${o.id}|${x.date}`;
      const g = groups.get(key) ?? { id: o.id, label: o.label, minutes: 0, date: x.date }; g.minutes++; groups.set(key, g);
    }
    for (const g of groups.values()) {
      const rec = penalty(g.id); const rate = penaltyRateCents(baseCents, Number(rec.rate));
      result.lines.push({
        shiftIndex: si, date: g.date, category: g.label, minutes: g.minutes, percent: Number(rec.rate), hourlyCents: rate,
        amountCents: divRound(rate * g.minutes, 60),
        sources: [rateSource, { type: "penalty", id: rec.penaltyFixedId, description: `${rec.clauseDescription}: ${rec.penaltyDescription}`, operativeFrom: rec.operativeFrom, clause: pack.clauses.penalties, url: pack.awardUrl }],
        explanation: `${(g.minutes / 60).toFixed(2)} h × ${Number(rec.rate)}% of $${(baseCents / 100).toFixed(2)} = $${(rate / 100).toFixed(2)}/h`,
      });
    }

    // Flat per-hour additions (Hospitality cl 29.2): Mon–Fri ordinary minutes in each band, paid per hour or part of an hour.
    for (const add of pack.additions) {
      const inBand = ordinaryWorked.filter(x => x.day === "weekday" && x.tod >= add.from && x.tod < add.to);
      if (!inBand.length) continue;
      const rec = pick(snap.wageAllowances.filter(w => w.wageAllowanceFixedId === add.wageAllowanceId), ref);
      if (!rec || rec.amount == null) { material(add.label, "The Fair Work amount for this period isn't in AwardPay's snapshot.", si); continue; }
      const units = Math.ceil(inBand.length / 60); const unit = toCents(Number(rec.amount));
      result.lines.push({
        shiftIndex: si, date: inBand[0].date, category: add.label, minutes: inBand.length, units, unitCents: unit, amountCents: units * unit,
        sources: [{ type: "wage_allowance", id: rec.wageAllowanceFixedId, description: rec.allowance, operativeFrom: rec.operativeFrom, clause: `${pack.clauses.penalties}${rec.clauses ? `, cl ${rec.clauses}` : ""}`, url: pack.awardUrl }],
        explanation: `${units} × $${(unit / 100).toFixed(2)} (per hour or part of an hour, ${(inBand.length / 60).toFixed(2)} h)`,
      });
    }

    // Overtime lines.
    if (otWorked.length) {
      if (!ot) { material("Overtime", (isCasual && pack.overtimeMissingReason?.casual) || "Overtime isn't assessed for this employment type.", si); }
      else {
        let tierUsed = 0;
        const og = new Map<string, { id: number; label: string; minutes: number; date: string }>();
        for (const x of otWorked) {
          let id: number; let label: string;
          if (x.day === "ph") { id = ot.publicHoliday; label = "Overtime — public holiday"; }
          else if (ot.tierDays.includes(x.dow)) {
            if (tierUsed < ot.tierMinutes) { id = ot.first; label = `Overtime — first ${ot.tierMinutes / 60} hours`; } else { id = ot.after; label = `Overtime — after ${ot.tierMinutes / 60} hours`; }
            tierUsed++;
          } else {
            const flat = x.dow === 0 ? ot.flat.sunday : ot.flat.saturday;
            if (flat == null) { material("Overtime", `No overtime rate mapped for this day.`, si); continue; }
            id = flat; label = x.dow === 0 ? "Overtime — Sunday" : "Overtime — Saturday";
          }
          const key = `${id}|${x.date}`; const g = og.get(key) ?? { id, label, minutes: 0, date: x.date }; g.minutes++; og.set(key, g);
        }
        for (const g of og.values()) {
          const rec = penalty(g.id); const rate = penaltyRateCents(baseCents, Number(rec.rate));
          result.lines.push({
            shiftIndex: si, date: g.date, category: g.label, minutes: g.minutes, percent: Number(rec.rate), hourlyCents: rate,
            amountCents: divRound(rate * g.minutes, 60),
            sources: [rateSource, { type: "penalty", id: rec.penaltyFixedId, description: `${rec.clauseDescription}: ${rec.penaltyDescription}`, operativeFrom: rec.operativeFrom, clause: pack.clauses.overtime, url: pack.awardUrl }],
            explanation: `${(g.minutes / 60).toFixed(2)} h × ${Number(rec.rate)}% of $${(baseCents / 100).toFixed(2)} = $${(rate / 100).toFixed(2)}/h`,
          });
        }
      }
    }
  });

  if (isCasual) for (const [wk, m] of weeklyOrdinary) if (m > 38 * 60) material("Overtime", `More than 38 ordinary hours in the week starting ${wk}. Casual overtime may apply (${pack.clauses.overtime}); tell us which hours were paid as overtime.`);
  if (input.employmentType === "part_time") result.notes.push("Part-time overtime also applies to hours beyond your agreed guaranteed hours. AwardPay only counts the overtime hours you tell us about.");

  result.assessedEntitlementCents = result.lines.reduce((t, l) => t + l.amountCents, 0);
  result.status = result.notAssessed.some(n => n.material) ? "partial" : "complete";
  if (result.status === "partial") result.reasons.push("Some hours or entitlements couldn't be assessed, so this is not your full entitlement and no underpayment total is shown.");

  // ---- paid comparison ----
  const comparableKinds: PaidKind[] = ["ordinary", "saturday", "sunday", "public_holiday", "evening", "overtime"];
  const lines = input.paid?.lines ?? [];
  if (lines.length) {
    const comp = lines.filter(l => comparableKinds.includes(l.kind)).reduce((t, l) => t + l.amountCents, 0);
    const excl = lines.filter(l => !comparableKinds.includes(l.kind)).reduce((t, l) => t + l.amountCents, 0);
    result.paid = { grossCents: input.paid?.grossCents ?? null, comparableCents: comp, excludedCents: excl, note: excl ? "Allowances, leave and other payments were left out of the comparison because they aren't assessed." : "Only wage lines for these hours were compared." };
  } else if (input.paid?.grossCents != null) {
    if (input.paid.grossCoversOnlyTheseShifts) {
      result.paid = { grossCents: input.paid.grossCents, comparableCents: input.paid.grossCents, excludedCents: 0, note: "You confirmed your gross pay covers only these hours, with no allowances, leave or other payments." };
    } else {
      result.paid = { grossCents: input.paid.grossCents, comparableCents: null, excludedCents: 0, note: "Gross pay can include allowances, leave and other payments, so it wasn't compared. Enter the pay lines for these hours to compare." };
    }
  }
  if (result.status === "complete" && result.paid.comparableCents != null) {
    result.differenceCents = result.assessedEntitlementCents - result.paid.comparableCents;
    result.underpaymentCents = Math.max(0, result.differenceCents);
  }
  return result;
}
