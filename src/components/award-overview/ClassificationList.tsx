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
        // Show all unique classifications without heavy filtering
        // Only skip entries that are clearly sub-rates (Base rate, Weekly rate, etc.)
        const subRateKeywords = ['base rate', 'weekly rate', 'hourly rate', 'industry allowance'];
        
        const filtered = data.results.filter((curr: any) => {
          const classification = curr.classification?.toLowerCase() || '';
          const parentName = curr.parent_classification_name?.trim();
          
          // Skip if it's a sub-rate component
          if (subRateKeywords.some(keyword => classification.includes(keyword))) {
            return false;
          }
          
          // Skip if no parent name
          if (!parentName || parentName === '') return false;
          
          return true;
        });

        // Remove exact duplicates only
        const unique = filtered.reduce((acc: any[], curr: any) => {
          const key = `${curr.parent_classification_name}_${curr.clause_description}_${curr.classification}`;
          
          if (!acc.find(item => {
            const itemKey = `${item.parent_classification_name}_${item.clause_description}_${item.classification}`;
            return itemKey === key;
          })) {
            acc.push({
              classification_fixed_id: curr.classification_fixed_id,
              parent_classification_name: curr.parent_classification_name,
              classification_level: curr.parent_classification_name,
              classification: curr.classification,
              clause_description: curr.clause_description,
            });
          }
          
          return acc;
        }, []);

        setClassifications(unique);
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
            No classifications available
          </p>
        )}
      </CardContent>
    </Card>
  );
};