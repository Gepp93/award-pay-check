import { Building2, UtensilsCrossed, ShoppingBag, Truck, FileText, Sparkles, Heart, Baby, Factory, Wrench, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface IndustrySelectionProps {
  onSelect: (industry: string) => void;
}

const industries = [
  { name: "Construction", icon: Building2 },
  { name: "Hospitality", icon: UtensilsCrossed },
  { name: "Retail", icon: ShoppingBag },
  { name: "Transport", icon: Truck },
  { name: "Admin & Clerical", icon: FileText },
  { name: "Cleaning", icon: Sparkles },
  { name: "Healthcare", icon: Heart },
  { name: "Childcare", icon: Baby },
  { name: "Manufacturing", icon: Factory },
  { name: "Trades", icon: Wrench },
  { name: "Other", icon: MoreHorizontal },
];

export const IndustrySelection = ({ onSelect }: IndustrySelectionProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
      <CardHeader>
        <CardTitle>Step 1: Select Your Industry</CardTitle>
        <CardDescription>Choose the industry you work in</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {industries.map((industry) => {
            const Icon = industry.icon;
            return (
              <Button
                key={industry.name}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-accent/10 hover:border-accent"
                onClick={() => onSelect(industry.name)}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm text-center">{industry.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
