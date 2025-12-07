import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface ManualAwardSelectionProps {
  onSelect: (awardId: string, awardName: string, awardCode: string) => void;
}

export const ManualAwardSelection = ({ onSelect }: ManualAwardSelectionProps) => {
  const [search, setSearch] = useState("");
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAward, setSelectedAward] = useState<any>(null);

  useEffect(() => {
    fetchAwards();
  }, []);

  const fetchAwards = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-awards", {
        body: { search: searchQuery || "" },
      });

      if (error) throw error;

      // Sort awards alphabetically by title
      const sortedAwards = (data?.results || []).sort((a: any, b: any) => 
        (a.title || "").localeCompare(b.title || "")
      );
      setAwards(sortedAwards);
    } catch (error) {
      console.error("Error fetching awards:", error);
      toast.error("Failed to fetch awards");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAwards(search);
  };

  const handleSelectAward = (award: any) => {
    setSelectedAward(award);
  };

  const handleConfirm = () => {
    if (selectedAward) {
      onSelect(
        selectedAward.id || selectedAward.code,
        selectedAward.title,
        selectedAward.code
      );
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card">
      <CardHeader>
        <CardTitle>Select Your Award</CardTitle>
        <CardDescription>
          Search by award name or code (e.g., MA000009)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search awards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading awards...
            </div>
          ) : awards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No awards found. Try a different search.
            </div>
          ) : (
            awards.map((award) => (
              <button
                key={award.code}
                onClick={() => handleSelectAward(award)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedAward?.code === award.code
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <div className="font-semibold">{award.title}</div>
                <div className="text-sm text-muted-foreground">
                  Code: {award.code}
                </div>
              </button>
            ))
          )}
        </div>

        {selectedAward && (
          <Button
            onClick={handleConfirm}
            className="w-full bg-accent hover:bg-accent/90"
          >
            Confirm Selection
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
