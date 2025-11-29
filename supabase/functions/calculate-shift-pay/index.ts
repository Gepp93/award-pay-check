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
    const {
      awardCode,
      classificationId,
      employmentType,
      date,
      startTime,
      finishTime,
      breakMinutes,
      workedWeekend,
      workedPublicHoliday,
      droveOwnCar,
      workedOver10Hours,
      actualPaid,
    } = await req.json();

    console.log('Calculating shift pay for:', { awardCode, classificationId, employmentType, date });

    const fwcApiKey = Deno.env.get('FWC_API_KEY');
    if (!fwcApiKey) {
      throw new Error('FWC_API_KEY not configured');
    }

    // Fetch pay rates
    const ratesResponse = await fetch(
      `https://api.fwc.gov.au/api/v1/awards/${awardCode}/classifications/${classificationId}/pay-rates`,
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
    console.log('Fetched pay rates, results count:', ratesData.results?.length || 0);

    // Find base hourly rate
    let baseRate = 0;
    if (ratesData.results && ratesData.results.length > 0) {
      const sortedRates = ratesData.results.sort((a: any, b: any) => 
        new Date(b.operative_from).getTime() - new Date(a.operative_from).getTime()
      );

      for (const rate of sortedRates) {
        if (rate.calculated_rate && rate.pay_rate_type === 'Hourly') {
          baseRate = parseFloat(rate.calculated_rate);
          break;
        }
        if (rate.base_rate) {
          if (rate.pay_rate_type === 'Hourly') {
            baseRate = parseFloat(rate.base_rate);
            break;
          } else if (rate.pay_rate_type === 'Weekly') {
            baseRate = parseFloat(rate.base_rate) / 38;
            break;
          }
        }
      }
    }

    console.log('Base rate found:', baseRate);

    // Calculate hours worked
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [finishHour, finishMinute] = finishTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const finishMinutes = finishHour * 60 + finishMinute;
    const totalMinutes = finishMinutes - startMinutes - breakMinutes;
    const totalHours = totalMinutes / 60;

    // Calculate base pay
    let basePay = totalHours * baseRate;
    let overtimePay = 0;
    let weekendPay = 0;
    let publicHolidayPay = 0;
    let allowances = 0;
    const reasons: string[] = [];

    // Apply casual loading if applicable
    if (employmentType === 'Casual') {
      const casualLoading = basePay * 0.25;
      basePay += casualLoading;
      reasons.push(`Casual loading (25%): +$${casualLoading.toFixed(2)}`);
    }

    // Check for overtime (simple rule: over 8 hours)
    if (totalHours > 8) {
      const overtimeHours = totalHours - 8;
      overtimePay = overtimeHours * baseRate * 0.5; // Time and a half for OT
      reasons.push(`Overtime (${overtimeHours.toFixed(2)} hrs at 1.5x): +$${overtimePay.toFixed(2)}`);
    }

    // Weekend penalty (50% extra)
    if (workedWeekend) {
      weekendPay = totalHours * baseRate * 0.5;
      reasons.push(`Weekend penalty (50%): +$${weekendPay.toFixed(2)}`);
    }

    // Public holiday (double time and a half)
    if (workedPublicHoliday) {
      publicHolidayPay = totalHours * baseRate * 1.5;
      reasons.push(`Public holiday penalty (2.5x): +$${publicHolidayPay.toFixed(2)}`);
    }

    // Allowances
    if (droveOwnCar) {
      allowances += 20; // Example allowance
      reasons.push('Motor vehicle allowance: +$20.00');
    }

    if (workedOver10Hours) {
      allowances += 15; // Example meal allowance
      reasons.push('Meal allowance (over 10 hours): +$15.00');
    }

    const awardPayTotal = basePay + overtimePay + weekendPay + publicHolidayPay + allowances;
    const underpayment = Math.max(0, awardPayTotal - actualPaid);

    if (underpayment > 0) {
      reasons.unshift(`You were paid $${actualPaid.toFixed(2)} but should have received $${awardPayTotal.toFixed(2)}`);
    } else if (actualPaid > awardPayTotal) {
      reasons.unshift('You were paid correctly or more than the minimum award rate');
    } else {
      reasons.unshift('Your pay matches the minimum award requirements');
    }

    const result = {
      awardPayTotal,
      actualPaid,
      underpayment,
      reasons,
      breakdown: {
        baseHours: totalHours,
        basePay,
        overtimePay,
        weekendPay,
        publicHolidayPay,
        allowances,
      },
    };

    console.log('Calculation complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating shift pay:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
