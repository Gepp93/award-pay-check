// Engine v2 rule packs. Each pack maps award situations to official Fair Work
// Commission record IDs (penalty_fixed_id / wage_allowance_fixed_id). Packs hold
// NO dollar amounts or percentages: those are read from the dated snapshots in
// ./data, copied verbatim from api.fwc.gov.au. Clause numbers were read from
// the award text at awards.fairwork.gov.au on 2026-10-29 (MA000020/MA000025:
// 2026-10-30). Exception: the pay database has no penalty records for MA000020,
// so that pack references string IDs resolved from the snapshot's
// inlinePenalties — percentages copied verbatim from the award text, dated and
// cited in scripts/engine-v2/inline_penalties.json.

export type Employment = "full_time" | "part_time" | "casual";
export type Dow = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

/** A Fair Work pay-database record id (number) or a snapshot inline-penalty id (string, for awards the database doesn't cover). */
export type PenaltyRef = number | string;

/** A time band within a day, minutes from midnight [from, to). */
export interface Band { from: number; to: number; penaltyId: PenaltyRef; label: string }

export interface OrdinaryRules {
  weekday: PenaltyRef; // penalty id for weekday ordinary hours outside any band
  weekdayBands: Band[]; // Monday-Friday bands with their own percentage
  /** null = the award has no ordinary hours on this day (all work is overtime). */
  saturday: PenaltyRef | null;
  sunday: PenaltyRef | { byGroup: Record<string, number> } | null;
  /** Time-of-day bands on Saturday/Sunday (e.g. Pharmacy). Take precedence over the flat rate; a minute outside every band falls back to the flat rate (or overtime when the flat rate is null). */
  saturdayBands?: Band[];
  sundayBands?: Band[];
  publicHoliday: PenaltyRef;
}

export interface OvertimeRules {
  /** Days where overtime is paid in tiers: first `tierMinutes` then the second rate. */
  tierDays: Dow[];
  tierMinutes: number;
  first: PenaltyRef;
  after: PenaltyRef;
  /** Per-day tier rates when they differ from first/after (e.g. Restaurant/Clubs Saturday 175%/200% vs Monday-Friday 150%/200%). */
  tierRates?: Partial<Record<Dow, { first: PenaltyRef; after: PenaltyRef }>>;
  /** Flat overtime rates for days outside tierDays. */
  flat: Partial<Record<"saturday" | "sunday", PenaltyRef>>;
  publicHoliday: PenaltyRef;
  /** MA000020 cl 30.1(b): all Saturday overtime after 12 noon is at the "after" rate, even within the first 2 hours. */
  saturdayNoonAllAfter?: boolean;
}

/** Flat dollar additions per hour or part of an hour (e.g. Hospitality cl 29.2). */
export interface Addition { from: number; to: number; wageAllowanceId: number; label: string }

export interface SpanRule {
  /** Ordinary span by day: [start, end) minutes. Outside it, hours may be overtime. */
  byDow: Record<Dow, [number, number]>;
  /** Latest possible end if the extended-trading exception applies (unknown to us). */
  extendedEnd: number;
  clause: string;
  /** Exceptions that move the span when the user confirms them. start/end in minutes of the day. */
  exceptions?: Array<{ id: string; label: string; clause: string; question: string; start?: number; end?: number }>;
}

export interface Classification { label: string; sundayGroup?: string }

