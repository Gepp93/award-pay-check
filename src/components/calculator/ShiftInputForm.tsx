import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type ShiftData } from "@/lib/payCalculator";

interface ShiftInputFormProps {
  onCalculate: (data: ShiftData) => void;
  awardInfo?: {
    awardId: string;
    awardName: string;
    awardCode: string;
  } | null;
}

interface PayRateInfo {
  officialRate: number;
  actualRate: number;
  classificationName: string;
}

export const ShiftInputForm = ({ onCalculate, awardInfo }: ShiftInputFormProps) => {
  const [formData, setFormData] = useState<ShiftData>({
    startTime: "09:00",
    endTime: "17:00",
    breakMinutes: 30,
    dayOfWeek: "Monday",
    baseRate: 28.5,
    awardType: awardInfo?.awardName || "Not Selected",
  });

  const [classifications, setClassifications] = useState<any[]>([]);
  const [selectedClassification, setSelectedClassification] = useState("");
  const [selectedClassificationName, setSelectedClassificationName] = useState("");
  const [loadingClassifications, setLoadingClassifications] = useState(false);
  const [officialBaseRate, setOfficialBaseRate] = useState<number | null>(null);
  const [actualPayRate, setActualPayRate] = useState<number>(0);

  useEffect(() => {
    if (awardInfo?.awardCode) {
      console.log("Loading classifications for award:", awardInfo.awardCode);
      loadClassifications();
    } else {
      console.log("No award info available, awardInfo:", awardInfo);
    }
  }, [awardInfo]);

  const loadClassifications = async () => {
    if (!awardInfo?.awardCode) return;
    
    setLoadingClassifications(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-classifications", {
        body: { awardId: awardInfo.awardCode },
      });

      if (error) throw error;

      if (data?.results) {
        setClassifications(data.results);
      }
    } catch (error) {
      console.error("Error loading classifications:", error);
      toast.error("Failed to load classifications");
    } finally {
      setLoadingClassifications(false);
    }
  };

  const handleClassificationChange = async (classificationId: string) => {
    const selectedClass = classifications.find(c => c.classification_fixed_id.toString() === classificationId);
    setSelectedClassification(classificationId);
    setSelectedClassificationName(selectedClass?.classification || "");
    
    // Fetch official pay rates from FWC
    try {
      const { data, error } = await supabase.functions.invoke("get-pay-rates", {
        body: { 
          awardId: awardInfo?.awardCode,
          classificationFixedId: classificationId 
        },
      });

      if (error) throw error;

      console.log("Official FWC pay rates data:", data);

      if (data?.baseRate) {
        const officialRate = Number(data.baseRate);
        setOfficialBaseRate(officialRate);
        // Set the official rate as the base for calculations
        setFormData({ ...formData, baseRate: officialRate });
        toast.success(`Official FWC rate loaded: $${officialRate.toFixed(2)}/hour`);
      } else {
        toast.warning("Could not fetch official pay rate from FWC");
      }
    } catch (error) {
      console.error("Error loading official pay rates:", error);
      toast.error("Failed to load official FWC pay rate");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-accent" />
          Shift Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Your Award</Label>
            {awardInfo ? (
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-md">
                <p className="font-semibold text-sm">{awardInfo.awardName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Code: {awardInfo.awardCode}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="font-semibold text-sm text-destructive">No award selected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please complete onboarding to select your award
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => window.location.href = "/onboarding"}
                >
                  Complete Onboarding
                </Button>
              </div>
            )}
          </div>

          {classifications.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="classification">Job Classification Level</Label>
              <Select
                value={selectedClassification}
                onValueChange={handleClassificationChange}
                disabled={loadingClassifications}
              >
                <SelectTrigger id="classification" className="bg-secondary/50">
                  <SelectValue placeholder="Select your classification level..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {classifications
                    .filter(c => c.parent_classification_name) // Only show child classifications with levels
                    .map((classification) => (
                      <SelectItem 
                        key={classification.classification_fixed_id} 
                        value={classification.classification_fixed_id.toString()}
                      >
                        {classification.parent_classification_name} - {classification.classification}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your specific pay level within your classification
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="bg-secondary/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <Select
              value={formData.dayOfWeek}
              onValueChange={(value) =>
                setFormData({ ...formData, dayOfWeek: value })
              }
            >
              <SelectTrigger id="dayOfWeek" className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakMinutes">Break Duration (minutes)</Label>
            <Input
              id="breakMinutes"
              type="number"
              min="0"
              value={formData.breakMinutes}
              onChange={(e) =>
                setFormData({ ...formData, breakMinutes: Number(e.target.value) })
              }
              className="bg-secondary/50"
              required
            />
          </div>

          {officialBaseRate && (
            <div className="space-y-3 p-4 bg-primary/10 border border-primary/20 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">Official FWC Rate</p>
                  <p className="text-xs text-muted-foreground">{selectedClassificationName}</p>
                </div>
                <p className="text-2xl font-bold text-primary">${officialBaseRate.toFixed(2)}<span className="text-sm">/hr</span></p>
              </div>
              <div className="pt-2 border-t border-primary/20">
                <Label htmlFor="actualRate" className="text-xs">What are you actually being paid? (Optional)</Label>
                <Input
                  id="actualRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`Enter your actual rate to compare`}
                  value={actualPayRate || ""}
                  onChange={(e) => setActualPayRate(Number(e.target.value))}
                  className="bg-background mt-1"
                />
                {actualPayRate > 0 && (
                  <div className="mt-2 p-2 rounded-md" style={{
                    backgroundColor: actualPayRate < officialBaseRate ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--success) / 0.1)',
                  }}>
                    {actualPayRate < officialBaseRate ? (
                      <div className="text-sm">
                        <p className="font-semibold text-destructive">⚠️ You may be underpaid!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Difference: ${(officialBaseRate - actualPayRate).toFixed(2)}/hr less than official rate
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <p className="font-semibold text-success">✓ You're being paid correctly</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${(actualPayRate - officialBaseRate).toFixed(2)}/hr above minimum rate
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={!officialBaseRate}
          >
            {officialBaseRate ? 'Calculate What You Should Earn' : 'Select Classification First'}
          </Button>
          {officialBaseRate && (
            <p className="text-xs text-center text-muted-foreground">
              Calculation based on official FWC award rates
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
