import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShiftInputForm } from "@/components/calculator/ShiftInputForm";
import { PayBreakdown } from "@/components/calculator/PayBreakdown";
import { NavBar } from "@/components/NavBar";
import { calculatePay, type ShiftData } from "@/lib/payCalculator";

const Calculator = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [shiftData, setShiftData] = useState<ShiftData | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [awardInfo, setAwardInfo] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      checkOnboarding(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      checkOnboarding(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkOnboarding = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed, award_id, award_name, award_code, industry, job_type, employment_type")
      .eq("id", userId)
      .single();

    if (!data?.onboarding_completed) {
      navigate("/onboarding");
      return;
    }
    
    // Set award info if available
    if (data.award_name) {
      setAwardInfo({
        awardId: data.award_id,
        awardName: data.award_name,
        awardCode: data.award_code,
        industry: data.industry,
        jobType: data.job_type,
        employmentType: data.employment_type,
      });
    }
  };

  const loadUserProfile = async (userId: string) => {
    // Profile loaded for potential future use
  };

  const handleCalculate = async (data: ShiftData) => {
    setShiftData(data);
    const result = calculatePay(data);
    setBreakdown(result);

    // Save calculation
    await supabase.from("calculations").insert([{
      user_id: user.id,
      shift_data: data as any,
      breakdown: result as any,
    }]);

    toast.success("Calculation complete!");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Pay Calculator</h1>
          <p className="text-muted-foreground">
            Calculate your pay based on Australian Modern Awards
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ShiftInputForm onCalculate={handleCalculate} />
          <div className="space-y-6">
            {awardInfo && (
              <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl">Your Award Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Award Name</p>
                    <p className="font-semibold">{awardInfo.awardName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Award Code</p>
                    <p className="font-mono">{awardInfo.awardCode}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Industry</p>
                      <p className="text-sm font-medium">{awardInfo.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                      <p className="text-sm font-medium">{awardInfo.employmentType}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Job Classification</p>
                    <p className="text-sm font-medium">{awardInfo.jobType}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/onboarding")}
                  >
                    Update Award Details
                  </Button>
                </CardContent>
              </Card>
            )}
            <PayBreakdown breakdown={breakdown} shiftData={shiftData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
