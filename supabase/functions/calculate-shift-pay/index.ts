import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to calculate pay for a single classification
async function calculateSingleClassification(params: any) {
  const {
    awardCode,
    classificationId,
    employmentType,
    startTime,
    finishTime,
    breakMinutes,
    workedWeekend,
    workedPublicHoliday,
    droveOwnCar,
    workedOver10Hours,
    actualPaid,
    fwcApiKey,
  } = params;

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
    console.log(`Failed to fetch rates for classification ${classificationId}: ${ratesResponse.status}`);
    return null;
  }

  const ratesData = await ratesResponse.json();

  // Find base hourly rate
  let baseRate = 0;
  if (ratesData.results && ratesData.results.length > 0) {
    const sortedRates = ratesData.results.sort((a: any, b: any) => 
      new Date(b.operative_from).getTime() - new Date(a.operative_from).getTime()
    );

    for (const rate of sortedRates) {
      if (rate.calculated_rate && rate.calculated_rate_type === 'Hourly') {
        baseRate = parseFloat(rate.calculated_rate);
        break;
      }
      if (rate.base_rate) {
        if (rate.base_rate_type === 'Hourly') {
          baseRate = parseFloat(rate.base_rate);
          break;
        } else if (rate.base_rate_type === 'Weekly') {
          baseRate = parseFloat(rate.base_rate) / 38;
          break;
        }
      }
    }
  }

  if (baseRate === 0) {
    console.log(`No valid base rate found for classification ${classificationId}`);
    return null;
  }

  console.log(`Successfully calculated for classification ${classificationId}, base rate: $${baseRate}`);

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

  // Apply casual loading if applicable
  if (employmentType === 'Casual') {
    const casualLoading = basePay * 0.25;
    basePay += casualLoading;
  }

  // Check for overtime (simple rule: over 8 hours)
  if (totalHours > 8) {
    const overtimeHours = totalHours - 8;
    overtimePay = overtimeHours * baseRate * 0.5;
  }

  // Weekend penalty (50% extra)
  if (workedWeekend) {
    weekendPay = totalHours * baseRate * 0.5;
  }

  // Public holiday (double time and a half)
  if (workedPublicHoliday) {
    publicHolidayPay = totalHours * baseRate * 1.5;
  }

  // Allowances
  if (droveOwnCar) {
    allowances += 20;
  }

  if (workedOver10Hours) {
    allowances += 15;
  }

  const awardPayTotal = basePay + overtimePay + weekendPay + publicHolidayPay + allowances;
  const possibleUnderpayment = Math.max(0, awardPayTotal - actualPaid);

  return {
    baseRate,
    awardPayTotal,
    possibleUnderpayment,
    breakdown: {
      baseHours: totalHours,
      basePay,
      overtimePay,
      weekendPay,
      publicHolidayPay,
      allowances,
    },
  };
}

