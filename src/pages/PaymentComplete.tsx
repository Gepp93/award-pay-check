import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { NavBar } from "@/components/NavBar";
import { PublicNavBar } from "@/components/PublicNavBar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { THREE_MONTH_PASS } from "@/lib/plans";

type Phase = "resolving" | "polling" | "timeout";

export default function PaymentComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthUser();
  const [phase, setPhase] = useState<Phase>("resolving");
  const [reportId, setReportId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionPaid, setSubscriptionPaid] = useState(false);
  const cancelledRef = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (authLoading) return;
    cancelledRef.current = false;
    const run = async () => {
      setPhase("resolving");

      // 1) Check if this is a subscription purchase.
      let pendingSubId = localStorage.getItem("pendingSubscriptionId");
      if (!pendingSubId && sessionId) {
        const { data: resolved } = await supabase.rpc("resolve_pass_purchase", { p_session_id: sessionId }).maybeSingle();
        if (resolved?.status === "paid" && resolved.report_id) {
          localStorage.removeItem("pendingReportId");
          navigate(`/report/${resolved.report_id}`);
          return;
        }
      }
      if (pendingSubId) {
        setSubscriptionId(pendingSubId);
        setPhase("polling");

        const started = Date.now();
        while (!cancelledRef.current && Date.now() - started < 20_000) {
          const { data, error } = await (supabase as any)
            .rpc("resolve_pass_purchase", { p_purchase_id: pendingSubId })
            .maybeSingle();
          if (error) {
            console.error("get_subscription_status error:", error);
          } else if (data?.status === "paid") {
            setSubscriptionPaid(true);
            localStorage.removeItem("pendingSubscriptionId");
            const linkedReport = data.report_id || localStorage.getItem("pendingReportId");
            if (linkedReport) {
              localStorage.removeItem("pendingReportId");
              navigate(`/report/${linkedReport}`);
            } else if (user) {
              navigate("/app-dashboard");
            } else {
              setPhase("timeout");
            }
            return;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
        if (!cancelledRef.current) setPhase("timeout");
        return;
      }

      // 2) Legacy report flow.
      let id = localStorage.getItem("pendingReportId");
      if (!id && sessionId) {
        const { data } = await (supabase as any)
          .from("reports")
          .select("id")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();
        id = (data?.id as string) || null;
      }

      if (!id) {
        setPhase("timeout");
        return;
      }
      setReportId(id);
      setPhase("polling");

      // Poll up to ~20s.
      const started = Date.now();
      while (!cancelledRef.current && Date.now() - started < 20_000) {
        const { data } = await (supabase as any)
          .from("reports")
          .select("payment_status")
          .eq("id", id)
          .maybeSingle();
        if (data?.payment_status === "paid") {
          localStorage.removeItem("pendingReportId");
          navigate(`/report/${id}`);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelledRef.current) setPhase("timeout");
    };

    run();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, sessionId]);

  return (
    <>
      {user ? <NavBar /> : <PublicNavBar />}
      <div className="checker-page flex items-center justify-center">
        <section className="w-full max-w-[560px] text-center">
          <header className="text-center">
            <div className="mx-auto flex items-center justify-center mb-3">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-[28px] leading-[34px] mb-4">Payment received</h1>
            <p className="text-ink-2 mb-6">
              {phase === "timeout"
                ? subscriptionId
                   ? subscriptionPaid ? "Your pass is ready — create your account to keep checking your pay." : "We're still confirming your payment. Refresh in a moment."
                  : "Your full report is unlocking now and will appear under My Reports in a moment."
                : subscriptionId
                 ? `Activating your ${THREE_MONTH_PASS.name}…`
                : "Unlocking your full report…"}
            </p>
          </header>
          <div className="space-y-4">
            {phase !== "timeout" ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {subscriptionId && !user ? (
                  <Button onClick={() => navigate(`/auth?redirect=app-dashboard&subscriptionId=${subscriptionId}`)}>
                    Create account to activate pass
                  </Button>
                ) : reportId ? (
                  <Button onClick={() => navigate(`/report/${reportId}`)}>
                    Open my report
                  </Button>
                ) : (
                  <Button onClick={() => navigate("/reports")}>Go to My Reports</Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    // Re-run by reloading; keeps logic simple.
                    window.location.reload();
                  }}
                >
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
