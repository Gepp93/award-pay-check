import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    if (!data?.onboarding_completed) {
      navigate("/onboarding");
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
          <PayBreakdown breakdown={breakdown} shiftData={shiftData} />
        </div>
      </div>
    </div>
  );
};

export default Calculator;
