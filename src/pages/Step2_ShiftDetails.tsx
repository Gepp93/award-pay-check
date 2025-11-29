import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useWizard } from "@/contexts/WizardContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Step2_ShiftDetails() {
  const navigate = useNavigate();
  const { state, updateState } = useWizard();
  const [date, setDate] = useState<Date | undefined>(state.shiftDate);
  const [startTime, setStartTime] = useState(state.startTime || "09:00");
  const [finishTime, setFinishTime] = useState(state.finishTime || "17:00");
  const [breakMinutes, setBreakMinutes] = useState(state.breakMinutes || 30);
  const [workedWeekend, setWorkedWeekend] = useState(state.workedWeekend);
  const [usedOwnCar, setUsedOwnCar] = useState(state.usedOwnCar);
  const [workedLongHours, setWorkedLongHours] = useState(state.workedLongHours);
  const [actualPaid, setActualPaid] = useState(state.actualPaid || 0);
  const [calculating, setCalculating] = useState(false);

  const handleCheckPay = async () => {
    if (!date || !startTime || !finishTime || actualPaid <= 0) {
      toast.error("Please fill in all fields");
      return;
    }

    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-correct-pay", {
        body: {
          awardCode: state.awardCode,
          classificationId: state.classificationId,
          employmentType: state.employmentType,
          date: format(date, "yyyy-MM-dd"),
          startTime,
          finishTime,
          breakMinutes,
          workedWeekend,
          usedOwnCar,
          workedLongHours,
          actualPaid,
        },
      });

      if (error) throw error;

      updateState({
        shiftDate: date,
        startTime,
        finishTime,
        breakMinutes,
        workedWeekend,
        usedOwnCar,
        workedLongHours,
        actualPaid,
      });

      navigate("/step3-result", { state: { result: data } });
    } catch (error) {
      console.error("Error calculating pay:", error);
      toast.error("Failed to calculate correct pay");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Shift details</CardTitle>
          <p className="text-muted-foreground">Tell us about the shift you want to check</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finish-time">Finish time</Label>
              <Input
                id="finish-time"
                type="time"
                value={finishTime}
                onChange={(e) => setFinishTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="break">Unpaid break (minutes)</Label>
            <Input
              id="break"
              type="number"
              min="0"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-3">
            <Label>Extras</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weekend"
                  checked={workedWeekend}
                  onCheckedChange={(checked) => setWorkedWeekend(checked === true)}
                />
                <Label htmlFor="weekend" className="font-normal cursor-pointer">
                  Worked Saturday / Sunday / Public holiday
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="car"
                  checked={usedOwnCar}
                  onCheckedChange={(checked) => setUsedOwnCar(checked === true)}
                />
                <Label htmlFor="car" className="font-normal cursor-pointer">
                  Drove your own car
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="long"
                  checked={workedLongHours}
                  onCheckedChange={(checked) => setWorkedLongHours(checked === true)}
                />
                <Label htmlFor="long" className="font-normal cursor-pointer">
                  Worked more than 10 hours
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual-paid">
              How much were you actually paid for this shift (before tax)?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="actual-paid"
                type="number"
                min="0"
                step="0.01"
                className="pl-7"
                value={actualPaid || ""}
                onChange={(e) => setActualPaid(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          <Button onClick={handleCheckPay} className="w-full" size="lg" disabled={calculating}>
            {calculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              "Check my pay →"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
