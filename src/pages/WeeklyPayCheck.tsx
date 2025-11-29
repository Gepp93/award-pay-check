import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { ShiftEntryRow } from "@/components/weekly-pay/ShiftEntryRow";
import { WeeklySummary } from "@/components/weekly-pay/WeeklySummary";
import { MissingMoneyBreakdown } from "@/components/weekly-pay/MissingMoneyBreakdown";
import { DetailedBreakdown } from "@/components/weekly-pay/DetailedBreakdown";
import { Plus } from "lucide-react";
import { calculateWeeklyPay, type WeeklyShift } from "@/lib/payCalculator";

export default function WeeklyPayCheck() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [baseRate, setBaseRate] = useState<number>(0);
  const [penalties, setPenalties] = useState<any>(null);
  const [allowances, setAllowances] = useState<any>(null);
  const [shifts, setShifts] = useState<WeeklyShift[]>([
    {
      id: crypto.randomUUID(),
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "17:00",
      breakMinutes: 30,
      workedPast6pm: false,
      isWeekend: false,
      isPublicHoliday: false,
      travelWithCar: false,
      boughtOwnMeal: false,
      actualPaid: 0,
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileAndRates();
  }, []);

  const loadProfileAndRates = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      if (!data.classification_fixed_id) {
        toast.info("Please select your classification first");
        navigate("/award-overview");
        return;
      }

      setProfileData(data);

      // Fetch base rate
      const { data: rateData } = await supabase.functions.invoke('get-pay-rates', {
        body: {
          awardId: data.award_code,
          classificationFixedId: data.classification_fixed_id,
        },
      });

      if (rateData?.baseRate) {
        setBaseRate(rateData.baseRate);
      }

      // Fetch penalties
      const { data: penaltyData } = await supabase.functions.invoke('get-penalties', {
        body: { awardId: data.award_code },
      });

      if (penaltyData) {
        setPenalties(penaltyData);
      }

      // Fetch allowances
      const { data: allowanceData } = await supabase.functions.invoke('get-allowances', {
        body: { awardId: data.award_code },
      });

      if (allowanceData) {
        setAllowances(allowanceData);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load pay information");
    } finally {
      setLoading(false);
    }
  };

  const addShift = () => {
    setShifts([
      ...shifts,
      {
        id: crypto.randomUUID(),
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
        workedPast6pm: false,
        isWeekend: false,
        isPublicHoliday: false,
        travelWithCar: false,
        boughtOwnMeal: false,
        actualPaid: 0,
      },
    ]);
  };

  const updateShift = (id: string, updates: Partial<WeeklyShift>) => {
    setShifts(shifts.map(shift => 
      shift.id === id ? { ...shift, ...updates } : shift
    ));
  };

  const removeShift = (id: string) => {
    if (shifts.length > 1) {
      setShifts(shifts.filter(shift => shift.id !== id));
    }
  };

  const weeklyCalc = calculateWeeklyPay(shifts, baseRate, penalties, allowances);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading pay information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Weekly Pay Check</h1>
          <p className="text-muted-foreground">
            {profileData?.award_name} - {profileData?.classification_name}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {shifts.map((shift) => (
            <ShiftEntryRow
              key={shift.id}
              shift={shift}
              onUpdate={updateShift}
              onRemove={removeShift}
              calculation={weeklyCalc.shifts.find(s => s.id === shift.id)}
              allowances={allowances}
            />
          ))}
        </div>

        <Button onClick={addShift} variant="outline" className="mb-8">
          <Plus className="w-4 h-4 mr-2" />
          Add Another Shift
        </Button>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <WeeklySummary calculation={weeklyCalc} />
          <MissingMoneyBreakdown calculation={weeklyCalc} />
        </div>

        <DetailedBreakdown 
          calculation={weeklyCalc} 
          shifts={shifts}
          baseRate={baseRate}
          penalties={penalties}
          allowances={allowances}
        />
      </div>
    </div>
  );
}