import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NavBar } from "@/components/NavBar";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { MultiDayShiftEntry } from "@/components/wizard/MultiDayShiftEntry";
import { AllowancesSection } from "@/components/wizard/AllowancesSection";
import { HoursWorked, AllowanceReported } from "@/types/payCheck";

export default function NewCheck_Step2_ShiftDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    awardCode, 
    awardName,
    classificationId, 
    employmentType, 
    knowsClassification, 
    workArea,
    jobDescription,
    industry,
    state 
  } = location.state || {};

  // Pay period type
  const [payPeriodType, setPayPeriodType] = useState<"single" | "weekly" | "fortnightly">("single");
  
  // Single shift fields (existing)
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [finishTime, setFinishTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("30");
  
  // Multi-day shifts
  const [shifts, setShifts] = useState<HoursWorked[]>([
    { date: "", day_of_week: "", start: "", finish: "", break_minutes: 30 }
  ]);
  
  // Free-text shift input for AI parsing
  const [freeTextShifts, setFreeTextShifts] = useState("");
  const [parsingShifts, setParsingShifts] = useState(false);
  
  // Enhanced conditions
  const [workedWeekend, setWorkedWeekend] = useState(false);
  const [workedPublicHoliday, setWorkedPublicHoliday] = useState(false);
  const [workedNights, setWorkedNights] = useState(false);
  const [droveOwnCar, setDroveOwnCar] = useState(false);
  const [workedOver10Hours, setWorkedOver10Hours] = useState(false);
  const [overtimeFrequency, setOvertimeFrequency] = useState<"never" | "sometimes" | "often">("never");
  
  // NEW: Allowance-triggering conditions - General
  const [workedAtHeight, setWorkedAtHeight] = useState(false);
  const [workedInConfinedSpace, setWorkedInConfinedSpace] = useState(false);
  const [usedOwnTools, setUsedOwnTools] = useState(false);
  const [isFirstAider, setIsFirstAider] = useState(false);
  const [isLeadingHand, setIsLeadingHand] = useState(false);
  const [workedInDirtyConditions, setWorkedInDirtyConditions] = useState(false);
  const [workedInExtremeWeather, setWorkedInExtremeWeather] = useState(false);
  const [workedUnderground, setWorkedUnderground] = useState(false);
  
  // NEW: Multi-industry allowance conditions
  const [workedInColdRoom, setWorkedInColdRoom] = useState(false);
  const [woreUniform, setWoreUniform] = useState(false);
  const [wasOnCall, setWasOnCall] = useState(false);
  const [wasCalledBack, setWasCalledBack] = useState(false);
  const [workedSplitShift, setWorkedSplitShift] = useState(false);
  const [holdsSpecialLicence, setHoldsSpecialLicence] = useState(false);
  const [transportedDangerousGoods, setTransportedDangerousGoods] = useState(false);
  const [workedRemoteSite, setWorkedRemoteSite] = useState(false);
  const [stayedAwayFromHome, setStayedAwayFromHome] = useState(false);
  const [operatedForklift, setOperatedForklift] = useState(false);
  const [holdsQualification, setHoldsQualification] = useState(false);
  
  // Enhanced allowances
  const [allowances, setAllowances] = useState<AllowanceReported[]>([
    { type: "travel", received: false, amount_per_period: 0 },
    { type: "meal", received: false, amount_per_period: 0 },
    { type: "site", received: false, amount_per_period: 0 },
    { type: "remote work", received: false, amount_per_period: 0 },
  ]);
  
  const [loading, setLoading] = useState(false);

  // Payslip fields
  const [payslipOpen, setPayslipOpen] = useState(true);
  const [payslipBaseRate, setPayslipBaseRate] = useState("");
  const [hoursAtBase, setHoursAtBase] = useState("");
  const [hoursAt150, setHoursAt150] = useState("");
  const [hoursAt200, setHoursAt200] = useState("");
  const [paidAllowances, setPaidAllowances] = useState<'no' | 'yes'>('no');
  const [allowanceDetails, setAllowanceDetails] = useState("");

  if (!awardCode || !employmentType) {
    navigate("/new-check-step-1");
    return null;
  }

  const handleParseShifts = async () => {
    if (!freeTextShifts.trim()) return;
    
    setParsingShifts(true);
    try {
      // Get the start of current week as context
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
      
      const { data, error } = await supabase.functions.invoke("ai-parse-shifts", {
        body: {
          freeTextShifts,
          weekStartDate: weekStart.toISOString().split('T')[0],
        },
      });

      if (error) throw error;

      if (data?.shifts && data.shifts.length > 0) {
        setShifts(data.shifts);
        toast({
          title: "Shifts Parsed",
          description: `Successfully parsed ${data.shifts.length} shift(s). Review them in the "Day by Day" tab.`,
        });
      } else {
        toast({
          title: "No Shifts Found",
          description: "Could not parse any shifts from your input. Try rephrasing.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: "Parsing Failed",
        description: "Could not parse shifts. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setParsingShifts(false);
    }
  };

  const handleCheckPay = async () => {
    if (!date || !startTime || !finishTime) {
      toast({
        title: "Missing Information",
        description: "Please complete date and shift times",
        variant: "destructive",
      });
      return;
    }

    // Check if payslip data is provided
    if (!payslipBaseRate || !hoursAtBase) {
      toast({
        title: "Missing Payslip Information",
        description: "Please provide your base hourly rate and hours worked",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate actual paid from payslip data
      const baseRate = parseFloat(payslipBaseRate) || 0;
      const hrsBase = parseFloat(hoursAtBase) || 0;
      const hrs150 = parseFloat(hoursAt150) || 0;
      const hrs200 = parseFloat(hoursAt200) || 0;
      
      const actualPaid = (baseRate * hrsBase) + (baseRate * 1.5 * hrs150) + (baseRate * 2 * hrs200);

      // Build payslip data
      const advancedPayslip = {
        payslipBaseRate: baseRate,
        hoursAtBase: hrsBase,
        hoursAt150: hrs150,
        hoursAt200: hrs200,
        paidAllowances,
        allowanceDetails: paidAllowances === 'yes' ? allowanceDetails : null,
      };

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
          actualPaid: actualPaid,
          advancedPayslip,
          // NEW: Allowance conditions - expanded for all industries
          allowanceConditions: {
            workedAtHeight,
            workedInConfinedSpace,
            workedUnderground,
            usedOwnTools,
            isFirstAider,
            isLeadingHand,
            workedInDirtyConditions,
            workedInExtremeWeather,
            workedNights,
            // Multi-industry conditions
            workedInColdRoom,
            woreUniform,
            wasOnCall,
            wasCalledBack,
            workedSplitShift,
            holdsSpecialLicence,
            transportedDangerousGoods,
            workedRemoteSite,
            stayedAwayFromHome,
            operatedForklift,
            holdsQualification,
          },
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
            actualPaid: actualPaid.toFixed(2),
          },
          advancedPayslip: {
            payslipBaseRate: baseRate,
            hoursAtBase: hrsBase,
            hoursAt150: hrs150,
            hoursAt200: hrs200,
            paidAllowances,
            allowanceDetails: paidAllowances === 'yes' ? allowanceDetails : null,
          },
        },
      });
    } catch (error) {
      console.error('Calculation error:', error);
      const errorMessage = error?.message || 'Failed to calculate pay. Please try again.';
      const errorDetails = (error as any)?.details;
      
      toast({
        title: "Error",
        description: errorDetails || errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-2xl">
        <CardHeader>
          <ProgressIndicator currentStep={2} />
          <CardTitle>Step 2: Hours & Pay</CardTitle>
          <CardDescription>Tell us about your shift(s) and pay details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Pay Period Type</Label>
            <Select value={payPeriodType} onValueChange={(value: any) => setPayPeriodType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Shift</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {payPeriodType === "single" ? (
            <>
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
            </>
          ) : (
            <Tabs defaultValue="structured" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="structured">Day by Day</TabsTrigger>
                <TabsTrigger value="freetext">Quick Entry</TabsTrigger>
              </TabsList>
              <TabsContent value="structured" className="space-y-4 mt-4">
                <MultiDayShiftEntry
                  shifts={shifts}
                  onUpdateShift={(index, shift) => {
                    const newShifts = [...shifts];
                    newShifts[index] = shift;
                    setShifts(newShifts);
                  }}
                  onAddShift={() => {
                    setShifts([...shifts, { date: "", day_of_week: "", start: "", finish: "", break_minutes: 30 }]);
                  }}
                  onRemoveShift={(index) => {
                    setShifts(shifts.filter((_, i) => i !== index));
                  }}
                />
              </TabsContent>
              <TabsContent value="freetext" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Describe your shifts</Label>
                  <Textarea
                    placeholder="e.g., Monday to Friday 6am-2:30pm, Saturday 8am-12pm no break"
                    value={freeTextShifts}
                    onChange={(e) => setFreeTextShifts(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your shifts in plain English - AI will parse them for you
                  </p>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleParseShifts}
                    disabled={parsingShifts || !freeTextShifts.trim()}
                    className="w-full"
                  >
                    {parsingShifts ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      "Parse Shifts with AI"
                    )}
                  </Button>
                  {shifts.length > 0 && shifts[0].date && (
                    <p className="text-sm text-green-600">
                      ✓ {shifts.length} shift(s) parsed - review in "Day by Day" tab
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

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
                  id="nights"
                  checked={workedNights}
                  onCheckedChange={(checked) => setWorkedNights(checked as boolean)}
                />
                <label htmlFor="nights" className="text-sm cursor-pointer">
                  Worked night shifts (between 8pm-6am)
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
                  Worked more than 10 hours in a day
                </label>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label>How often do you work overtime?</Label>
              <RadioGroup value={overtimeFrequency} onValueChange={(value: any) => setOvertimeFrequency(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="ot-never" />
                  <Label htmlFor="ot-never" className="font-normal cursor-pointer">Never</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sometimes" id="ot-sometimes" />
                  <Label htmlFor="ot-sometimes" className="font-normal cursor-pointer">Sometimes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="often" id="ot-often" />
                  <Label htmlFor="ot-often" className="font-normal cursor-pointer">Often</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Allowance-Triggering Conditions</Label>
            <p className="text-xs text-muted-foreground">Check any that apply - these may entitle you to extra allowances</p>
            
            {/* General Conditions */}
            <Collapsible defaultOpen className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                <ChevronDown className="h-4 w-4" />
                General Conditions
              </CollapsibleTrigger>
              <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="tools" checked={usedOwnTools} onCheckedChange={(checked) => setUsedOwnTools(checked as boolean)} />
                  <label htmlFor="tools" className="text-sm cursor-pointer">Used your own tools</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="first-aid" checked={isFirstAider} onCheckedChange={(checked) => setIsFirstAider(checked as boolean)} />
                  <label htmlFor="first-aid" className="text-sm cursor-pointer">Appointed first aider</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="leading-hand" checked={isLeadingHand} onCheckedChange={(checked) => setIsLeadingHand(checked as boolean)} />
                  <label htmlFor="leading-hand" className="text-sm cursor-pointer">Supervise other employees</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="uniform" checked={woreUniform} onCheckedChange={(checked) => setWoreUniform(checked as boolean)} />
                  <label htmlFor="uniform" className="text-sm cursor-pointer">Wore uniform/work clothing</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="qualification" checked={holdsQualification} onCheckedChange={(checked) => setHoldsQualification(checked as boolean)} />
                  <label htmlFor="qualification" className="text-sm cursor-pointer">Hold Cert IV/RN/EN/trade certificate</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="licence" checked={holdsSpecialLicence} onCheckedChange={(checked) => setHoldsSpecialLicence(checked as boolean)} />
                  <label htmlFor="licence" className="text-sm cursor-pointer">Hold special licence (forklift, electrical, etc.)</label>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Hazardous/Physical Conditions */}
            <Collapsible className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                <ChevronDown className="h-4 w-4" />
                Hazardous/Physical Conditions
              </CollapsibleTrigger>
              <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="height" checked={workedAtHeight} onCheckedChange={(checked) => setWorkedAtHeight(checked as boolean)} />
                  <label htmlFor="height" className="text-sm cursor-pointer">Worked at heights (above 15m)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="confined" checked={workedInConfinedSpace} onCheckedChange={(checked) => setWorkedInConfinedSpace(checked as boolean)} />
                  <label htmlFor="confined" className="text-sm cursor-pointer">Worked in confined spaces</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="underground" checked={workedUnderground} onCheckedChange={(checked) => setWorkedUnderground(checked as boolean)} />
                  <label htmlFor="underground" className="text-sm cursor-pointer">Worked underground</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="dirty" checked={workedInDirtyConditions} onCheckedChange={(checked) => setWorkedInDirtyConditions(checked as boolean)} />
                  <label htmlFor="dirty" className="text-sm cursor-pointer">Dirty/dusty/offensive conditions</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="extreme-weather" checked={workedInExtremeWeather} onCheckedChange={(checked) => setWorkedInExtremeWeather(checked as boolean)} />
                  <label htmlFor="extreme-weather" className="text-sm cursor-pointer">Extreme heat (46°C+) or cold (0°C or below)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="cold-room" checked={workedInColdRoom} onCheckedChange={(checked) => setWorkedInColdRoom(checked as boolean)} />
                  <label htmlFor="cold-room" className="text-sm cursor-pointer">Worked in freezer/cool room</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="dangerous-goods" checked={transportedDangerousGoods} onCheckedChange={(checked) => setTransportedDangerousGoods(checked as boolean)} />
                  <label htmlFor="dangerous-goods" className="text-sm cursor-pointer">Handled/transported dangerous goods</label>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Shift/Roster Conditions */}
            <Collapsible className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                <ChevronDown className="h-4 w-4" />
                Shift/Roster Conditions
              </CollapsibleTrigger>
              <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="on-call" checked={wasOnCall} onCheckedChange={(checked) => setWasOnCall(checked as boolean)} />
                  <label htmlFor="on-call" className="text-sm cursor-pointer">Was on-call / available to be called in</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="called-back" checked={wasCalledBack} onCheckedChange={(checked) => setWasCalledBack(checked as boolean)} />
                  <label htmlFor="called-back" className="text-sm cursor-pointer">Called back to work after finishing shift</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="split-shift" checked={workedSplitShift} onCheckedChange={(checked) => setWorkedSplitShift(checked as boolean)} />
                  <label htmlFor="split-shift" className="text-sm cursor-pointer">Worked a split/broken shift</label>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Location/Travel Conditions */}
            <Collapsible className="space-y-2">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
                <ChevronDown className="h-4 w-4" />
                Location & Travel
              </CollapsibleTrigger>
              <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remote-site" checked={workedRemoteSite} onCheckedChange={(checked) => setWorkedRemoteSite(checked as boolean)} />
                  <label htmlFor="remote-site" className="text-sm cursor-pointer">Worked at remote site / away from usual base</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="away-from-home" checked={stayedAwayFromHome} onCheckedChange={(checked) => setStayedAwayFromHome(checked as boolean)} />
                  <label htmlFor="away-from-home" className="text-sm cursor-pointer">Stayed overnight / away from home</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="forklift" checked={operatedForklift} onCheckedChange={(checked) => setOperatedForklift(checked as boolean)} />
                  <label htmlFor="forklift" className="text-sm cursor-pointer">Operated forklift / heavy machinery</label>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <AllowancesSection
            allowances={allowances}
            onUpdateAllowance={(index, allowance) => {
              const newAllowances = [...allowances];
              newAllowances[index] = allowance;
              setAllowances(newAllowances);
            }}
          />

          <Collapsible open={payslipOpen} onOpenChange={setPayslipOpen} className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 w-full justify-start p-0 h-auto font-normal">
                <ChevronDown className={cn("h-4 w-4 transition-transform", payslipOpen && "transform rotate-180")} />
                <span className="text-sm font-medium">Your payslip breakdown</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Base hourly rate</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={payslipBaseRate}
                      onChange={(e) => setPayslipBaseRate(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Hours at base rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hoursAtBase}
                    onChange={(e) => setHoursAtBase(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hours at 1.5× (time and a half)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hoursAt150}
                    onChange={(e) => setHoursAt150(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hours at 2× (double time)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hoursAt200}
                    onChange={(e) => setHoursAt200(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Were you paid any allowances on this shift?</Label>
                  <RadioGroup value={paidAllowances} onValueChange={(value) => setPaidAllowances(value as 'no' | 'yes')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="allowances-no" />
                      <Label htmlFor="allowances-no" className="font-normal cursor-pointer">No / not sure</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="allowances-yes" />
                      <Label htmlFor="allowances-yes" className="font-normal cursor-pointer">Yes – I was paid allowances</Label>
                    </div>
                  </RadioGroup>

                  {paidAllowances === 'yes' && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="allowance-details" className="text-sm text-muted-foreground">
                        What does your payslip say?
                      </Label>
                      <Textarea
                        id="allowance-details"
                        value={allowanceDetails}
                        onChange={(e) => setAllowanceDetails(e.target.value)}
                        placeholder="e.g. meal allowance $20, travel allowance $15"
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
    </>
  );
}
