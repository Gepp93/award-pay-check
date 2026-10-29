import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IndustryChip, Stepper } from "./Layout";
import { useV2 } from "./store";
import {
  AWARDS, OTHER_AWARD, buildRequest, classificationsFor, overtimeRules, prefillFromPayslip, stepsFor,
  type EngineDraft, type ShiftDraft, type StepId, type Tri,
} from "./engine/model";
import { runEngine, type EngineCallError } from "./engine/api";

const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];
const KINDS: [string, string][] = [
  ["ordinary", "Ordinary hours"], ["casual_loading", "Casual loading"], ["evening", "Evening / night penalty"],
  ["saturday", "Saturday"], ["sunday", "Sunday"], ["weekend", "Weekend (Sat and Sun combined)"], ["public_holiday", "Public holiday"],
  ["overtime", "Overtime"], ["allowance", "Allowance"], ["leave", "Leave"], ["other", "Other / not sure"],
];
const ERR: Record<EngineCallError, string> = {
  signin: "Sign in with an authorised tester account to run Engine v2 in this preview.",
  forbidden: "This account isn't authorised to test Engine v2.",
  invalid: "Some answers aren't in a format the engine accepts. Check dates and times.",
  failed: "The calculation couldn't run. Try again in a moment.",
};

function Choice({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-3 sm:grid-cols-2">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn("min-h-14 rounded-lg border-2 bg-card px-4 py-3 text-left font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === v ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50")}>{l}</button>
      ))}
    </div>
  );
}
const TRI: [Tri, string][] = [["yes", "Yes"], ["no", "No"], ["unknown", "I'm not sure"]];
const blankShift: ShiftDraft = { date: "", start: "", finish: "", breakMinutes: "", breakStart: "", overtimeMinutes: "" };

