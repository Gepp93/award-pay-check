import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndustrySelection } from "@/components/onboarding/IndustrySelection";
import { JobTypeSelection } from "@/components/onboarding/JobTypeSelection";
import { EmploymentTypeSelection } from "@/components/onboarding/EmploymentTypeSelection";
import { AwardRecommendation } from "@/components/onboarding/AwardRecommendation";
import { ManualAwardSelection } from "@/components/onboarding/ManualAwardSelection";
import { Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ViewMode = "start" | "guided" | "manual";
type GuidedStep = "industry" | "jobType" | "employmentType" | "recommendation";

export default function AwardFinder() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("start");
  const [guidedStep, setGuidedStep] = useState<GuidedStep>("industry");
  const [industry, setIndustry] = useState("");
  const [jobType, setJobType] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  const handleIndustrySelect = (selectedIndustry: string) => {
    setIndustry(selectedIndustry);
    setGuidedStep("jobType");
  };

  const handleJobTypeSelect = (selectedJobType: string) => {
    setJobType(selectedJobType);
    setGuidedStep("employmentType");
  };

  const handleEmploymentTypeSelect = (selectedEmploymentType: string) => {
    setEmploymentType(selectedEmploymentType);
    setGuidedStep("recommendation");
  };

  const handleAwardConfirm = async (awardData: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          award_id: awardData.awardId,
          award_name: awardData.awardName,
          award_code: awardData.awardCode,
          industry,
          job_type: jobType,
          employment_type: employmentType,
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Award saved successfully!");
      navigate("/award-overview");
    } catch (error) {
      console.error("Error saving award:", error);
      toast.error("Failed to save award information");
    }
  };

  const handleManualAwardSelect = async (awardData: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          award_id: awardData.awardId,
          award_name: awardData.awardName,
          award_code: awardData.awardCode,
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Award saved successfully!");
      navigate("/award-overview");
    } catch (error) {
      console.error("Error saving award:", error);
      toast.error("Failed to save award information");
    }
  };

  if (viewMode === "start") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-card/50 backdrop-blur-lg border-border shadow-card">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl font-bold">Find Your Award</CardTitle>
            <CardDescription className="text-base">
              We'll help you find the right award and job level so we can check your pay.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full h-auto py-6 flex flex-col items-center gap-3"
              onClick={() => {
                setViewMode("guided");
                setGuidedStep("industry");
              }}
            >
              <Sparkles className="w-6 h-6" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold">Help me find my award</span>
                <span className="text-sm opacity-80">Answer a few questions</span>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-auto py-6 flex flex-col items-center gap-3"
              onClick={() => setViewMode("manual")}
            >
              <Search className="w-6 h-6" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold">I already know my award</span>
                <span className="text-sm opacity-80">Search by code or name</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === "manual") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setViewMode("start")}
          >
            ← Back
          </Button>
          <ManualAwardSelection onSelect={handleManualAwardSelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {guidedStep === "industry" && (
          <IndustrySelection onSelect={handleIndustrySelect} />
        )}

        {guidedStep === "jobType" && (
          <JobTypeSelection
            industry={industry}
            onSelect={handleJobTypeSelect}
            onBack={() => setGuidedStep("industry")}
          />
        )}

        {guidedStep === "employmentType" && (
          <EmploymentTypeSelection
            onSelect={handleEmploymentTypeSelect}
            onBack={() => setGuidedStep("jobType")}
          />
        )}

        {guidedStep === "recommendation" && (
          <AwardRecommendation
            industry={industry}
            jobType={jobType}
            employmentType={employmentType}
            onConfirm={handleAwardConfirm}
            onManualSelect={() => setViewMode("manual")}
            onBack={() => setGuidedStep("employmentType")}
          />
        )}
      </div>
    </div>
  );
}