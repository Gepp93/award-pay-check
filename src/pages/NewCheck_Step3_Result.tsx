import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { LockedTeaser } from "@/components/report/LockedTeaser";
import { PublicNavBar } from "@/components/PublicNavBar";
import { NavBar } from "@/components/NavBar";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { useUserCredits } from "@/hooks/useUserCredits";
import { FULL_REPORT_LINK, BACKPAY_LINK, buildCheckoutUrl } from "@/lib/paymentLinks";

interface PotentialAllowance {
  id: string;
  name: string;
  amount: string;
  estimatedValue: number;
  reason: string;
  icon: string;
}

// Count-up hook for animating the headline owed figure.
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!isFinite(target) || target <= 0) {
      setValue(target || 0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export default function NewCheck_Step3_Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, shiftDetails, advancedPayslip } = location.state || {};
  const [user, setUser] = useState<User | null>(null);
  const fromDashboard = location.state?.fromDashboard;
  const pendingProduct = (location.state as any)?.pendingProduct as
    | "full_report"
    | "backpay_pack"
    | undefined;
  const [unlocking, setUnlocking] = useState(false);
  const autoResumedRef = useRef(false);
  const { credits, refetch: refetchCredits } = useUserCredits();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Save calculation for logged-in users (unchanged behaviour).
  useEffect(() => {
    if (fromDashboard || !result || !shiftDetails) return;
    const save = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("calculations").insert({
          user_id: user.id,
          shift_data: shiftDetails,
          breakdown: result,
        });
      } catch (e) {
        console.error("Error saving calculation:", e);
      }
    };
    save();
  }, [shiftDetails, result, fromDashboard]);

  const isUnsureMode = result?.mode === "unsure";
  const minUnsure = isUnsureMode ? (result?.overallMinUnderpayment || 0) : 0;
  const maxUnsure = isUnsureMode ? (result?.overallMaxUnderpayment || 0) : 0;
  const underpayment = isUnsureMode ? maxUnsure : (result?.underpayment || 0);
  const isUnderpaid = underpayment > 0;
  const potentialAllowances: PotentialAllowance[] = result?.potentialAllowances || [];
  const issueCount =
    (Array.isArray(result?.reasons) ? result.reasons.length : 0) +
    (potentialAllowances?.length || 0);
  const showRange = isUnsureMode && minUnsure > 0 && minUnsure !== maxUnsure;
  const owedAnimated = useCountUp(isUnderpaid ? underpayment : 0);

  // Create a report row for the signed-in user, then navigate to /report/:id.
  // Unauthed users get bounced to /auth with returnTo + pendingProduct so we can
  // auto-resume the flow once they're signed in (see effect below).
  const handleUnlock = async (product: "full_report" | "backpay_pack") => {
    if (!result || !shiftDetails) return;
    if (!user) {
      navigate("/auth", {
        state: {
          returnTo: "/new-check-step-3",
          returnState: { ...(location.state || {}), pendingProduct: product },
          mode: "signup",
        },
      });
      return;
    }
    if (unlocking) return;
    setUnlocking(true);
    try {
      const { data, error } = await (supabase as any)
        .from("reports")
        .insert({
          user_id: user.id,
          result,
          inputs: { shiftDetails, advancedPayslip },
          owed_amount: isUnderpaid ? underpayment : 0,
          product,
          payment_status: "free",
        })
        .select("id")
        .single();
      if (error || !data) throw error || new Error("No row returned");
      const reportId = data.id as string;

      // Credit redemption path — only for the single-report ($10) tier.
      if (product === "full_report" && credits > 0) {
        const { data: redeem, error: rErr } = await supabase.functions.invoke(
          "redeem-credit",
          { body: { reportId } },
        );
        if (!rErr && (redeem as any)?.ok) {
          await refetchCredits();
          toast.success("Unlocked with 1 credit");
          navigate(`/report/${reportId}`);
          return;
        }
        console.error("redeem-credit failed, falling back to Stripe:", rErr, redeem);
      }

      // Otherwise go to Stripe for purchase.
      const link = product === "full_report" ? FULL_REPORT_LINK : BACKPAY_LINK;
      window.location.href = buildCheckoutUrl(link, reportId);
    } catch (e: any) {
      console.error("Error creating report:", e);
      toast.error("Couldn't start your report — please try again.");
      setUnlocking(false);
    }
  };

  // Auto-resume: user just came back from /auth with a pending product.
  useEffect(() => {
    if (autoResumedRef.current) return;
    if (!user || !pendingProduct || !result || !shiftDetails) return;
    autoResumedRef.current = true;
    handleUnlock(pendingProduct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingProduct, result, shiftDetails]);

  if (!result || !shiftDetails) {
    navigate("/new-check-step-1");
    return null;
  }

  return (
    <>
      {user ? <NavBar /> : <PublicNavBar />}
      <div className={`min-h-screen flex items-start justify-center p-4 bg-background ${!user ? "pt-24" : "pt-4"}`}>
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="no-print">
              <ProgressIndicator currentStep={3} />
            </div>
            <CardTitle>Your pay check</CardTitle>
            <CardDescription>Based on official Fair Work modern award rates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* FREE headline — always visible */}
            {isUnderpaid ? (
              <div
                className="text-center rounded-2xl px-6 py-10"
                style={{
                  background: "hsl(var(--primary) / 0.06)",
                  border: "1px solid hsl(var(--primary) / 0.18)",
                }}
              >
                <div className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
                  {showRange
                    ? "Estimated range"
                    : isUnsureMode
                    ? "You may be owed up to"
                    : "You may be owed"}
                </div>
                <div
                  className="font-extrabold tabular-nums"
                  style={{
                    color: "hsl(var(--gold))",
                    fontSize: "clamp(48px, 8vw, 84px)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {showRange
                    ? `${minUnsure.toLocaleString("en-AU", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                        style: "currency",
                        currency: "AUD",
                      })} – ${maxUnsure.toLocaleString("en-AU", {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                        style: "currency",
                        currency: "AUD",
                      })}`
                    : `${isUnsureMode ? "~" : ""}$${owedAnimated.toLocaleString(
                        "en-AU",
                        { maximumFractionDigits: 2, minimumFractionDigits: 2 }
                      )}`}
                </div>
                {isUnsureMode ? (
                  <div className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
                    This is an estimate across the likely classification levels for your
                    role. For an exact figure, go back and select your classification.
                  </div>
                ) : (
                  <div className="mt-4 text-base text-muted-foreground">
                    We found{" "}
                    <strong className="text-foreground">{issueCount || 1}</strong>{" "}
                    issue{(issueCount || 1) === 1 ? "" : "s"} with your pay.
                  </div>
                )}
              </div>
            ) : (
              <div
                className="text-center rounded-2xl px-6 py-10"
                style={{
                  background: "hsl(var(--primary) / 0.06)",
                  border: "1px solid hsl(var(--primary) / 0.18)",
                }}
              >
                <div
                  className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "hsl(var(--primary) / 0.15)" }}
                >
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Looks like you were paid correctly</h2>
                <p className="text-muted-foreground mt-2">
                  We didn't find any underpayment for this pay period.
                </p>
              </div>
            )}


            {/* Free teaser — full detail lives at /report/:id behind the (upcoming) paywall. */}
            {isUnderpaid && (
              <>
                <LockedTeaser result={result} />
                {user && credits > 0 && (
                  <div className="text-sm text-center text-muted-foreground">
                    You have <strong className="text-foreground">{credits}</strong> report
                    credit{credits === 1 ? "" : "s"} left from your Back-Pay Pack.
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="ap-btn ap-btn-gold flex-1"
                    onClick={() => handleUnlock("full_report")}
                    disabled={unlocking}
                  >
                    {unlocking
                      ? "Preparing…"
                      : credits > 0
                      ? `Unlock with 1 credit (${credits} left)`
                      : "Unlock full report — $10"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnlock("backpay_pack")}
                    disabled={unlocking}
                    className="flex-1"
                    style={{
                      padding: "10px 14px",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      background: "transparent",
                      cursor: unlocking ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    Back-Pay Pack — 5 reports for $30 (save $20)
                  </button>
                </div>
              </>
            )}

            <div className="flex gap-3 no-print pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/check")}
                className="flex-1"
              >
                Check another payslip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}