import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface JobTypeSelectionProps {
  industry: string;
  onSelect: (jobType: string) => void;
  onBack: () => void;
}

const jobTypesByIndustry: Record<string, string[]> = {
  "Hospitality": [
    "Food & Beverage Attendant Level 1",
    "Food & Beverage Attendant Level 2",
    "Food & Beverage Attendant Level 3",
    "Cook Grade 1",
    "Cook Grade 2",
    "Cook Grade 3",
    "Chef",
    "Supervisor",
  ],
  "Building and Construction": [
    "Construction Labourer",
    "Apprentice Level 1",
    "Apprentice Level 2",
    "Apprentice Level 3",
    "Apprentice Level 4",
    "Tradesperson",
    "Leading Hand",
    "Plant Operator",
  ],
  "Retail": [
    "Retail Employee Level 1",
    "Retail Employee Level 2",
    "Retail Employee Level 3",
    "Retail Employee Level 4",
    "Retail Supervisor",
    "Department Manager",
  ],
  "Transport and Logistics": [
    "Driver Grade 1",
    "Driver Grade 2",
    "Driver Grade 3",
    "Driver Grade 4",
    "Logistics Coordinator",
    "Warehouse Worker",
  ],
  "Clerical and Administrative": [
    "Clerical Level 1",
    "Clerical Level 2",
    "Clerical Level 3",
    "Clerical Level 4",
    "Administrative Officer",
  ],
  "Cleaning Services": [
    "Cleaner Level 1",
    "Cleaner Level 2",
    "Cleaner Level 3",
    "Cleaning Supervisor",
  ],
  "Health and Aged Care": [
    "Personal Care Assistant",
    "Healthcare Assistant",
    "Enrolled Nurse",
    "Registered Nurse Level 1",
    "Registered Nurse Level 2",
  ],
  "Early Childhood Education and Care": [
    "Educator Level 1",
    "Educator Level 2",
    "Educator Level 3",
    "Early Childhood Teacher Level 1",
    "Early Childhood Teacher Level 2",
    "Director",
  ],
  "Manufacturing": [
    "Production Worker Level 1",
    "Production Worker Level 2",
    "Production Worker Level 3",
    "Machine Operator",
    "Team Leader",
  ],
};

export const JobTypeSelection = ({ industry, onSelect, onBack }: JobTypeSelectionProps) => {
  const jobTypes = jobTypesByIndustry[industry] || [
    "Entry Level",
    "Mid Level",
    "Senior Level",
    "Supervisor",
  ];

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
        <CardTitle>Step 2: Select Your Role</CardTitle>
        <CardDescription>Choose your job type in {industry}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {jobTypes.map((jobType) => (
            <Button
              key={jobType}
              variant="outline"
              className="justify-start hover:bg-accent/20 hover:border-accent hover:text-foreground transition-all font-medium"
              onClick={() => onSelect(jobType)}
            >
              {jobType}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
