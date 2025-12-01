import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Download, Loader2 } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function NewCheck_Step3_Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { result, shiftDetails, advancedPayslip } = location.state || {};
  const [downloading, setDownloading] = useState(false);

  if (!result || !shiftDetails) {
    navigate("/new-check-step-1");
    return null;
  }

  const isUnsureMode = result.mode === 'unsure';
  const underpayment = isUnsureMode ? result.overallMaxUnderpayment : (result.underpayment || 0);
  const isUnderpaid = underpayment > 0;

  // Save calculation to database (only if not viewing from dashboard)
  const fromDashboard = location.state?.fromDashboard;
  
  useEffect(() => {
    // Skip saving if viewing from dashboard
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
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: {
          result,
          shiftDetails,
          advancedPayslip
        }
      });

      if (error) throw error;

      // Convert base64 to blob and download as text file
      const reportBlob = new Blob(
        [Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0))],
        { type: 'text/plain' }
      );
      
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pay-check-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your pay check report has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating your report",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-3xl">
        <CardHeader>
          <ProgressIndicator currentStep={3} />
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
                  <li key={idx} className="text-sm text-muted-foreground">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isUnsureMode && result.rateWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {result.rateWarning}
              </AlertDescription>
            </Alert>
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

          {/* Action Buttons */}
          <div className="flex justify-center">
            <Button onClick={handleDownloadPDF} disabled={downloading} className="gap-2">
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Report
            </Button>
          </div>

          <div className="flex gap-3">
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
