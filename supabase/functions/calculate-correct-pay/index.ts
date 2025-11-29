import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fwcApiKey = Deno.env.get('FWC_API_KEY');
    if (!fwcApiKey) {
      throw new Error('FWC_API_KEY not configured');
    }

    const {
      awardCode,
      classificationId,
      employmentType,
      date,
      startTime,
      finishTime,
      breakMinutes,
      workedWeekend,
      usedOwnCar,
      workedLongHours,
      actualPaid,
    } = await req.json();

    console.log('Calculating pay for:', { awardCode, classificationId, employmentType, date, startTime, finishTime });

    // Fetch base rate
    const ratesResponse = await fetch(
      `https://api.fwc.gov.au/api/v1/awards/${awardCode}/pay-rates?classification_fixed_id=${classificationId}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': fwcApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!ratesResponse.ok) {
      throw new Error('Failed to fetch pay rates');
    }

    const ratesData = await ratesResponse.json();
    const sortedRates = [...(ratesData.results || [])].sort((a: any, b: any) =>
      new Date(b.operative_from).getTime() - new Date(a.operative_from).getTime()
    );

    let baseRate = 0;
    for (const rate of sortedRates) {
      if (rate.calculated_rate_type === 'Hourly' && rate.calculated_rate && parseFloat(rate.calculated_rate) > 0) {
        baseRate = parseFloat(rate.calculated_rate);
        break;
      }
      if (rate.base_rate_type === 'Hourly' && rate.base_rate && parseFloat(rate.base_rate) > 0) {
        baseRate = parseFloat(rate.base_rate);
        break;
      }
    }

    if (!baseRate) {
      for (const rate of sortedRates) {
        if (rate.base_rate_type === 'Weekly' && rate.base_rate && parseFloat(rate.base_rate) > 0) {
          baseRate = parseFloat(rate.base_rate) / 38;
          break;
        }
      }
    }

    if (!baseRate) {
      throw new Error('Could not determine base rate');
    }

    console.log('Base rate:', baseRate);

    // Apply casual loading if applicable
    if (employmentType === 'casual') {
      baseRate = baseRate * 1.25; // 25% casual loading
    }

    // Calculate hours worked
    const start = new Date(`2000-01-01T${startTime}`);
    const finish = new Date(`2000-01-01T${finishTime}`);
    let totalMinutes = (finish.getTime() - start.getTime()) / 60000;
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
    const workedMinutes = totalMinutes - breakMinutes;
    const workedHours = workedMinutes / 60;

    console.log('Worked hours:', workedHours);

    // Calculate base and overtime
    let baseHours = Math.min(workedHours, 8);
    let overtimeHours = Math.max(0, workedHours - 8);

    const baseAmount = baseHours * baseRate;
    const overtimeRate = baseRate * 1.5; // Time and a half for overtime
    const overtimeAmount = overtimeHours * overtimeRate;

    let total = baseAmount + overtimeAmount;
    const reasons: string[] = [];
    const penalties: any[] = [];
    const allowances: any[] = [];

    // Weekend/public holiday penalty
    if (workedWeekend) {
      const weekendRate = baseRate * 1.5; // Saturday rate
      const weekendAmount = workedHours * weekendRate - (baseHours * baseRate);
      total += weekendAmount;
      penalties.push({
        description: 'Weekend/public holiday penalty',
        amount: weekendAmount,
      });
      reasons.push(`Weekend/public holiday penalty: $${weekendAmount.toFixed(2)}`);
    }

    // Meal allowance for long shifts
    if (workedLongHours) {
      const mealAllowance = 20; // Example amount
      total += mealAllowance;
      allowances.push({
        description: 'Meal allowance (10+ hours)',
        amount: mealAllowance,
      });
      reasons.push(`Meal allowance for working more than 10 hours: $${mealAllowance.toFixed(2)}`);
    }

    // Travel allowance
    if (usedOwnCar) {
      const travelAllowance = 15; // Example amount
      total += travelAllowance;
      allowances.push({
        description: 'Travel allowance (own vehicle)',
        amount: travelAllowance,
      });
      reasons.push(`Travel allowance for using your own car: $${travelAllowance.toFixed(2)}`);
    }

    if (overtimeHours > 0) {
      reasons.push(`Overtime pay for ${overtimeHours.toFixed(1)} hours: $${overtimeAmount.toFixed(2)}`);
    }

    const underpayment = Math.max(0, total - actualPaid);

    console.log('Calculation complete:', { total, actualPaid, underpayment });

    return new Response(
      JSON.stringify({
        awardPayTotal: total,
        actualPaidTotal: actualPaid,
        underpaymentAmount: underpayment,
        reasons,
        breakdown: {
          baseHours: {
            hours: baseHours,
            rate: baseRate,
            amount: baseAmount,
          },
          overtime: {
            hours: overtimeHours,
            rate: overtimeRate,
            amount: overtimeAmount,
          },
          penalties,
          allowances,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-correct-pay:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
