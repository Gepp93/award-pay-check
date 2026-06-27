import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { NavBar } from "@/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="min-h-screen bg-background p-4 pt-8">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Reports</h1>
            <p className="text-muted-foreground mt-1">
              All your pay checks in one place — paid reports stay unlocked here.
            </p>
          </div>

          {rows.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No reports yet</CardTitle>
                <CardDescription>
                  Run a free check to get started — it takes about a minute.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/check")}>Start a free pay check</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {rows.map((r) => {
                const paid = r.payment_status === "paid";
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigate(`/report/${r.id}`)}
                    className="w-full flex items-center gap-4 px-4 py-4 hover:bg-secondary/40 text-left transition-colors"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {formatHeadline(r)}
                        </span>
                        {paid ? (
                          <Badge className="bg-green-600 hover:bg-green-600 text-white">Paid</Badge>
                        ) : (
                          <Badge variant="secondary">Locked</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {new Date(r.created_at).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground hidden sm:inline">Open</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}