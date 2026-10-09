import { useState } from "react";
import { ApNav } from "@/components/ApNav";
import { PassOffer } from "@/components/PassOffer";
import SEO from "@/components/SEO";
import { THREE_MONTH_PASS } from "@/lib/plans";
import { startSubscriptionCheckout } from "@/lib/paymentLinks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
export default function Pricing() {
  const [busy, setBusy] = useState(false);
  const checkout = async () => {
    if (busy) return; setBusy(true);
    try { const { data: { user } } = await supabase.auth.getUser(); const url = await startSubscriptionCheckout("three_month_pass", user?.email, user?.id); if (url) window.location.href = url; else toast.error("Could not start checkout — please try again."); }
    finally { setBusy(false); }
  };
  return <div className="ap-marketing"><SEO title={`${THREE_MONTH_PASS.name} — ${THREE_MONTH_PASS.priceLabel} | AwardPay`} description="One payment for 90 days of payslip checks, full reports and PDF downloads. No recurring subscription." path="/pricing" /><ApNav />
    <section className="ap-wrap ap-home-section"><div className="ap-eyebrow">Pricing</div><h1 className="ap-h1">One pass. Three months.</h1><p className="ap-lede">See your headline result first. Unlock the details and keep checking every payslip.</p></section>
    <section className="ap-wrap ap-home-section"><div className="ap-home-pricing"><PassOffer onCheckout={() => void checkout()} busy={busy} /></div></section>
    <section className="ap-wrap ap-home-section"><p>Your payslip is read, then discarded. AwardPay is an interpretation tool, not legal advice.</p></section>
    <footer className="ap-footer"><div className="ap-footer-in"><div className="ap-brand"><span className="ap-mark" />AwardPay</div><div className="fine">© 2026 AwardPay · Prices in AUD.</div></div></footer></div>;
}
