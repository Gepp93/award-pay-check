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
            <span className="text-xl font-bold">${calculation.totalShouldEarn.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total you were paid</span>
            <span className="text-xl font-bold">${calculation.totalActualPaid.toFixed(2)}</span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Possible {isUnderpaid ? 'underpayment' : 'overpayment'}</span>
              <div className="flex items-center gap-2">
                {isUnderpaid ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-2xl font-bold ${isUnderpaid ? 'text-green-600' : 'text-red-600'}`}>
                  {isUnderpaid ? '+' : ''}${totalUnderpayment.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {isUnderpaid && totalUnderpayment > 0 && (
            <>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4 mt-4">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-3">
                  You may be owed ${totalUnderpayment.toFixed(2)} this week!
                </p>
                
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-100">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-green-800 dark:text-green-200">
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
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    Possible overpayment detected
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
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