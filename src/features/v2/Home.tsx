import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Clock, FileSearch, Lock, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";
import { INDUSTRIES } from "./industries";
import { THREE_MONTH_PASS } from "@/lib/plans";
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
  return (
    <main>
      <SEO title="AwardPay 2.0 preview" description="Design preview of the new AwardPay pay checker." path="/v2"><meta name="robots" content="noindex" /></SEO>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.05fr_1fr] md:px-8 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">Australian pay checker</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] md:text-6xl">Working hard.<br />Getting paid <span className="text-primary">right?</span></h1>
            <p className="mt-5 max-w-lg text-lg text-ink-2">Check your payslip against Australian award rates. Understand your overtime, penalties and allowances — and what to do next.</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Published award rates</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> No account needed</li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg" className="h-14 px-7 text-base"><Link to="/v2/industry">Check my pay <ArrowRight className="h-5 w-5" /></Link></Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-7 text-base"><Link to="/how-it-works">See how it works</Link></Button>
            </div>
          </div>
          <div className="relative">
            <img src={hero} alt="" width={1024} height={1152} className="ml-auto aspect-[4/5] w-4/5 rounded-lg object-cover md:w-3/4" />
            <div className="absolute bottom-6 left-0 w-[78%] max-w-sm rounded-lg border border-border bg-card p-5 shadow-sheet">
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

      {/* Sourced stat band */}
      <section className="bg-forest text-forest-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:px-8">
          <div>
            <p className="tabular text-4xl font-extrabold text-gold">$358 million</p>
            <p className="mt-1 opacity-90">recovered by the Fair Work Ombudsman for more than 249,000 underpaid workers in 2024–25.</p>
            <a className="mt-2 inline-block text-xs underline opacity-70" href="https://www.fairwork.gov.au/newsroom/media-releases/2025-media-releases/october-2025/20251029-annual-report-2024-25-media-release" target="_blank" rel="noreferrer">Source: Fair Work Ombudsman, Oct 2025</a>
          </div>
          <div>
            <p className="tabular text-4xl font-extrabold text-gold">$2 billion+</p>
            <p className="mt-1 opacity-90">back-paid to workers across the last five years.</p>
            <a className="mt-2 inline-block text-xs underline opacity-70" href="https://www.fairwork.gov.au/newsroom/media-releases/2025-media-releases/october-2025/20251029-annual-report-2024-25-media-release" target="_blank" rel="noreferrer">Source: Fair Work Ombudsman, Oct 2025</a>
          </div>
        </div>
      </section>

      {/* Explanation */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="text-center text-3xl font-extrabold md:text-4xl">How AwardPay works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[[Search, "Choose your industry", "We tailor the questions to the kind of work you do."], [Clock, "Tell us your hours & pay", "Answer a few quick questions or upload your payslip."], [FileSearch, "See what we found", "Compare your pay with award rates, line by line."]].map(([Icon, t, d]: any) => (
            <div key={t} className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industry preview */}
      <section className="bg-surface-sunk py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-3xl font-extrabold">What industry do you work in?</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {INDUSTRIES.filter((i) => i.image).slice(0, 8).map((i) => (
              <Link key={i.id} to={`/v2/industry?pick=${i.id}`} className="group overflow-hidden rounded-lg border border-border bg-card shadow-soft focus-visible:ring-2 focus-visible:ring-ring">
                <img src={i.image} alt="" loading="lazy" width={896} height={752} className="aspect-[4/3] w-full object-cover" />
                <span className="flex items-center justify-between p-3 font-bold">{i.label}<ArrowRight className="h-4 w-4 text-primary" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Calculators */}
      <section id="calculators" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-8">
        <h2 className="text-3xl font-extrabold">Calculator tools</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[["Shift pay calculator", "/calculator"], ["Weekly pay check", "/weekly-pay-check"], ["Award finder", "/award-finder"]].map(([t, to]) => (
            <Link key={to} to={to} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 font-bold shadow-soft hover:border-primary">
              <Calculator className="h-6 w-6 text-primary" />{t}<ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <div className="rounded-lg bg-primary-soft p-8">
          <h2 className="text-2xl font-extrabold">Trust and privacy</h2>
          <ul className="mt-4 grid gap-3 text-ink-2 md:grid-cols-3">
            <li>Calculated from published Fair Work Commission award rates.</li>
            <li>Headline results are shown without an account or email.</li>
            <li>Independent — not affiliated with Fair Work.</li>
          </ul>
        </div>
      </section>

      {/* Pay Pulse */}
      <section id="pay-pulse" className="bg-surface-sunk py-16 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-3xl font-extrabold">Pay Pulse</h2>
          <p className="mt-2 text-ink-2">Plain-English guides to Australian pay. Articles coming soon.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {["How Saturday penalty rates work", "Casual loading explained", "What to do if you're underpaid"].map((t) => (
              <article key={t} className="rounded-lg border border-border bg-card p-6">
                <span className="text-xs font-bold uppercase text-ink-3">Coming soon</span>
                <h3 className="mt-2 text-lg font-bold">{t}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8">
        <h2 className="text-3xl font-extrabold">Transparent pricing</h2>
        <p className="mt-3 text-ink-2">See your headline result first. Unlock the full report with the {THREE_MONTH_PASS.name} — {THREE_MONTH_PASS.priceLabel} one payment, no subscription.</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/pricing">See pricing</Link></Button>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-8">
        <h2 className="text-3xl font-extrabold">Questions</h2>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left font-bold">{q}</AccordionTrigger><AccordionContent className="text-ink-2">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
