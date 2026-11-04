import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tierCall } from "@/features/v2/tierApi";
import { trackPurchaseOnce } from "@/lib/analytics";

/** After a guest payment: confirm with the server, then unlock through a verified email sign-in link. */
export default function GuestPaidNotice({ reportId, session, signedIn }: { reportId: string; session: string; signedIn: boolean }) {
  const [paid, setPaid] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (signedIn) {
        // Server claims only purchases paid with this account's confirmed email.
        await supabase.rpc("claim_my_tier_purchases");
        if (!cancelled) window.location.replace(`/report/${reportId}?tier_session=${encodeURIComponent(session)}`);
        return;
      }
      for (let i = 0; i < 20 && !cancelled; i++) {
        const r = await tierCall({ action: "confirm", sessionId: session }).catch(() => null);
        if (r?.confirmed === true) { trackPurchaseOnce(session); setPaid(true); return; }
        await new Promise(res => setTimeout(res, 3000));
      }
      if (!cancelled) setPaid(false);
    })();
    return () => { cancelled = true; };
  }, [signedIn, reportId, session]);

  const send = async () => {
    setBusy(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/report/${reportId}?tier_session=${encodeURIComponent(session)}&guest=1` } });
    setBusy(false);
    if (error) setError("We couldn't send the link. Check the email and try again."); else setSent(true);
  };

  if (signedIn) return <div className="checker-sheet text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Unlocking your report…</div>;
  if (paid === null) return <div className="checker-sheet text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Confirming your payment with Stripe…</div>;
  return <section className="checker-sheet space-y-3">
    <h3 className="font-semibold">{paid ? "Payment received" : "Payment is still being confirmed"}</h3>
    <p className="text-sm text-muted-foreground">Enter the email you paid with. We'll send a secure sign-in link that opens your paid report.</p>
    {sent ? <p className="text-sm">Check your inbox for the sign-in link.</p> : <div className="flex flex-col gap-2 sm:flex-row">
      <Input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email you paid with" />
      <Button onClick={() => void send()} disabled={busy || !email.includes("@")}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me the link"}</Button>
    </div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
