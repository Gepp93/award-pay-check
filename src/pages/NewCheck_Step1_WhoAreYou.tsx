import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function NewCheck_Step1_WhoAreYou() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [awards, setAwards] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAward, setSelectedAward] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");

  const searchAwards = async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-awards", {
        body: { search: query },
      });

      if (error) throw error;
      setAwards(data.results || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch awards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClassifications = async (awardId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-classifications", {
        body: { awardId },
      });

      if (error) throw error;
      setClassifications(data.results || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAwardSelect = (awardCode: string) => {
    setSelectedAward(awardCode);
    setSelectedClassification("");
    setClassifications([]);
    loadClassifications(awardCode);
  };

  const handleNext = () => {
    if (!selectedAward || !selectedClassification || !employmentType) {
      toast({
        title: "Missing Information",
        description: "Please complete all fields",
        variant: "destructive",
      });
      return;
    }

    navigate("/new-check-step-2", {
      state: {
        awardCode: selectedAward,
        classificationId: selectedClassification,
        employmentType,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Step 1: Who are you?</CardTitle>
          <CardDescription>Let's identify your award and job classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Search for your Award</Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by award name or code..."
                className="flex-1 px-3 py-2 border rounded-md"
                onKeyDown={(e) => e.key === "Enter" && searchAwards(searchQuery)}
              />
              <Button onClick={() => searchAwards(searchQuery)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>
            {awards.length > 0 && (
              <Select value={selectedAward} onValueChange={handleAwardSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an award" />
                </SelectTrigger>
                <SelectContent>
                  {awards.map((award) => (
                    <SelectItem key={award.code} value={award.code}>
                      {award.code} - {award.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {classifications.length > 0 && (
            <div className="space-y-2">
              <Label>Job Classification / Level</Label>
              <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your classification" />
                </SelectTrigger>
                <SelectContent>
                  {classifications.map((cls) => (
                    <SelectItem key={cls.fixed_id} value={cls.fixed_id}>
                      {cls.classification}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Employment Type</Label>
            <RadioGroup value={employmentType} onValueChange={setEmploymentType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Full-time" id="full-time" />
                <Label htmlFor="full-time" className="font-normal cursor-pointer">
                  Full-time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Part-time" id="part-time" />
                <Label htmlFor="part-time" className="font-normal cursor-pointer">
                  Part-time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Casual" id="casual" />
                <Label htmlFor="casual" className="font-normal cursor-pointer">
                  Casual
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleNext} className="w-full" size="lg">
            Next
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
