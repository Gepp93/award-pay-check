import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, HelpCircle, Search, Building2, ShoppingBag, Utensils, Heart, Wrench, GraduationCap, Truck, Briefcase, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
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
  { name: "Retail", icon: <ShoppingBag className="w-7 h-7 md:w-6 md:h-6" />, keywords: ["retail", "shop", "store", "sales"] },
  { name: "Hospitality", icon: <Utensils className="w-7 h-7 md:w-6 md:h-6" />, keywords: ["hospitality", "restaurant", "cafe", "hotel", "food"] },
  { name: "Healthcare", icon: <Heart className="w-7 h-7 md:w-6 md:h-6" />, keywords: ["health", "medical", "nurse", "aged care", "disability"] },
  { name: "Construction", icon: <Wrench className="w-7 h-7 md:w-6 md:h-6" />, keywords: ["construction", "building", "plumber", "electrical", "carpentry"] },
  { name: "Manufacturing", icon: <Building2 className="w-7 h-7 md:w-6 md:h-6" />, keywords: ["manufacturing", "factory", "production"] },
  { name: "Education", icon: <GraduationCap className="w-7 h-7 md:w-6 md:h-6" />, keywords: ["education", "school", "teacher", "childcare"] },
  { name: "Transport", icon: <Truck className="w-7 h-7 md:w-6 md:h-6" />, keywords: ["transport", "logistics", "driver", "warehouse"] },
  { name: "Other", icon: <Briefcase className="w-7 h-7 md:w-6 md:h-6" />, keywords: [] },
];

