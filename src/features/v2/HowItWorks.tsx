import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useV2 } from "./store";
import { usePublicSite } from "./publicSite";
import SEO from "@/components/SEO";

const Line = ({ w }: { w: string }) => <span className={`block h-2 rounded-full bg-rule ${w}`} />;

const IllWork = () => (
  <div className="relative h-full rounded-xl bg-primary-soft/60 p-4">
    <div className="rounded-lg bg-card p-3 shadow-soft">
      <p className="text-xs font-bold">Payslip</p>
      <div className="mt-2 space-y-1.5"><Line w="w-full" /><Line w="w-4/5" /><Line w="w-3/5" /><Line w="w-4/5" /></div>
    </div>
    <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"><Upload className="h-5 w-5" /></span>
  </div>
);
const IllAward = () => (
  <div className="h-full rounded-xl bg-primary-soft/60 p-4">
    <div className="rounded-lg bg-card p-3 shadow-soft">
      <p className="text-xs font-bold">Your award</p>
      <ul className="mt-2 space-y-1.5 text-xs">
        {["Industry", "Award", "Classification", "Employment type"].map((x) => (
          <li key={x} className="flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" strokeWidth={3} /></span>{x}</li>
        ))}
      </ul>
    </div>
  </div>
);
const IllResult = () => (
  <div className="h-full rounded-xl bg-primary-soft/60 p-4">
    <div className="rounded-lg bg-card p-3 shadow-soft">
      <p className="text-xs font-bold">Pay comparison</p>
      <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1.5 text-[10px] text-ink-3">
        <span>Item</span><span>Paid</span><span>Award</span>
        {[0, 1, 2].map((i) => (<Fragment key={i}><Line w="w-full" /><Line w="w-6" /><Line w="w-6" /></Fragment>))}
      </div>
    </div>
  </div>
);

const STEPS = [
  { n: 1, t: "Tell us about your work", d: "Choose your industry and answer a few questions about your job, hours and pay. You can also upload a payslip where supported.", ill: IllWork },
  { n: 2, t: "We check the applicable award", d: "Confirm your award and classification so AwardPay can compare your information against the relevant published rates.", ill: IllAward },
  { n: 3, t: "Understand your results", d: "See a clear comparison of your pay, applicable rates and any potential differences we identify.", ill: IllResult },
];

export default function HowItWorks() {
  const { answers } = useV2();
  const publicSite = usePublicSite();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      {publicSite && <SEO title="How AwardPay works — check your pay in three steps" description="Share your pay details, confirm your award and classification, and compare your pay against published Australian award rates." path="/how-it-works" />}
      <p className="text-sm font-bold uppercase tracking-wider text-primary">How it works</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">How AwardPay checks your pay</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">Compare your pay against Australian award rates, penalties and allowances — with a clear breakdown of what we find.</p>

      <ol className="mt-10 space-y-4">
        {STEPS.map(({ n, t, d, ill: Ill }) => (
          <li key={n} className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-sheet sm:grid-cols-[auto_1fr_200px] sm:items-center md:p-6">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-lg font-extrabold text-primary" aria-hidden>{n}</span>
            <div><h2 className="text-xl font-bold"><span className="sr-only">Step {n}: </span>{t}</h2><p className="mt-2 text-ink-2">{d}</p></div>
            <div aria-hidden className="h-36"><Ill /></div>
          </li>
        ))}
      </ol>

      <section className="mt-8 flex gap-4 rounded-2xl bg-primary-soft p-6">
        <ShieldCheck className="h-8 w-8 shrink-0 text-primary" aria-hidden />
        <div>
          <h2 className="font-bold">Based on published Australian award rates</h2>
          <p className="mt-2 text-sm text-ink-2">Results depend on the correct award, classification, dates, hours and employment conditions — so check your details carefully. AwardPay is independent and is not affiliated with or endorsed by the Fair Work Ombudsman or the Fair Work Commission. General information only, not legal advice.</p>
        </div>
      </section>

      <div className="mt-8 text-center">
        <Button asChild variant="gold" size="lg" className="h-14 px-8 text-base">
          <Link to={publicSite ? "/check" : answers.industry ? "/v2/check" : "/v2/industry"}>Check my pay <ArrowRight className="h-5 w-5" /></Link>
        </Button>
      </div>
    </main>
  );
}
