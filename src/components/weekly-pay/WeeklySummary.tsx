import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, ExternalLink } from "lucide-react";

interface WeeklySummaryProps {
  calculation: any;
}

export const WeeklySummary = ({ calculation }: WeeklySummaryProps) => {
  const totalUnderpayment = calculation.totalShouldEarn - calculation.totalActualPaid;
  const isUnderpaid = totalUnderpayment > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Weekly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total award pay</span>
            <span className="text-xl font-semibold">${calculation.totalShouldEarn.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total you were paid</span>
            <span className="text-xl font-semibold">${calculation.totalActualPaid.toFixed(2)}</span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Possible {isUnderpaid ? 'underpayment' : 'overpayment'}</span>
              <div className="flex items-center gap-2">
                {isUnderpaid ? (
                  <TrendingUp className="w-5 h-5 text-clay" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-ink-2" />
                )}
                <span className={`text-2xl font-semibold ${isUnderpaid ? 'text-clay' : 'text-ink-2'}`}>
                  {isUnderpaid ? '+' : ''}${totalUnderpayment.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {isUnderpaid && totalUnderpayment > 0 && (
            <>
              <div className="bg-primary-soft border border-rule-strong rounded-md p-4 mt-4">
                <p className="text-sm text-primary font-medium mb-3">
                  You may be owed ${totalUnderpayment.toFixed(2)} this week!
                </p>
                
                <div className="space-y-2 mt-4">
                  <p className="text-[13px] font-semibold text-primary">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[13px] text-primary">
                    <li>Save or screenshot this calculation</li>
                    <li>Compare with your payslip line-by-line</li>
                    <li>Speak to your employer about the discrepancy</li>
                    <li>If unresolved, contact Fair Work Ombudsman</li>
                  </ol>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open('https://www.fairwork.gov.au/tools-and-resources/fact-sheets/unpaid-wages/what-to-do-if-you-havent-been-paid', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Fair Work Resources
              </Button>
            </>
          )}

          {!isUnderpaid && totalUnderpayment < -10 && (
            <div className="bg-primary-soft border border-rule-strong rounded-md p-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-ink-2 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-ink-2 font-medium">
                    Possible overpayment detected
                  </p>
                  <p className="text-[13px] text-ink-2">
                    Double-check your inputs and award entitlements. If correct, your employer may have made an overpayment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};