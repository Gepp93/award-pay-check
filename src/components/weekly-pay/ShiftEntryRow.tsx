import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { type WeeklyShift } from "@/lib/payCalculator";

interface ShiftEntryRowProps {
  shift: WeeklyShift;
  onUpdate: (id: string, updates: Partial<WeeklyShift>) => void;
  onRemove: (id: string) => void;
  calculation?: any;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ShiftEntryRow = ({ shift, onUpdate, onRemove, calculation }: ShiftEntryRowProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Day</Label>
            <Select
              value={shift.dayOfWeek}
              onValueChange={(value) => onUpdate(shift.id, { dayOfWeek: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              value={shift.startTime}
              onChange={(e) => onUpdate(shift.id, { startTime: e.target.value })}
            />
          </div>

          <div>
            <Label>End Time</Label>
            <Input
              type="time"
              value={shift.endTime}
              onChange={(e) => onUpdate(shift.id, { endTime: e.target.value })}
            />
          </div>

          <div>
            <Label>Break (minutes)</Label>
            <Input
              type="number"
              value={shift.breakMinutes}
              onChange={(e) => onUpdate(shift.id, { breakMinutes: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label>Actually Paid</Label>
            <Input
              type="number"
              step="0.01"
              value={shift.actualPaid}
              onChange={(e) => onUpdate(shift.id, { actualPaid: Number(e.target.value) })}
              placeholder="$0.00"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemove(shift.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`past6pm-${shift.id}`}
              checked={shift.workedPast6pm}
              onCheckedChange={(checked) => 
                onUpdate(shift.id, { workedPast6pm: checked as boolean })
              }
            />
            <Label htmlFor={`past6pm-${shift.id}`} className="text-sm">
              Past 6pm
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`weekend-${shift.id}`}
              checked={shift.isWeekend}
              onCheckedChange={(checked) => 
                onUpdate(shift.id, { isWeekend: checked as boolean })
              }
            />
            <Label htmlFor={`weekend-${shift.id}`} className="text-sm">
              Weekend
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`holiday-${shift.id}`}
              checked={shift.isPublicHoliday}
              onCheckedChange={(checked) => 
                onUpdate(shift.id, { isPublicHoliday: checked as boolean })
              }
            />
            <Label htmlFor={`holiday-${shift.id}`} className="text-sm">
              Public Holiday
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`travel-${shift.id}`}
              checked={shift.travelWithCar}
              onCheckedChange={(checked) => 
                onUpdate(shift.id, { travelWithCar: checked as boolean })
              }
            />
            <Label htmlFor={`travel-${shift.id}`} className="text-sm">
              Travel
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`meal-${shift.id}`}
              checked={shift.boughtOwnMeal}
              onCheckedChange={(checked) => 
                onUpdate(shift.id, { boughtOwnMeal: checked as boolean })
              }
            />
            <Label htmlFor={`meal-${shift.id}`} className="text-sm">
              Own Meal
            </Label>
          </div>
        </div>

        {calculation && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Should earn</p>
              <p className="font-bold text-lg">${calculation.shouldEarn.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">You were paid</p>
              <p className="font-bold text-lg">${shift.actualPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Difference</p>
              <p className={`font-bold text-lg ${calculation.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculation.difference >= 0 ? '+' : ''}${calculation.difference.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};