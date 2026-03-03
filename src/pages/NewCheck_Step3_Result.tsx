import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, CheckCircle, ChevronDown, Coins, Mail, FileText, Shield, Loader2 } from "lucide-react";
import { PublicNavBar } from "@/components/PublicNavBar";
import { NavBar } from "@/components/NavBar";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { User } from "@supabase/supabase-js";

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

// TODO: Replace these with your actual Stripe Checkout Links
const STRIPE_REPORT_LINK = "https://buy.stripe.com/REPLACE_WITH_REPORT_LINK";
const STRIPE_RECOVERY_LINK = "https://buy.stripe.com/REPLACE_WITH_RECOVERY_LINK";

export default function NewCheck_Step3_Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { result, shiftDetails, advancedPayslip } = location.state || {};
  const [allAllowancesOpen, setAllAllowancesOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Email capture state
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  const fromDashboard = location.state?.fromDashboard;

  // Check if user is logged in (optional, for nav display only)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // Save calculation for logged-in users
  useEffect(() => {
    if (fromDashboard || !result || !shiftDetails) return;
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

  if (!result || !shiftDetails) {
    navigate("/new-check-step-1");
    return null;
  }

  const isUnsureMode = result.mode === 'unsure';
  const underpayment = isUnsureMode ? result.overallMaxUnderpayment : (result.underpayment || 0);
  const isUnderpaid = underpayment > 0;
  const potentialAllowances: PotentialAllowance[] = result.potentialAllowances || [];
  const allAwardAllowances: AwardAllowance[] = result.allAwardAllowances || [];

  const handleEmailCapture = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setSavingEmail(true);
    try {
      const { data, error } = await supabase.from("leads").insert({
        email: emailInput,
        calculation_data: result as any,
        shift_details: shiftDetails as any,
      }).select("id").single();

      if (error) throw error;
      setLeadId(data.id);
      setCapturedEmail(emailInput);
      setEmailCaptured(true);
    } catch (error) {
      console.error("Error saving lead:", error);
      toast({ title: "Something went wrong", description: "Please try again", variant: "destructive" });
    } finally {
      setSavingEmail(false);
    }
  };

  // Email capture gate
  if (!emailCaptured) {
    return (
      <>
        <PublicNavBar />
        <div className="min-h-screen flex items-center justify-center p-4 bg-background pt-24">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Where should we send your results?</h2>
                <p className="text-muted-foreground text-sm">
                  Enter your email to see your full pay check analysis
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailCapture()}
                  className="text-center"
                />
                <Button
                  onClick={handleEmailCapture}
                  disabled={savingEmail}
                  size="lg"
                  className="w-full"
                >
                  {savingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Show My Results
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Free forever. No spam.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {user ? <NavBar /> : <PublicNavBar />}
      <div className={`min-h-screen flex items-start justify-center p-4 bg-background ${!user ? 'pt-24' : 'pt-4'}`}>
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
                  You may have been underpaid by approximately ${underpayment.toFixed(2)}
                </h2>
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

          {/* Potential Allowances Section */}
          {potentialAllowances.length > 0 && (
            <div className="rounded-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-lg text-amber-800 dark:text-amber-200">
                  🎉 We found {potentialAllowances.length} potential allowance{potentialAllowances.length > 1 ? 's' : ''} you may be entitled to!
                </h3>
              </div>
              <div className="space-y-3">
                {potentialAllowances.map((allowance) => {
                  const getYearlyEstimate = () => {
                    if (allowance.estimatedValue <= 0) return 0;
                    const amountLower = allowance.amount.toLowerCase();
                    if (amountLower.includes('per week')) return allowance.estimatedValue * 52;
                    if (amountLower.includes('per hour')) return allowance.estimatedValue * 38 * 52;
                    if (amountLower.includes('per day') || amountLower.includes('per meal')) return allowance.estimatedValue * 260;
                    return allowance.estimatedValue * 260;
                  };
                  const yearlyEstimate = getYearlyEstimate();
                  
                  return (
                    <div key={allowance.id} className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-background p-3 space-y-2">
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
              <p className="text-xs text-amber-700 dark:text-amber-300">
                These are potential entitlements based on your shift conditions. Check your award for exact amounts and eligibility.
              </p>
            </div>
          )}

          {/* Payslip breakdown */}
          {advancedPayslip && (
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
          )}

          {isUnsureMode ? (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold text-lg">
                    Based on your inputs, you may be missing between ${result.overallMinUnderpayment.toFixed(2)} and ${result.overallMaxUnderpayment.toFixed(2)}
                  </div>
                  <p className="text-sm mt-2">
                    We analyzed {result.breakdown?.totalClassificationsAnalyzed || 0} classifications. Here are the most likely matches:
                  </p>
                </AlertDescription>
              </Alert>

              {result.commonEntitlements && result.commonEntitlements.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold">Potential entitlements you may be missing:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    {result.commonEntitlements.map((entitlement: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{entitlement}</li>
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
                        {cls.workArea && <div className="text-xs text-muted-foreground">{cls.workArea}</div>}
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
            </>
          ) : (
            <>
              {isUnderpaid ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold text-lg">
                      You may be missing: ${underpayment.toFixed(2)}
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
            </>
          )}

          {!isUnsureMode && result.reasons && result.reasons.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Why this difference?</p>
              <ul className="space-y-1 list-disc list-inside">
                {result.reasons.map((reason: string, idx: number) => (
                  <li key={idx} className="text-sm text-muted-foreground">{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {!isUnsureMode && result.rateWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{result.rateWarning}</AlertDescription>
            </Alert>
          )}

          {/* All Award Allowances */}
          {allAwardAllowances.length > 0 && (
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

          {/* Conversion Section - only if underpaid */}
          {isUnderpaid && (
            <div className="space-y-6 border-t-2 border-primary/20 pt-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-destructive">
                  You May Be Owed ${underpayment.toFixed(2)}
                </h2>
                <p className="text-muted-foreground">
                  Get your official underpayment report to take to your employer or Fair Work Australia
                </p>
              </div>

              {/* Card 1: PDF Report */}
              <Card className="border-2 border-primary">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Official PDF Report — $9</h3>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Detailed pay breakdown</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Official Fair Work rates used</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Ready to present to your employer</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Tax deductible</li>
                  </ul>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => window.open(STRIPE_REPORT_LINK, "_blank")}
                  >
                    Get My Report — $9
                  </Button>
                </CardContent>
              </Card>

              {/* Card 2: Recovery Service */}
              <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Let Us Handle It For You — $49</h3>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> We lodge the claim for you</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Fair Work complaint prepared</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> No paperwork on your end</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Money back if no underpayment found</li>
                  </ul>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950"
                    onClick={() => window.open(STRIPE_RECOVERY_LINK, "_blank")}
                  >
                    Start My Claim — $49
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 no-print">
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
