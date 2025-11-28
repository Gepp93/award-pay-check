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
    <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
      <CardHeader>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="w-fit mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <CardTitle>Step 3: Employment Type</CardTitle>
        <CardDescription>How are you employed?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {employmentTypes.map(({ type, icon: Icon, description }) => (
            <Button
              key={type}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start hover:bg-accent/20 hover:border-accent transition-all"
              onClick={() => onSelect(type)}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{type}</span>
              </div>
              <span className="text-sm text-muted-foreground">{description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
