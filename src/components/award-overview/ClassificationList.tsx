import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ClassificationListProps {
  awardId: string;
  selectedClassification: any;
  onSelect: (classification: any) => void;
}

export const ClassificationList = ({ 
  awardId, 
  selectedClassification, 
  onSelect 
}: ClassificationListProps) => {
  const [classifications, setClassifications] = useState<any[]>([]);
  const [filteredClassifications, setFilteredClassifications] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<string>("all");
  const [streams, setStreams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassifications();
  }, [awardId]);

  useEffect(() => {
    // Filter classifications when stream changes
    if (selectedStream === "all") {
      setFilteredClassifications(classifications);
    } else {
      setFilteredClassifications(
        classifications.filter(c => c.stream === selectedStream)
      );
    }
  }, [selectedStream, classifications]);

  const fetchClassifications = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-classifications', {
        body: { awardId }
      });

      if (error) throw error;

      if (data?.results) {
        // Process all classifications - only filter out pure rate entries
        const subRateKeywords = ['base rate', 'weekly rate', 'hourly rate', 'industry allowance', 'total weekly rate'];
        
        const processedData = data.results
          .filter((item: any) => {
            const classification = item.classification?.toLowerCase() || '';
            // Skip pure rate entries
            return !subRateKeywords.some(keyword => classification === keyword);
          })
          .map((item: any) => ({
            classification_fixed_id: item.classification_fixed_id,
            parent_classification_name: item.parent_classification_name || 'Other',
            classification: item.classification,
            clause_description: item.clause_description || '',
            stream: item.clause_description || 'Other', // Use clause_description as stream grouping
          }));

        // Remove exact duplicates
        const uniqueClassifications = processedData.reduce((acc: any[], curr: any) => {
          const key = `${curr.parent_classification_name}_${curr.classification}_${curr.clause_description}`;
          
          if (!acc.find(item => {
            const itemKey = `${item.parent_classification_name}_${item.classification}_${item.clause_description}`;
            return itemKey === key;
          })) {
            acc.push(curr);
          }
          
          return acc;
        }, []);

        setClassifications(uniqueClassifications);
        setFilteredClassifications(uniqueClassifications);
        
        // Extract unique streams for dropdown
        const uniqueStreams = Array.from(new Set(uniqueClassifications.map(c => c.stream))) as string[];
        setStreams(uniqueStreams.sort());
      }
    } catch (error) {
      console.error('Error fetching classifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your job level</CardTitle>
        <CardDescription>
          First select your work area, then choose your specific classification
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stream/Work Area Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Work Area / Category</label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All areas ({classifications.length})</option>
                {streams.map((stream) => (
                  <option key={stream} value={stream}>
                    {stream} ({classifications.filter(c => c.stream === stream).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Classifications List */}
            {filteredClassifications.length > 0 ? (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                <div className="text-sm text-muted-foreground mb-2">
                  Showing {filteredClassifications.length} classification{filteredClassifications.length !== 1 ? 's' : ''}
                </div>
                {filteredClassifications.map((classification) => (
                  <Button
                    key={classification.classification_fixed_id}
                    variant={
                      selectedClassification?.classification_fixed_id === 
                      classification.classification_fixed_id 
                        ? "default" 
                        : "outline"
                    }
                    className="w-full justify-start h-auto py-4 px-5 whitespace-normal text-left"
                    onClick={() => onSelect(classification)}
                  >
                    <div className="w-full">
                      <div className="font-semibold leading-relaxed break-words">
                        {classification.parent_classification_name}
                        {classification.classification && 
                         classification.classification !== classification.parent_classification_name && 
                         ` – ${classification.classification}`}
                      </div>
                      {classification.clause_description && (
                        <div className="text-xs opacity-80 mt-2 leading-relaxed break-words">
                          {classification.clause_description}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No classifications available for selected area
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};