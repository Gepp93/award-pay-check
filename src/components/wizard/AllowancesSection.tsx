import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AllowanceReported } from "@/types/payCheck";

interface AllowancesSectionProps {
  allowances: AllowanceReported[];
  onUpdateAllowance: (index: number, allowance: AllowanceReported) => void;
}

export const AllowancesSection = ({
  allowances,
  onUpdateAllowance,
}: AllowancesSectionProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        Allowances Received (if any)
      </Label>
      <div className="space-y-3">
        {allowances.map((allowance, index) => (
          <div
            key={index}
            className="border border-border rounded-lg p-4 space-y-3 bg-secondary/5"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`allowance-${index}`}
                checked={allowance.received}
                onCheckedChange={(checked) =>
                  onUpdateAllowance(index, {
                    ...allowance,
                    received: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor={`allowance-${index}`}
                className="text-sm font-medium cursor-pointer"
              >
                {allowance.type.charAt(0).toUpperCase() +
                  allowance.type.slice(1)}{" "}
                Allowance
              </Label>
            </div>
            {allowance.received && (
              <div>
                <Label htmlFor={`amount-${index}`} className="text-xs">
                  Amount per pay period ($)
                </Label>
                <Input
                  id={`amount-${index}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={allowance.amount_per_period || ""}
                  onChange={(e) =>
                    onUpdateAllowance(index, {
                      ...allowance,
                      amount_per_period: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
