import { Link, useNavigate } from "react-router-dom";
import { useV2 } from "./store";
import { ArrowRight, Calculator, Clock, FileSearch, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";
import { INDUSTRIES } from "./industries";
import { THREE_MONTH_PASS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import hero from "@/assets/workers/construction.jpg";

const example = [
  { l: "Ordinary hours", s: "38h at $32.50", v: "Correct", ok: true },
  { l: "Saturday penalty (+50%)", s: "8h, should be $48.75/h", v: "+$130.00" },
  { l: "Tool allowance", s: "Construction award", v: "+$25.00" },
  { l: "RDO accrual", s: "2h per week", v: "+$65.00" },
];

const faqs = [
  ["Is AwardPay connected to Fair Work?", "No. AwardPay is independent. We use published Fair Work Commission award rates, but we're not affiliated with or endorsed by the Fair Work Ombudsman or the Fair Work Commission."],
  ["Do I need an account?", "No. You can check your pay and see the headline result without signing up. An account lets you save reports."],
  ["What does payment buy?", "Payment buys an assessment and report. It is not a guarantee that you've been underpaid or that money will be recovered."],
  ["Is this legal advice?", "No. It's general information to help you understand your pay and what to ask next."],
];

export default function V2Home() {
  const { answers, update } = useV2();
  const navigate = useNavigate();
  const pick = (id: typeof answers.industry) => {
    update(answers.industry === id ? {} : { industry: id, role: "", extras: [] });
    navigate("/v2/check");
  };
  return (
    <main>
      <SEO title="AwardPay 2.0 preview" description="Design preview of the new AwardPay pay checker." path="/v2"><meta name="robots" content="noindex" /></SEO>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[1.05fr_1fr] md:px-8 md:py-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">Australian pay checker</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] md:text-6xl">Working hard.<br />Getting paid <span className="text-primary">right?</span></h1>
            <p className="mt-5 max-w-lg text-lg text-ink-2">Check your payslip against Australian award rates. Understand your overtime, penalties and allowances — and what to do next.</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Published award rates</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> No account needed</li>
            </ul>
            <div className="mt-7">
              <p className="text-sm font-bold">Start with your industry</p>
              <div role="group" aria-label="Choose your industry" className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
                {INDUSTRIES.filter((i) => i.image).map((i) => (
                  <button key={i.id} type="button" onClick={() => pick(i.id)}
                    className={cn("group overflow-hidden rounded-md border bg-card text-left shadow-soft transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", answers.industry === i.id ? "border-2 border-primary" : "border-border")}>
                    <img src={i.image} alt="" loading="eager" width={896} height={752} className="aspect-[4/3] w-full object-cover" />
                    <span className="block truncate px-2 py-1.5 text-xs font-bold sm:text-sm">{i.label}</span>
                  </button>
                ))}
              </div>
              <Link to="/v2/industry" className="mt-2 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">Something else? See all industries</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg" className="h-14 px-7 text-base"><Link to={answers.industry ? "/v2/check" : "/v2/industry"}>Check my pay <ArrowRight className="h-5 w-5" /></Link></Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-7 text-base"><Link to="/how-it-works">See how it works</Link></Button>
            </div>
          </div>
          <div className="relative">
            <img src={hero} alt="" width={1024} height={1152} className="ml-auto aspect-[4/5] w-[85%] rounded-lg object-cover" />
            <div className="absolute bottom-6 left-0 w-[70%] max-w-[300px] md:-left-6 rounded-lg border border-border bg-card p-5 shadow-sheet">
              <div className="flex items-center justify-between text-xs"><span className="font-bold uppercase tracking-wide text-primary">Payslip check</span><span className="rounded-full bg-gold-soft px-2 py-0.5 font-bold">Example</span></div>
              <p className="mt-1 font-bold">Construction</p>
              <ul className="mt-3 divide-y divide-border text-sm">
                {example.map((r) => (
                  <li key={r.l} className="flex items-center justify-between gap-3 py-2">
                    <span><span className="block font-medium">{r.l}</span><span className="text-xs text-ink-3">{r.s}</span></span>
                    <span className={r.ok ? "text-xs font-bold text-primary" : "tabular font-bold text-destructive"}>{r.v}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-md bg-primary-soft p-3">
                <p className="text-xs font-bold uppercase text-primary">Potential underpayment</p>
                <p className="tabular text-3xl font-extrabold">$220.00</p>
              </div>
              <p className="mt-2 text-[11px] text-ink-3">Example for illustration only — not a real payslip.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sourced stat band — FWO 2024–25 Annual Report figures, quoted as recoveries only */}
      <section className="bg-forest text-forest-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="tabular text-4xl font-extrabold text-gold">$358 million</p>
              <p className="mt-1 opacity-90">recovered by the Fair Work Ombudsman for more than 249,000 underpaid workers in 2024–25.</p>
            </div>
            <div>
              <p className="tabular text-4xl font-extrabold text-gold">More than $2 billion</p>
              <p className="mt-1 opacity-90">back-paid to workers through the Fair Work Ombudsman across the five years to 2024–25.</p>
            </div>
          </div>
          <p className="mt-6 text-xs opacity-75">These figures are money the Fair Work Ombudsman recovered — not the total currently owed to Australian workers. Sources:{" "}
            <a className="underline" href="https://www.fairwork.gov.au/newsroom/media-releases/2025-media-releases/october-2025/20251029-annual-report-2024-25-media-release" target="_blank" rel="noreferrer">FWO media release, 29 Oct 2025</a>{" · "}
            <a className="underline" href="https://www.fairwork.gov.au/sites/default/files/2025-10/office-of-the-fair-work-ombudsman-2024-25-annual-report.pdf" target="_blank" rel="noreferrer">FWO Annual Report 2024–25 (PDF)</a></p>
        </div>
      </section>

      {/* Explanation */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-center text-3xl font-extrabold md:text-4xl">How AwardPay works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[[FileSearch, "Choose your industry", "We tailor the questions to the kind of work you do."], [Clock, "Tell us your hours & pay", "Answer a few quick questions or upload your payslip."], [FileSearch, "See what we found", "Compare your pay with award rates, line by line."]].map(([Icon, t, d]: any) => (
            <div key={t} className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools — only what works today */}
      <section id="calculators" className="scroll-mt-20 bg-surface-sunk py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-3xl font-extrabold">Check tools</h2>
          <p className="mt-2 text-ink-2">One checker covers your hours, penalties and allowances. More focused tools will be listed here once they're working.</p>
          <Link to="/check" className="mt-6 flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-soft hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:max-w-xl">
            <Calculator className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <span className="flex-1"><span className="block font-bold">Payslip check</span>
              <span className="mt-1 block text-sm text-ink-2">Answer a few questions about your award, hours and pay (or upload a payslip) and we compare what you were paid with the award minimum for each shift.</span></span>
            <ArrowRight className="mt-1 h-4 w-4 text-primary" />
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-2xl font-extrabold">What to know before you check</h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {[[ShieldCheck, "Independent", "AwardPay isn't part of, affiliated with or endorsed by the Fair Work Ombudsman or Fair Work Commission."],
            [Calculator, "Based on published award rates", "Results are only as accurate as the award you're covered by and the hours and pay you enter."],
            [Lock, "No account to see your result", "Your headline result appears without signing up. It's general information, not legal advice."]].map(([Icon, t, d]: any) => (
            <li key={t} className="rounded-lg border border-border bg-card p-5">
              <Icon className="h-6 w-6 text-primary" /><p className="mt-3 font-bold">{t}</p><p className="mt-1 text-sm text-ink-2">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Pricing */}
      <section className="bg-surface-sunk py-12">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-extrabold">Simple pricing</h2>
          <p className="mt-2 text-center text-ink-2">Your headline result is shown before you pay anything.</p>
          <div className="mt-6 rounded-lg border-2 border-primary bg-card p-6 shadow-sheet">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xl font-extrabold">{THREE_MONTH_PASS.name}</p>
              <p><span className="tabular text-3xl font-extrabold">{THREE_MONTH_PASS.priceLabel}</span> <span className="text-sm text-ink-3">AUD, one payment</span></p>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {[`Full itemised report for every check you run in the next ${THREE_MONTH_PASS.durationDays} days`, "Line-by-line comparison of your pay with award rates, penalties and the allowances we support", "Downloadable PDF of each report", "Reports saved to your account when you sign in"].map((x) => (
                <li key={x} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{x}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-3">No subscription — it doesn't renew. A report is an assessment, not a guarantee you've been underpaid or that money will be recovered.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h2 className="text-3xl font-extrabold">Questions</h2>
        <Accordion type="single" collapsible className="mt-4">
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left font-bold">{q}</AccordionTrigger><AccordionContent className="text-ink-2">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
