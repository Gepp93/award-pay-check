import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";

type Phase = "resolving" | "polling" | "timeout";

export default function PaymentComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuthUser();
  const [phase, setPhase] = useState<Phase>("resolving");
  const [reportId, setReportId] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const full = `/payment-complete${window.location.search}`;
      navigate("/auth", { state: { returnTo: full } });
      return;
    }

    cancelledRef.current = false;
    const run = async () => {
      setPhase("resolving");

      // Resolve report id.
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
      <NavBar />
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-3">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle>Payment received</CardTitle>
            <CardDescription>
              {phase === "timeout"
                ? "Your full report is unlocking now and will appear under My Reports in a moment."
                : "Unlocking your full report…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {phase !== "timeout" ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/reports")}>Go to My Reports</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Re-run by reloading; keeps logic simple.
                    window.location.reload();
                  }}
                >
                  Refresh
                </Button>
                {reportId && (
                  <Button variant="ghost" onClick={() => navigate(`/report/${reportId}`)}>
                    Open report anyway
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}