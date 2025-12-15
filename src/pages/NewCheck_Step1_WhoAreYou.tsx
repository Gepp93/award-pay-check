import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, Search, Building2, ShoppingBag, Utensils, Heart, Wrench, GraduationCap, Truck, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { PublicNavBar } from "@/components/PublicNavBar";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface IndustryCard {
  name: string;
  icon: React.ReactNode;
  keywords: string[];
}

const industryCards: IndustryCard[] = [
  { name: "Retail", icon: <ShoppingBag className="w-6 h-6" />, keywords: ["retail", "shop", "store", "sales"] },
  { name: "Hospitality", icon: <Utensils className="w-6 h-6" />, keywords: ["hospitality", "restaurant", "cafe", "hotel", "food"] },
  { name: "Healthcare", icon: <Heart className="w-6 h-6" />, keywords: ["health", "medical", "nurse", "aged care", "disability"] },
  { name: "Construction", icon: <Wrench className="w-6 h-6" />, keywords: ["construction", "building", "plumber", "electrical", "carpentry"] },
  { name: "Manufacturing", icon: <Building2 className="w-6 h-6" />, keywords: ["manufacturing", "factory", "production"] },
  { name: "Education", icon: <GraduationCap className="w-6 h-6" />, keywords: ["education", "school", "teacher", "childcare"] },
  { name: "Transport", icon: <Truck className="w-6 h-6" />, keywords: ["transport", "logistics", "driver", "warehouse"] },
  { name: "Other", icon: <Briefcase className="w-6 h-6" />, keywords: [] },
];

