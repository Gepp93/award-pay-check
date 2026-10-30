import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useV2 } from "./store";
import { liveCheckUrl, usePublicSite } from "./publicSite";
import { ArrowRight, Calculator, Clock, FileSearch, Lock, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";
import { INDUSTRIES, type IndustryId } from "./industries";
import PublicTierCards from "@/components/PublicTierCards";
import { cn } from "@/lib/utils";
import { EXAMPLES, exampleTotalCents, rowDiffCents } from "./examples";

const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

const faqs = [
  ["Is AwardPay connected to Fair Work?", "No. AwardPay is independent. We use published Fair Work Commission award rates, but we're not affiliated with or endorsed by the Fair Work Ombudsman or the Fair Work Commission."],
  ["Do I need an account?", "No. You can check your pay and see the headline result without signing up. An account lets you save reports."],
  ["What does payment buy?", "Payment buys an assessment and report. It is not a guarantee that you've been underpaid or that money will be recovered."],
  ["Is this legal advice?", "No. It's general information to help you understand your pay and what to ask next."],
];

export default function V2Home() {
  const { answers, update } = useV2();
  const navigate = useNavigate();
  const publicSite = usePublicSite();
  const allIndustries = publicSite ? "/check" : "/v2/industry";
  const pick = (id: typeof answers.industry) => {
    if (publicSite) { navigate(liveCheckUrl(id)); return; }
    update(answers.industry === id ? {} : { industry: id, role: "", extras: [] });
    navigate("/v2/check");
  };
  const [preview, setPreview] = useState<IndustryId | null>(null);
  const photoIndustries = INDUSTRIES.filter((i) => i.image);
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const onRailScroll = () => {
    const el = rail.current; const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    setActive(Math.min(photoIndustries.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + 12))));
  };
  const shown = photoIndustries.find((i) => i.id === (preview ?? answers.industry)) ?? photoIndustries[0];
  const ex = EXAMPLES[shown.id as keyof typeof EXAMPLES];
  const total = exampleTotalCents(ex);
  return (
    <main>
      {publicSite
        ? <SEO title="AwardPay — Check your pay against Australian award rates" description="Check your payslip against Australian award rates. Understand overtime, penalties and allowances — and what to do next." path="/" />
        : <SEO title="AwardPay 2.0 preview" description="Design preview of the new AwardPay pay checker." path="/v2"><meta name="robots" content="noindex" /></SEO>}
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[1.05fr_1fr] md:gap-12 md:px-8 md:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">Australian pay checker</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] md:text-6xl">Working hard.<br />Getting paid <span className="text-primary">right?</span></h1>
            <p className="mt-6 max-w-lg text-lg text-ink-2">Check your payslip against Australian award rates. Understand your overtime, penalties and allowances — and what to do next.</p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Published award rates</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> No account needed</li>
            </ul>
            <div className="mt-10">
              <p className="text-sm font-bold">Start with your industry</p>
              <div ref={rail} role="group" aria-label="Choose your industry" onMouseLeave={() => setPreview(null)} onScroll={onRailScroll}
                className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] motion-safe:scroll-smooth sm:mx-0 sm:grid sm:snap-none sm:grid-cols-4 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
                {photoIndustries.map((i, idx) => (
                  <button key={i.id} type="button" onClick={() => pick(i.id)}
                    aria-label={`${i.label} (industry ${idx + 1} of ${photoIndustries.length})`}
                    onPointerEnter={(e) => { if (e.pointerType === "mouse") setPreview(i.id); }}
                    onFocus={() => setPreview(i.id)} onBlur={() => setPreview(null)}
                    aria-pressed={answers.industry === i.id}
                    className={cn("group block w-[82%] shrink-0 snap-start overflow-hidden rounded-lg border bg-card text-left shadow-soft transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:rounded-md", answers.industry === i.id ? "border-2 border-primary" : "border-border")}>
                    <img src={i.image} alt="" loading="eager" width={896} height={752} className="aspect-[16/10] h-auto w-full object-cover" />
                    <span className="flex items-center justify-between gap-2 px-3 py-3 text-base font-bold sm:block sm:truncate sm:px-2 sm:py-1.5 sm:text-[13px]">{i.label}<ArrowRight className="h-4 w-4 text-primary sm:hidden" aria-hidden /></span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
                {photoIndustries.map((i, idx) => (
                  <button key={i.id} type="button" aria-label={`Show ${i.label}`} aria-current={active === idx}
                    onClick={() => (rail.current?.children[idx] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })}
                    className="grid h-6 w-6 place-items-center">
                    <span className={cn("block h-1.5 rounded-full transition-all", active === idx ? "w-4 bg-primary" : "w-1.5 bg-rule-strong")} />
                  </button>
                ))}
              </div>
              <Link to={allIndustries} className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">Something else? See all industries</Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative ml-auto aspect-[4/3] w-full overflow-hidden rounded-lg md:aspect-[4/5] md:w-[85%]">
              {photoIndustries.map((i) => (
                <img key={i.id} src={i.image} alt="" aria-hidden width={1024} height={1152}
                  className={cn("absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300", shown.id === i.id ? "opacity-100" : "opacity-0")} />
              ))}
            </div>
            <div className="relative mt-4 rounded-lg border border-border bg-card p-4 shadow-sheet md:absolute md:-left-8 md:bottom-4 md:mt-0 md:w-[270px] leading-snug" aria-live="polite">
              <div className="flex items-center justify-between text-xs"><span className="font-bold uppercase tracking-wide text-primary">Payslip check</span><span className="rounded-full bg-gold-soft px-2 py-0.5 font-bold">Example</span></div>
              <p className="mt-1 font-bold">{shown.label}</p>
              <p className="text-[11px] text-ink-3">{ex.scenario} · {ex.award}</p>
              <ul className="mt-2 min-h-[188px] divide-y divide-border text-[13px]">
                {ex.rows.map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-3 py-1.5">
                    <span><span className="block font-medium">{r.label}</span><span className="text-[11px] text-ink-3">{r.detail}</span></span>
                    {r.figures
                      ? <span className="tabular font-bold text-destructive">+{fmt(rowDiffCents(r))}</span>
                      : <span className="shrink-0 text-xs font-bold text-primary">We check</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-2 rounded-md bg-primary-soft p-2.5">
                <p className="text-[11px] font-bold uppercase text-primary">{total === null ? "Your result" : "Example difference"}</p>
                <p className="text-sm font-bold">{total === null ? "Compared line by line with the award" : fmt(total)}</p>
              </div>
              <p className="mt-2 text-[11px] text-ink-3">Illustrative example — not a real payslip or customer result.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Sourced stat band — FWO 2024–25 Annual Report figures, quoted as recoveries only */}
      <section className="bg-forest text-forest-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="tabular text-4xl font-extrabold text-gold">$358M <span className="text-2xl text-forest-foreground">— Recovered in 2024–25</span></p>
              <p className="mt-1 opacity-90">by the Fair Work Ombudsman for more than 249,000 workers in the 2024–25 financial year.</p>
            </div>
            <div>
              <p className="tabular text-4xl font-extrabold text-gold">$2B+ <span className="text-2xl text-forest-foreground">— Recovered over five years, July 2020–June 2025</span></p>
              <p className="mt-1 opacity-90">by the Fair Work Ombudsman across the five financial years ending June 2025.</p>
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
          <Link to={allIndustries} className="mt-6 flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-soft hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:max-w-xl">
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
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-extrabold">Simple pricing</h2>
          <p className="mt-2 text-center text-ink-2">Your headline result is shown before you pay anything.</p>
          <div className="mt-6"><PublicTierCards compact /></div>
          <p className="mt-4 text-center text-sm"><Link to="/pricing" className="font-semibold text-primary underline underline-offset-4">Compare what each option includes</Link></p>
          <p className="mt-3 text-center text-xs text-ink-3">A report is an assessment, not a guarantee you've been underpaid or that money will be recovered.</p>
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
