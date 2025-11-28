import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AwardRecommendationProps {
  industry: string;
  jobType: string;
  employmentType: string;
  onConfirm: (awardId: string, awardName: string, awardCode: string) => void;
  onManualSelect: () => void;
  onBack: () => void;
}

const awardMapping: Record<string, { name: string; code: string }> = {
  "Hospitality": { name: "Hospitality Industry (General) Award", code: "MA000009" },
  "Building and Construction": { name: "Building and Construction General On-site Award", code: "MA000020" },
  "Retail": { name: "General Retail Industry Award", code: "MA000004" },
  "Transport and Logistics": { name: "Road Transport and Distribution Award", code: "MA000038" },
  "Clerical and Administrative": { name: "Clerks—Private Sector Award", code: "MA000002" },
  "Cleaning Services": { name: "Cleaning Services Award", code: "MA000022" },
  "Health and Aged Care": { name: "Nurses Award", code: "MA000034" },
  "Early Childhood Education and Care": { name: "Children's Services Award", code: "MA000120" },
  "Manufacturing": { name: "Manufacturing and Associated Industries and Occupations Award", code: "MA000010" },
  "Mining": { name: "Mining Industry Award", code: "MA000011" },
  "Security Services": { name: "Security Services Industry Award", code: "MA000016" },
  "Fast Food": { name: "Fast Food Industry Award", code: "MA000003" },
};

export const AwardRecommendation = ({
  industry,
  jobType,
  employmentType,
  onConfirm,
  onManualSelect,
  onBack,
}: AwardRecommendationProps) => {
  const [loading, setLoading] = useState(true);
  const [recommendedAward, setRecommendedAward] = useState<{
    id: string;
    name: string;
    code: string;
  } | null>(null);

  useEffect(() => {
    const fetchRecommendedAward = async () => {
      try {
        const mapping = awardMapping[industry];
        if (!mapping) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke("get-awards", {
          body: { search: mapping.code },
        });

        if (error) throw error;

        if (data?.results && data.results.length > 0) {
          const award = data.results[0];
          setRecommendedAward({
            id: award.id || award.code,
            name: award.title,
            code: award.code,
          });
        }
      } catch (error) {
        console.error("Error fetching recommended award:", error);
        toast.error("Failed to fetch award recommendation");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedAward();
  }, [industry]);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
        <CardContent className="py-8">
          <div className="text-center">Loading recommendation...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
      <CardHeader>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-fit mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <CardTitle>Step 4: Award Recommendation</CardTitle>
        <CardDescription>Based on your answers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-accent/10 border border-accent rounded-lg p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-accent mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Your Recommended Award</h3>
              {recommendedAward ? (
                <>
                  <p className="text-lg mb-1">{recommendedAward.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {recommendedAward.code}</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p><strong>Industry:</strong> {industry}</p>
                    <p><strong>Role:</strong> {jobType}</p>
                    <p><strong>Employment:</strong> {employmentType}</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  We couldn't find a specific recommendation. Please select your award manually.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {recommendedAward && (
            <Button
              onClick={() => onConfirm(recommendedAward.id, recommendedAward.name, recommendedAward.code)}
              className="bg-accent hover:bg-accent/90"
            >
              Yes, this is correct
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onManualSelect}
          >
            No, choose my award manually
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
