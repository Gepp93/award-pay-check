import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Clock, TrendingUp, Gift } from "lucide-react";
import { type ShiftData } from "@/lib/payCalculator";

interface PayBreakdownProps {
  breakdown: any;
  shiftData: ShiftData | null;
}

export const PayBreakdown = ({ breakdown, shiftData }: PayBreakdownProps) => {
  if (!breakdown || !shiftData) {
    return (
      <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
        <CardContent className="py-16 text-center">
          <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Enter your shift details to see your pay breakdown
          </p>
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: "Base Pay",
      value: breakdown.basePay,
      icon: Clock,
      description: `${breakdown.baseHours.toFixed(2)} hours @ $${shiftData.baseRate}/hr`,
    },
    {
      label: "Overtime (1.5x)",
      value: breakdown.timeAndHalf,
      icon: TrendingUp,
      description: `${breakdown.overtimeHours.toFixed(2)} hours @ 1.5x rate`,
      highlight: breakdown.timeAndHalf > 0,
    },
    {
      label: "Double Time (2x)",
      value: breakdown.doubleTime,
      icon: TrendingUp,
      description: `${breakdown.doubleTimeHours.toFixed(2)} hours @ 2x rate`,
      highlight: breakdown.doubleTime > 0,
    },
    {
      label: "Allowances",
      value: breakdown.allowances,
      icon: Gift,
      description: "Meal and other allowances",
      highlight: breakdown.allowances > 0,
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-success" />
          Pay Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${
                      item.highlight ? "text-accent" : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span
                  className={`font-bold ${
                    item.highlight ? "text-accent" : ""
                  }`}
                >
                  ${item.value.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                {item.description}
              </p>
              {index < items.length - 1 && <Separator className="mt-4" />}
            </div>
          );
        })}

        <Separator className="my-4" />

        <div className="bg-gradient-primary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary-foreground">
              Total Pay
            </span>
            <span className="text-2xl font-bold text-primary-foreground">
              ${breakdown.total.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-primary-foreground/80 mt-2">
            Total hours worked: {breakdown.totalHours.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