export interface RulePack {
  awardCode: string;
  name: string;
  version: string;
  awardUrl: string;
  classifications: Record<number, Classification>;
  clauses: { minimumRates: string; penalties: string; overtime: string; hours: string; casual: string; schedule: string };
  ordinary: { ftpt: OrdinaryRules; casual: OrdinaryRules };
  overtime: { ftpt: OvertimeRules; casual: OvertimeRules | null };
  overtimeMissingReason?: { casual?: string };
  additions: Addition[];
  /** Maximum ordinary minutes in a day before overtime must apply. */
  dailyMaxOrdinaryMinutes: number;
  dailyMaxClause: string;
  span?: SpanRule;
  /** Daily ordinary-hours maximum by employment type (minutes). Above it, hours are overtime. */
  dailyMaxByEmployment?: Partial<Record<Employment, number>>;
  /** Some awards allow one longer day per week (Retail cl 15.5: 11 hours on one day). */
  oneLongDayMinutes?: number;
  /** Employment types the span-of-hours overtime trigger applies to. */
  spanAppliesTo?: Employment[];
  /** Information needed before AwardPay can rule out overtime: "roster" = every non-overtime hour was rostered ordinary time; "guaranteed" = agreed/guaranteed weekly hours. */
  overtimeNeeds: Record<Employment, Array<"roster" | "guaranteed">>;
  overtimeNeedsClause: Record<Employment, string>;
  /** Unpaid meal breaks may apply to shifts longer than this many minutes. */
  unpaidBreakAfterMinutes: number;
  breakClause: string;
  /** Minimum paid engagement per shift (minutes), and on public holidays where the award sets one. */
  minimumEngagement: Partial<Record<Employment, number>>;
  publicHolidayMinimum?: Partial<Record<Employment, number>>;
  minimumClause: string;
  /** Situations the pack refuses to assess. */
  unsupportedFlags: Array<"shiftworker" | "casinoGaming" | "managerial">;
  /** RDO accrual system (MA000020 cl 16.2): of each ordinary day, only paidPerWorked is paid; the rest accrues towards a rostered day off. Applies to non-casuals when the user confirms the RDO system. */
  rdoAccrual?: { paidPerWorked: number; clause: string };
}

const h = (hh: number, mm = 0) => hh * 60 + mm;

export const RETAIL: RulePack = {
  awardCode: "MA000004",
  name: "General Retail Industry Award 2020",
  version: "2026-10-30.1",
  awardUrl: "https://awards.fairwork.gov.au/MA000004.html",
  classifications: {
    112: { label: "Retail Employee Level 1" }, 113: { label: "Retail Employee Level 2" },
    114: { label: "Retail Employee Level 3" }, 115: { label: "Retail Employee Level 4" },
    116: { label: "Retail Employee Level 5" }, 117: { label: "Retail Employee Level 6" },
    118: { label: "Retail Employee Level 7" }, 119: { label: "Retail Employee Level 8" },
  },
  clauses: {
    minimumRates: "cl 17 (Table 4—Minimum rates)", penalties: "cl 22.1 (Table 12—Penalty rates)",
    overtime: "cl 21.2 (Table 10—Application of overtime; Table 11—Overtime rates)", hours: "cl 15 (Table 2—Span of hours)",
    casual: "cl 11 (casual loading)", schedule: "Schedule B—Summary of Hourly Rates of Pay",
  },
  ordinary: {
    ftpt: { weekday: 1930, weekdayBands: [{ from: h(18), to: h(24), penaltyId: 1931, label: "Monday to Friday after 6.00 pm" }], saturday: 1932, sunday: 1933, publicHoliday: 1934 },
    casual: { weekday: 1945, weekdayBands: [{ from: h(18), to: h(24), penaltyId: 5417, label: "Monday to Friday after 6.00 pm" }], saturday: 1946, sunday: 1947, publicHoliday: 1948 },
  },
  overtime: {
    ftpt: { tierDays: [1, 2, 3, 4, 5, 6], tierMinutes: 180, first: 1941, after: 1942, flat: { sunday: 1943 }, publicHoliday: 1944 },
    casual: null,
  },
  overtimeMissingReason: { casual: "The award sets casual overtime rates (cl 21.2 Table 11 column 3), but the Fair Work pay database has no records for them, so AwardPay doesn't calculate casual overtime for this award yet." },
  additions: [],
  dailyMaxOrdinaryMinutes: h(9),
  dailyMaxClause: "cl 15.4–15.5 (9 ordinary hours a day; 11 on one day a week); Table 10 casual (iii)",
  oneLongDayMinutes: h(11),
  spanAppliesTo: ["full_time", "part_time", "casual"],
  overtimeNeeds: { full_time: ["roster"], part_time: ["guaranteed"], casual: [] },
  overtimeNeedsClause: { full_time: "cl 21.2 Table 10 (hours in excess of ordinary hours or outside roster conditions)", part_time: "cl 10.8 and Table 10 (hours beyond guaranteed hours)", casual: "Table 10 (more than 38 ordinary hours a week, averaged over a roster cycle if rostered)" },
  unpaidBreakAfterMinutes: h(5), breakClause: "cl 16 Table 3 (unpaid meal break for shifts of more than 5 hours)",
  minimumEngagement: { part_time: h(3), casual: h(3) }, minimumClause: "cl 10.9 (part-time 3 hours), cl 11.2 (casual 3 hours, 1.5 hours in limited circumstances)",
  span: {
    byDow: { 0: [h(9), h(18)], 1: [h(7), h(21)], 2: [h(7), h(21)], 3: [h(7), h(21)], 4: [h(7), h(21)], 5: [h(7), h(21)], 6: [h(7), h(18)] },
    extendedEnd: h(23), clause: "cl 15.1–15.2 and Table 10",
    exceptions: [
      { id: "late_trading", label: "Retailer trades beyond 9 pm weekdays or 6 pm weekends: ordinary hours until 11 pm every day", clause: "cl 15.2(c)", question: "the store trades beyond 9 pm Monday to Friday or 6 pm on a Saturday or Sunday", end: h(23) },
      { id: "newsagency", label: "Newsagency: ordinary hours from 5 am", clause: "cl 15.2(a)", question: "you work in a newsagency", start: h(5) },
      { id: "video_shop", label: "Video shop: ordinary hours until midnight", clause: "cl 15.2(b)", question: "you work in a video shop", end: h(24) },
    ],
  },
  unsupportedFlags: ["shiftworker"],
};

