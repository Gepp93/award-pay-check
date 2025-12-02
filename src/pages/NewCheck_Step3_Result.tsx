import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, CheckCircle, Download, Loader2, ChevronDown, Coins, Lock } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";

interface PotentialAllowance {
  id: string;
  name: string;
  amount: string;
  estimatedValue: number;
  reason: string;
  icon: string;
}

interface AwardAllowance {
  name: string;
  description: string;
}

export default function NewCheck_Step3_Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isPremium, loading: subLoading } = useSubscription();
  const { result, shiftDetails, advancedPayslip } = location.state || {};
  const [downloading, setDownloading] = useState(false);
  const [allAllowancesOpen, setAllAllowancesOpen] = useState(false);

  if (!result || !shiftDetails) {
    navigate("/new-check-step-1");
    return null;
  }

  const isUnsureMode = result.mode === 'unsure';
  const underpayment = isUnsureMode ? result.overallMaxUnderpayment : (result.underpayment || 0);
  const isUnderpaid = underpayment > 0;
  const potentialAllowances: PotentialAllowance[] = result.potentialAllowances || [];
  const allAwardAllowances: AwardAllowance[] = result.allAwardAllowances || [];

  // Save calculation to database (only if not viewing from dashboard)
  const fromDashboard = location.state?.fromDashboard;
  
  useEffect(() => {
    if (fromDashboard) return;
    
    const saveCalculation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('calculations').insert({
          user_id: user.id,
          shift_data: shiftDetails,
          breakdown: result,
        });
      } catch (error) {
        console.error('Error saving calculation:', error);
      }
    };

    saveCalculation();
  }, [shiftDetails, result, fromDashboard]);
  
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      window.print();
      
      toast({
        title: "Print Dialog Opened",
        description: "Use 'Save as PDF' in the print dialog to download your report",
      });
    } catch (error) {
      console.error('Error opening print dialog:', error);
      toast({
        title: "Print Failed",
        description: "There was an error opening the print dialog",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  // Paywall wrapper component
  const PaywallBlur = ({ children, showTeaser = false, teaserContent }: { 
    children: React.ReactNode; 
    showTeaser?: boolean;
    teaserContent?: React.ReactNode;
  }) => {
    if (isPremium) return <>{children}</>;
    
    return (
      <div className="relative select-none">
        <div className="blur-sm pointer-events-none opacity-70">
          {children}
        </div>
        {showTeaser && teaserContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {teaserContent}
          </div>
        )}
      </div>
    );
  };

  // Upgrade CTA Card
  const UpgradeCTA = () => (
    <Card className="border-2 border-primary bg-primary/5">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Unlock Your Full Results</h3>
          <p className="text-muted-foreground mt-2">
            See exactly how much you may be owed and which allowances apply to your situation.
          </p>
        </div>
        <Button onClick={() => navigate("/subscription")} size="lg" className="w-full sm:w-auto">
          Subscribe Now - From $29/month
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <>
      <NavBar />
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="no-print">
            <ProgressIndicator currentStep={3} />
          </div>
          <CardTitle>Step 3: Results</CardTitle>
          <CardDescription>Your pay check analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Big headline based on underpayment */}
          <div className="text-center py-6 border-2 border-dashed rounded-lg">
            {isUnderpaid ? (
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-destructive">
                  {isPremium ? (
                    <>You may have been underpaid by approximately ${underpayment.toFixed(2)}</>
                  ) : (
                    <>Based on our analysis, you may have been underpaid</>
                  )}
                </h2>
                {!isPremium && (
                  <p className="text-2xl font-bold text-destructive/60 blur-sm select-none">
                    $XXX.XX
                  </p>
                )}
                <p className="text-muted-foreground">
                  {isUnsureMode ? "Based on likely classifications for your work area" : "For this pay period"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                  Your pay looks roughly correct for this period
                </h2>
                <p className="text-muted-foreground">
                  No significant underpayment detected
                </p>
              </div>
            )}
          </div>

          {/* Upgrade CTA for free users - shown prominently */}
          {!isPremium && !subLoading && <UpgradeCTA />}

          {/* Potential Allowances Section */}
          {potentialAllowances.length > 0 && (
            <div className="rounded-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-lg text-amber-800 dark:text-amber-200">
                  🎉 We found {potentialAllowances.length} potential allowance{potentialAllowances.length > 1 ? 's' : ''} you may be entitled to!
                </h3>
              </div>
              <PaywallBlur>
                <div className="space-y-3">
                  {potentialAllowances.map((allowance) => {
                    // Calculate yearly estimate based on allowance type
                    const getYearlyEstimate = () => {
                      if (allowance.estimatedValue <= 0) return 0;
                      const amountLower = allowance.amount.toLowerCase();
                      if (amountLower.includes('per week')) {
                        return allowance.estimatedValue * 52;
                      } else if (amountLower.includes('per hour')) {
                        // Assume 38hr week, 52 weeks
                        return allowance.estimatedValue * 38 * 52;
                      } else if (amountLower.includes('per day') || amountLower.includes('per meal')) {
                        // Assume 5 days/week, 52 weeks = 260 days
                        return allowance.estimatedValue * 260;
                      }
                      // Default: assume daily occurrence
                      return allowance.estimatedValue * 260;
                    };
                    const yearlyEstimate = getYearlyEstimate();
                    
                    return (
                      <div 
                        key={allowance.id} 
                        className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-background p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{allowance.icon}</span>
                            <div>
                              <div className="font-semibold">{allowance.name}</div>
                              <div className="text-sm text-primary font-medium">{allowance.amount}</div>
                            </div>
                          </div>
                          {allowance.estimatedValue > 0 && (
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Est. today</div>
                              <div className="font-bold text-green-600 dark:text-green-400">
                                ${allowance.estimatedValue.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                        {yearlyEstimate > 0 && (
                          <div className="bg-green-50 dark:bg-green-950/30 rounded-md p-2 text-center">
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                              That's ${yearlyEstimate.toLocaleString('en-AU', { maximumFractionDigits: 0 })} extra per year
                            </span>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                          <span className="font-medium text-foreground">WHY: </span>
                          {allowance.reason}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PaywallBlur>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {isPremium 
                  ? "These are potential entitlements based on your shift conditions. Check your award for exact amounts and eligibility."
                  : "Subscribe to see which specific allowances you're entitled to and their values."
                }
              </p>
            </div>
          )}

          {/* Payslip breakdown - blurred for free users */}
          {advancedPayslip && (
            <PaywallBlur>
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 space-y-3">
                <div className="font-bold text-base">What you were paid (from your payslip):</div>
                {advancedPayslip.hoursAtBase > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Base hours ({advancedPayslip.hoursAtBase} hrs × ${advancedPayslip.payslipBaseRate}/hr)</span>
                    <span className="font-semibold">${(advancedPayslip.hoursAtBase * advancedPayslip.payslipBaseRate).toFixed(2)}</span>
                  </div>
                )}
                {advancedPayslip.hoursAt150 > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Time & half ({advancedPayslip.hoursAt150} hrs × ${(advancedPayslip.payslipBaseRate * 1.5).toFixed(2)}/hr)</span>
                    <span className="font-semibold">${(advancedPayslip.hoursAt150 * advancedPayslip.payslipBaseRate * 1.5).toFixed(2)}</span>
                  </div>
                )}
                {advancedPayslip.hoursAt200 > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Double time ({advancedPayslip.hoursAt200} hrs × ${(advancedPayslip.payslipBaseRate * 2).toFixed(2)}/hr)</span>
                    <span className="font-semibold">${(advancedPayslip.hoursAt200 * advancedPayslip.payslipBaseRate * 2).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-primary/30 pt-2 flex justify-between font-bold text-lg">
                  <span>Total you were paid</span>
                  <span className="text-primary">${parseFloat(shiftDetails.actualPaid).toFixed(2)}</span>
                </div>
              </div>
            </PaywallBlur>
          )}

          {isUnsureMode ? (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold text-lg">
                    {isPremium 
                      ? `Based on your inputs, you may be missing between $${result.overallMinUnderpayment.toFixed(2)} and $${result.overallMaxUnderpayment.toFixed(2)}`
                      : `We analyzed ${result.breakdown?.totalClassificationsAnalyzed || 0} classifications for your work area`
                    }
                  </div>
                  {isPremium && (
                    <p className="text-sm mt-2">
                      We analyzed {result.breakdown?.totalClassificationsAnalyzed || 0} classifications. Here are the most likely matches:
                    </p>
                  )}
                </AlertDescription>
              </Alert>

              <PaywallBlur>
                {result.commonEntitlements && result.commonEntitlements.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Potential entitlements you may be missing:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      {result.commonEntitlements.map((entitlement: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {entitlement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.likelyClassifications && result.likelyClassifications.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold">Most likely classifications:</p>
                    <div className="space-y-2">
                      {result.likelyClassifications.slice(0, 5).map((cls: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-3 space-y-1">
                          <div className="font-medium">{cls.classificationName}</div>
                          {cls.workArea && (
                            <div className="text-xs text-muted-foreground">{cls.workArea}</div>
                          )}
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-sm">Award pay total:</span>
                            <span className="font-semibold">${cls.awardPayTotal.toFixed(2)}</span>
                          </div>
                          {cls.possibleUnderpayment > 0 && (
                            <div className="flex justify-between items-center text-destructive">
                              <span className="text-sm">Possible underpayment:</span>
                              <span className="font-semibold">${cls.possibleUnderpayment.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </PaywallBlur>
            </>
          ) : (
            <>
              {isUnderpaid ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold text-lg">
                      {isPremium 
                        ? `You may be missing: $${underpayment.toFixed(2)}`
                        : "Our analysis found potential underpayment"
                      }
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription>
                    <div className="font-semibold text-lg text-green-800 dark:text-green-200">
                      No missing pay detected
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <PaywallBlur>
                {advancedPayslip && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div className="font-semibold text-sm">What you were paid (your payslip):</div>
                    {advancedPayslip.hoursAtBase > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Base hours ({advancedPayslip.hoursAtBase} hrs × ${advancedPayslip.payslipBaseRate}/hr)</span>
                        <span>${(advancedPayslip.hoursAtBase * advancedPayslip.payslipBaseRate).toFixed(2)}</span>
                      </div>
                    )}
                    {advancedPayslip.hoursAt150 > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Time & half ({advancedPayslip.hoursAt150} hrs × ${(advancedPayslip.payslipBaseRate * 1.5).toFixed(2)}/hr)</span>
                        <span>${(advancedPayslip.hoursAt150 * advancedPayslip.payslipBaseRate * 1.5).toFixed(2)}</span>
                      </div>
                    )}
                    {advancedPayslip.hoursAt200 > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Double time ({advancedPayslip.hoursAt200} hrs × ${(advancedPayslip.payslipBaseRate * 2).toFixed(2)}/hr)</span>
                        <span>${(advancedPayslip.hoursAt200 * advancedPayslip.payslipBaseRate * 2).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-base">
                      <span>Total you were paid</span>
                      <span>${parseFloat(shiftDetails.actualPaid).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="font-semibold text-sm">What the award says you should earn:</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Based on ${result.baseRate?.toFixed(2)}/hr award rate
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Regular hours ({result.breakdown?.regularHours?.toFixed(2) || "0"} hrs × ${result.baseRate?.toFixed(2)}/hr)</span>
                    <span>${result.breakdown?.basePay?.toFixed(2) || "0.00"}</span>
                  </div>
                  
                  {result.breakdown?.overtimeAt150Hours > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Overtime at 1.5x ({result.breakdown.overtimeAt150Hours.toFixed(2)} hrs × ${(result.baseRate * 1.5)?.toFixed(2)}/hr)</span>
                      <span>${(result.breakdown.overtimeAt150Hours * result.baseRate * 1.5).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {result.breakdown?.overtimeAt200Hours > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Overtime at 2x ({result.breakdown.overtimeAt200Hours.toFixed(2)} hrs × ${(result.baseRate * 2)?.toFixed(2)}/hr)</span>
                      <span>${(result.breakdown.overtimeAt200Hours * result.baseRate * 2).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {result.breakdown?.allowances > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Meal allowance (worked over 10 hours)</span>
                      <span>${result.breakdown.allowances.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>Total award pay</span>
                    <span>${result.awardPayTotal?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </PaywallBlur>
            </>
          )}

          {!isUnsureMode && result.reasons && result.reasons.length > 0 && isPremium && (
            <div className="space-y-2">
              <p className="font-semibold">Why this difference?</p>
              <ul className="space-y-1 list-disc list-inside">
                {result.reasons.map((reason: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isUnsureMode && result.rateWarning && isPremium && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {result.rateWarning}
              </AlertDescription>
            </Alert>
          )}

          {/* All Award Allowances - Collapsible for education */}
          {allAwardAllowances.length > 0 && isPremium && (
            <Collapsible open={allAllowancesOpen} onOpenChange={setAllAllowancesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-0 h-auto font-normal hover:bg-transparent">
                  <ChevronDown className={cn("h-4 w-4 transition-transform", allAllowancesOpen && "transform rotate-180")} />
                  <span className="text-sm font-medium">📚 Other Allowances Under Your Award</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    These allowances may apply depending on your specific work circumstances:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allAwardAllowances.map((allowance, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{allowance.name}</span>
                        <p className="text-xs text-muted-foreground">{allowance.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {/* Disclaimer */}
          <Alert className="border-muted-foreground/30 bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs leading-relaxed">
              <strong>Disclaimer:</strong> These calculations are based on Fair Work modern award pay data and your answers. 
              They are general guidance only and are not legal or financial advice. For specific advice about your situation, 
              please consult with a qualified professional or contact the Fair Work Ombudsman.
            </AlertDescription>
          </Alert>

          {/* Action Buttons - PDF only for premium */}
          {isPremium && (
            <div className="flex justify-center no-print">
              <Button onClick={handleDownloadPDF} disabled={downloading} className="gap-2">
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Save as PDF
              </Button>
            </div>
          )}

          <div className="flex gap-3 no-print">
            <Button variant="outline" onClick={() => navigate("/app-dashboard")} className="flex-1">
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate("/new-check-step-1")} className="flex-1">
              New Check
            </Button>
            <Button
              onClick={() =>
                navigate("/new-check-step-2", {
                  state: {
                    awardCode: shiftDetails.awardCode,
                    classificationId: shiftDetails.classificationId,
                    employmentType: shiftDetails.employmentType,
                  },
                })
              }
              className="flex-1"
              size="lg"
            >
              Check another shift
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