export default function NewCheck_Step1_WhoAreYou() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingClassifications, setLoadingClassifications] = useState(false);
  const [awards, setAwards] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [workAreas, setWorkAreas] = useState<string[]>([]);
  const [selectedAward, setSelectedAward] = useState("");
  const [selectedWorkArea, setSelectedWorkArea] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  
  // Simplified flow - default to unsure mode
  const [showClassificationPicker, setShowClassificationPicker] = useState(false);
  
  // New Phase 1 fields
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [awardSearch, setAwardSearch] = useState("");
  const [showAllAwards, setShowAllAwards] = useState(false);
  const [state, setState] = useState("NSW");

  const states = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);

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
      const sortedAwards = (data.results || []).sort((a: any, b: any) => 
        (a.name || "").localeCompare(b.name || "")
      );
      setAwards(sortedAwards);
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

  // Filter awards based on industry and search
  const filteredAwards = useMemo(() => {
    let filtered = awards;
    
    // Filter by industry keywords if selected (except "Other")
    if (selectedIndustry && selectedIndustry !== "Other") {
      const industryData = industryCards.find(i => i.name === selectedIndustry);
      if (industryData && industryData.keywords.length > 0) {
        filtered = awards.filter(award => {
          const name = (award.name || "").toLowerCase();
          return industryData.keywords.some(keyword => name.includes(keyword));
        });
      }
    }
    
    // Filter by search term
    if (awardSearch.trim()) {
      const search = awardSearch.toLowerCase();
      filtered = filtered.filter(award => 
        (award.name || "").toLowerCase().includes(search) ||
        (award.code || "").toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [awards, selectedIndustry, awardSearch]);

  // Show limited awards initially on mobile
  const displayedAwards = showAllAwards ? filteredAwards : filteredAwards.slice(0, 10);

  const loadClassifications = async (awardId: string) => {
    setLoadingClassifications(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-classifications", {
        body: { awardId },
      });

      if (error) throw error;
      
      const allClassifications = data.results || [];
      setClassifications(allClassifications);
      
      const areas = new Set<string>();
      allClassifications.forEach((cls: any) => {
        if (cls.clause_description) {
          areas.add(cls.clause_description);
        }
      });
      
      const sortedAreas = Array.from(areas).sort();
      setWorkAreas(sortedAreas);
      
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
    setShowClassificationPicker(false);
    loadClassifications(awardCode);
  };

  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    setSelectedAward("");
    setSelectedClassification("");
    setSelectedWorkArea("");
    setShowAllAwards(false);
    setAwardSearch("");
  };

  // Calculate step progress (1-3 questions)
  const stepsCompleted = useMemo(() => {
    let count = 0;
    if (selectedIndustry) count++;
    if (selectedAward) count++;
    if (employmentType) count++;
    return count;
  }, [selectedIndustry, selectedAward, employmentType]);

  const progressPercentage = (stepsCompleted / 3) * 100;
  
  const filteredClassifications = classifications.filter((cls: any) => {
    if (selectedWorkArea && cls.clause_description !== selectedWorkArea) {
      return false;
    }
    
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
    if (!selectedAward || !employmentType) {
      toast({
        title: "Missing Information",
        description: "Please select your award and employment type",
        variant: "destructive",
      });
      return;
    }

    const selectedAwardObj = awards.find(a => a.code === selectedAward);
    
    // Default to "unsure mode" unless user explicitly picked a classification
    const knowsClassification = showClassificationPicker && selectedClassification ? 'yes' : 'no';
    
    navigate("/new-check-step-2", {
      state: {
        awardCode: selectedAward,
        awardName: selectedAwardObj?.name || "",
        classificationId: knowsClassification === 'yes' ? selectedClassification : null,
        employmentType,
        knowsClassification,
        workArea: selectedWorkArea,
        industry: selectedIndustry,
        state,
      },
    });
  };

  return (
    <TooltipProvider>
      {user ? <NavBar /> : <PublicNavBar />}
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-4">
            <ProgressIndicator currentStep={1} />
            <div>
              <CardTitle className="text-xl md:text-2xl">Tell us about your job</CardTitle>
              <CardDescription>We'll find the right award rates for you</CardDescription>
            </div>
            
            {/* Inner progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stepsCompleted} of 3 answered</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Industry Selection - Visual Cards */}
            <div className="space-y-3">
              <Label className="text-base font-medium">What industry do you work in?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {industryCards.map((industry) => (
                  <button
                    key={industry.name}
                    onClick={() => handleIndustrySelect(industry.name)}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all min-h-[80px] ${
                      selectedIndustry === industry.name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    {industry.icon}
                    <span className="mt-2 text-sm font-medium">{industry.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Award Selection with Search */}
            {selectedIndustry && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">Select your Award</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px] bg-popover text-popover-foreground">
                      <p>An Award is a legal document that sets minimum pay rates and conditions for your job. Check your payslip or employment contract to find yours.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2 text-muted-foreground">Loading awards...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search awards..."
                        value={awardSearch}
                        onChange={(e) => setAwardSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    {/* Awards list */}
                    <div className="space-y-2">
                      {filteredAwards.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No awards found. Try a different search term.
                        </p>
                      ) : (
                        <>
                          {displayedAwards.map((award) => (
                            <button
                              key={award.code}
                              onClick={() => handleAwardSelect(award.code)}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${
                                selectedAward === award.code
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <div className="font-medium text-sm">{award.name}</div>
                              <div className="text-xs text-muted-foreground">{award.code}</div>
                            </button>
                          ))}
                          
                          {filteredAwards.length > 10 && !showAllAwards && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAllAwards(true)}
                              className="w-full"
                            >
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Show {filteredAwards.length - 10} more awards
                            </Button>
                          )}
                          
                          {showAllAwards && filteredAwards.length > 10 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAllAwards(false)}
                              className="w-full"
                            >
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Show less
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Work Area (if available) */}
            {selectedAward && workAreas.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label>Work Area / Category</Label>
                {loadingClassifications ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* Optional: Classification picker (collapsed by default) */}
            {selectedAward && selectedWorkArea && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <button
                  onClick={() => setShowClassificationPicker(!showClassificationPicker)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {showClassificationPicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showClassificationPicker ? "Skip classification selection" : "I know my exact classification (optional)"}
                </button>
                
                {showClassificationPicker && filteredClassifications.length > 0 && (
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
                )}
              </div>
            )}

            {/* Step 3: Employment Type */}
            {selectedAward && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">Employment Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px] bg-popover text-popover-foreground">
                      <p><strong>Full-time:</strong> Regular hours, usually 38/week<br/>
                      <strong>Part-time:</strong> Regular but fewer hours<br/>
                      <strong>Casual:</strong> No guaranteed hours, higher base rate</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <RadioGroup value={employmentType} onValueChange={setEmploymentType} className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Full-time" id="full-time" />
                    <Label htmlFor="full-time" className="font-normal cursor-pointer">Full-time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Part-time" id="part-time" />
                    <Label htmlFor="part-time" className="font-normal cursor-pointer">Part-time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Casual" id="casual" />
                    <Label htmlFor="casual" className="font-normal cursor-pointer">Casual</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* State (optional, collapsed) */}
            {selectedAward && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-sm text-muted-foreground">State (optional)</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {states.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Next Button - Sticky on mobile */}
            <div className="pt-4">
              <Button 
                onClick={handleNext} 
                className="w-full" 
                size="lg"
                disabled={!selectedAward || !employmentType}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
