import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FullReport } from "@/components/report/FullReport";
import { LockedTeaser } from "@/components/report/LockedTeaser";
import { NavBar } from "@/components/NavBar";

interface ReportRow {
  id: string;
  user_id: string;
  result: any;
  inputs: any;
  owed_amount: number;
  product: "full_report" | "backpay_pack";
  payment_status: "free" | "paid";
  stripe_session_id: string | null;
  created_at: string;
}

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthUser();
  const [row, setRow] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchReport = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();
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
    if (!user) {
      navigate("/auth", { state: { returnTo: `/report/${id}` } });
      return;
    }
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, id]);

  // TEMP: remove when Stripe is live
  const simulatePayment = async () => {
    if (!id) return;
    const { error } = await (supabase as any)
      .from("reports")
      .update({ payment_status: "paid" })
      .eq("id", id);
    if (error) {
      toast.error("Could not simulate payment");
      console.error(error);
      return;
    }
    toast.success("Marked as paid (dev)");
    fetchReport();
  };

  // Stub — real Stripe checkout wires here in the next step.
  const handleStartCheckout = (product: "full_report" | "backpay_pack") => {
    console.log("[stub] start checkout for", product, "report", id);
    toast.info("Payments coming next — use the dev button below for now.");
  };

  if (authLoading || loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (notFound || !row) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center p-4 pt-24">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Report not available</CardTitle>
              <CardDescription>
                This report doesn't exist or you don't have access to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/new-check-step-1")} className="w-full">
                Start a new pay check
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const result = row.result;
  const inputs = row.inputs || {};
  const isPaid = row.payment_status === "paid";
  const isUnsureMode = result?.mode === "unsure";
  const owed = row.owed_amount || 0;
  const isUnderpaid = owed > 0;

  return (
    <>
      <NavBar />
      <div className="min-h-screen flex items-start justify-center p-4 pt-24 bg-background">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Your pay check report</CardTitle>
            <CardDescription>
              {isPaid ? "Full report unlocked." : "Preview — unlock to see full detail."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Headline */}
            {isUnderpaid ? (
              <div
                className="text-center rounded-2xl px-6 py-10"
                style={{
                  background: "hsl(var(--primary) / 0.06)",
                  border: "1px solid hsl(var(--primary) / 0.18)",
                }}
              >
                <div className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
                  {isUnsureMode ? "You may be owed up to" : "You may be owed"}
                </div>
                <div
                  className="font-extrabold tabular-nums"
                  style={{
                    color: "hsl(var(--gold))",
                    fontSize: "clamp(48px, 8vw, 84px)",
                    lineHeight: 1,
                  }}
                >
                  {isUnsureMode ? "~" : ""}$
                  {owed.toLocaleString("en-AU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold">Looks like you were paid correctly</h2>
              </div>
            )}

            {isPaid ? (
              <FullReport
                result={result}
                shiftDetails={inputs.shiftDetails}
                advancedPayslip={inputs.advancedPayslip}
              />
            ) : (
              <>
                <LockedTeaser result={result} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="ap-btn ap-btn-gold flex-1"
                    onClick={() => handleStartCheckout("full_report")}
                  >
                    Unlock full report — $10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCheckout("backpay_pack")}
                    className="flex-1"
                    style={{
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

                {/* TEMP: remove when Stripe is live */}
                <div className="rounded-lg border border-dashed border-amber-500/60 bg-amber-50/40 dark:bg-amber-950/10 p-3 text-center">
                  <div className="text-xs text-amber-700 dark:text-amber-400 mb-2 font-mono">
                    DEV ONLY — simulates a successful Stripe payment
                  </div>
                  <Button variant="outline" size="sm" onClick={simulatePayment}>
                    Simulate payment (dev)
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}