export const HOSPITALITY: RulePack = {
  awardCode: "MA000009",
  name: "Hospitality Industry (General) Award 2020",
  version: "2026-10-30.1",
  awardUrl: "https://awards.fairwork.gov.au/MA000009.html",
  classifications: {
    242: { label: "Introductory level" },
    243: { label: "Level 1 (e.g. food and beverage attendant grade 1, kitchen attendant grade 1)" },
    246: { label: "Level 2 (e.g. cook grade 1, food and beverage attendant grade 2)" },
    257: { label: "Level 3 (e.g. cook grade 2, food and beverage attendant grade 3)" },
    268: { label: "Level 4 (e.g. cook (tradesperson) grade 3)" },
    276: { label: "Level 5 (e.g. cook (tradesperson) grade 4, supervisors)" },
    282: { label: "Level 6 (cook (tradesperson) grade 5)" },
  },
  clauses: {
    minimumRates: "cl 18", penalties: "cl 29.2 (Table 14—Penalty rates, including the per-hour additional amount Mon–Fri 7.00 pm to 7.00 am)",
    overtime: "cl 28 (cl 28.4 Table 13—Overtime rates)", hours: "cl 15", casual: "cl 11", schedule: "Schedule B—Summary of Hourly Rates of Pay",
  },
  ordinary: {
    ftpt: { weekday: 2053, weekdayBands: [], saturday: 2054, sunday: 2055, publicHoliday: 2056 },
    casual: { weekday: 2061, weekdayBands: [], saturday: 2062, sunday: 2063, publicHoliday: 2064 },
  },
  overtime: {
    ftpt: { tierDays: [1, 2, 3, 4, 5], tierMinutes: 120, first: 2057, after: 2058, flat: { saturday: 2059, sunday: 2059 }, publicHoliday: 2060 },
    casual: { tierDays: [1, 2, 3, 4, 5], tierMinutes: 120, first: 5652, after: 5653, flat: { saturday: 5654, sunday: 5654 }, publicHoliday: 5655 },
  },
  additions: [
    { from: h(19), to: h(24), wageAllowanceId: 87, label: "Monday to Friday 7.00 pm to midnight (per hour or part)" },
    { from: h(0), to: h(7), wageAllowanceId: 11954, label: "Monday to Friday midnight to 7.00 am (per hour or part)" },
  ],
  dailyMaxOrdinaryMinutes: h(11, 30),
  dailyMaxClause: "cl 15.1–15.2 (maximum 11.5 ordinary hours a day); cl 11.2 (casual maximum 12 hours a day)",
  dailyMaxByEmployment: { casual: h(12) },
  overtimeNeeds: { full_time: ["roster"], part_time: ["roster"], casual: [] },
  overtimeNeedsClause: { full_time: "cl 28.2(a) (time in excess of ordinary hours)", part_time: "cl 10.13(b) (beyond 38 a week, daily maximum, or rostered hours)", casual: "cl 11.2/11.4 (more than 12 hours a day or 38 a week, averaged over a roster cycle of up to 4 weeks)" },
  unpaidBreakAfterMinutes: h(5), breakClause: "cl 16 Table 2 (elective unpaid break over 5 hours; required over 6 hours)",
  minimumEngagement: { part_time: h(3), casual: h(2) }, publicHolidayMinimum: { full_time: h(4), part_time: h(4), casual: h(2) },
  minimumClause: "cl 15.2(a) (part-time 3 hours), cl 11.3 (casual 2 hours), cl 29.4 (public holiday 4 hours; casual 2 hours)",
  unsupportedFlags: ["casinoGaming", "managerial"],
};

