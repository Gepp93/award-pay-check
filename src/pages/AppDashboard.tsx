import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FileText, TrendingDown, CheckCircle } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Welcome to AwardPay</h1>
            <p className="text-muted-foreground text-lg">
              Let's check if you're being paid correctly
            </p>
          </div>

          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                <Calculator className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Check My Pay</CardTitle>
              <CardDescription className="text-base">
                Answer a few questions and we'll compare your pay to Fair Work data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                size="lg"
                onClick={() => navigate("/new-check-step-1")}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 text-lg px-8 py-6 h-14 font-semibold"
              >
                Start Pay Check
              </Button>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recent Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : calculations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No checks yet. Start your first check to see results here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {calculations.slice(0, 5).map((calc) => {
                      const breakdown = calc.breakdown;
                      const underpayment = breakdown.mode === 'unsure' 
                        ? breakdown.overallMaxUnderpayment 
                        : (breakdown.underpayment || 0);
                      const isUnderpaid = underpayment > 0;

                      return (
                        <div key={calc.id} className="border rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(calc.created_at), 'MMM dd, yyyy')}
                            </span>
                            {isUnderpaid ? (
                              <span className="flex items-center gap-1 text-xs text-destructive">
                                <TrendingDown className="h-3 w-3" />
                                Underpaid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Correct
                              </span>
                            )}
                          </div>
                          {isUnderpaid && (
                            <div className="text-sm font-semibold text-destructive">
                              ${underpayment.toFixed(2)} underpayment
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : calculations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Stats will appear here after you complete your first check.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Checks</span>
                      <span className="text-2xl font-bold">{calculations.length}</span>
                    </div>
                    {totalUnderpayment > 0 && (
                      <div className="pt-3 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Total Potential Underpayment</div>
                        <div className="text-2xl font-bold text-destructive">
                          ${totalUnderpayment.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;
