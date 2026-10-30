import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TIER_PRODUCTS, type TierProduct } from "../../supabase/functions/_shared/tier-products";
import { tierCall } from "@/features/v2/tierApi";
import { customerBillingError } from "@/components/report/TierChoices";

export const RECOMMENDED_TIER: TierProduct = "underpayment_report";

const DETAILS: Record<TierProduct, { blurb: string; items: string[] }> = {
  pay_check: { blurb: "A quick answer for one payslip.", items: ["Preliminary estimate for one saved report", "The award and possible pay issues found"] },
  underpayment_report: { blurb: "The full picture for one payslip.", items: ["Everything in Pay Check", "Shift-by-shift comparison and allowances", "Downloadable PDF to keep or share"] },
  pay_protection: { blurb: "For checking every payslip.", items: ["Full reports and PDFs for all your saved reports", "Access while your subscription is paid", "Cancel renewal any time"] },
};

/** Public price cards for the three tiers. One-time tiers are bought on a saved report after a check. */
export default function PublicTierCards({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const startProtection = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth", { state: { returnTo: "/pricing", mode: "signup" } }); return; }
    setBusy(true); setError("");
    try { const d = await tierCall({ action: "checkout", product: "pay_protection" }); window.location.assign(d.url); }
    catch (e) { setError(customerBillingError(e)); setBusy(false); }
  };
  return <div>
    <div className="grid gap-4 md:grid-cols-3">
      {(Object.keys(TIER_PRODUCTS) as TierProduct[]).map(product => {
        const offer = TIER_PRODUCTS[product], d = DETAILS[product], rec = product === RECOMMENDED_TIER;
        return <article key={product} className={`relative flex flex-col rounded-lg bg-card p-6 ${rec ? "border-2 border-primary shadow-sheet" : "border border-border"}`}>
          {rec && <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">Recommended</span>}
          <h3 className="text-lg font-extrabold">{offer.name}</h3>
          <p className="mt-1 text-sm text-ink-2">{d.blurb}</p>
          <p className="mt-4"><span className="tabular text-4xl font-extrabold">${offer.amountCents / 100}</span> <span className="text-sm text-ink-3">AUD{offer.mode === "subscription" ? " / year" : " once"}</span></p>
          {!compact && <ul className="my-5 flex-1 space-y-2 text-sm">{d.items.map(i => <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{i}</li>)}</ul>}
          <div className={compact ? "mt-4" : ""}>
            {product === "pay_protection"
              ? <Button variant="outline" className="w-full" disabled={busy} onClick={() => void startProtection()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start Pay Protection <ArrowRight className="h-4 w-4" /></>}</Button>
              : <Button asChild variant={rec ? "default" : "outline"} className="w-full"><Link to="/check">Check my payslip <ArrowRight className="h-4 w-4" /></Link></Button>}
          </div>
          <p className="mt-3 text-xs text-ink-3">{offer.mode === "subscription" ? "Renews yearly. Cancelling keeps access until your paid period ends." : "Choose it after you see your headline result."}</p>
        </article>;
      })}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </div>;
}
