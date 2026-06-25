import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, CheckCircle, ChevronDown, Coins, Lock } from "lucide-react";
import { PublicNavBar } from "@/components/PublicNavBar";
import { NavBar } from "@/components/NavBar";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface PotentialAllowance {
  id: string;
  name: string;
  amount: string;
  estimatedValue: number;
  reason: string;
  icon: string;
}

interface AwardAllowance {
  name: string;
  description: string;
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
  const underpayment = result
    ? isUnsureMode
      ? result.overallMaxUnderpayment || 0
      : result.underpayment || 0
    : 0;
  const isUnderpaid = underpayment > 0;
  const potentialAllowances: PotentialAllowance[] = result?.potentialAllowances || [];
  const issueCount =
    (Array.isArray(result?.reasons) ? result.reasons.length : 0) +
    (potentialAllowances?.length || 0);
  const owedAnimated = useCountUp(isUnderpaid ? underpayment : 0);

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
                  You may be owed
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
                  ${owedAnimated.toLocaleString("en-AU", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                </div>
                <div className="mt-4 text-base text-muted-foreground">
                  We found{" "}
                  <strong className="text-foreground">{issueCount || 1}</strong>{" "}
                  issue{(issueCount || 1) === 1 ? "" : "s"} with your pay.
                </div>
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

            {/* LOCKED breakdown — only when underpaid */}
            {isUnderpaid && (
              <div className="relative">
                <div
                  aria-hidden
                  style={{
                    filter: "blur(6px)",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  <LockedBreakdown
                    result={result}
                    advancedPayslip={advancedPayslip}
                    shiftDetails={shiftDetails}
                    potentialAllowances={potentialAllowances}
                    isUnsureMode={isUnsureMode}
                  />
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center p-4"
                  style={{
                    background:
                      "linear-gradient(180deg, hsl(var(--background) / 0.4), hsl(var(--background) / 0.92))",
                  }}
                >
                  <div
                    className="w-full max-w-md rounded-2xl p-6 text-center"
                    style={{
                      background: "hsl(var(--card))",
                      border: "2px solid hsl(var(--gold))",
                      boxShadow: "0 20px 60px -20px hsl(var(--gold) / 0.35)",
                    }}
                  >
                    <div
                      className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "hsl(var(--gold) / 0.15)" }}
                    >
                      <Lock className="h-5 w-5" style={{ color: "hsl(var(--gold))" }} />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Unlock your full report</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      See exactly what's missing and how to claim it.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        className="ap-btn ap-btn-gold"
                        onClick={() => navigate("/auth")}
                        style={{ width: "100%" }}
                      >
                        Unlock full report — $10
                      </button>
                      <button
                        onClick={() => navigate("/auth")}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          background: "transparent",
                          cursor: "pointer",
                          fontWeight: 600,
                          color: "hsl(var(--foreground))",
                        }}
                      >
                        Check up to 5 payslips — $30
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

// ---------------------------------------------------------------------------
// Locked breakdown — full detail UI, rendered behind the blur overlay.
// ---------------------------------------------------------------------------
function LockedBreakdown({
  result,
  advancedPayslip,
  shiftDetails,
  potentialAllowances,
  isUnsureMode,
}: {
  result: any;
  advancedPayslip: any;
  shiftDetails: any;
  potentialAllowances: PotentialAllowance[];
  isUnsureMode: boolean;
}) {
  const allAwardAllowances: AwardAllowance[] = result.allAwardAllowances || [];
  const [open, setOpen] = useState(true);
  const underpayment = isUnsureMode ? result.overallMaxUnderpayment : (result.underpayment || 0);
  const isUnderpaid = underpayment > 0;

  return (
    <div className="space-y-6">
      {potentialAllowances.length > 0 && (
        <div className="rounded-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-lg text-amber-800 dark:text-amber-200">
              We found {potentialAllowances.length} potential allowance{potentialAllowances.length > 1 ? "s" : ""} you may be entitled to
            </h3>
          </div>
          <div className="space-y-3">
            {potentialAllowances.map((a) => (
              <div key={a.id} className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-background p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{a.icon}</span>
                    <div>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-sm text-primary font-medium">{a.amount}</div>
                    </div>
                  </div>
                  {a.estimatedValue > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Est. today</div>
                      <div className="font-bold text-green-600 dark:text-green-400">
                        ${a.estimatedValue.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                  <span className="font-medium text-foreground">WHY: </span>
                  {a.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {advancedPayslip && (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-3">
          <div className="font-bold text-base">What you were paid (from your payslip):</div>
          {advancedPayslip.hoursAtBase > 0 && (
            <div className="flex justify-between text-sm">
              <span>Base hours ({advancedPayslip.hoursAtBase} hrs × ${advancedPayslip.payslipBaseRate}/hr)</span>
              <span className="font-semibold">${(advancedPayslip.hoursAtBase * advancedPayslip.payslipBaseRate).toFixed(2)}</span>
            </div>
          )}
          {advancedPayslip.hoursAt150 > 0 && (
            <div className="flex justify-between text-sm">
              <span>Time & half ({advancedPayslip.hoursAt150} hrs × ${(advancedPayslip.payslipBaseRate * 1.5).toFixed(2)}/hr)</span>
              <span className="font-semibold">${(advancedPayslip.hoursAt150 * advancedPayslip.payslipBaseRate * 1.5).toFixed(2)}</span>
            </div>
          )}
          {advancedPayslip.hoursAt200 > 0 && (
            <div className="flex justify-between text-sm">
              <span>Double time ({advancedPayslip.hoursAt200} hrs × ${(advancedPayslip.payslipBaseRate * 2).toFixed(2)}/hr)</span>
              <span className="font-semibold">${(advancedPayslip.hoursAt200 * advancedPayslip.payslipBaseRate * 2).toFixed(2)}</span>
            </div>
          )}
          <div className="border-t-2 border-primary/30 pt-2 flex justify-between font-bold text-lg">
            <span>Total you were paid</span>
            <span className="text-primary">${parseFloat(shiftDetails.actualPaid).toFixed(2)}</span>
          </div>
        </div>
      )}

      {isUnderpaid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold text-lg">You may be missing: ${underpayment.toFixed(2)}</div>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="font-semibold text-sm">What the award says you should earn:</div>
        <div className="text-xs text-muted-foreground mb-2">
          Based on ${result.baseRate?.toFixed(2)}/hr award rate
        </div>
        <div className="flex justify-between text-sm">
          <span>Regular hours ({result.breakdown?.regularHours?.toFixed(2) || "0"} hrs × ${result.baseRate?.toFixed(2)}/hr)</span>
          <span>${result.breakdown?.basePay?.toFixed(2) || "0.00"}</span>
        </div>
        {result.breakdown?.overtimeAt150Hours > 0 && (
          <div className="flex justify-between text-sm">
            <span>Overtime at 1.5x ({result.breakdown.overtimeAt150Hours.toFixed(2)} hrs)</span>
            <span>${(result.breakdown.overtimeAt150Hours * result.baseRate * 1.5).toFixed(2)}</span>
          </div>
        )}
        {result.breakdown?.overtimeAt200Hours > 0 && (
          <div className="flex justify-between text-sm">
            <span>Overtime at 2x ({result.breakdown.overtimeAt200Hours.toFixed(2)} hrs)</span>
            <span>${(result.breakdown.overtimeAt200Hours * result.baseRate * 2).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between font-bold text-base">
          <span>Total award pay</span>
          <span>${result.awardPayTotal?.toFixed(2) || "0.00"}</span>
        </div>
      </div>

      {result.reasons && result.reasons.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Why this difference?</p>
          <ul className="space-y-1 list-disc list-inside">
            {result.reasons.map((r: string, idx: number) => (
              <li key={idx} className="text-sm text-muted-foreground">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {allAwardAllowances.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-0 h-auto font-normal hover:bg-transparent">
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "transform rotate-180")} />
              <span className="text-sm font-medium">Other allowances under your award</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {allAwardAllowances.map((al, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">{al.name}</span>
                    <p className="text-xs text-muted-foreground">{al.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Alert className="border-muted-foreground/30 bg-muted/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs leading-relaxed">
          <strong>Disclaimer:</strong> These calculations are based on Fair Work modern award pay data and your answers. They are general guidance only and are not legal or financial advice.
        </AlertDescription>
      </Alert>
    </div>
  );
}