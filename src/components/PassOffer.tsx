import { THREE_MONTH_PASS, PASS_INCLUSIONS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function PassOffer({ onCheckout, busy = false }: { onCheckout: () => void; busy?: boolean }) {
  return <section className="ap-home-tier ap-home-tier-paid w-full">
    <span className="ap-home-best-value">One payment</span>
    <h3>{THREE_MONTH_PASS.name}</h3>
    <div className="ap-home-price">{THREE_MONTH_PASS.priceLabel}<small> / 90 days</small></div>
    <p>Keep checking every payslip for the next 3 months.</p>
    <ul>{PASS_INCLUSIONS.map(text => <li key={text}><Check className="h-4 w-4 text-primary" /><span>{text}</span></li>)}</ul>
    <Button className="w-full" disabled={busy} onClick={onCheckout}>{busy ? "Opening checkout…" : `Get ${THREE_MONTH_PASS.name} — ${THREE_MONTH_PASS.priceLabel}`}</Button>
    <p className="text-[13px] text-ink-3">One payment · no subscription · secure checkout by Stripe. Prices in AUD.</p>
  </section>;
}