export const FAST_FOOD: RulePack = {
  awardCode: "MA000003",
  name: "Fast Food Industry Award 2010",
  version: "2026-10-30.1",
  awardUrl: "https://awards.fairwork.gov.au/MA000003.html",
  classifications: {
    108: { label: "Fast food employee level 1", sundayGroup: "level1" },
    109: { label: "Fast food employee level 2", sundayGroup: "level23" },
    110: { label: "Fast food employee level 3—in charge of one or no person", sundayGroup: "level23" },
    111: { label: "Fast food employee level 3—in charge of 2 or more people", sundayGroup: "level23" },
  },
  clauses: {
    minimumRates: "cl 15", penalties: "cl 21 (penalty rates table)", overtime: "cl 20 (overtime rates table)",
    hours: "cl 13", casual: "cl 11", schedule: "Schedule B—Summary of Hourly Rates of Pay",
  },
  ordinary: {
    ftpt: {
      weekday: 19177,
      weekdayBands: [
        { from: h(22), to: h(24), penaltyId: 19178, label: "Monday to Friday 10.00 pm to midnight" },
        { from: h(0), to: h(6), penaltyId: 19179, label: "Monday to Friday midnight to 6.00 am" },
      ],
      saturday: 19180, sunday: { byGroup: { level1: 19181, level23: 19182 } }, publicHoliday: 19183,
    },
    casual: {
      weekday: 19188,
      weekdayBands: [
        { from: h(22), to: h(24), penaltyId: 19189, label: "Monday to Friday 10.00 pm to midnight" },
        { from: h(0), to: h(6), penaltyId: 19190, label: "Monday to Friday midnight to 6.00 am" },
      ],
      saturday: 19191, sunday: { byGroup: { level1: 19192, level23: 19193 } }, publicHoliday: 19194,
    },
  },
  overtime: {
    ftpt: { tierDays: [1, 2, 3, 4, 5, 6], tierMinutes: 120, first: 19184, after: 19185, flat: { sunday: 19186 }, publicHoliday: 19187 },
    casual: { tierDays: [1, 2, 3, 4, 5, 6], tierMinutes: 120, first: 19195, after: 19196, flat: { sunday: 19197 }, publicHoliday: 19198 },
  },
  additions: [],
  dailyMaxOrdinaryMinutes: h(11),
  dailyMaxClause: "cl 13.5 (maximum 11 ordinary hours on any day); cl 20.2–20.4",
  overtimeNeeds: { full_time: ["roster"], part_time: ["roster", "guaranteed"], casual: [] },
  overtimeNeedsClause: { full_time: "cl 20.2 (beyond 38 a week, 5 days, 11 hours a day, or outside rostered start/finish)", part_time: "cl 20.3 and cl 10.9 (beyond agreed hours or rostered start/finish)", casual: "cl 20.4 (more than 38 ordinary hours a week, averaged over a roster cycle if rostered, or 11 hours a day)" },
  unpaidBreakAfterMinutes: h(5) - 1, breakClause: "cl 14 (unpaid meal break for shifts of 5 hours or more)",
  minimumEngagement: { part_time: h(3), casual: h(3) }, minimumClause: "cl 10.2 (part-time 3 hours), cl 11.3 (casual 3 hours)",
  unsupportedFlags: [],
};

