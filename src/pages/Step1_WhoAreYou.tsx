import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWizard } from "@/contexts/WizardContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Step1_WhoAreYou() {
  const navigate = useNavigate();
  const { state, updateState } = useWizard();
  const [awards, setAwards] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(true);
  const [loadingClassifications, setLoadingClassifications] = useState(false);
  const [selectedAward, setSelectedAward] = useState(state.awardCode);
  const [selectedClassification, setSelectedClassification] = useState(state.classificationId);
  const [employmentType, setEmploymentType] = useState(state.employmentType || "full-time");

  useEffect(() => {
    loadAwards();
  }, []);

  useEffect(() => {
    if (selectedAward) {
      loadClassifications(selectedAward);
    }
  }, [selectedAward]);

  const loadAwards = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-awards");
      if (error) throw error;
      setAwards(data.results || []);
    } catch (error) {
      console.error("Error loading awards:", error);
      toast.error("Failed to load awards");
    } finally {
      setLoadingAwards(false);
    }
  };

  const loadClassifications = async (awardCode: string) => {
    setLoadingClassifications(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-classifications", {
        body: { awardId: awardCode },
      });
      if (error) throw error;
      setClassifications(data.results || []);
    } catch (error) {
      console.error("Error loading classifications:", error);
      toast.error("Failed to load classifications");
    } finally {
      setLoadingClassifications(false);
    }
  };

  const handleNext = () => {
    if (!selectedAward || !selectedClassification || !employmentType) {
      toast.error("Please fill in all fields");
      return;
    }

    const award = awards.find((a) => a.code === selectedAward);
    const classification = classifications.find((c) => c.classification_fixed_id.toString() === selectedClassification);

    const classificationName = classification?.parent_classification_name 
      ? `${classification.parent_classification_name} - ${classification.classification}`
      : classification?.clause_description || classification?.classification || selectedClassification;

    updateState({
      awardCode: selectedAward,
      awardName: award?.name || selectedAward,
      classificationId: selectedClassification,
      classificationName: classificationName,
      employmentType,
    });

    navigate("/step2-shift-details");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Who are you?</CardTitle>
          <p className="text-muted-foreground">Tell us about your job so we can check your pay</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="award">Your award</Label>
            {loadingAwards ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading awards...
              </div>
            ) : (
              <Select value={selectedAward} onValueChange={setSelectedAward}>
                <SelectTrigger id="award">
                  <SelectValue placeholder="Search by name or code (e.g., MA000020, Building and Construction)" />
                </SelectTrigger>
                <SelectContent>
                  {awards.map((award) => (
                    <SelectItem key={award.code} value={award.code}>
                      {award.name} ({award.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedAward && (
            <div className="space-y-2">
              <Label htmlFor="classification">Job level / classification</Label>
              {loadingClassifications ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading classifications...
                </div>
              ) : (
              <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                <SelectTrigger id="classification">
                  <SelectValue placeholder="Select your classification" />
                </SelectTrigger>
                <SelectContent>
                  {classifications.map((classification) => {
                    const displayText = classification.parent_classification_name 
                      ? `${classification.parent_classification_name} - ${classification.classification}`
                      : classification.clause_description || classification.classification;
                    
                    return (
                      <SelectItem
                        key={classification.classification_fixed_id}
                        value={classification.classification_fixed_id.toString()}
                      >
                        {displayText}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label>Employment type</Label>
            <RadioGroup value={employmentType} onValueChange={setEmploymentType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full-time" id="full-time" />
                <Label htmlFor="full-time" className="font-normal cursor-pointer">
                  Full-time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="part-time" id="part-time" />
                <Label htmlFor="part-time" className="font-normal cursor-pointer">
                  Part-time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual" className="font-normal cursor-pointer">
                  Casual
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleNext}
            className="w-full"
            size="lg"
            disabled={!selectedAward || !selectedClassification}
          >
            Next →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
