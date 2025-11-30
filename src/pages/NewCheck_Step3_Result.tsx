import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function NewCheck_Step3_Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, shiftDetails } = location.state || {};
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!result || !shiftDetails) {
    navigate("/new-check-step-1");
    return null;
  }

  const isUnsureMode = result.mode === 'unsure';
  const underpayment = isUnsureMode ? result.overallMaxUnderpayment : (result.underpayment || 0);
  const isUnderpaid = underpayment > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Step 3: Your Pay Check Result</CardTitle>
          <CardDescription>Here's what we found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Should have been paid</p>
                  <p className="text-2xl font-bold">${result.awardPayTotal?.toFixed(2) || "0.00"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">You were paid</p>
                  <p className="text-2xl font-bold">${parseFloat(shiftDetails.actualPaid).toFixed(2)}</p>
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

          {!isUnsureMode && (
            <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                {showBreakdown ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide detailed breakdown
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    View detailed breakdown
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              {result.breakdown && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Base hours</span>
                    <span>{result.breakdown.baseHours?.toFixed(2) || "0"} hrs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Base pay</span>
                    <span>${result.breakdown.basePay?.toFixed(2) || "0.00"}</span>
                  </div>
                  {result.breakdown.overtimePay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Overtime pay</span>
                      <span>${result.breakdown.overtimePay.toFixed(2)}</span>
                    </div>
                  )}
                  {result.breakdown.weekendPay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Weekend penalty</span>
                      <span>${result.breakdown.weekendPay.toFixed(2)}</span>
                    </div>
                  )}
                  {result.breakdown.publicHolidayPay > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Public holiday penalty</span>
                      <span>${result.breakdown.publicHolidayPay.toFixed(2)}</span>
                    </div>
                  )}
                  {result.breakdown.allowances > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Allowances</span>
                      <span>${result.breakdown.allowances.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${result.awardPayTotal?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              )}
            </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
              Back to Home
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
  );
}
