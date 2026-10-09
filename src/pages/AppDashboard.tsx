import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FileText, TrendingDown, CheckCircle, Trash2 } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { format } from "date-fns";

const AppDashboard = () => {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch user's calculations
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setCalculations(data);
      }
      setLoading(false);
    };
    checkUserAndFetchData();
  }, [navigate]);

  const totalUnderpayment = calculations.reduce((sum, calc) => {
    const breakdown = calc.breakdown;
    const underpayment = breakdown.mode === 'unsure' 
      ? breakdown.overallMaxUnderpayment 
      : (breakdown.underpayment || 0);
    return sum + underpayment;
  }, 0);

  const handleDeleteCalculation = async (calcId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', calcId);

    if (!error) {
      setCalculations(calculations.filter(calc => calc.id !== calcId));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="checker-page">
        <header className="checker-heading">
          <div className="ledger-label">Your account</div>
          <h1>Welcome to AwardPay</h1>
          <p>Let's check if you're being paid correctly</p>
        </header>
        <div className="ap-final border-t border-rule py-6">
          <div><h2 className="text-[19px] leading-[26px]">Check My Pay</h2><p>Answer a few questions and we'll compare your pay to Fair Work data</p></div>
          <Button onClick={() => navigate("/check")}>Check a payslip</Button>
        </div>
        {!loading && calculations.length > 0 && (
          <div className="border-t-2 border-foreground py-6 mb-6">
            <p className="ledger-label">Total Potential Underpayment</p>
            <p className={`font-mono text-[40px] leading-[48px] font-medium ${totalUnderpayment > 0 ? "text-clay" : "text-primary"}`}>${totalUnderpayment.toFixed(2)}</p>
            <p className="text-[13px] text-ink-3">Total Checks: {calculations.length}</p>
          </div>
        )}
        <h2 className="text-[19px] leading-[26px] mb-5">Recent Checks</h2>
        {loading ? <p className="text-ink-3">Loading...</p> : calculations.length === 0 ? (
          <div className="border-t border-rule py-6 space-y-5"><p>No checks yet. Start your first check to see results here.</p><Button onClick={() => navigate("/check")}>Start Pay Check</Button></div>
        ) : (
          <table className="ledger-table ledger-mobile-rows">
            <thead><tr><th>Period</th><th>Award</th><th>Result</th><th>Amount</th><th>Action</th></tr></thead>
            <tbody>{calculations.slice(0, 5).map((calc) => {
              const breakdown = calc.breakdown;
              const underpayment = breakdown.mode === 'unsure' ? breakdown.overallMaxUnderpayment : (breakdown.underpayment || 0);
              const isUnderpaid = underpayment > 0;
              return (
                <tr key={calc.id}>
                  <td data-label="Period" className="font-mono text-[13px]">{format(new Date(calc.created_at), 'MMM dd, yyyy')}</td>
                  <td data-label="Award">{calc.shift_data?.awardName || breakdown.awardName || "—"}</td>
                  <td data-label="Result" className={isUnderpaid ? "text-clay" : "text-primary"}><span className="flex items-center gap-1">{isUnderpaid ? <TrendingDown className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}{isUnderpaid ? "Underpaid" : "Paid correctly"}</span></td>
                  <td data-label="Amount" className={`font-mono text-right ${isUnderpaid ? "text-clay" : "text-primary"}`}>${underpayment.toFixed(2)}</td>
                  <td data-label="Action"><div className="flex justify-end items-center gap-2">
                    <Button variant="link" onClick={() => navigate('/new-check-step-3', { state: { result: calc.breakdown, shiftDetails: calc.shift_data, fromDashboard: true } })}>Open</Button>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDeleteCalculation(calc.id, e)} title="Delete check" aria-label="Delete check"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default AppDashboard;
