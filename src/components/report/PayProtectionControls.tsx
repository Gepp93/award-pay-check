import { useEffect, useState } from "react";
import { trackPurchaseOnce } from "@/lib/analytics";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tierCall } from "@/features/v2/tierApi";

/** Pay Protection status, confirmation after Stripe return, billing portal and cancel-at-period-end. */
export default function PayProtectionControls() {
  const [state, setState] = useState<{ active: boolean; subscriptions: any[] } | null>(null);
  const [busy, setBusy] = useState<"" | "portal" | "cancel">("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const session = new URLSearchParams(window.location.search).get("tier_session");
    (async () => {
      try {
        let data = await tierCall({ action: "status" });
        if (session) {
          setConfirming(true);
          for (let i = 0; !data?.active && i < 20 && !cancelled; i++) {
            const r = await tierCall({ action: "confirm", sessionId: session }).catch(() => null);
            if (r?.confirmed === true) trackPurchaseOnce(session, { tier: "pay_protection" });
            data = await tierCall({ action: "status" });
            if (!data?.active) await new Promise(r => setTimeout(r, 3000));
          }
          if (!data?.active && !cancelled) toast.message("Payment is still being confirmed. Refresh this page in a minute.");
        }
        if (!cancelled) setState(data);
      } catch { if (!cancelled) setState(null); }
      finally { if (!cancelled) setConfirming(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const current = state?.subscriptions?.find(s => s.paid_through) ?? state?.subscriptions?.[0];
  if (confirming) return <div className="mb-6 text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Confirming your Pay Protection payment with Stripe…</div>;
  if (!current) return null;

  const portal = async () => {
    setBusy("portal");
    try { const d = await tierCall({ action: "portal" }); window.location.assign(d.url); }
    catch { toast.error("Billing management isn't available right now. You can still cancel renewal here."); setBusy(""); }
  };
  const cancel = async () => {
    if (!window.confirm("Cancel renewal? You keep access until the end of your paid period.")) return;
    setBusy("cancel");
    try { await tierCall({ action: "cancel" }); toast.success("Renewal cancelled. Access continues until your paid period ends."); setState(s => s && { ...s, subscriptions: s.subscriptions.map(x => x === current ? { ...x, cancel_at_period_end: true } : x) }); }
    catch { toast.error("Couldn't cancel renewal. Please try again."); }
    finally { setBusy(""); }
  };

  return <section className="mb-6 rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <p className="text-sm">
      <strong>Pay Protection</strong> · {state?.active && current.paid_through ? `paid through ${new Date(current.paid_through).toLocaleDateString("en-AU")}` : "not currently active"}
      {current.cancel_at_period_end ? " · renewal cancelled" : ""}
    </p>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void portal()}>{busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage billing"}</Button>
      {state?.active && !current.cancel_at_period_end && <Button variant="outline" size="sm" disabled={!!busy} onClick={() => void cancel()}>{busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel renewal"}</Button>}
    </div>
  </section>;
}
