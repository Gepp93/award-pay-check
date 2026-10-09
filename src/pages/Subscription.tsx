import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { PassOffer } from "@/components/PassOffer";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuthUser } from "@/hooks/useAuthUser";
import { startSubscriptionCheckout } from "@/lib/paymentLinks";
import { THREE_MONTH_PASS } from "@/lib/plans";
import { toast } from "sonner";
export default function Subscription() {
 const { user } = useAuthUser(); const pass = useSubscription(); const [busy,setBusy] = useState(false);
 const checkout = async () => { if(busy) return; setBusy(true); try { const url=await startSubscriptionCheckout("three_month_pass",user?.email,user?.id); if(url) window.location.href=url; else toast.error("Could not start checkout — please try again."); } finally { setBusy(false); } };
 return <><NavBar /><main className="checker-page"><header className="checker-heading"><h1>{THREE_MONTH_PASS.name}</h1><p>{pass.isPremium ? `Your pass is active${pass.expiresAt ? ` until ${new Date(pass.expiresAt).toLocaleDateString("en-AU")}` : ""}.` : "Full reports and payslip checks for the next 3 months."}</p></header><div className="max-w-[720px] mx-auto"><PassOffer onCheckout={() => void checkout()} busy={busy} /></div></main></>;
}
