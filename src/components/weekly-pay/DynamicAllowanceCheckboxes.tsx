import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { type WeeklyShift } from "@/lib/payCalculator";

interface DynamicAllowanceCheckboxesProps {
  shift: WeeklyShift;
  allowances: any;
  onUpdate: (id: string, updates: Partial<WeeklyShift>) => void;
}

export const DynamicAllowanceCheckboxes = ({ 
  shift, 
  allowances, 
  onUpdate 
}: DynamicAllowanceCheckboxesProps) => {
  // Find relevant allowances from the FWC data
  const mealAllowance = allowances?.results?.find((a: any) => 
    a.allowance_type_description?.toLowerCase().includes('meal') ||
    a.allowance_description?.toLowerCase().includes('meal')
  );

  const travelAllowance = allowances?.results?.find((a: any) => 
    a.allowance_type_description?.toLowerCase().includes('travel') ||
    a.allowance_type_description?.toLowerCase().includes('vehicle') ||
    a.allowance_description?.toLowerCase().includes('travel')
  );

  return (
    <>
      {mealAllowance && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`meal-${shift.id}`}
            checked={shift.boughtOwnMeal}
            onCheckedChange={(checked) => 
              onUpdate(shift.id, { boughtOwnMeal: checked as boolean })
            }
          />
          <Label htmlFor={`meal-${shift.id}`} className="text-sm cursor-pointer">
            Meal Allowance
          </Label>
        </div>
      )}

      {travelAllowance && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`travel-${shift.id}`}
            checked={shift.travelWithCar}
            onCheckedChange={(checked) => 
              onUpdate(shift.id, { travelWithCar: checked as boolean })
            }
          />
          <Label htmlFor={`travel-${shift.id}`} className="text-sm cursor-pointer">
            Travel Allowance
          </Label>
        </div>
      )}
    </>
  );
};