export default function EngineQuestions() {
  const { answers, update } = useV2();
  const navigate = useNavigate();
  const loc = useLocation();
  const [d, setD] = useState<EngineDraft>(() => answers.payslip ? prefillFromPayslip(answers.engine, answers.payslip) : answers.engine);
  const steps = useMemo(() => stepsFor(d), [d]);
  const fromHash = steps.indexOf(loc.hash.slice(1) as StepId);
  const [i, setI] = useState(fromHash >= 0 ? fromHash : 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<EngineCallError | null>(null);
  useEffect(() => { update({ engine: d }); }, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = steps[Math.min(i, steps.length - 1)];
  const set = (p: Partial<EngineDraft>) => setD(x => ({ ...x, ...p }));
  const rules = d.awardCode && d.employmentType ? overtimeRules(d.awardCode, d.employmentType) : null;
  const fromPayslip = (v: string, src?: string) => v && src === "payslip" ? <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">From your confirmed payslip</span> : null;
  const otField = answers.payslip?.find(f => f.key === "overtime_hours" && f.source !== "missing");

  // Required to continue (input completeness only — never decides the assessment result).
  const canNext: Record<StepId, boolean> = {
    award: !!d.awardCode && (d.awardCode === OTHER_AWARD || !!d.enterpriseAgreement),
    classification: d.classificationFixedId !== null, employment: !!d.employmentType, rate: !!d.rateType, state: !!d.state,
    period: true, shifts: d.shifts.some(s => s.date && s.start && s.finish), allShifts: !!d.allShifts, roster: !!d.workedToRoster,
    guaranteed: true, cycle: true, pay: true,
  };

  const submit = async () => {
    setBusy(true); setErr(null);
    const r = await runEngine(buildRequest(d));
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    update({ engine: d, result: r.result });
    navigate("/v2/results");
  };
  const last = i >= steps.length - 1;
  const next = () => (last ? submit() : setI(i + 1));
  const updShift = (k: number, p: Partial<ShiftDraft>) => set({ shifts: d.shifts.map((s, j) => (j === k ? { ...s, ...p } : s)) });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <Stepper current={1} />
      <IndustryChip />
      <p className="mb-6 rounded-md bg-gold-soft px-3 py-2 text-xs font-bold">Internal Engine v2 test — not available to customers. Question {i + 1} of {steps.length}</p>

      <section aria-live="polite" className="space-y-5">
        {step === "award" && (<>
          <h1 className="text-3xl font-extrabold">Which award covers you?</h1>
          <p className="text-ink-2">We only check these three awards for now. We never pick an award for you.</p>
          <Choice label="Award" value={d.awardCode} onChange={v => set({ awardCode: v, classificationFixedId: null })}
            options={[...AWARDS.map(a => [a.code, `${a.label} (${a.code})`] as [string, string]), [OTHER_AWARD, "A different award / not sure"]]} />
          {d.awardCode && d.awardCode !== OTHER_AWARD && (<>
            <p className="pt-2 font-bold">Are you covered by an enterprise agreement instead?</p>
            <Choice label="Enterprise agreement" value={d.enterpriseAgreement} onChange={v => set({ enterpriseAgreement: v as Tri })} options={[["no", "No — the award applies"], ["yes", "Yes, an enterprise agreement"], ["unknown", "I'm not sure"]]} />
          </>)}
        </>)}

        {step === "classification" && (<>
          <h1 className="text-3xl font-extrabold">Your classification level</h1>
          <p className="text-ink-2">Find it on your payslip, contract or ask your employer. Choose "Not sure" rather than guessing.</p>
          <Choice label="Classification" value={String(d.classificationFixedId ?? "")} onChange={v => set({ classificationFixedId: Number(v) })}
            options={[...classificationsFor(d.awardCode).map(c => [String(c.id), c.label] as [string, string]), ["0", "Not sure"]]} />
        </>)}

        {step === "employment" && (<>
          <h1 className="text-3xl font-extrabold">How are you employed?{fromPayslip(d.employmentType, answers.payslip?.find(f => f.key === "employment_type")?.source)}</h1>
          <Choice label="Employment type" value={d.employmentType} onChange={v => set({ employmentType: v as EngineDraft["employmentType"] })} options={[["full_time", "Full-time"], ["part_time", "Part-time"], ["casual", "Casual"]]} />
        </>)}

        {step === "rate" && (<>
          <h1 className="text-3xl font-extrabold">Which pay rate applies to you?</h1>
          <Choice label="Rate type" value={d.rateType} onChange={v => set({ rateType: v as EngineDraft["rateType"] })} options={[["adult", "Adult rate"], ["junior", "Junior (under 21) rate"], ["apprentice", "Apprentice"], ["trainee", "Trainee"]]} />
        </>)}

        {step === "state" && (<>
          <h1 className="text-3xl font-extrabold">Where do you work?</h1>
          <p className="text-ink-2">Public holidays depend on your state or territory.</p>
          <Choice label="State" value={d.state} onChange={v => set({ state: v })} options={STATES.map(s => [s, s] as [string, string])} />
        </>)}

        {step === "period" && (<>
          <h1 className="text-3xl font-extrabold">Your pay period</h1>
          <p className="text-ink-2">The dates printed on your payslip. Without them, rate changes and weekly overtime can't be fully checked.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">Start{fromPayslip(d.periodStart, answers.payslip?.find(f => f.key === "pay_period_start")?.source)}<Input type="date" className="mt-1 h-12 text-base" value={d.periodStart} onChange={e => set({ periodStart: e.target.value })} /></label>
            <label className="text-sm font-bold">End{fromPayslip(d.periodEnd, answers.payslip?.find(f => f.key === "pay_period_end")?.source)}<Input type="date" className="mt-1 h-12 text-base" value={d.periodEnd} onChange={e => set({ periodEnd: e.target.value })} /></label>
          </div>
        </>)}

        {step === "shifts" && (<>
          <h1 className="text-3xl font-extrabold">Your shifts</h1>
          <p className="text-ink-2">Actual start and finish times. A finish at or before the start means the shift ended the next day. Leave the break blank if you don't know it — enter 0 if you had none.</p>
          {rules && <p className="rounded-md bg-secondary px-3 py-2 text-sm">Unpaid breaks: {rules.breakClause}. Overtime can apply beyond the daily limit ({rules.daily}){rules.span ? `, outside the span of ordinary hours (${rules.span})` : ""}, and {rules.clause}. Only enter overtime minutes your employer paid or that you know were overtime.</p>}
          {otField && <p className="text-sm text-ink-2">Your confirmed payslip shows {otField.value} overtime hours. Tell us which shifts they belong to.</p>}
          {d.shifts.map((s, k) => (
            <fieldset key={k} className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-3">
              <legend className="px-1 text-sm font-bold">Shift {k + 1}</legend>
              <label className="text-xs font-bold">Date<Input type="date" className="mt-1 h-12 text-base" value={s.date} onChange={e => updShift(k, { date: e.target.value })} /></label>
              <label className="text-xs font-bold">Start<Input type="time" className="mt-1 h-12 text-base" value={s.start} onChange={e => updShift(k, { start: e.target.value })} /></label>
              <label className="text-xs font-bold">Finish<Input type="time" className="mt-1 h-12 text-base" value={s.finish} onChange={e => updShift(k, { finish: e.target.value })} /></label>
              <label className="text-xs font-bold">Unpaid break (minutes)<Input inputMode="numeric" placeholder="Don't know" className="mt-1 h-12 text-base" value={s.breakMinutes} onChange={e => updShift(k, { breakMinutes: e.target.value.replace(/\D/g, "") })} /></label>
              <label className="text-xs font-bold">Break started at<Input type="time" className="mt-1 h-12 text-base" value={s.breakStart} onChange={e => updShift(k, { breakStart: e.target.value })} /></label>
              <label className="text-xs font-bold">Overtime minutes (end of shift)<Input inputMode="numeric" placeholder="None stated" className="mt-1 h-12 text-base" value={s.overtimeMinutes} onChange={e => updShift(k, { overtimeMinutes: e.target.value.replace(/\D/g, "") })} /></label>
              <Button variant="ghost" size="sm" className="justify-self-start sm:col-span-3" onClick={() => set({ shifts: d.shifts.filter((_, j) => j !== k) })}><Trash2 /> Remove shift</Button>
            </fieldset>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => set({ shifts: [...d.shifts, blankShift] })}><Plus /> Add a shift</Button>
            {d.shifts.length > 0 && <Button variant="outline" onClick={() => { const p = d.shifts[d.shifts.length - 1]; const n = p.date ? new Date(Date.parse(`${p.date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : ""; set({ shifts: [...d.shifts, { ...p, date: n }] }); }}>Copy last shift to next day</Button>}
          </div>
        </>)}

        {step === "allShifts" && (<>
          <h1 className="text-3xl font-extrabold">Are these all the shifts you worked in this pay period?</h1>
          <p className="text-ink-2">Weekly overtime depends on every hour in the week.</p>
          <Choice label="All shifts included" value={d.allShifts} onChange={v => set({ allShifts: v as Tri })} options={TRI} />
        </>)}

        {step === "roster" && (<>
          <h1 className="text-3xl font-extrabold">Apart from overtime, were these your normal rostered hours?</h1>
          <p className="text-ink-2">For your award and employment type, hours outside your roster can be overtime ({rules?.clause}).</p>
          <Choice label="Worked to roster" value={d.workedToRoster} onChange={v => set({ workedToRoster: v as Tri })} options={TRI} />
        </>)}

        {step === "guaranteed" && (<>
          <h1 className="text-3xl font-extrabold">How many hours a week are you guaranteed or agreed to work?</h1>
          <p className="text-ink-2">It's in your written part-time agreement. Hours beyond it can be overtime ({rules?.clause}). Leave blank if you don't know.</p>
          <label className="text-sm font-bold">Hours per week<Input inputMode="decimal" className="mt-1 h-12 max-w-40 text-base" value={d.guaranteedHours} onChange={e => set({ guaranteedHours: e.target.value.replace(/[^\d.]/g, "") })} /></label>
        </>)}

        {step === "cycle" && (<>
          <h1 className="text-3xl font-extrabold">Are your hours averaged over a roster cycle?</h1>
          <p className="text-ink-2">Some rosters average 38 hours a week over several weeks. Skip if you don't know.</p>
          <Choice label="Roster cycle" value={d.rosterCycleWeeks} onChange={v => set({ rosterCycleWeeks: v })} options={[["1", "No — weekly"], ["2", "Over 2 weeks"], ["3", "Over 3 weeks"], ["4", "Over 4 weeks"], ["", "I don't know"]]} />
        </>)}

        {step === "pay" && (<>
          <h1 className="text-3xl font-extrabold">What you were paid for these hours</h1>
          <p className="text-ink-2">Each amount once, as printed. Don't add a total that's already split into lines.</p>
          {d.payLines.map((l, k) => (
            <div key={k} className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[2fr_1fr_auto]">
              <label className="text-xs font-bold">Type{l.source === "payslip" && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] text-primary">From payslip</span>}{l.source === "user" && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px]">Entered by you</span>}
                <select className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base" value={l.kind} onChange={e => set({ payLines: d.payLines.map((x, j) => j === k ? { ...x, kind: e.target.value, source: "user" } : x) })}>
                  {KINDS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select></label>
              <label className="text-xs font-bold">Amount ($)<Input inputMode="decimal" className="mt-1 h-12 text-base" value={l.amount} onChange={e => set({ payLines: d.payLines.map((x, j) => j === k ? { ...x, amount: e.target.value, source: "user" } : x) })} /></label>
              <Button variant="ghost" size="icon" aria-label="Remove line" className="self-end" onClick={() => set({ payLines: d.payLines.filter((_, j) => j !== k) })}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => set({ payLines: [...d.payLines, { kind: "ordinary", amount: "", source: "user", label: "" }] })}><Plus /> Add a pay line</Button>
          <label className="block text-sm font-bold">Gross pay ($){fromPayslip(d.grossPay, d.grossSource)}<Input inputMode="decimal" className="mt-1 h-12 max-w-48 text-base" value={d.grossPay} onChange={e => set({ grossPay: e.target.value, grossSource: "user" })} /></label>
          {d.payLines.length > 0 && (<>
            <p className="font-bold">Do these lines include every wage payment for these hours?</p>
            <Choice label="Lines cover all wages" value={d.linesCoverAllWages} onChange={v => set({ linesCoverAllWages: v as Tri })} options={TRI} />
          </>)}
        </>)}
      </section>

      {err && <p role="alert" className="mt-6 rounded-md bg-clay-soft px-3 py-2 text-sm font-semibold text-destructive">{ERR[err]} {err === "signin" && <Link to="/v2/sign-in" className="underline">Sign in</Link>}</p>}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => (i === 0 ? navigate(-1) : setI(i - 1))}><ArrowLeft /> Back</Button>
        <Button className="h-12 min-w-40" disabled={!canNext[step] || busy} onClick={next}>
          {busy ? <><Loader2 className="animate-spin" /> Checking…</> : last ? "See my result" : <>Continue <ArrowRight /></>}
        </Button>
      </div>
    </main>
  );
}
