import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Step3_Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!result) {
    navigate("/step1-who-are-you");
    return null;
  }

  const {
    awardPayTotal,
    actualPaidTotal,
    underpaymentAmount,
    reasons,
    breakdown,
  } = result;

  const isMissingPay = underpaymentAmount > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-4xl text-center">
            {isMissingPay ? (
              <span className="text-destructive">
                You may be missing: ${underpaymentAmount.toFixed(2)}
              </span>
            ) : (
              <span className="text-green-600">No missing pay detected on this shift</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-lg">
              <span className="text-muted-foreground">Should have been paid:</span>{" "}
              <span className="font-semibold">${awardPayTotal.toFixed(2)}</span>
            </p>
            <p className="text-lg">
              <span className="text-muted-foreground">You were paid:</span>{" "}
              <span className="font-semibold">${actualPaidTotal.toFixed(2)}</span>
            </p>
          </div>

          {reasons && reasons.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Why?</h3>
              <ul className="space-y-1 list-disc list-inside">
                {reasons.map((reason: string, index: number) => (
                  <li key={index} className="text-muted-foreground">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {breakdown && (
            <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>View detailed breakdown</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showBreakdown ? "transform rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2 text-sm">
                      {breakdown.baseHours && (
                        <div className="flex justify-between">
                          <span>Base hours ({breakdown.baseHours.hours}h @ ${breakdown.baseHours.rate}/h)</span>
                          <span className="font-semibold">${breakdown.baseHours.amount.toFixed(2)}</span>
                        </div>
                      )}
                      {breakdown.overtime && breakdown.overtime.amount > 0 && (
                        <div className="flex justify-between">
                          <span>Overtime ({breakdown.overtime.hours}h @ ${breakdown.overtime.rate}/h)</span>
                          <span className="font-semibold">${breakdown.overtime.amount.toFixed(2)}</span>
                        </div>
                      )}
                      {breakdown.penalties && breakdown.penalties.length > 0 && (
                        <>
                          {breakdown.penalties.map((penalty: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{penalty.description}</span>
                              <span className="font-semibold">${penalty.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {breakdown.allowances && breakdown.allowances.length > 0 && (
                        <>
                          {breakdown.allowances.map((allowance: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{allowance.description}</span>
                              <span className="font-semibold">${allowance.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span>${awardPayTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Button onClick={() => navigate("/step2-shift-details")} variant="secondary" className="w-full">
            Check another shift
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
