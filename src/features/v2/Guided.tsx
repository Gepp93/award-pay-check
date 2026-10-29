import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lightbulb, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { industryById } from "./industries";
import { useV2 } from "./store";
import { IndustryChip, Stepper } from "./Layout";
import IntentPicker from "./IntentPicker";
import { intentById, type QuestionId } from "./intents";
import { Link } from "react-router-dom";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const EMPLOYMENT = ["Full-time", "Part-time", "Casual"] as const;

function Choice({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={cn("min-h-14 rounded-md border px-4 py-3 text-left font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on ? "border-2 border-primary bg-primary-soft text-primary-press" : "border-rule-strong bg-card hover:bg-muted")}>{children}</button>
  );
}

export default function Guided() {
  const { answers, update } = useV2();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const ind = industryById(answers.industry);
  if (!ind) return <Navigate to="/v2/industry" replace />;
  const intent = intentById(answers.intent);
  if (!intent) return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Stepper current={1} />
      <IndustryChip />
      <IntentPicker industry={ind} selected={null} onSelect={(id) => {
        update({ intent: id }); setStep(0);
        if (id === "payslip") navigate("/v2/upload");
      }} />
    </main>
  );

  const steps = [
    { id: "role" as const, title: "What's your role?", tip: `These are common ${ind.label.toLowerCase()} roles. Pick one or type your own — it's a starting point, not your award.`, ok: !!answers.role.trim(),
      body: (
        <div className="space-y-4">
          {ind.roles.length > 0 && <div role="radiogroup" aria-label="Suggested roles" className="grid gap-3 sm:grid-cols-2">
            {ind.roles.map((r) => <Choice key={r} on={answers.role === r} onClick={() => update({ role: r })}>{r}</Choice>)}
          </div>}
          <label className="block text-sm font-bold">Or type your role
            <Input className="mt-2 h-12 text-base" value={answers.role} onChange={(e) => update({ role: e.target.value })} placeholder="e.g. Electrician Level 1" />
          </label>
        </div>) },
    { id: "employment" as const, title: "How are you employed?", tip: "Casuals usually get a loading instead of paid leave, so this changes the rates we compare.", ok: !!answers.employment,
      body: <div role="radiogroup" aria-label="Employment type" className="grid gap-3 sm:grid-cols-3">{EMPLOYMENT.map((e) => <Choice key={e} on={answers.employment === e} onClick={() => update({ employment: e })}>{e}</Choice>)}</div> },
    { id: "state" as const, title: "Which state do you work in?", tip: "Public holidays differ by state.", ok: !!answers.state,
      body: <div role="radiogroup" aria-label="State" className="grid grid-cols-4 gap-3">{STATES.map((s) => <Choice key={s} on={answers.state === s} onClick={() => update({ state: s })}>{s}</Choice>)}</div> },
    { id: "extras" as const, title: "Do you work any of the following?", tip: `We'll check for things like: ${ind.checks.join(", ")}.`, ok: true,
      body: (
        <fieldset className="space-y-2"><legend className="mb-2 text-sm text-ink-3">Select all that apply</legend>
          {ind.extras.map((x) => {
            const on = answers.extras.includes(x);
            return (
              <label key={x} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4", on ? "border-primary bg-primary-soft" : "border-border bg-card")}>
                <Checkbox checked={on} onCheckedChange={() => update({ extras: on ? answers.extras.filter((y) => y !== x) : [...answers.extras, x] })} />{x}
              </label>
            );
          })}
        </fieldset>) },
    { id: "pay" as const, title: "Your hours and pay", tip: "Use your latest payslip if you have it. A rough number is fine — you can change it later.", ok: Number(answers.hoursPerWeek) > 0 && Number(answers.hourlyRate) > 0,
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Hours per week<Input inputMode="decimal" className="tabular mt-2 h-12 text-base" value={answers.hoursPerWeek} onChange={(e) => update({ hoursPerWeek: e.target.value })} placeholder="38" /></label>
          <label className="text-sm font-bold">Hourly rate ($)<Input inputMode="decimal" className="tabular mt-2 h-12 text-base" value={answers.hourlyRate} onChange={(e) => update({ hourlyRate: e.target.value })} placeholder="32.50" /></label>
        </div>) },
    { id: "review" as const, title: "Check your answers", tip: "Tap any answer to change it.", ok: true,
      body: (
        <dl className="divide-y divide-border rounded-lg border border-border bg-card">
          {([["Industry", ind.label, "industry"], ["Checking", intent.title, "intent"], ["Role", answers.role, "role"], ["Employment", answers.employment, "employment"], ["State", answers.state, "state"], ["Extras", answers.extras.join(", ") || "None", "extras"], ["Hours & pay", `${answers.hoursPerWeek}h at $${answers.hourlyRate}`, "pay"]] as const).filter(([, , i]) => i === "industry" || i === "intent" || intent.questions.includes(i as QuestionId)).map(([k, v, i]) => (
            <div key={k as string} className="flex items-center justify-between gap-4 p-4">
              <div><dt className="text-xs text-ink-3">{k}</dt><dd className="font-semibold">{v}</dd></div>
              <Button variant="link" onClick={() => (i === "industry" ? navigate("/v2/industry") : i === "intent" ? update({ intent: null }) : goTo(i))}>Change</Button>
            </div>
          ))}
        </dl>) },
  ];
  const order: (QuestionId | "review")[] = ["role", "employment", "state", "extras", "pay", "review"];
  const asked = order.filter((q) => q === "review" || intent.questions.includes(q as QuestionId));
  const flow = steps.filter((x) => asked.includes(x.id));
  const s = flow[Math.min(step, flow.length - 1)];
  const last = s.id === "review";
  const goTo = (id: string) => setStep(Math.max(0, flow.findIndex((x) => x.id === id)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Stepper current={1} />
      <IndustryChip />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-border bg-card p-6 shadow-sheet md:p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-3">{intent.title} · Question {step + 1} of {flow.length}</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / flow.length) * 100}%` }} /></div>
          <h1 className="mt-6 text-2xl font-extrabold md:text-3xl">{s.title}</h1>
          <div className="mt-6">{s.body}</div>
          <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6 pb-[env(safe-area-inset-bottom)]">
            <Button variant="outline" className="h-12" onClick={() => (step ? setStep(step - 1) : update({ intent: null }))}><ArrowLeft /> {step ? "Back" : "Change check"}</Button>
            {last ? (
              <div className="ml-auto flex flex-wrap justify-end gap-3">
                {intent.live ? (
                  <Button asChild className="h-12"><Link to={intent.live.to}>{intent.live.label} <ArrowRight /></Link></Button>
                ) : (
                  <p role="status" className="rounded-md bg-gold-soft px-4 py-3 text-sm font-semibold text-gold-foreground">This check isn't connected in the preview yet — no result is shown.</p>
                )}
              </div>
            ) : (
              <Button className="ml-auto h-12 px-8" disabled={!s.ok} onClick={() => setStep(step + 1)}>Next <ArrowRight /></Button>
            )}
          </div>
        </section>
        <aside className="space-y-4">
          {ind.image && <img src={ind.image} alt="" width={896} height={752} className="hidden aspect-[4/3] w-full rounded-lg object-cover lg:block" />}
          <div className="rounded-lg border border-border bg-card p-5 shadow-soft" aria-live="polite">
            <div className="flex items-center gap-2 font-bold"><Lightbulb className="h-5 w-5 text-gold" /> Helper</div>
            <p className="mt-2 text-sm text-ink-2">{s.tip}</p>
            <p className="mt-3 text-xs text-ink-3">{ind.blurb}</p>
            <p className="mt-3 text-[11px] text-ink-3">Helper tips are pre-written guidance in this preview, not a live assistant.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
