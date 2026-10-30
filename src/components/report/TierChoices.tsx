import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIER_PRODUCTS, type TierProduct } from "../../../supabase/functions/_shared/tier-products";
import { tierCall } from "@/features/v2/tierApi";

const ITEMS: Record<TierProduct, string[]> = {
  pay_check: ["Your preliminary estimate for this report", "The award and pay issues found"],
  underpayment_report: ["Everything in Pay Check", "Shift-by-shift detail and allowances", "Downloadable PDF"],
  pay_protection: ["Full reports and PDFs for all your saved reports", "Access while your subscription is paid", "Cancel any time"],
};

export function customerBillingError(e: unknown) {
  const m = e instanceof Error ? e.message : "";
  if (m === "already_unlocked") return "You already have access to this.";
  if (m === "confirmed_account_required") return "Confirm your account email before buying.";
  if (m === "webhook_not_configured" || m === "webhook_events_missing") return "Checkout is temporarily unavailable. Nothing has been charged.";
  if (m === "unauthorized") return "Please sign in again.";
  return "Checkout is unavailable right now. Nothing has been charged.";
}

/** Three-tier choice for a saved public-checker report. Requires a signed-in owner so payment binds to one account. */
export default function TierChoices({ reportId, signedIn, owned, onClaim, assessment }: { reportId: string; signedIn: boolean; owned: boolean; onClaim: () => Promise<boolean>; assessment: boolean }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<TierProduct | null>(null);
  const [error, setError] = useState("");
  const buy = async (product: TierProduct) => {
    if (!signedIn) { navigate("/auth", { state: { returnTo: `/report/${reportId}`, mode: "signup" } }); return; }
    setBusy(product); setError("");
    try {
      if (!owned && !(await onClaim())) throw new Error("claim_failed");
      const data = await tierCall({ action: "checkout", product, legacyReportId: reportId });
      window.location.assign(data.url);
    } catch (e) { setError(customerBillingError(e)); setBusy(null); }
  };
  const products = (Object.keys(TIER_PRODUCTS) as TierProduct[]).filter(p => !(assessment && p === "pay_check"));
  return <section className="space-y-4">
    <h2 className="text-xl font-semibold">Choose how much detail you need</h2>
    <div className="grid gap-4 md:grid-cols-3">
      {products.map(product => {
        const offer = TIER_PRODUCTS[product];
        return <article key={product} className="flex flex-col rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold">{offer.name}</h3>
          <p className="figure text-[28px] mt-2">${offer.amountCents / 100}<span className="text-sm text-muted-foreground ml-1">AUD{offer.mode === "subscription" ? "/year" : " once"}</span></p>
          <ul className="my-4 flex-1 space-y-2 text-sm">{ITEMS[product].map(i => <li key={i} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{i}</li>)}</ul>
          <Button variant={product === "underpayment_report" ? "default" : "outline"} disabled={!!busy} onClick={() => void buy(product)}>
            {busy === product ? <Loader2 className="h-4 w-4 animate-spin" /> : signedIn ? `Choose ${offer.name}` : `Sign in to buy ${offer.name}`}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">{offer.mode === "subscription" ? "Renews yearly. Cancelling keeps access until the paid period ends." : "One payment for this report."}</p>
        </article>;
      })}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">All results are preliminary estimates. Secure checkout by Stripe.</p>
  </section>;
}