// Handler for when user doesn't know their classification
async function handleUnsureClassification(params: any) {
  const {
    awardCode,
    employmentType,
    workArea,
    startTime,
    finishTime,
    breakMinutes,
    workedWeekend,
    workedPublicHoliday,
    droveOwnCar,
    workedOver10Hours,
    actualPaid,
    fwcApiKey,
    corsHeaders,
  } = params;

  console.log('User is unsure about classification, fetching all classifications for award:', awardCode);

  // Fetch all classifications for the award
  let allClassifications: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 5) {
    const classificationsResponse = await fetch(
      `https://api.fwc.gov.au/api/v1/awards/${awardCode}/classifications?limit=100&offset=${(page - 1) * 100}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': fwcApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!classificationsResponse.ok) {
      throw new Error('Failed to fetch classifications');
    }

    const classificationsData = await classificationsResponse.json();
    const results = classificationsData.results || [];
    allClassifications = allClassifications.concat(results);
    
    hasMore = results.length === 100;
    page++;
  }

  console.log(`Fetched ${allClassifications.length} classifications`);

  // Filter classifications
  const filteredClassifications = allClassifications.filter((cls: any) => {
    // Filter by work area if provided
    if (workArea && cls.clause_description !== workArea) {
      return false;
    }

    // Exclude trainee classifications unless work area is trainee-related
    const isTraineeWorkArea = workArea?.toLowerCase().includes('trainee') || 
                               workArea?.toLowerCase().includes('school');
    
    if (!isTraineeWorkArea) {
      const classificationName = cls.classification?.toLowerCase() || '';
      const isTraineeClassification = 
        classificationName.includes('school leaver') ||
        classificationName.includes('plus 1 year') ||
        classificationName.includes('plus 2 year') ||
        classificationName.includes('plus 3 year') ||
        classificationName.includes('trainee');
      
      if (isTraineeClassification) {
        return false;
      }
    }

    return true;
  });

  console.log(`After filtering: ${filteredClassifications.length} classifications`);

  // Calculate for each classification (limit to first 30 to avoid timeout)
  const classificationsToCheck = filteredClassifications.slice(0, 30);
  const results: any[] = [];

  console.log(`Attempting to calculate pay for ${classificationsToCheck.length} classifications...`);

  for (const cls of classificationsToCheck) {
    try {
      const result = await calculateSingleClassification({
        awardCode,
        classificationId: cls.classification_fixed_id,
        employmentType,
        startTime,
        finishTime,
        breakMinutes,
        workedWeekend,
        workedPublicHoliday,
        droveOwnCar,
        workedOver10Hours,
        actualPaid,
        fwcApiKey,
      });

      if (result) {
        results.push({
          classificationId: cls.classification_fixed_id,
          classificationName: cls.classification,
          workArea: cls.clause_description,
          ...result,
        });
      }
    } catch (error) {
      console.error(`Error calculating for classification ${cls.classification_fixed_id}:`, error);
    }
  }

  console.log(`Successfully calculated ${results.length} out of ${classificationsToCheck.length} classifications`);

  if (results.length === 0) {
    // Return a helpful error with guidance
    return new Response(
      JSON.stringify({
        error: 'Could not calculate pay for any classification',
        details: 'Unable to find valid pay rates for the selected work area. This may be because the classifications in this category require additional information or have complex rate structures. Please try selecting "Yes, I know it" and choose your specific classification.',
        classificationsChecked: classificationsToCheck.length,
        workArea,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Sort by possible underpayment (highest first)
  results.sort((a, b) => b.possibleUnderpayment - a.possibleUnderpayment);

  // Calculate min and max underpayment
  const underpayments = results.map(r => r.possibleUnderpayment);
  const overallMinUnderpayment = Math.min(...underpayments);
  const overallMaxUnderpayment = Math.max(...underpayments);

  // Determine common entitlements based on shift conditions
  const commonEntitlements: string[] = [];
  if (workedWeekend) commonEntitlements.push('Weekend penalty rates');
  if (workedPublicHoliday) commonEntitlements.push('Public holiday penalty rates');
  if (droveOwnCar) commonEntitlements.push('Motor vehicle allowance');
  if (workedOver10Hours) commonEntitlements.push('Meal allowance (worked over 10 hours)');
  
  // Check for overtime
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [finishHour, finishMinute] = finishTime.split(':').map(Number);
  const totalMinutes = (finishHour * 60 + finishMinute) - (startHour * 60 + startMinute) - breakMinutes;
  const totalHours = totalMinutes / 60;
  if (totalHours > 8) commonEntitlements.push('Overtime (worked over 8 hours)');
  if (employmentType === 'Casual') commonEntitlements.push('Casual loading (25%)');

  return new Response(
    JSON.stringify({
      mode: 'unsure',
      overallMinUnderpayment,
      overallMaxUnderpayment,
      likelyClassifications: results.slice(0, 10).map(r => ({
        classificationId: r.classificationId,
        classificationName: r.classificationName,
        workArea: r.workArea,
        awardPayTotal: r.awardPayTotal,
        possibleUnderpayment: r.possibleUnderpayment,
      })),
      commonEntitlements,
      breakdown: {
        totalClassificationsAnalyzed: results.length,
        totalClassificationsAvailable: filteredClassifications.length,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      awardCode,
      classificationId,
      employmentType,
      workArea,
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

    console.log('Calculating shift pay for:', { awardCode, classificationId, employmentType, date, workArea });

    // If classificationId is null, user doesn't know their classification
    if (classificationId === null) {
      return await handleUnsureClassification({
        awardCode,
        employmentType,
        workArea,
        date,
        startTime,
        finishTime,
        breakMinutes,
        workedWeekend,
        workedPublicHoliday,
        droveOwnCar,
        workedOver10Hours,
        actualPaid,
        fwcApiKey: Deno.env.get('FWC_API_KEY'),
        corsHeaders,
      });
    }

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
        if (rate.calculated_rate && rate.calculated_rate_type === 'Hourly') {
          baseRate = parseFloat(rate.calculated_rate);
          break;
        }
        if (rate.base_rate) {
          if (rate.base_rate_type === 'Hourly') {
            baseRate = parseFloat(rate.base_rate);
            break;
          } else if (rate.base_rate_type === 'Weekly') {
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
