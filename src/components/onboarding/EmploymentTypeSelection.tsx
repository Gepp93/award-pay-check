import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, Coffee } from "lucide-react";

interface EmploymentTypeSelectionProps {
  onSelect: (employmentType: string) => void;
  onBack: () => void;
}

const employmentTypes = [
  {
    type: "Full-time",
    icon: Clock,
    description: "Regular hours, typically 38 hours per week",
  },
  {
    type: "Part-time",
    icon: Calendar,
    description: "Regular but fewer hours than full-time",
  },
  {
    type: "Casual",
    icon: Coffee,
    description: "Irregular hours with casual loading",
  },
];

export const EmploymentTypeSelection = ({ onSelect, onBack }: EmploymentTypeSelectionProps) => {
  return (
    <section className="checker-onboarding checker-form">
      <header className="checker-heading">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-fit mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1>Step 3: Employment Type</h1>
        <p>How are you employed?</p>
      </header>
      <div>
        <div className="grid gap-4">
          {employmentTypes.map(({ type, icon: Icon, description }) => (
            <Button
              key={type}
              variant="outline"
              className="checker-choice items-start"
              onClick={() => onSelect(type)}
            >
              <span className="choice-radio" aria-hidden="true" /><div className="min-w-0"><div className="font-semibold">
                <span className="font-semibold">{type}</span>
              </div>
              <span className="text-sm text-muted-foreground">{description}</span></div>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};
