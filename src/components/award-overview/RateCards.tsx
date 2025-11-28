import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, Clock, Gift } from "lucide-react";

interface RateCardsProps {
  awardId: string;
  classification: any;
  employmentType: string;
}

export const RateCards = ({ awardId, classification, employmentType }: RateCardsProps) => {
  const [baseRate, setBaseRate] = useState<number | null>(null);
  const [penalties, setPenalties] = useState<any>(null);
  const [allowances, setAllowances] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classification) {
      fetchRateData();
    }
  }, [classification, awardId]);

  const fetchRateData = async () => {
    setLoading(true);
    try {
      // Fetch base rate
      const { data: rateData } = await supabase.functions.invoke('get-pay-rates', {
        body: {
          awardId,
          classificationFixedId: classification.classification_fixed_id,
        },
      });

      if (rateData?.baseRate) {
        setBaseRate(rateData.baseRate);
      }

      // Fetch penalties
      const { data: penaltyData } = await supabase.functions.invoke('get-penalties', {
        body: { awardId },
      });

      setPenalties(penaltyData);

      // Fetch allowances
      const { data: allowanceData } = await supabase.functions.invoke('get-allowances', {
        body: { awardId },
      });

      setAllowances(allowanceData);

    } catch (error) {
      console.error('Error fetching rate data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!classification) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Select a classification to view rates</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <CardTitle>Base Rate</CardTitle>
          </div>
          <CardDescription>Your hourly rate and penalties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {baseRate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Base hourly rate</span>
              <span className="text-lg font-bold">${baseRate.toFixed(2)}/hr</span>
            </div>
          )}
          
          {penalties?.results && penalties.results.length > 0 && (
            <>
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Penalty Rates</p>
                {penalties.results.slice(0, 5).map((penalty: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm mb-1">
                    <span className="text-muted-foreground">{penalty.penalty_description}</span>
                    <span className="font-medium">{penalty.penalty_rate}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <CardTitle>Allowances</CardTitle>
          </div>
          <CardDescription>Additional payments you may be entitled to</CardDescription>
        </CardHeader>
        <CardContent>
          {allowances?.results && allowances.results.length > 0 ? (
            <div className="space-y-2">
              {allowances.results.slice(0, 8).map((allowance: any, idx: number) => (
                <div key={idx} className="bg-muted/30 rounded-md p-3">
                  <div className="font-medium text-sm mb-1">
                    {allowance.allowance_type_description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {allowance.allowance_amount && `$${allowance.allowance_amount}`}
                    {allowance.allowance_description && ` - ${allowance.allowance_description}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No specific allowances found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Common places people miss money for this award:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>Overtime rates after standard hours</li>
            <li>Weekend and public holiday penalties</li>
            <li>Meal allowances for long shifts</li>
            <li>Travel allowances when required</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};