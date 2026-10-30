import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper, IndustryChip } from "./Layout";
import { useV2 } from "./store";
import { buildRequest } from "./engine/model";
import { runEngine } from "./engine/api";
import type { AssessmentResult } from "../../../supabase/functions/_shared/engine-v2/engine";
import { reportSellable } from "../../../supabase/functions/_shared/engine-v2/eligibility";
import { tierCall, billingError } from "./tierApi";

const $ = (c: number | null | undefined) => (c == null ? "—" : `${c < 0 ? "−" : ""}$${(Math.abs(c) / 100).toFixed(2)}`);
const KIND: Record<string, string> = { ordinary: "Ordinary hours", evening: "Evening / night", saturday: "Saturday", sunday: "Sunday", public_holiday: "Public holiday", overtime: "Overtime" };
const STEP_FOR: Record<string, string> = { Break: "shifts", Overtime: "shifts", "Pay comparison": "pay", "Minimum engagement": "shifts", Shift: "shifts" };

export default function Results() {
  const { answers, update } = useV2();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const r = answers.result as AssessmentResult | null;

  if (!r) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <Stepper current={2} />
        <h1 className="text-3xl font-extrabold">No result yet</h1>
        <p className="mt-2 text-ink-2">Answer the questions to run a check.</p>
        <Button asChild className="mt-6"><Link to="/v2/questions">Answer questions</Link></Button>
      </main>
    );
  }

  const holidayQs = r.notAssessed.filter(n => n.item === "Public holiday" && n.question && /\d{4}-\d{2}-\d{2}/.test(n.question));
  const answerHoliday = async (date: string, yes: boolean) => {
    const engine = { ...answers.engine, holidayAnswers: { ...answers.engine.holidayAnswers, [date]: yes } };
    setBusy(true);
    const res = await runEngine(buildRequest(engine));
    setBusy(false);
    if (res.ok) update({ engine, result: res.result });
  };

  const head = {
    complete: { icon: r.underpaymentCents ? AlertTriangle : CheckCircle2, tone: r.underpaymentCents ? "bg-clay-soft text-destructive" : "bg-primary-soft text-primary", t: r.underpaymentCents ? "Potential underpayment found" : "No shortfall identified in what we checked" },
    partial: { icon: HelpCircle, tone: "bg-gold-soft text-gold-foreground", t: "Partial check — not your full entitlement" },
    unsupported: { icon: XCircle, tone: "bg-muted text-ink-2", t: "We can't reliably assess this" },
  }[r.status];
  const Icon = head.icon;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Stepper current={2} />
      <IndustryChip />
      <p className="mb-6 rounded-md bg-gold-soft px-3 py-2 text-xs font-bold">Internal Engine v2 test — calculated by engine {r.engineVersion}. Paid reports remain restricted to authorised testers.</p>

      <section className={`rounded-lg p-6 ${head.tone}`} data-status={r.status}>
        <p className="flex items-center gap-2 text-xl font-extrabold"><Icon className="h-6 w-6" /> {head.t}</p>
        {r.status === "complete" && r.underpaymentCents != null && (
          <p className="mt-3 text-4xl font-extrabold" data-testid="underpayment">{$(r.underpaymentCents)}</p>
        )}
        {r.reasons.map((x, k) => <p key={k} className="mt-2 text-sm text-foreground">{x}</p>)}
      </section>

      {r.status !== "unsupported" && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-extrabold">{r.rulePack?.name} ({r.rulePack?.awardCode})</h2>
          <p className="text-sm text-ink-2">{r.classification} · base rate {$(r.rate?.hourlyCents)}/h from {r.rate?.operativeFrom} · {r.rate?.rule}</p>
          <table className="mt-4 w-full text-sm">
            <thead><tr className="text-left text-ink-3"><th className="py-1">Date</th><th>What</th><th>Working</th><th className="text-right">Award minimum</th></tr></thead>
            <tbody>
              {r.lines.map((l, k) => (
                <tr key={k} className="border-t border-rule align-top">
                  <td className="py-2 pr-2">{l.date}</td><td className="pr-2">{l.category}</td>
                  <td className="pr-2 text-ink-2">{l.explanation}<br /><span className="text-xs text-ink-3">{l.sources.map(s => `${s.description}${s.clause ? ` (${s.clause})` : ""}`).join("; ")}</span></td>
                  <td className="text-right font-semibold">{$(l.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-right text-sm">{r.status === "complete" ? "Assessed award minimum" : "Assessed items only (not a total entitlement)"}: <strong>{$(r.assessedEntitlementCents)}</strong></p>

          {r.paid.components && (
            <div className="mt-4 border-t border-rule pt-4 text-sm" data-testid="components">
              <h3 className="font-extrabold">By pay category</h3>
              <ul className="mt-2 space-y-2 sm:hidden">
                {r.paid.components.map(c => (
                  <li key={c.kind} className="rounded-md border border-rule p-3">
                    <p className="font-bold">{KIND[c.kind]}{c.basis === "loading" ? " (extra loading only)" : ""}</p>
                    <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                      <dt className="text-ink-3">Actual paid</dt><dd className="text-right">{$(c.paidCents)}</dd>
                      <dt className="text-ink-3">Award minimum</dt><dd className="text-right">{$(c.entitledCents)}</dd>
                      <dt className="text-ink-3">Shortfall</dt><dd className="text-right font-semibold">{c.differenceCents > 0 ? $(c.differenceCents) : "—"}</dd>
                      <dt className="text-ink-3">Overpayment</dt><dd className="text-right">{c.differenceCents < 0 ? $(-c.differenceCents) : "—"}</dd>
                    </dl>
                  </li>))}
              </ul>
              <div className="hidden sm:block">
                <table className="mt-2 w-full">
                  <thead><tr className="text-left text-ink-3"><th>Category</th><th className="text-right">Actual paid</th><th className="text-right">Award minimum</th><th className="text-right">Shortfall</th><th className="text-right">Overpayment</th></tr></thead>
                  <tbody>{r.paid.components.map(c => (
                    <tr key={c.kind} className="border-t border-rule"><td className="py-1">{KIND[c.kind]}{c.basis === "loading" ? " (extra loading only)" : ""}</td>
                      <td className="text-right">{$(c.paidCents)}</td><td className="text-right">{$(c.entitledCents)}</td>
                      <td className="text-right font-semibold">{c.differenceCents > 0 ? $(c.differenceCents) : "—"}</td>
                      <td className="text-right">{c.differenceCents < 0 ? $(-c.differenceCents) : "—"}</td></tr>))}</tbody>
                </table>
              </div>
              {r.status === "complete" && r.paid.comparison === "complete" && r.differenceCents != null
                ? <p className="mt-3">Comparable wages paid: <strong>{$(r.paid.comparableCents)}</strong> · Net comparable difference: <strong data-testid="net">{$(r.differenceCents)}</strong></p>
                : <p className="mt-3 font-semibold">Category differences are shown, but these may offset each other and not everything could be checked, so no total underpayment is stated.</p>}
              {r.paid.components.some(c => c.differenceCents > 0) && r.paid.components.some(c => c.differenceCents < 0) && <p className="mt-2 text-ink-2">A shortfall in one category isn't necessarily money owed: an overpayment in another category may offset it, depending on your employment arrangement.</p>}
              <p className="mt-2 text-ink-2">{r.paid.note}</p>
            </div>
          )}
          {r.paid.indicativeDifferenceCents != null && <p className="mt-3 text-sm text-ink-2">Indicative only — not an underpayment: {$(r.paid.indicativeDifferenceCents)}. {r.paid.note}</p>}
        </section>
      )}

      {holidayQs.length > 0 && (
        <section className="mt-6 rounded-lg border border-gold bg-card p-6">
          {holidayQs.map((n, k) => { const date = n.question?.match(/\d{4}-\d{2}-\d{2}/)?.[0]; if (!date) return null; return (
            <div key={k} className="mb-3"><p className="font-bold">{n.question}</p><p className="text-sm text-ink-2">{n.reason}</p>
              <div className="mt-2 flex gap-3"><Button size="sm" disabled={busy} onClick={() => answerHoliday(date, true)}>Yes</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => answerHoliday(date, false)}>No</Button>{busy && <Loader2 className="animate-spin" />}</div>
            </div>); })}
        </section>
      )}

      {r.notAssessed.length > 0 && (
        <section className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-extrabold">Not assessed or needs more information</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {r.notAssessed.filter(n => n.item !== "Public holiday" || !holidayQs.includes(n)).map((n, k) => (
              <li key={k}><strong>{n.item}:</strong> {n.reason}{n.question && <> <span className="text-ink-2">{n.question}</span></>}
                {STEP_FOR[n.item] && <> <Link className="font-semibold text-primary underline" to={`/v2/questions#${STEP_FOR[n.item]}`}>Add this</Link></>}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 text-sm text-ink-2">
        {r.notes.map((x, k) => <p key={k} className="mt-1">{x}</p>)}
        <p className="mt-3 font-bold text-foreground">Not included</p>
        <ul className="list-disc pl-5">{r.exclusions.map((x, k) => <li key={k}>{x}</li>)}</ul>
        <p className="mt-3">AwardPay is independent of the Fair Work Ombudsman. Results depend on award coverage and the information you gave.</p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate("/v2/questions")}><ArrowLeft /> {r.status === "unsupported" ? "Change award or classification" : "Change my answers"}</Button>
        {reportSellable(r) && <Button disabled={busy} onClick={async () => { setBusy(true); setSaveError(""); try { const data = await tierCall({ action: "save", request: buildRequest(answers.engine) }); navigate(`/v2/report/${data.reportId}`); } catch (e) { setSaveError(billingError(e)); } finally { setBusy(false); } }}>{busy ? <Loader2 className="animate-spin" /> : "Save assessment and view report options"}</Button>}
      </div>
      {!reportSellable(r) && <p className="mt-4 text-sm text-ink-2">This calculation is incomplete or unsupported. No paid underpayment report is available.</p>}
      {saveError && <p role="alert" className="mt-4 text-destructive">{saveError}</p>}
    </main>
  );
}
