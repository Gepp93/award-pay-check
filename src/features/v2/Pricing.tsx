import { useState } from "react";
import { ArrowRight, Check, Clock, FileText, Info, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startSubscriptionCheckout } from "@/lib/paymentLinks";
import { THREE_MONTH_PASS } from "@/lib/plans";

const INCLUDES = [
  `Payslip checks for ${THREE_MONTH_PASS.durationDays} days`,
  "Detailed pay comparisons, line by line",
  "Award rates, penalties and supported allowances",
  "Downloadable PDF reports",
  "Reports saved to your account when signed in",
];

export default function Pricing() {
  const [busy, setBusy] = useState(false);
  // Same checkout as the live /pricing page: guests can buy, signed-in users are linked.
  const checkout = async () => {
    if (busy) return; setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await startSubscriptionCheckout("three_month_pass", user?.email, user?.id);
      if (url) window.location.href = url; else toast.error("Could not start checkout — please try again.");
    } finally { setBusy(false); }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">Pricing</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">One pass. Three months.</h1>
      <p className="mt-4 text-lg text-ink-2">See your headline result first. Unlock the details and keep checking your pay.</p>

      <section className="mt-8 rounded-2xl border-2 border-primary bg-card p-6 shadow-soft md:p-8" aria-labelledby="pass">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="pass" className="text-xl font-bold">{THREE_MONTH_PASS.name}</h2>
            <p className="mt-2"><span className="text-5xl font-extrabold tabular-nums">{THREE_MONTH_PASS.priceLabel}</span> <span className="text-lg text-ink-2">AUD</span></p>
          </div>
          <p className="rounded-lg bg-primary-soft px-4 py-2 text-center text-sm font-semibold text-primary">One-time payment<br />No subscription</p>
        </div>
        <ul className="mt-6 space-y-3">
          {INCLUDES.map((i) => <li key={i} className="flex gap-3"><Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />{i}</li>)}
        </ul>
        <Button size="lg" className="mt-7 h-14 w-full text-base" onClick={() => void checkout()} disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Get the {THREE_MONTH_PASS.name} <ArrowRight className="h-5 w-5" /></>}
        </Button>
        <p className="mt-3 text-center text-sm text-ink-2">One-time payment. Your pass expires automatically after {THREE_MONTH_PASS.durationDays} days. No recurring charges.</p>
      </section>

      <ul className="mt-8 grid gap-6 text-center sm:grid-cols-3">
        {[
          { icon: FileText, t: "Clear reports", d: "Understand the differences between your pay and the rates used." },
          { icon: Clock, t: `${THREE_MONTH_PASS.durationDays}-day access`, d: "Continue checking during your pass period." },
          { icon: Lock, t: "Secure payment", d: "Payments are handled by Stripe, our payment provider." },
        ].map(({ icon: I, t, d }) => (
          <li key={t}><I className="mx-auto h-8 w-8 text-primary" aria-hidden /><p className="mt-2 font-bold">{t}</p><p className="mt-1 text-sm text-ink-2">{d}</p></li>
        ))}
      </ul>

      <p className="mt-8 flex gap-3 rounded-xl bg-muted p-4 text-sm text-ink-2"><Info className="h-5 w-5 shrink-0 text-primary" aria-hidden />An AwardPay report is an assessment, not a guarantee of underpayment or recovery.</p>
    </main>
  );
}
