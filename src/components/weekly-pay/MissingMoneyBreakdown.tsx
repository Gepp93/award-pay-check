import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface MissingMoneyBreakdownProps {
  calculation: any;
}

export const MissingMoneyBreakdown = ({ calculation }: MissingMoneyBreakdownProps) => {
  const hasIssues = calculation.missingMoney && calculation.missingMoney.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Missing Money Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasIssues ? (
          <div className="space-y-3">
            {calculation.missingMoney.map((issue: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-clay-soft bg-primary border border-rule-strong border-rule-strong rounded-md"
              >
                <AlertCircle className="w-5 h-5 text-clay text-clay flex-shrink-0 mt-0.5" />
                <p className="text-sm text-clay text-clay">{issue}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No issues detected. Your pay appears to be correct!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};