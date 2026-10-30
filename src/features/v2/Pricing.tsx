import { ArrowRight, Check, Clock, FileText, Info, Loader2, Lock } from "lucide-react";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import PublicTierCards from "@/components/PublicTierCards";
import SEO from "@/components/SEO";
import { usePublicSite } from "./publicSite";
import TierOffers from "./TierOffers";


export default function Pricing() {
  const publicSite = usePublicSite();
  useEffect(() => { if (publicSite) track("pricing_viewed"); }, [publicSite]);
  if (!publicSite) return <main className="mx-auto max-w-6xl px-4 py-10 md:px-8"><p className="text-sm font-bold uppercase text-primary">Pricing preview</p><h1 className="mt-3 text-4xl font-extrabold">Choose your pay check</h1><p className="mb-8 mt-4 text-lg text-ink-2">Supported assessments. Clear reports. No promise of recovery.</p><TierOffers /></main>;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <SEO title="AwardPay pricing — Pay Check, Underpayment Report, Pay Protection" description="Pay Check $9, Underpayment Report $29 or Pay Protection $59 a year. See your headline result before choosing." path="/pricing" />
      <p className="text-sm font-bold uppercase tracking-wider text-primary">Pricing</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Choose the detail you need.</h1>
      <p className="mt-4 mb-10 text-lg text-ink-2">Check your payslip and see your headline result first. Then choose a report for that payslip, or protect every payslip for a year.</p>
      <PublicTierCards />

      <ul className="mt-8 grid gap-6 text-center sm:grid-cols-3">
        {[
          { icon: FileText, t: "Clear reports", d: "Understand the differences between your pay and the rates used." },
          { icon: Clock, t: "Saved to your account", d: "Reports you buy stay in My Reports." },
          { icon: Lock, t: "Secure payment", d: "Payments are handled by Stripe, our payment provider." },
        ].map(({ icon: I, t, d }) => (
          <li key={t}><I className="mx-auto h-8 w-8 text-primary" aria-hidden /><p className="mt-2 font-bold">{t}</p><p className="mt-1 text-sm text-ink-2">{d}</p></li>
        ))}
      </ul>

      <p className="mt-8 flex gap-3 rounded-xl bg-muted p-4 text-sm text-ink-2"><Info className="h-5 w-5 shrink-0 text-primary" aria-hidden />An AwardPay report is an assessment, not a guarantee of underpayment or recovery.</p>
    </main>
  );
}
