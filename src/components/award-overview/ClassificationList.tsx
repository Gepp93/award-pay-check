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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassifications();
  }, [awardId]);

  const fetchClassifications = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-classifications', {
        body: { awardId }
      });

      if (error) throw error;

      if (data?.results) {
        // Group by parent_classification_name to show distinct job levels
        const grouped = data.results.reduce((acc: any[], curr: any) => {
          const parentName = curr.parent_classification_name?.trim();
          
          // Skip if no parent name or if it's a sub-classification like "Base rate", "Weekly rate"
          if (!parentName || parentName === '') return acc;
          
          // Only add if we don't already have this parent classification
          if (!acc.find(item => item.classification_level === parentName)) {
            acc.push({
              classification_fixed_id: curr.classification_fixed_id,
              classification_level: parentName,
              classification: curr.clause_description || curr.classification,
            });
          }
          
          return acc;
        }, []);

        setClassifications(grouped);
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
        <CardDescription>Select the classification that matches your role</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : classifications.length > 0 ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {classifications.map((classification) => (
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
                    {classification.classification_level}
                  </div>
                  {classification.classification && (
                    <div className="text-xs opacity-80 mt-2 leading-relaxed break-words">
                      {classification.classification}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No classifications available
          </p>
        )}
      </CardContent>
    </Card>
  );
};