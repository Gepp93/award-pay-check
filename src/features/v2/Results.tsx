import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, HelpCircle, Mail, TrendingUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IndustryChip, Stepper } from "./Layout";
import { useV2 } from "./store";
import { industryById } from "./industries";

type Kind = "under" | "ok" | "more" | "unsupported" | "error";
const STATES: { id: Kind; label: string }[] = [
  { id: "under", label: "Potential underpayment" }, { id: "ok", label: "No discrepancy" },
  { id: "more", label: "More info needed" }, { id: "unsupported", label: "Unsupported" }, { id: "error", label: "Processing error" },
];

const EXAMPLE = [
  ["Saturday penalty (+50%)", "+$130.00"], ["Tool allowance", "+$25.00"], ["RDO accrual", "+$65.00"],
];

export default function Results() {
  const [kind, setKind] = useState<Kind>("under");
  const { answers } = useV2();
  const ind = industryById(answers.industry);

  const head = {
    under: { icon: AlertTriangle, tone: "bg-clay-soft text-destructive", t: "Potential underpayment" },
    ok: { icon: CheckCircle2, tone: "bg-primary-soft text-primary", t: "No discrepancy found in the checks we support" },
    more: { icon: HelpCircle, tone: "bg-gold-soft text-gold-foreground", t: "We need a bit more information" },
    unsupported: { icon: XCircle, tone: "bg-muted text-ink-2", t: "We can't calculate this yet" },
    error: { icon: XCircle, tone: "bg-clay-soft text-destructive", t: "Something went wrong" },
  }[kind];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Stepper current={2} />
      <IndustryChip />
      <div className="rounded-lg border-2 border-dashed border-gold bg-gold-soft p-4 text-sm">
        <p className="font-bold">Design preview — example data only</p>
        <p className="mt-1 text-ink-2">These results are not calculated from your answers. For a real check against official award rates, use the live checker.</p>
        <Button asChild size="sm" className="mt-3"><Link to="/check">Run my real check <ArrowRight /></Link></Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Preview result state">
        {STATES.map((s) => (
          <button key={s.id} role="tab" aria-selected={kind === s.id} onClick={() => setKind(s.id)}
            className={cn("rounded-full border px-4 py-2 text-sm font-semibold", kind === s.id ? "border-forest bg-forest text-forest-foreground" : "border-border bg-card")}>{s.label}</button>
        ))}
      </div>

      <h1 className="mt-8 text-3xl font-extrabold">Your result</h1>
      <p className="mt-1 text-ink-2">Example pay period: Mon 1 Jun – Sun 14 Jun 2026</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={cn("rounded-lg p-6", head.tone)}>
          <p className="flex items-center gap-2 font-bold"><head.icon className="h-5 w-5" /> {head.t}</p>
          {kind === "under" && <><p className="tabular mt-3 text-5xl font-extrabold text-foreground">$220.00</p><p className="text-sm text-ink-2">for this pay period (example)</p></>}
          {kind === "ok" && <p className="mt-3 text-sm text-ink-2">Your base rate, penalties and allowances matched the award for the items we check. Things we can't check are listed below.</p>}
          {kind === "more" && <p className="mt-3 text-sm text-ink-2">Your hours or classification weren't clear. Answer two more questions to finish the check.</p>}
          {kind === "unsupported" && <p className="mt-3 text-sm text-ink-2">Your award or arrangement (e.g. an enterprise agreement) isn't supported yet. Contact the Fair Work Ombudsman for help.</p>}
          {kind === "error" && <p className="mt-3 text-sm text-ink-2">We couldn't finish the calculation. Your answers are saved — please try again.</p>}
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-soft">
          <h2 className="font-bold">Breakdown</h2>
          {kind === "under" ? (
            <ul className="mt-3 divide-y divide-border text-sm">
              {EXAMPLE.map(([l, v]) => <li key={l} className="flex justify-between py-3"><span>{l}</span><span className="tabular font-bold text-destructive">{v}</span></li>)}
              <li className="flex justify-between py-3 font-bold"><span>Total potential underpayment</span><span className="tabular text-destructive">$220.00</span></li>
            </ul>
          ) : <p className="mt-3 text-sm text-ink-3">No itemised findings for this state.</p>}
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-bold">Award and classification</h2>
          <p className="mt-2 text-sm text-ink-2">Example: Electrical, Electronic and Communications Contracting Award 2020 · {answers.role || "Electrician Level 1"} · {answers.employment || "Full-time"}{ind ? ` · ${ind.label}` : ""}</p>
          <h3 className="mt-4 text-sm font-bold">Sources</h3>
          <a className="text-sm text-primary underline" href="https://www.fairwork.gov.au/pay-and-wages/minimum-wages/pay-guides" target="_blank" rel="noreferrer">Fair Work Ombudsman pay guides</a>
          <h3 className="mt-4 text-sm font-bold">Assumptions and limitations</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">
            <li>Based only on the information provided.</li>
            <li>Doesn't cover enterprise agreements or superannuation.</li>
            <li>Verification status: estimate — not checked by a person.</li>
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-bold">Next steps</h2>
          <ul className="mt-3 space-y-4 text-sm">
            <li className="flex gap-3"><FileText className="h-5 w-5 text-primary" /><span><b>Get the full report</b><br />Itemised breakdown with award clauses.</span></li>
            <li className="flex gap-3"><Mail className="h-5 w-5 text-primary" /><span><b>Talk to your employer</b><br />Use a template letter (optional).</span></li>
            <li className="flex gap-3"><TrendingUp className="h-5 w-5 text-primary" /><span><b>Track your pay</b><br />Keep your evidence organised.</span></li>
          </ul>
          <Button asChild variant="gold" className="mt-6 w-full"><Link to="/v2/pricing-preview">See report options</Link></Button>
        </section>
      </div>
    </main>
  );
}
