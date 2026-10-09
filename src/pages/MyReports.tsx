import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { THREE_MONTH_PASS } from "@/lib/plans";
import { Loader2, FileText, ChevronRight } from "lucide-react";

interface Row {
  id: string;
  created_at: string;
  owed_amount: number;
  payment_status: "free" | "paid";
  result: any;
}

export default function MyReports() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthUser();
  const pass = useSubscription();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { state: { returnTo: "/reports" } });
      return;
    }
    (async () => {
      const { data, error } = await (supabase as any)
        .from("reports")
        .select("id, created_at, owed_amount, payment_status, result")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("MyReports load error:", error);
        setRows([]);
        return;
      }
      setRows((data || []) as Row[]);
    })();
  }, [authLoading, user, navigate]);

  const formatHeadline = (r: Row) => {
    const isUnsure = r.result?.mode === "unsure";
    const min = Number(r.result?.overallMinUnderpayment || 0);
    const owed = Number(r.owed_amount || 0);
    if (owed <= 0 && min <= 0) return "Paid correctly";
    if (isUnsure && min > 0) {
      return `Owed at least ~$${min.toLocaleString("en-AU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `Owed $${owed.toLocaleString("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (authLoading || rows === null) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="checker-page">
        <header className="checker-heading">
          <div className="ledger-label">Your pay checks</div>
          <h1>My Reports</h1>
          <p>All your pay checks in one place — paid reports stay unlocked here.</p>
        </header>
        <div className="ap-final border-t border-rule py-6 mb-6">
          <p className="text-ink-2">{pass.isPremium && pass.expiresAt ? `${pass.subscriptionStatus === "three_month" ? THREE_MONTH_PASS.name : "Pass"} · expires ${new Date(pass.expiresAt).toLocaleDateString("en-AU")}` : "Paid reports stay unlocked."}</p>
          <Button onClick={() => navigate("/check")}>Check a payslip</Button>
        </div>
        {rows.length === 0 ? (
          <div className="space-y-5 border-t border-rule pt-6">
            <p>No reports yet — check a payslip to get started.</p>
            <Button onClick={() => navigate("/check")}>Check my payslip</Button>
          </div>
        ) : (
          <table className="ledger-table ledger-mobile-rows">
            <thead><tr><th>Period</th><th>Award</th><th>Result</th><th>Amount</th><th>Action</th></tr></thead>
            <tbody>{rows.map((r) => {
              const paid = r.payment_status === "paid";
              return (
                <tr key={r.id}>
                  <td data-label="Period" className="font-mono text-[13px]">{new Date(r.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td data-label="Award">{r.result?.awardName || r.result?.award_name || "—"}</td>
                  <td data-label="Result"><Badge variant={paid ? "default" : "secondary"}>{paid ? "Paid" : "Locked"}</Badge></td>
                  <td data-label="Amount" className={`font-mono text-right ${Number(r.owed_amount) > 0 || Number(r.result?.overallMinUnderpayment) > 0 ? "text-clay" : "text-primary"}`}>{formatHeadline(r)}</td>
                  <td data-label="Action" className="text-right"><Button variant="link" onClick={() => navigate(`/report/${r.id}`)}>Open <ChevronRight className="h-4 w-4" /></Button></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </main>
    </>
  );
}
