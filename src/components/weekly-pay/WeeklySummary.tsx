import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

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
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4 mt-4">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                You may be owed ${totalUnderpayment.toFixed(2)} this week!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};