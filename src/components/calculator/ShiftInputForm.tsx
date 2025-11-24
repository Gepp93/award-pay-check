import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";
import { type ShiftData } from "@/lib/payCalculator";

interface ShiftInputFormProps {
  onCalculate: (data: ShiftData) => void;
}

export const ShiftInputForm = ({ onCalculate }: ShiftInputFormProps) => {
  const [formData, setFormData] = useState<ShiftData>({
    startTime: "09:00",
    endTime: "17:00",
    breakMinutes: 30,
    dayOfWeek: "Monday",
    baseRate: 28.5,
    awardType: "Generic Award",
  });

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
            <Label htmlFor="awardType">Award Type</Label>
            <Select
              value={formData.awardType}
              onValueChange={(value) =>
                setFormData({ ...formData, awardType: value })
              }
            >
              <SelectTrigger id="awardType" className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Generic Award">Generic Award</SelectItem>
                <SelectItem value="Sample Award">Sample Award</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
