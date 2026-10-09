import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, DollarSign, Clock, Gift, ChevronDown, Coffee, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFallbackPenalties, getFallbackAllowances } from "@/lib/fallbackAwardData";

interface RateCardsProps {
  awardId: string;
  classification: any;
  employmentType: string;
}

export const RateCards = ({ awardId, classification, employmentType }: RateCardsProps) => {
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [penalties, setPenalties] = useState<any>(null);
  const [allowances, setAllowances] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAllPenalties, setShowAllPenalties] = useState(false);
  const [showAllAllowances, setShowAllAllowances] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState({ penalties: false, allowances: false });

  useEffect(() => {
    if (classification) {
      console.log('RateCards: Classification changed, fetching data for:', classification.classification_level);
      fetchRateData();
    } else {
      // Reset state when no classification
      setBaseRate(null);
      setPenalties(null);
      setAllowances(null);
    }
  }, [classification?.classification_fixed_id, awardId]);

  // Filter allowances based on classification keywords
  const filterAllowancesByClassification = (allowancesList: any[]) => {
    if (!classification || !allowancesList || allowancesList.length === 0) return allowancesList;

    const classificationText = `${classification.classification || ''} ${classification.parent_classification_name || ''} ${classification.clause_description || ''}`.toLowerCase();
    
    // Extract role keywords from classification
    const roleKeywords = [
      'operator', 'foreman', 'supervisor', 'director', 'manager', 'driver',
      'labourer', 'tradesperson', 'apprentice', 'cook', 'chef', 'teacher',
      'assistant', 'coordinator', 'leading hand', 'plant', 'machinery', 'forklift',
      'excavator', 'equipment'
    ];

    const matchedRoles = roleKeywords.filter(keyword => classificationText.includes(keyword));
    
    if (matchedRoles.length === 0) return allowancesList; // Show all if no specific role identified

    // Filter allowances that match the role keywords
    return allowancesList.filter(allowance => {
      const allowanceText = `${allowance.allowance_type_description || ''} ${allowance.allowance_description || ''}`.toLowerCase();
      
      // Show allowance if it matches any of the role keywords
      return matchedRoles.some(role => allowanceText.includes(role)) ||
             // Always show common allowances that apply to most roles
             allowanceText.includes('meal') ||
             allowanceText.includes('travel') ||
             allowanceText.includes('vehicle') ||
             allowanceText.includes('tool') ||
             allowanceText.includes('uniform') ||
             allowanceText.includes('first aid') ||
             allowanceText.includes('laundry') ||
             allowanceText.includes('clothing');
    });
  };

  const fetchRateData = async () => {
    setLoading(true);
    // Reset previous data
    setBaseRate(null);
    setPenalties(null);
    setAllowances(null);
    
    try {
      // Fetch base rate
      const { data: rateData } = await supabase.functions.invoke('get-pay-rates', {
        body: {
          awardId,
          classificationFixedId: classification.classification_fixed_id,
        },
      });

      console.log('RateCards: Base rate response:', rateData?.baseRate);
      if (rateData?.baseRate) {
        setBaseRate(rateData.baseRate);
      }

      // Fetch penalties
      const { data: penaltyData } = await supabase.functions.invoke('get-penalties', {
        body: { awardId },
      });

      console.log('RateCards: Penalties response:', penaltyData?.results?.length || 0);
      
      // Use fallback data if API returns empty
      if (!penaltyData?.results || penaltyData.results.length === 0) {
        const fallbackPenalties = getFallbackPenalties(awardId);
        if (fallbackPenalties.length > 0) {
          console.log('Using fallback penalties:', fallbackPenalties.length);
          setPenalties({ results: fallbackPenalties });
          setUsingFallbackData(prev => ({ ...prev, penalties: true }));
        } else {
          setPenalties(penaltyData);
          setUsingFallbackData(prev => ({ ...prev, penalties: false }));
        }
      } else {
        setPenalties(penaltyData);
        setUsingFallbackData(prev => ({ ...prev, penalties: false }));
      }

      // Fetch allowances
      const { data: allowanceData } = await supabase.functions.invoke('get-allowances', {
        body: { awardId },
      });

      console.log('RateCards: Allowances response:', allowanceData?.allowances?.length || 0);
      
      // Use fallback data if API returns empty
      if (!allowanceData?.allowances || allowanceData.allowances.length === 0) {
        const fallbackAllowances = getFallbackAllowances(awardId);
        if (fallbackAllowances.length > 0) {
          console.log('Using fallback allowances:', fallbackAllowances.length);
          setAllowances({ results: fallbackAllowances });
          setUsingFallbackData(prev => ({ ...prev, allowances: true }));
        } else {
          setAllowances(allowanceData);
          setUsingFallbackData(prev => ({ ...prev, allowances: false }));
        }
      } else {
        setAllowances({ results: allowanceData.allowances });
        setUsingFallbackData(prev => ({ ...prev, allowances: false }));
      }

    } catch (error) {
      console.error('Error fetching rate data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!classification) {
    return (
      <section className="checker-form border-t border-rule py-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Select a classification to view rates</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="checker-form border-t border-rule py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const casualLoading = employmentType === "Casual" ? 0.25 : 0;
  const displayRate = baseRate ? baseRate * (1 + casualLoading) : null;
  
  // Filter allowances based on classification
  const filteredAllowances = filterAllowancesByClassification(allowances?.results || []);

  return (
    <div className="space-y-4">
      {/* Selected Classification Header */}
      <section className="checker-form border-t border-rule py-6">
        <div className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-primary flex-shrink-0">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-1">Selected Classification</p>
              <p className="text-lg font-semibold break-words">{classification.classification_level}</p>
              {classification.classification && classification.classification !== classification.classification_level && (
                <p className="text-sm text-muted-foreground mt-1 break-words">{classification.classification}</p>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Base Rate Card */}
      <section className="checker-form border-t border-rule py-6">
        <header>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <h2 className="text-[19px] leading-[26px] mb-3">Base Rate</h2>
          </div>
          <p>Your hourly rate{employmentType === "Casual" && " (including 25% casual loading)"}</p>
        </header>
        <div className="space-y-3">
          {displayRate && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your hourly rate</span>
                <span className="font-mono tabular-nums text-lg font-semibold">${displayRate.toFixed(2)}/hr</span>
              </div>
              
              {employmentType === "Casual" && baseRate && (
                <div className="bg-primary-soft border border-rule-strong rounded-md p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ink-2">Base rate:</span>
                    <span className="font-mono tabular-nums font-medium text-ink-2">${baseRate.toFixed(2)}/hr</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-ink-2">Casual loading (25%):</span>
                    <span className="font-mono tabular-nums font-medium text-ink-2">+${(baseRate * 0.25).toFixed(2)}/hr</span>
                  </div>
                </div>
              )}

              {employmentType === "Part-time" && (
                <div className="bg-primary-soft border border-rule-strong rounded-md p-3">
                  <p className="text-[13px] text-ink-2">
                    As a part-time employee, you're entitled to pro-rata benefits and minimum engagement hours may apply.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Penalty Rates Card */}
      <section className="checker-form border-t border-rule py-6">
        <header>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="text-[19px] leading-[26px] mb-3">Penalty Rates</h2>
          </div>
          <p>Weekend, public holiday, and overtime penalties</p>
        </header>
        <div>
          {usingFallbackData.penalties && (
            <Alert className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-[13px]">
                Showing standard penalty rates for this award. Verify with current award documentation.
              </AlertDescription>
            </Alert>
          )}
          {penalties?.results && penalties.results.length > 0 ? (
            <Collapsible open={showAllPenalties} onOpenChange={setShowAllPenalties}>
              <div className="space-y-2">
                {(showAllPenalties ? penalties.results : penalties.results.slice(0, 5)).map((penalty: any, idx: number) => (
                  <div key={idx} className="border-b border-rule py-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium block">{penalty.penalty_description || penalty.description}</span>
                        {penalty.conditions && (
                          <span className="text-[13px] text-muted-foreground block mt-1">{penalty.conditions}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">{penalty.penalty_rate || penalty.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {penalties.results.length > 5 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-3">
                    {showAllPenalties ? "Show Less" : `Show All ${penalties.results.length} Penalties`}
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAllPenalties ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              )}
            </Collapsible>
          ) : (
            <p className="text-sm text-muted-foreground">No penalty rate information available</p>
          )}
        </div>
      </section>

      {/* Allowances Card */}
      <section className="checker-form border-t border-rule py-6">
        <header>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <h2 className="text-[19px] leading-[26px] mb-3">Allowances</h2>
          </div>
          <p>
            Additional payments you may be entitled to based on your work conditions
          </p>
        </header>
        <div>
          {usingFallbackData.allowances && (
            <Alert className="mb-4">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-[13px]">
                Showing common allowances for this award. Check with your employer which apply to you.
              </AlertDescription>
            </Alert>
          )}
          {filteredAllowances.length > 0 ? (
            <Collapsible open={showAllAllowances} onOpenChange={setShowAllAllowances}>
              <div className="space-y-2">
                {(showAllAllowances ? filteredAllowances : filteredAllowances.slice(0, 8)).map((allowance: any, idx: number) => (
                  <div key={idx} className="border-b border-rule py-4">
                    <div className="font-medium text-sm mb-1">
                      {allowance.allowance_type_description || allowance.name}
                    </div>
                    <div className="text-[13px] text-muted-foreground space-y-1">
                      {(allowance.allowance_amount || allowance.amount) && (
                        <div className="font-semibold text-foreground">{allowance.allowance_amount || allowance.amount}</div>
                      )}
                      {(allowance.allowance_description || allowance.description) && (
                        <div>{allowance.allowance_description || allowance.description}</div>
                      )}
                      {allowance.conditions && (
                        <div className="italic">{allowance.conditions}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredAllowances.length > 8 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mt-3">
                    {showAllAllowances ? "Show Less" : `Show All ${filteredAllowances.length} Allowances`}
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAllAllowances ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              )}
            </Collapsible>
          ) : (
            <p className="text-sm text-muted-foreground">No specific allowances found for your award</p>
          )}
        </div>
      </section>

      {/* Break Entitlements Card */}
      <section className="checker-form border-t border-rule py-6">
        <header>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            <h2 className="text-[19px] leading-[26px] mb-3">Break Entitlements</h2>
          </div>
          <p>Rest breaks based on shift length</p>
        </header>
        <div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-4 border-b border-rule gap-4">
              <span>4-5 hours</span>
              <span className="font-medium">One 10-minute paid rest break</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-rule gap-4">
              <span>5-7 hours</span>
              <span className="font-medium">One 30-minute unpaid meal break</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-rule gap-4">
              <span>7+ hours</span>
              <span className="font-medium">Additional 10-minute paid rest break</span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-3">
              Note: Specific break entitlements may vary by award. Check your award for exact requirements.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};