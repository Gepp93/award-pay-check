import { useState } from "react";
import { Building2, UtensilsCrossed, ShoppingBag, Truck, FileText, Sparkles, Heart, Baby, Factory, Wrench, MoreHorizontal, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface IndustrySelectionProps {
  onSelect: (industry: string) => void;
}

const commonIndustries = [
  { name: "Hospitality", icon: UtensilsCrossed },
  { name: "Building and Construction", icon: Building2 },
  { name: "Retail", icon: ShoppingBag },
  { name: "Transport and Logistics", icon: Truck },
  { name: "Clerical and Administrative", icon: FileText },
  { name: "Cleaning Services", icon: Sparkles },
  { name: "Health and Aged Care", icon: Heart },
  { name: "Early Childhood Education and Care", icon: Baby },
];

const allIndustries = [
  "Hospitality",
  "Building and Construction",
  "Retail",
  "Transport and Logistics",
  "Clerical and Administrative",
  "Cleaning Services",
  "Health and Aged Care",
  "Early Childhood Education and Care",
  "Manufacturing",
  "Mining",
  "Security Services",
  "Storage Services and Wholesale",
  "Fast Food",
  "Hair and Beauty",
  "Social and Community Services",
  "Pharmacy",
  "Real Estate",
  "Banking and Finance",
  "Telecommunications",
  "Educational Services",
  "Restaurant",
  "Legal Services",
  "Agricultural",
  "Timber",
  "Textile and Footwear",
  "Marine Tourism and Charter Vessels",
  "Fitness",
  "Passenger Vehicle Transportation",
  "Contract Call Centres",
  "Electrical Power",
];

export const IndustrySelection = ({ onSelect }: IndustrySelectionProps) => {
  const [selectedFromDropdown, setSelectedFromDropdown] = useState("");

  const handleDropdownSelect = (value: string) => {
    setSelectedFromDropdown(value);
    onSelect(value);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
      <CardHeader>
        <CardTitle>Step 1: Select Your Industry</CardTitle>
        <CardDescription>Choose the industry you work in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">Common Industries</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {commonIndustries.map((industry) => {
              const Icon = industry.icon;
              return (
                <Button
                  key={industry.name}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-accent/20 hover:border-accent hover:text-foreground transition-all"
                  onClick={() => onSelect(industry.name)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs text-center font-medium leading-tight">{industry.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">All Industries</Label>
          <Select onValueChange={handleDropdownSelect} value={selectedFromDropdown}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Search or select your industry..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {allIndustries.sort().map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
