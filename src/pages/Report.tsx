import { useEffect, useRef, useState } from "react";
import { trackPurchaseOnce } from "@/lib/analytics";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FullReport } from "@/components/report/FullReport";
import { LockedTeaser, ReportIncludes } from "@/components/report/LockedTeaser";
import PreliminaryNotice, { ESTIMATE_LABEL, MULTI_LEVEL_LABEL } from "@/components/report/PreliminaryNotice";
import { NavBar } from "@/components/NavBar";
import { PublicNavBar } from "@/components/PublicNavBar";
import { useUserCredits } from "@/hooks/useUserCredits";
import { startSubscriptionCheckout } from "@/lib/paymentLinks";
import { THREE_MONTH_PASS } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";
import TierChoices from "@/components/report/TierChoices";
import { tierCall } from "@/features/v2/tierApi";

interface ReportRow {
  id: string;
  user_id: string | null;
  email: string | null;
  result: any;
  inputs: any;
  owed_amount: number;
  product: "full_report" | "backpay_pack" | "three_month_pass";
  payment_status: "free" | "paid";
  stripe_session_id: string | null;
  created_at: string;
}

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const { user, loading: authLoading } = useAuthUser();
  const [row, setRow] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { credits, refetch: refetchCredits } = useUserCredits();
  const [redeeming, setRedeeming] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const { isPremium } = useSubscription();
  useEffect(() => {
    if (!isPremium || !user || !row || row.payment_status === "paid" || row.user_id !== user.id) return;
    supabase.rpc("unlock_report_with_pass", { p_report_id: row.id }).then(({ data }) => { if (data) void fetchReport(); });
  }, [isPremium, user, row]);
  const autoLaunchedRef = useRef(false);
  const [tier, setTier] = useState<{ assessment: boolean; detailed: boolean; result: any; inputs: any } | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Three-tier access is verified by the server against Stripe; the return address alone never unlocks.
  useEffect(() => {
    if (!user || !row || row.user_id !== user.id || row.payment_status === "paid") { setTier(null); return; }
    let cancelled = false;
    const session = params.get("tier_session");
    const load = async () => (await tierCall({ action: "legacy_report", legacyReportId: row.id })) as any;
    // Count a purchase only when the server reports a verified transaction for this session.
    const confirmPurchase = async (id: string) => { const r = await tierCall({ action: "confirm", sessionId: id }).catch(() => null); if (r?.confirmed === true) trackPurchaseOnce(id); };
    (async () => {
      try {
        if (session) { setConfirming(true); await confirmPurchase(session); }
        let data = await load();
        for (let i = 0; session && !data?.assessment && i < 20 && !cancelled; i++) {
          await new Promise(r => setTimeout(r, 3000));
          await confirmPurchase(session);
          data = await load();
        }
        if (!cancelled) setTier(data);
        if (!cancelled && session && !data?.assessment) toast.message("Payment is still being confirmed. Refresh this page in a minute.");
      } catch { if (!cancelled) setTier(null); }
      finally { if (!cancelled) setConfirming(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, row?.id, row?.user_id, row?.payment_status]);

  const fetchReport = async () => {
    if (!id) return;
    setLoading(true);
    // Detail is only returned by the server when the report is unlocked.
    const { data, error } = await (supabase as any).rpc("get_report_view", { p_report_id: id });
    if (error) {
      console.error("Error loading report:", error);
      setNotFound(true);
    } else if (!data) {
      setNotFound(true);
    } else {
      setRow(data as ReportRow);
      setNotFound(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, id]);

  // Offer to save an unowned report into the account of a signed-in visitor.
  const handleClaim = async (): Promise<boolean> => {
    if (!id || !user || claiming) return false;
    setClaiming(true);
    const { error } = await (supabase as any)
      .from("reports")
      .update({ user_id: user.id })
      .eq("id", id)
      .is("user_id", null);
    setClaiming(false);
    if (error) {
      console.error("Error claiming report:", error);
      toast.error("Couldn't save this report to your account.");
      return false;
    }
    toast.success("Saved to your account.");
    await fetchReport();
    return true;
  };

  const handleUnlock = async (product: "full_report" | "backpay_pack") => {
    if (!id) return;
    // Use a credit if available (single-report tier only).
    if (product === "full_report" && credits > 0) {
      setRedeeming(true);
      const { data, error } = await supabase.functions.invoke("redeem-credit", {
        body: { reportId: id },
      });
      setRedeeming(false);
      if (!error && (data as any)?.ok) {
        toast.success("Unlocked with 1 credit");
        await refetchCredits();
        fetchReport();
        return;
      }
      console.error("redeem-credit failed:", error, data);
      toast.error("Couldn't redeem credit — sending you to checkout.");
    }
    setRedeeming(true);
    localStorage.setItem("pendingReportId", id);
    const checkout = await startSubscriptionCheckout("three_month_pass", row?.email || user?.email || undefined, user?.id, id);
    if (checkout) window.location.href = checkout;
    else { setRedeeming(false); toast.error("Couldn't start checkout — please try again."); }
  };

  // Auto-launch checkout if we arrived here straight after sign-up with a pending product.
  useEffect(() => {
    if (autoLaunchedRef.current) return;
    if (!row || row.payment_status === "paid") return;
    const pending = (window.history.state?.usr?.pendingProduct ||
      params.get("auto")) as "full_report" | "backpay_pack" | null;
    // The $30 pass is no longer sold, so auto-checkout only applies to legacy credits.
    if (!pending || credits <= 0) return;
    // Don't auto-burn a credit on the $10 tier — let the user click.
    if (pending === "full_report" && credits > 0) return;
    autoLaunchedRef.current = true;
    handleUnlock(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row, credits]);

  if (authLoading || loading) {
    return (
      <>
        {user ? <NavBar /> : <PublicNavBar />}
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (notFound || !row) {
    return (
      <>
        {user ? <NavBar /> : <PublicNavBar />}
        <div className="checker-page flex justify-center">
          <section className="w-full max-w-[560px] checker-heading">
            <header>
              <h1>Report not available</h1>
              <p>
                This report doesn't exist or you don't have access to it.
              </p>
            </header>
            <div>
              <Button onClick={() => navigate("/new-check-step-1")} className="w-full">
                Start a new pay check
              </Button>
            </div>
          </section>
        </div>
      </>
    );
  }

  const isPaid = row.payment_status === "paid" || !!tier?.detailed;
  const result = tier?.detailed ? tier.result : row.result;
  const inputs = (tier?.detailed ? tier.inputs : row.inputs) || {};
  const summary = !isPaid && tier?.assessment ? tier.result : null;
  const isUnsureMode = result?.mode === "unsure";
  const owed = row.owed_amount || 0;
  const isUnderpaid = owed > 0;

  return (
    <>
      {user ? <NavBar /> : <PublicNavBar />}
      <div className={`checker-page ${!user ? "checker-public" : ""}`}>
        <main className="checker-report">
          <header className="checker-heading">
            <h1>Your pay check report</h1>
            <p>
              {isPaid ? "Full report unlocked." : "Preview — unlock to see full detail."}
            </p>
          </header>
          <div className="space-y-6">
            {!isPaid && <PreliminaryNotice />}
            {/* Headline */}
            {!isPaid && (isUnderpaid ? (
              <div className="checker-sheet">
                <div className="ledger-label mb-3">
                  {isUnsureMode ? `${ESTIMATE_LABEL} · ${MULTI_LEVEL_LABEL}` : ESTIMATE_LABEL}
                </div>
                <div className="checker-owed figure">
                  {isUnsureMode ? "~" : ""}$
                  {owed.toLocaleString("en-AU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ) : (
              <div className="checker-sheet">
                <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-semibold">No shortfall found in this preliminary estimate</h2>
              </div>
            ))}

            {isPaid ? (
              <>
                <FullReport
                  result={result}
                  shiftDetails={inputs.shiftDetails}
                  advancedPayslip={inputs.advancedPayslip}
                />
                {!row.user_id && (
                  <div className="rounded-lg border border-border p-4 text-sm flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <span className="text-muted-foreground">
                      Keep this report — save it to an account so you can come back to it.
                    </span>
                    {user ? (
                      <Button variant="outline" onClick={handleClaim} disabled={claiming}>
                        {claiming ? "Saving…" : "Save to my account"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate("/auth", {
                            state: { returnTo: `/report/${id}`, mode: "signup" },
                          })
                        }
                      >
                        Create an account
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {confirming && <div className="checker-sheet text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Confirming your payment with Stripe…</div>}
                {summary ? (
                  <section className="checker-findings">
                    <h3>Your Pay Check</h3>
                    {summary.awardName && <p className="text-sm">Award: {summary.awardName}{summary.classification ? ` · ${summary.classification}` : ""}</p>}
                    {(summary.potentialAllowances || []).map((a: any) => <div key={a.id || a.name} className="checker-finding-row"><span className="ledger-missing">POSSIBLE</span><span>{a.name}</span></div>)}
                    {(summary.reasons || []).map((r: string, i: number) => <div key={i} className="checker-finding-row"><span>{r}</span></div>)}
                  </section>
                ) : <LockedTeaser result={result} />}
                <TierChoices reportId={row.id} signedIn={!!user} owned={!!user && row.user_id === user.id} onClaim={handleClaim} assessment={!!tier?.assessment} />
                {user && credits > 0 && (
                  <div className="text-sm text-center text-muted-foreground">
                    You have <strong className="text-foreground">{credits}</strong> report
                    credit{credits === 1 ? "" : "s"} left from your Back-Pay Pack.
                  </div>
                )}
                {!tier?.assessment && user && credits > 0 && <aside className="checker-unlock"><h2>Use a report credit</h2>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => handleUnlock("full_report")}
                    disabled={redeeming}
                  >
                    {redeeming
                      ? "Unlocking…"
                      : user && credits > 0
                      ? `Unlock with 1 credit (${credits} left)`
                      : "Unlock"}
                  </Button>
                </div>
                <p className="text-[13px] text-center text-muted-foreground">
                  Uses one credit from your earlier purchase.
                </p></aside>}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}