export default function NewCheck_Step1_WhoAreYou() {
  const navigate = useNavigate();
  const location = useLocation();
  const parsedPayslip = (location.state as any)?.parsedPayslip || null;
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

  // Pre-fill from AI-parsed payslip (Step 0).
  useEffect(() => {
    if (!parsedPayslip) return;
    const et = parsedPayslip.employment_type;
    if (et === "Full-time" || et === "Part-time" || et === "Casual") {
      setEmploymentType(et);
    }
    const hint =
      parsedPayslip.classification_or_role ||
      parsedPayslip.employer_name ||
      "";
    if (hint) setAwardSearch(hint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const displayedAwards = showAllAwards ? filteredAwards : filteredAwards.slice(0, 8);

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

  const canProceed = selectedAward && employmentType;

  const handleNext = () => {
    if (!canProceed) {
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
        parsedPayslip,
      },
    });
  };

  return (
    <TooltipProvider>
      {user ? <NavBar /> : <PublicNavBar />}
      {/* Add top padding to account for fixed PublicNavBar (h-20 = 80px) when not logged in */}
      <div className={`min-h-screen bg-background pb-24 md:pb-8 ${!user ? 'pt-24' : ''}`}>
        <div className="flex items-start justify-center p-4 pt-8">
          <Card className="w-full max-w-2xl">
            <CardHeader className="space-y-4 px-4 md:px-6">
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
            
            <CardContent className="space-y-6 px-4 md:px-6">
              {/* Step 1: Industry Selection - Visual Cards with larger touch targets */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What industry do you work in?</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {industryCards.map((industry) => (
                    <button
                      key={industry.name}
                      onClick={() => handleIndustrySelect(industry.name)}
                      className={`flex flex-col items-center justify-center p-5 md:p-4 rounded-xl border-2 transition-all min-h-[100px] md:min-h-[80px] active:scale-95 ${
                        selectedIndustry === industry.name
                          ? "border-primary bg-primary/10 text-primary shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-muted/50 active:bg-muted"
                      }`}
                    >
                      {industry.icon}
                      <span className="mt-2 text-sm font-medium text-center">{industry.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Award Selection with Search */}
              {selectedIndustry && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Select your Award</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="touch-manipulation p-1">
                          <HelpCircle className="w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
                        </button>
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
                      {/* Search input with larger touch target */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          placeholder="Search awards..."
                          value={awardSearch}
                          onChange={(e) => setAwardSearch(e.target.value)}
                          className="pl-10 h-12 md:h-10 text-base"
                        />
                      </div>
                      
                      {/* Awards list with larger touch targets */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto overscroll-contain -mx-1 px-1">
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
                                className={`w-full text-left p-4 md:p-3 rounded-xl md:rounded-lg border-2 transition-all active:scale-[0.98] ${
                                  selectedAward === award.code
                                    ? "border-primary bg-primary/10 shadow-md"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50 active:bg-muted"
                                }`}
                              >
                                <div className="font-medium text-sm leading-tight">{award.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">{award.code}</div>
                              </button>
                            ))}
                            
                            {filteredAwards.length > 8 && !showAllAwards && (
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => setShowAllAwards(true)}
                                className="w-full h-12 md:h-10"
                              >
                                <ChevronDown className="w-5 h-5 mr-2" />
                                Show {filteredAwards.length - 8} more awards
                              </Button>
                            )}
                            
                            {showAllAwards && filteredAwards.length > 8 && (
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => setShowAllAwards(false)}
                                className="w-full h-12 md:h-10"
                              >
                                <ChevronUp className="w-5 h-5 mr-2" />
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
                <div className="space-y-2 animate-fade-in">
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
                      <SelectTrigger className="bg-background h-12 md:h-10 text-base">
                        <SelectValue placeholder="Select work area" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border max-h-[300px] z-50">
                        {workAreas.map((area) => (
                          <SelectItem key={area} value={area} className="py-3 md:py-2">
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
                <div className="space-y-2 animate-fade-in">
                  <button
                    onClick={() => setShowClassificationPicker(!showClassificationPicker)}
                    className="text-sm text-primary hover:underline flex items-center gap-1 py-2 touch-manipulation"
                  >
                    {showClassificationPicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showClassificationPicker ? "Skip classification selection" : "I know my exact classification (optional)"}
                  </button>
                  
                  {showClassificationPicker && filteredClassifications.length > 0 && (
                    <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                      <SelectTrigger className="bg-background h-12 md:h-10 text-base">
                        <SelectValue placeholder="Select your classification" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border max-h-[300px] z-50">
                        {filteredClassifications.map((cls: any) => (
                          <SelectItem key={cls.classification_fixed_id} value={cls.classification_fixed_id.toString()} className="py-3 md:py-2">
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

              {/* Step 3: Employment Type with larger touch targets */}
              {selectedAward && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Employment Type</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="touch-manipulation p-1">
                          <HelpCircle className="w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] bg-popover text-popover-foreground">
                        <p><strong>Full-time:</strong> Regular hours, usually 38/week<br/>
                        <strong>Part-time:</strong> Regular but fewer hours<br/>
                        <strong>Casual:</strong> No guaranteed hours, higher base rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Employment type as larger buttons for mobile */}
                  <div className="grid grid-cols-3 gap-2">
                    {["Full-time", "Part-time", "Casual"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setEmploymentType(type)}
                        className={`py-4 md:py-3 px-3 rounded-xl md:rounded-lg border-2 font-medium text-sm transition-all active:scale-95 ${
                          employmentType === type
                            ? "border-primary bg-primary/10 text-primary shadow-md"
                            : "border-border hover:border-primary/50 hover:bg-muted/50 active:bg-muted"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* State (optional, collapsed) */}
              {selectedAward && (
                <div className="space-y-2 animate-fade-in">
                  <Label className="text-sm text-muted-foreground">State (optional)</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger className="bg-background h-12 md:h-10 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      {states.map((st) => (
                        <SelectItem key={st} value={st} className="py-3 md:py-2">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Spacer for sticky button on desktop */}
              <div className="h-4 md:h-0" />
              
              {/* Next Button - Desktop only (sticky button below for mobile) */}
              <div className="hidden md:block pt-2">
                <Button 
                  onClick={handleNext} 
                  className="w-full" 
                  size="lg"
                  disabled={!canProceed}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sticky Next Button - Mobile only */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:hidden z-40">
          <Button 
            onClick={handleNext} 
            className="w-full h-14 text-base font-semibold shadow-lg" 
            size="lg"
            disabled={!canProceed}
          >
            {canProceed ? (
              <>
                Next Step
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              "Select your award to continue"
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