// MA000020 — verified against the consolidated award text (up to 1 July 2026,
// PR799301/PR799458) on 2026-10-30. The Fair Work pay database has no penalty
// records for this award, so every percentage comes from the snapshot's
// inlinePenalties (award text, see scripts/engine-v2/inline_penalties.json).
// Ordinary hours are Monday to Friday only: all Saturday/Sunday work is
// overtime (cl 29.12, cl 30.1). Daily hire employees (cl 9) are assessed as
// full-time weekly hire — the rates are the same; termination differences are
// not assessed.
export const CONSTRUCTION: RulePack = {
  awardCode: "MA000020",
  name: "Building and Construction General On-site Award 2020",
  version: "2026-10-30.1",
  awardUrl: "https://awards.fairwork.gov.au/MA000020.html",
  classifications: {
    680: { label: "Level 1 (CW/ECW 1)—CW/ECW1 (level a)" },
    679: { label: "Level 1 (CW/ECW 1)—CW/ECW 1 (level b)" },
    678: { label: "Level 1 (CW/ECW 1)—CW/ECW 1 (level c)" },
    677: { label: "Level 1 (CW/ECW 1)—CW/ECW 1 (level d)" },
    676: { label: "Level 2 (CW/ECW 2)" },
    675: { label: "Level 3 (CW/ECW 3)" },
    674: { label: "Level 4 (CW/ECW 4)" },
    673: { label: "Level 5 (CW/ECW 5)" },
    672: { label: "Level 6 (CW/ECW 6)" },
    671: { label: "Level 7 (CW/ECW 7)" },
    670: { label: "Level 8 (CW/ECW 8)" },
    669: { label: "Level 9 (ECW 9)" },
  },
  clauses: {
    minimumRates: "cl 19.1 (minimum classification rates; verified against the award text table)",
    penalties: "cl 30.1 (weekend and public holiday work); cl 12.4–12.6 (casual rates)",
    overtime: "cl 29.4 (overtime Monday to Friday), cl 30.1 (Saturday and Sunday)",
    hours: "cl 16 (38 hours a week averaged over a 4-week RDO cycle; 7.00 am–6.00 pm Monday to Friday)",
    casual: "cl 12 (25% casual loading)",
    schedule: "cl 19.1(a) rate table (this award has no Schedule B hourly summary)",
  },
  ordinary: {
    ftpt: { weekday: "MA000020-ORD", weekdayBands: [], saturday: null, sunday: null, publicHoliday: "MA000020-PH" },
    casual: { weekday: "MA000020-CAS-ORD", weekdayBands: [], saturday: null, sunday: null, publicHoliday: "MA000020-CAS-PH" },
  },
  overtime: {
    ftpt: { tierDays: [1, 2, 3, 4, 5, 6], tierMinutes: 120, first: "MA000020-OT-1", after: "MA000020-OT-2", flat: { sunday: "MA000020-SUN" }, publicHoliday: "MA000020-PH", saturdayNoonAllAfter: true },
    casual: { tierDays: [1, 2, 3, 4, 5, 6], tierMinutes: 120, first: "MA000020-CAS-OT-1", after: "MA000020-CAS-OT-2", flat: { sunday: "MA000020-CAS-SUN" }, publicHoliday: "MA000020-CAS-PH", saturdayNoonAllAfter: true },
  },
  additions: [],
  dailyMaxOrdinaryMinutes: h(8),
  dailyMaxClause: "cl 16.2, 16.8, 16.9(a), 16.10 (8 ordinary hours a day, including RDO accrual time)",
  span: {
    byDow: { 0: [h(7), h(18)], 1: [h(7), h(18)], 2: [h(7), h(18)], 3: [h(7), h(18)], 4: [h(7), h(18)], 5: [h(7), h(18)], 6: [h(7), h(18)] },
    extendedEnd: h(18), clause: "cl 16.1 (7.00 am–6.00 pm Monday to Friday)",
    exceptions: [
      { id: "early_start", label: "Agreed early start: the working day may begin from 6.00 am", clause: "cl 16.11(a)", question: "there is an agreement at your workplace to start the working day as early as 6.00 am", start: h(6) },
    ],
  },
  overtimeNeeds: { full_time: ["roster"], part_time: ["roster"], casual: [] },
  overtimeNeedsClause: { full_time: "cl 29.4(a) (time beyond ordinary working hours, including RDO accrual time)", part_time: "cl 11.4 and 29.4(a) (hours beyond the agreed part-time hours)", casual: "cl 16.10 and 29.4(a) (more than 8 ordinary hours a day or 38 a week)" },
  rdoAccrual: { paidPerWorked: 0.95, clause: "cl 16.2 (8-hour day: 7.6 hours paid, 0.4 hours accrue towards an RDO)" },
  unpaidBreakAfterMinutes: h(5), breakClause: "cl 18.1 (unpaid meal break of at least 30 minutes; no more than 5 hours without a break)",
  minimumEngagement: { casual: h(4) }, publicHolidayMinimum: { full_time: h(4), part_time: h(4), casual: h(4) },
  minimumClause: "cl 12.3 (casual 4 hours); cl 29.10 and 30.2(d) (public holiday 4 hours); cl 30.2(a),(c) (Saturday overtime 3 hours, Sunday 4 hours)",
  unsupportedFlags: ["shiftworker"],
};

