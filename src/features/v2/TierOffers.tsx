import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIER_PRODUCTS, type TierProduct } from "../../../supabase/functions/_shared/tier-products";
import { tierCall, billingError } from "./tierApi";

export default function TierOffers({ reportId }: { reportId?: string }) {
  const [busy, setBusy] = useState<TierProduct | null>(null);
  const [error, setError] = useState("");
  const buy = async (product: TierProduct) => {
    setBusy(product); setError("");
    try { const data = await tierCall({ action: "checkout", product, reportId }); window.location.assign(data.url); }
    catch (e) { setError(billingError(e)); } finally { setBusy(null); }
  };
  return <>
    <div className="grid gap-5 md:grid-cols-3">
      {(Object.keys(TIER_PRODUCTS) as TierProduct[]).map(product => {
        const offer = TIER_PRODUCTS[product];
        const items = product === "pay_check" ? ["One supported assessment", "Saved assessment result"] : product === "underpayment_report" ? ["One supported assessment", "Detailed itemised report", "Downloadable PDF"] : ["Unlimited supported assessments", "Detailed reports and PDFs", "Access while your subscription is active"];
        return <article key={product} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-xl font-extrabold">{offer.name}</h2>
          <p className="mt-5"><span className="text-4xl font-extrabold">${offer.amountCents / 100}</span><span className="ml-2 text-ink-2">AUD{offer.mode === "subscription" ? "/year" : " once"}</span></p>
          <ul className="my-6 flex-1 space-y-3 text-sm">{items.map(item => <li key={item} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul>
          {!reportId && offer.mode === "payment" ? <Button asChild variant="outline"><Link to="/v2/questions">Check eligibility first <ArrowRight /></Link></Button> : <Button variant={product === "underpayment_report" ? "gold" : "outline"} disabled={!!busy} onClick={() => void buy(product)}>{busy === product ? <Loader2 className="animate-spin" /> : <>Choose {offer.name}<ArrowRight /></>}</Button>}
          <p className="mt-3 text-xs text-ink-3">{offer.mode === "subscription" ? "Renews annually. Cancellation takes effect at the end of your paid period." : "One payment for this assessment. No subscription."}</p>
        </article>;
      })}
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    <p className="mt-6 text-sm text-ink-2">Only supported, complete wage comparisons can be purchased. Allowances, leave, superannuation and other excluded entitlements are not assessed. A potential difference is not a verified debt or a promise of recovery. Existing 3 Month Pass access is unchanged.</p>
  </>;
}