import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { ClassificationList } from "@/components/award-overview/ClassificationList";
import { RateCards } from "@/components/award-overview/RateCards";

export default function AwardOverview() {
  const navigate = useNavigate();
  const [awardInfo, setAwardInfo] = useState<any>(null);
  const [selectedClassification, setSelectedClassification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAwardInfo();
  }, []);

  const checkAwardInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      if (!data.award_id || !data.onboarding_completed) {
        toast.info("Please select your award first");
        navigate("/award-finder");
        return;
      }

      setAwardInfo({
        awardId: data.award_id,
        awardName: data.award_name || data.award_code,
        awardCode: data.award_code,
        industry: data.industry,
        jobType: data.job_type,
        employmentType: data.employment_type,
      });
    } catch (error) {
      console.error("Error fetching award info:", error);
      toast.error("Failed to load award information");
    } finally {
      setLoading(false);
    }
  };

  const handleClassificationSelect = (classification: any) => {
    setSelectedClassification(classification);
  };

  const handleCheckWeeklyPay = async () => {
    if (!selectedClassification) {
      toast.error("Please select a classification first");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from("profiles")
        .update({
          classification_fixed_id: selectedClassification.classification_fixed_id,
          classification_name: selectedClassification.classification_level,
        })
        .eq("id", session.user.id);

      navigate("/weekly-pay-check");
    } catch (error) {
      console.error("Error saving classification:", error);
      toast.error("Failed to save classification");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading award information...</p>
        </div>
      </div>
    );
  }

  if (!awardInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Award Overview</h1>
          <p className="text-muted-foreground">{awardInfo.awardName}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <ClassificationList
              awardId={awardInfo.awardCode}
              selectedClassification={selectedClassification}
              onSelect={handleClassificationSelect}
            />
          </div>

          <div>
            <RateCards
              awardId={awardInfo.awardCode}
              classification={selectedClassification}
              employmentType={awardInfo.employmentType}
            />
          </div>
        </div>

        {selectedClassification && (
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={handleCheckWeeklyPay}
              className="w-full max-w-md"
            >
              Check my weekly pay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}