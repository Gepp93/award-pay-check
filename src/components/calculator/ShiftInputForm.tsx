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
  const [loadingClassifications, setLoadingClassifications] = useState(false);

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
    setSelectedClassification(classificationId);
    
    // Fetch classification details to get the base rate
    try {
      const { data, error } = await supabase.functions.invoke("get-classification-details", {
        body: { 
          awardId: awardInfo?.awardCode,
          classificationId: classificationId 
        },
      });

      if (error) throw error;

      // Extract base rate from classification details
      // The FWC API structure may vary, adjust as needed
      if (data?.baseRate) {
        setFormData({ ...formData, baseRate: Number(data.baseRate) });
        toast.success("Base rate updated from award classification");
      }
    } catch (error) {
      console.error("Error loading classification details:", error);
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
              <Label htmlFor="classification">Job Classification</Label>
              <Select
                value={selectedClassification}
                onValueChange={handleClassificationChange}
                disabled={loadingClassifications}
              >
                <SelectTrigger id="classification" className="bg-secondary/50">
                  <SelectValue placeholder="Select your classification..." />
                </SelectTrigger>
                <SelectContent>
                  {classifications.map((classification) => (
                    <SelectItem 
                      key={classification.classification_fixed_id || classification.id} 
                      value={classification.classification_fixed_id?.toString() || classification.id?.toString()}
                    >
                      {classification.classification_name || classification.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="baseRate">Base Hourly Rate ($)</Label>
            <Input
              id="baseRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.baseRate}
              onChange={(e) =>
                setFormData({ ...formData, baseRate: Number(e.target.value) })
              }
              className="bg-secondary/50"
              required
            />
            <p className="text-xs text-muted-foreground">
              Select a classification above to auto-fill the rate
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Calculate Pay
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
