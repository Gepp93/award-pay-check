import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { HoursWorked } from "@/types/payCheck";

interface MultiDayShiftEntryProps {
  shifts: HoursWorked[];
  onUpdateShift: (index: number, shift: HoursWorked) => void;
  onAddShift: () => void;
  onRemoveShift: (index: number) => void;
}

export const MultiDayShiftEntry = ({
  shifts,
  onUpdateShift,
  onAddShift,
  onRemoveShift,
}: MultiDayShiftEntryProps) => {
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", { weekday: "short" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Shifts in Pay Period</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddShift}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Day
        </Button>
      </div>

      {shifts.map((shift, index) => (
        <div
          key={index}
          className="border border-border rounded-lg p-4 space-y-3 bg-secondary/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              Day {index + 1} {shift.date && `- ${getDayOfWeek(shift.date)}`}
            </span>
            {shifts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveShift(index)}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`date-${index}`} className="text-xs">
                Date
              </Label>
              <Input
                id={`date-${index}`}
                type="date"
                value={shift.date}
                onChange={(e) =>
                  onUpdateShift(index, {
                    ...shift,
                    date: e.target.value,
                    day_of_week: getDayOfWeek(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor={`break-${index}`} className="text-xs">
                Break (mins)
              </Label>
              <Input
                id={`break-${index}`}
                type="number"
                placeholder="30"
                value={shift.break_minutes || ""}
                onChange={(e) =>
                  onUpdateShift(index, {
                    ...shift,
                    break_minutes: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`start-${index}`} className="text-xs">
                Start Time
              </Label>
              <Input
                id={`start-${index}`}
                type="time"
                value={shift.start}
                onChange={(e) =>
                  onUpdateShift(index, { ...shift, start: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor={`finish-${index}`} className="text-xs">
                Finish Time
              </Label>
              <Input
                id={`finish-${index}`}
                type="time"
                value={shift.finish}
                onChange={(e) =>
                  onUpdateShift(index, { ...shift, finish: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
