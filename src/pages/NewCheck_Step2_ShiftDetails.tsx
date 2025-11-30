import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function NewCheck_Step2_ShiftDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { awardCode, classificationId, employmentType, knowsClassification, workArea } = location.state || {};

  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [finishTime, setFinishTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("30");
  const [workedWeekend, setWorkedWeekend] = useState(false);
  const [workedPublicHoliday, setWorkedPublicHoliday] = useState(false);
  const [droveOwnCar, setDroveOwnCar] = useState(false);
  const [workedOver10Hours, setWorkedOver10Hours] = useState(false);
  const [actualPaid, setActualPaid] = useState("");
  const [loading, setLoading] = useState(false);

  if (!awardCode || !employmentType) {
    navigate("/new-check-step-1");
    return null;
  }

  const handleCheckPay = async () => {
    if (!date || !startTime || !finishTime || !actualPaid) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-shift-pay", {
        body: {
          awardCode,
          classificationId,
          employmentType,
          workArea,
          date: format(date, "yyyy-MM-dd"),
          startTime,
          finishTime,
          breakMinutes: parseInt(breakMinutes) || 0,
          workedWeekend,
          workedPublicHoliday,
          droveOwnCar,
          workedOver10Hours,
          actualPaid: parseFloat(actualPaid),
        },
      });

      if (error) throw error;

      navigate("/new-check-step-3", {
        state: {
          result: data,
          shiftDetails: {
            awardCode,
            classificationId,
            employmentType,
            date: format(date, "yyyy-MM-dd"),
            startTime,
            finishTime,
            breakMinutes,
            actualPaid,
          },
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate pay. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Step 2: Your shift details</CardTitle>
          <CardDescription>Tell us about the shift you worked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Shift Date</Label>
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
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Finish Time</Label>
              <Input type="time" value={finishTime} onChange={(e) => setFinishTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unpaid Break (minutes)</Label>
            <Input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              placeholder="30"
            />
          </div>

          <div className="space-y-3">
            <Label>Shift Conditions</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weekend"
                  checked={workedWeekend}
                  onCheckedChange={(checked) => setWorkedWeekend(checked as boolean)}
                />
                <label htmlFor="weekend" className="text-sm cursor-pointer">
                  Worked Saturday or Sunday
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public-holiday"
                  checked={workedPublicHoliday}
                  onCheckedChange={(checked) => setWorkedPublicHoliday(checked as boolean)}
                />
                <label htmlFor="public-holiday" className="text-sm cursor-pointer">
                  Worked on a public holiday
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="own-car"
                  checked={droveOwnCar}
                  onCheckedChange={(checked) => setDroveOwnCar(checked as boolean)}
                />
                <label htmlFor="own-car" className="text-sm cursor-pointer">
                  Drove your own car for work
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="over-10"
                  checked={workedOver10Hours}
                  onCheckedChange={(checked) => setWorkedOver10Hours(checked as boolean)}
                />
                <label htmlFor="over-10" className="text-sm cursor-pointer">
                  Worked more than 10 hours
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>How much were you actually paid (before tax)?</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
              <Input
                type="number"
                step="0.01"
                value={actualPaid}
                onChange={(e) => setActualPaid(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/new-check-step-1")} className="flex-1">
              Back
            </Button>
            <Button onClick={handleCheckPay} disabled={loading} className="flex-1" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Calculating...
                </>
              ) : (
                "Check my pay"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
