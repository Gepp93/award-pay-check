import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";

interface DetailedBreakdownProps {
  calculation: any;
  shifts: any[];
  baseRate: number;
  penalties: any;
  allowances: any;
}

export const DetailedBreakdown = ({ 
  calculation, 
  shifts, 
  baseRate, 
  penalties, 
  allowances 
}: DetailedBreakdownProps) => {
  
  const findPenaltyRate = (description: string): number => {
    if (!penalties?.results) return 1;
    
    const penalty = penalties.results.find((p: any) => 
      p.penalty_description?.toLowerCase().includes(description.toLowerCase())
    );
    
    if (penalty?.penalty_rate) {
      const match = penalty.penalty_rate.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        const num = parseFloat(match[1]);
        return num > 10 ? num / 100 : num;
      }
    }
    
    return description.includes("saturday") ? 1.5 : 
           description.includes("sunday") ? 1.75 : 
           description.includes("holiday") ? 2.5 : 1;
  };

  const findAllowanceAmount = (description: string): number => {
    if (!allowances?.results) return 0;
    
    const allowance = allowances.results.find((a: any) => 
      a.allowance_type_description?.toLowerCase().includes(description.toLowerCase()) ||
      a.allowance_description?.toLowerCase().includes(description.toLowerCase())
    );
    
    if (allowance?.allowance_amount) {
      const match = allowance.allowance_amount.toString().match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    return 0;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Detailed Calculation Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {calculation.shifts.map((calc: any, idx: number) => {
          const shift = shifts.find(s => s.id === calc.id);
          if (!shift || shift.actualPaid === 0) return null;

          // Calculate hours
          const [startHour, startMin] = shift.startTime.split(":").map(Number);
          const [endHour, endMin] = shift.endTime.split(":").map(Number);
          let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          if (totalMinutes < 0) totalMinutes += 24 * 60;
          const workedMinutes = totalMinutes - shift.breakMinutes;
          const totalHours = workedMinutes / 60;
          const standardHours = 7.6;
          const regularHours = Math.min(totalHours, standardHours);
          const overtimeHours = totalHours > standardHours ? totalHours - standardHours : 0;

          // Determine penalty multiplier
          let penaltyMultiplier = 1;
          let penaltyDescription = "Standard rate";
          
          if (shift.isPublicHoliday) {
            penaltyMultiplier = findPenaltyRate("public holiday");
            penaltyDescription = "Public Holiday penalty";
          } else if (shift.isWeekend) {
            if (shift.dayOfWeek === "Saturday") {
              penaltyMultiplier = findPenaltyRate("saturday");
              penaltyDescription = "Saturday penalty";
            } else if (shift.dayOfWeek === "Sunday") {
              penaltyMultiplier = findPenaltyRate("sunday");
              penaltyDescription = "Sunday penalty";
            }
          }

          const effectiveRate = baseRate * penaltyMultiplier;
          const basePay = regularHours * effectiveRate;
          
          const overtimeMultiplier = findPenaltyRate("overtime");
          const overtimePay = overtimeHours * effectiveRate * overtimeMultiplier;

          const mealAllowanceAmount = shift.boughtOwnMeal && totalHours > 5 
            ? findAllowanceAmount("meal") || 20.10 
            : 0;
          
          const travelAllowanceAmount = shift.travelWithCar 
            ? findAllowanceAmount("travel") || findAllowanceAmount("vehicle") || 15.00 
            : 0;

          return (
            <div key={calc.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{shift.dayOfWeek}</h3>
                <span className="text-sm text-muted-foreground">
                  {shift.startTime} - {shift.endTime}
                </span>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Rate:</span>
                  <span className="font-medium">${baseRate.toFixed(2)}/hr</span>
                </div>

                {penaltyMultiplier !== 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{penaltyDescription}:</span>
                    <span className="font-medium">{(penaltyMultiplier * 100).toFixed(0)}% (${effectiveRate.toFixed(2)}/hr)</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Regular Hours ({regularHours.toFixed(2)}h):</span>
                  <span className="font-medium">${basePay.toFixed(2)}</span>
                </div>

                {overtimeHours > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overtime Hours ({overtimeHours.toFixed(2)}h at {(overtimeMultiplier * 100).toFixed(0)}%):</span>
                    <span className="font-medium">${overtimePay.toFixed(2)}</span>
                  </div>
                )}

                {mealAllowanceAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meal Allowance:</span>
                    <span className="font-medium">${mealAllowanceAmount.toFixed(2)}</span>
                  </div>
                )}

                {travelAllowanceAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Travel Allowance:</span>
                    <span className="font-medium">${travelAllowanceAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Should Earn</p>
                  <p className="text-lg font-bold">${calc.shouldEarn.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Actually Paid</p>
                  <p className="text-lg font-bold">${shift.actualPaid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Difference</p>
                  <p className={`text-lg font-bold ${calc.difference > 0 ? 'text-green-600' : calc.difference < 0 ? 'text-red-600' : ''}`}>
                    {calc.difference >= 0 ? '+' : ''}${calc.difference.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};