// MA000025 — verified against the consolidated award text (up to 1 July 2026,
// PR799280/PR799306/PR799463) on 2026-10-30. Penalty percentages are Fair Work
// pay-database records. Day workers' ordinary hours are Monday to Friday only:
// weekend work is overtime (cl 20.1, 20.4). The database has no casual overtime
// or casual Sunday records, so those stay Not assessed.
export const ELECTRICAL: RulePack = {
  awardCode: "MA000025",
  name: "Electrical, Electronic and Communications Contracting Award 2020",
  version: "2026-10-30.1",
  awardUrl: "https://awards.fairwork.gov.au/MA000025.html",
  classifications: {
    850: { label: "Electrical worker grade 1" },
    851: { label: "Electrical worker grade 2" },
    852: { label: "Electrical worker grade 3" },
    853: { label: "Electrical worker grade 4" },
    854: { label: "Electrical worker grade 5" },
    855: { label: "Electrical worker grade 6" },
    856: { label: "Electrical worker grade 7" },
    857: { label: "Electrical worker grade 8" },
    858: { label: "Electrical worker grade 9" },
    859: { label: "Electrical worker grade 10" },
  },
  clauses: {
    minimumRates: "cl 16.2 (minimum rates; verified against the award text table)",
    penalties: "cl 20.4 (Sunday and public holiday work); cl 11.2 (casual loading)",
    overtime: "cl 20.1 (overtime rates), cl 20.3 (minimum payment)",
    hours: "cl 13 (6.00 am–6.00 pm Monday to Friday; average 38 hours a week over a work cycle of up to 28 days)",
    casual: "cl 11 (25% casual loading)",
    schedule: "Schedule B—Summary of Hourly Rates of Pay",
  },
  ordinary: {
    ftpt: { weekday: 2449, weekdayBands: [], saturday: null, sunday: null, publicHoliday: 2450 },
    casual: { weekday: 2467, weekdayBands: [], saturday: null, sunday: null, publicHoliday: 2468 },
  },
  overtime: {
    ftpt: { tierDays: [1, 2, 3, 4, 5, 6], tierMinutes: 120, first: 2451, after: 2452, flat: { sunday: 2453 }, publicHoliday: 2454 },
    casual: null,
  },
  overtimeMissingReason: { casual: "Casual overtime (cl 20.1(b): 187.5%/250%) and casual Sunday work (cl 20.4(a)(ii): 250%) are in the award, but the Fair Work pay database has no rate records for them, so AwardPay doesn't calculate casual overtime or weekend work for this award yet." },
  additions: [],
  dailyMaxOrdinaryMinutes: h(8),
  dailyMaxClause: "cl 13.4–13.5 (8 ordinary hours a day standard; up to 12 only by majority agreement)",
  span: {
    byDow: { 0: [h(6), h(18)], 1: [h(6), h(18)], 2: [h(6), h(18)], 3: [h(6), h(18)], 4: [h(6), h(18)], 5: [h(6), h(18)], 6: [h(6), h(18)] },
    extendedEnd: h(18), clause: "cl 13.2–13.3 (6.00 am–6.00 pm Monday to Friday; the spread can be altered by agreement)",
  },
  overtimeNeeds: { full_time: ["roster"], part_time: ["roster", "guaranteed"], casual: [] },
  overtimeNeedsClause: { full_time: "cl 20.1(a) and 13.4 (work outside ordinary hours; 38-hour average over the work cycle)", part_time: "cl 20.1(a) and cl 10 (hours outside the agreed part-time arrangement)", casual: "cl 11.1 and 20.1(b) (beyond the lesser of the 38-hour average or the hours required)" },
  unpaidBreakAfterMinutes: h(6), breakClause: "cl 14.1(a),(c) (unpaid meal break of at least 30 minutes; not more than 6 hours without a break)",
  minimumEngagement: { casual: h(2) }, publicHolidayMinimum: { full_time: h(4), part_time: h(4), casual: h(4) },
  minimumClause: "cl 11.6 (casual 2 hours); cl 20.3(a) (Saturday, Sunday, RDO or public holiday overtime minimum 4 hours)",
  unsupportedFlags: ["shiftworker"],
};

export const RULE_PACKS: Record<string, RulePack> = { MA000004: RETAIL, MA000009: HOSPITALITY, MA000003: FAST_FOOD, MA000020: CONSTRUCTION, MA000025: ELECTRICAL };
