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
      <div className={`checker-page checker-form ${!user ? "checker-public" : ""}`}>
        <div>
          <main>
            <header className="checker-heading space-y-4">
              <ProgressIndicator currentStep={1} />
              <div>
                <h1>Tell us about your job</h1>
                <p>We'll find the right award rates for you</p>
              </div>
              
              {/* Inner progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[13px] text-muted-foreground">
                  <span>{stepsCompleted} of 3 answered</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </header>
            
            <div className="space-y-6">
              {parsedPayslip && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                  Pulled from your payslip — please confirm.
                </div>
              )}
              {/* Step 1: Industry Selection - Visual Cards with larger touch targets */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What industry do you work in?</Label>
                <div className="grid grid-cols-1 gap-2">
                  {industryCards.map((industry) => (
                    <Button
                      variant="outline" key={industry.name}
                      onClick={() => handleIndustrySelect(industry.name)}
                      className={`checker-choice  ${
                        selectedIndustry === industry.name
                          ? "is-selected border-primary bg-primary-soft text-primary "
                          : "border-input hover:border-primary"
                      }`}
                    >
                      <span className="choice-radio" aria-hidden="true" />
                      <span className="text-base font-medium text-left">{industry.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 2: Award Selection with Search */}
              {selectedIndustry && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Select your Award</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="About award selection" className="touch-manipulation p-1">
                          <HelpCircle className="w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
                        </Button>
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
                          className="pl-10 h-12 text-base"
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
                              <Button
                                variant="outline" key={award.code}
                                onClick={() => handleAwardSelect(award.code)}
                                className={`checker-choice  ${
                                  selectedAward === award.code
                                    ? "is-selected border-primary bg-primary-soft "
                                    : "border-input hover:border-primary"
                                }`}
                              >
                                <span className="choice-radio" aria-hidden="true" /><div className="min-w-0"><div className="font-medium text-base leading-snug">{award.name}</div>
                                <div className="text-[13px] text-muted-foreground mt-1">{award.code}</div></div>
                              </Button>
                            ))}
                            
                            {filteredAwards.length > 8 && !showAllAwards && (
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => setShowAllAwards(true)}
                                className="w-full h-12"
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
                                className="w-full h-12"
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
                <div className="space-y-2">
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
                      <SelectTrigger className="bg-background h-12 text-base">
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
                <div className="space-y-2">
                  <Button
                    variant="link" onClick={() => setShowClassificationPicker(!showClassificationPicker)}
                    className="text-sm text-primary hover:underline flex items-center gap-1 py-2 touch-manipulation"
                  >
                    {showClassificationPicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showClassificationPicker ? "Skip classification selection" : "I know my exact classification (optional)"}
                  </Button>
                  
                  {showClassificationPicker && filteredClassifications.length > 0 && (
                    <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                      <SelectTrigger className="bg-background h-12 text-base">
                        <SelectValue placeholder="Select your classification" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border max-h-[300px] z-50">
                        {filteredClassifications.map((cls: any) => (
                          <SelectItem key={cls.classification_fixed_id} value={cls.classification_fixed_id.toString()} className="py-3 md:py-2">
                            <div className="flex flex-col">
                              <span>{cls.classification}</span>
                              {cls.parent_classification_name && (
                                <span className="text-[13px] text-muted-foreground">{cls.parent_classification_name}</span>
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Employment Type</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="About employment types" className="touch-manipulation p-1">
                          <HelpCircle className="w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] bg-popover text-popover-foreground">
                        <p><strong>Full-time:</strong> Regular hours, usually 38/week<br/>
                        <strong>Part-time:</strong> Regular but fewer hours<br/>
                        <strong>Casual:</strong> No guaranteed hours, higher base rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Employment type as larger buttons for mobile */}
                  <div className="grid grid-cols-1 gap-2">
                    {["Full-time", "Part-time", "Casual"].map((type) => (
                      <Button
                        variant="outline" key={type}
                        onClick={() => setEmploymentType(type)}
                        className={`checker-choice  ${
                          employmentType === type
                            ? "is-selected border-primary bg-primary-soft text-primary "
                            : "border-input hover:border-primary"
                        }`}
                      >
                        <span className="choice-radio" aria-hidden="true" />{type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* State (optional, collapsed) */}
              {selectedAward && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">State (optional)</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger className="bg-background h-12 text-base">
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
              <div className="checker-actions hidden md:flex pt-2">
                <Button 
                  onClick={handleNext} 
                  className="md:w-auto" 
                  size="lg"
                  disabled={!canProceed}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </main>
        </div>
        
        {/* Sticky Next Button - Mobile only */}
        <div className="checker-actions md:hidden">
          <Button 
            onClick={handleNext} 
            className="w-full h-12 text-base font-semibold " 
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
