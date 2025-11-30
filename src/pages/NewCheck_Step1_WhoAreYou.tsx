import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function NewCheck_Step1_WhoAreYou() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingClassifications, setLoadingClassifications] = useState(false);
  const [awards, setAwards] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [workAreas, setWorkAreas] = useState<string[]>([]);
  const [selectedAward, setSelectedAward] = useState("");
  const [selectedWorkArea, setSelectedWorkArea] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [knowsClassification, setKnowsClassification] = useState<'yes' | 'no'>('yes');

  useEffect(() => {
    loadAllAwards();
  }, []);

  const loadAllAwards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-awards", {
        body: { search: "" },
      });

      if (error) throw error;
      setAwards(data.results || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch awards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClassifications = async (awardId: string) => {
    setLoadingClassifications(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-classifications", {
        body: { awardId },
      });

      if (error) throw error;
      
      console.log("Classifications data received:", data);
      console.log("Number of classifications:", data.results?.length);
      if (data.results?.[0]) {
        console.log("Sample classification:", data.results[0]);
      }
      
      const allClassifications = data.results || [];
      setClassifications(allClassifications);
      
      // Extract unique work areas from clause_description
      const areas = new Set<string>();
      allClassifications.forEach((cls: any) => {
        if (cls.clause_description) {
          areas.add(cls.clause_description);
        }
      });
      
      const sortedAreas = Array.from(areas).sort();
      setWorkAreas(sortedAreas);
      
      // Set default work area to first non-trainee option or first option
      const defaultArea = sortedAreas.find(area => 
        !area.toLowerCase().includes('trainee') && 
        !area.toLowerCase().includes('school')
      ) || sortedAreas[0];
      
      setSelectedWorkArea(defaultArea || "");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classifications",
        variant: "destructive",
      });
    } finally {
      setLoadingClassifications(false);
    }
  };

  const handleAwardSelect = (awardCode: string) => {
    setSelectedAward(awardCode);
    setSelectedClassification("");
    setSelectedWorkArea("");
    setClassifications([]);
    setWorkAreas([]);
    loadClassifications(awardCode);
  };
  
  // Filter classifications by selected work area and exclude trainee options when not applicable
  const filteredClassifications = classifications.filter((cls: any) => {
    // Filter by work area if selected
    if (selectedWorkArea && cls.clause_description !== selectedWorkArea) {
      return false;
    }
    
    // If work area is NOT a trainee/school category, exclude trainee classifications
    const isTraineeWorkArea = selectedWorkArea?.toLowerCase().includes('trainee') || 
                               selectedWorkArea?.toLowerCase().includes('school');
    
    if (!isTraineeWorkArea) {
      const classificationName = cls.classification?.toLowerCase() || '';
      const isTraineeClassification = 
        classificationName.includes('school leaver') ||
        classificationName.includes('plus 1 year') ||
        classificationName.includes('plus 2 year') ||
        classificationName.includes('plus 3 year') ||
        classificationName.includes('trainee');
      
      if (isTraineeClassification) {
        return false;
      }
    }
    
    return true;
  });

  const handleNext = () => {
    // Validate based on whether user knows classification
    if (!selectedAward || !employmentType) {
      toast({
        title: "Missing Information",
        description: "Please complete all fields",
        variant: "destructive",
      });
      return;
    }

    if (knowsClassification === 'yes' && !selectedClassification) {
      toast({
        title: "Missing Information",
        description: "Please select your job classification",
        variant: "destructive",
      });
      return;
    }

    navigate("/new-check-step-2", {
      state: {
        awardCode: selectedAward,
        classificationId: knowsClassification === 'yes' ? selectedClassification : null,
        employmentType,
        knowsClassification,
        workArea: selectedWorkArea,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Step 1: Who are you?</CardTitle>
          <CardDescription>Let's identify your award and job classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select your Award</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading awards...</span>
              </div>
            ) : (
              <Select value={selectedAward} onValueChange={handleAwardSelect}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select an award" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border max-h-[300px] z-50">
                  {awards.map((award) => (
                    <SelectItem key={award.code} value={award.code}>
                      {award.code} - {award.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedAward && (
            <>
              <div className="space-y-2">
                <Label>Work Area / Category</Label>
                {loadingClassifications ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading work areas...</span>
                  </div>
                ) : workAreas.length > 0 ? (
                  <Select value={selectedWorkArea} onValueChange={(value) => {
                    setSelectedWorkArea(value);
                    setSelectedClassification("");
                  }}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select work area" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border max-h-[300px] z-50">
                      {workAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>

              {selectedWorkArea && (
                <>
                  <div className="space-y-2">
                    <Label>Do you know your exact job classification?</Label>
                    <RadioGroup value={knowsClassification} onValueChange={(value: 'yes' | 'no') => {
                      setKnowsClassification(value);
                      if (value === 'no') {
                        setSelectedClassification("");
                      }
                    }}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="knows-yes" />
                        <Label htmlFor="knows-yes" className="font-normal cursor-pointer">
                          Yes, I know it
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="knows-no" />
                        <Label htmlFor="knows-no" className="font-normal cursor-pointer">
                          No, I'm not sure
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {knowsClassification === 'yes' && (
                    <div className="space-y-2">
                      <Label>Job Classification / Level</Label>
                      {filteredClassifications.length > 0 ? (
                        <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select your classification" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border max-h-[300px] z-50">
                            {filteredClassifications.map((cls: any) => (
                              <SelectItem key={cls.classification_fixed_id} value={cls.classification_fixed_id.toString()}>
                                <div className="flex flex-col">
                                  <span>{cls.classification}</span>
                                  {cls.parent_classification_name && (
                                    <span className="text-xs text-muted-foreground">{cls.parent_classification_name}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground">No classifications available for this work area</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Employment Type</Label>
            <RadioGroup value={employmentType} onValueChange={setEmploymentType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Full-time" id="full-time" />
                <Label htmlFor="full-time" className="font-normal cursor-pointer">
                  Full-time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Part-time" id="part-time" />
                <Label htmlFor="part-time" className="font-normal cursor-pointer">
                  Part-time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Casual" id="casual" />
                <Label htmlFor="casual" className="font-normal cursor-pointer">
                  Casual
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleNext} className="w-full" size="lg">
            Next
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
