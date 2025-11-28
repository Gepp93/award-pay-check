import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { IndustrySelection } from "@/components/onboarding/IndustrySelection";
import { JobTypeSelection } from "@/components/onboarding/JobTypeSelection";
import { EmploymentTypeSelection } from "@/components/onboarding/EmploymentTypeSelection";
import { AwardRecommendation } from "@/components/onboarding/AwardRecommendation";
import { ManualAwardSelection } from "@/components/onboarding/ManualAwardSelection";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    industry: "",
    jobType: "",
    employmentType: "",
    awardId: "",
    awardName: "",
    awardCode: "",
  });

  const handleSkipOnboarding = () => {
    setShowManualSelection(true);
  };

  const handleIndustrySelect = (industry: string) => {
    setOnboardingData({ ...onboardingData, industry });
    setStep(1);
  };

  const handleJobTypeSelect = (jobType: string) => {
    setOnboardingData({ ...onboardingData, jobType });
    setStep(2);
  };

  const handleEmploymentTypeSelect = (employmentType: string) => {
    setOnboardingData({ ...onboardingData, employmentType });
    setStep(3);
  };

  const handleAwardConfirm = async (awardId: string, awardName: string, awardCode: string) => {
    await saveOnboardingData(awardId, awardName, awardCode);
  };

  const handleManualAwardSelect = async (awardId: string, awardName: string, awardCode: string) => {
    await saveOnboardingData(awardId, awardName, awardCode);
  };

  const saveOnboardingData = async (awardId: string, awardName: string, awardCode: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          industry: onboardingData.industry,
          job_type: onboardingData.jobType,
          employment_type: onboardingData.employmentType,
          award_id: awardId,
          award_name: awardName,
          award_code: awardCode,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Onboarding complete!");
      navigate("/calculator");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast.error("Failed to save your information");
    }
  };

  if (showManualSelection) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <ManualAwardSelection onSelect={handleManualAwardSelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {step === 0 && (
          <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-3xl">Welcome to AwardPay</CardTitle>
              <CardDescription className="text-lg">
                Let's find your correct Australian Modern Award in 4 quick steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSkipOnboarding}
                variant="outline"
                className="w-full"
              >
                I already know my award → skip onboarding
              </Button>
              <Button
                onClick={() => setStep(1)}
                className="w-full bg-accent hover:bg-accent/90"
              >
                Let's Get Started
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && <IndustrySelection onSelect={handleIndustrySelect} />}
        {step === 2 && <JobTypeSelection industry={onboardingData.industry} onSelect={handleJobTypeSelect} onBack={() => setStep(1)} />}
        {step === 3 && <EmploymentTypeSelection onSelect={handleEmploymentTypeSelect} onBack={() => setStep(2)} />}
        {step === 4 && (
          <AwardRecommendation
            industry={onboardingData.industry}
            jobType={onboardingData.jobType}
            employmentType={onboardingData.employmentType}
            onConfirm={handleAwardConfirm}
            onManualSelect={() => setShowManualSelection(true)}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
