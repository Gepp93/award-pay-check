import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowance detection rules engine
interface AllowanceRule {
  id: string;
  name: string;
  amount: string;
  estimatedValue: number;
  condition: (params: any) => boolean;
  reason: (params: any) => string;
  icon: string;
}

const allowanceRules: AllowanceRule[] = [
  // === GENERAL ALLOWANCES (All Industries) ===
  {
    id: 'meal_allowance',
    name: 'Meal Allowance',
    amount: '$20.50 per meal',
    estimatedValue: 20.50,
    condition: (p) => p.workedOver10Hours || p.totalHours > 10,
    reason: (p) => `You worked ${p.totalHours?.toFixed(1) || 'over 10'} hours. After 10 hours, most awards require a meal allowance if you weren't given notice the day before.`,
    icon: '🍽️',
  },
  {
    id: 'travel_allowance',
    name: 'Travel/Vehicle Allowance',
    amount: '$0.99 per km',
    estimatedValue: 20.00,
    condition: (p) => p.droveOwnCar,
    reason: (p) => `You used your own vehicle for work purposes. You may be entitled to a per-kilometre allowance.`,
    icon: '🚗',
  },
  {
    id: 'tool_allowance',
    name: 'Tool Allowance',
    amount: '$28.00 per week',
    estimatedValue: 28.00,
    condition: (p) => p.allowanceConditions?.usedOwnTools,
    reason: (p) => `You're supplying your own tools. Tradespersons are often entitled to a tool maintenance/replacement allowance.`,
    icon: '🧰',
  },
  {
    id: 'first_aid_allowance',
    name: 'First Aid Allowance',
    amount: '$17.95 per week',
    estimatedValue: 17.95,
    condition: (p) => p.allowanceConditions?.isFirstAider,
    reason: (p) => `You hold a first aid certificate and perform first aid duties. This entitles you to a weekly allowance.`,
    icon: '🩹',
  },
  {
    id: 'leading_hand',
    name: 'Leading Hand Allowance',
    amount: '$25-65 per week',
    estimatedValue: 45.00,
    condition: (p) => p.allowanceConditions?.isLeadingHand,
    reason: (p) => `You're supervising other employees. Leading hands receive additional pay based on the number of people supervised.`,
    icon: '👷',
  },
  {
    id: 'uniform_laundry',
    name: 'Uniform/Laundry Allowance',
    amount: '$6.50 per week',
    estimatedValue: 6.50,
    condition: (p) => p.allowanceConditions?.woreUniform,
    reason: (p) => `You wear and maintain a uniform or special work clothing. Many awards provide a laundry/uniform allowance.`,
    icon: '👔',
  },
  {
    id: 'qualification_allowance',
    name: 'Qualification Allowance',
    amount: '$15-40 per week',
    estimatedValue: 25.00,
    condition: (p) => p.allowanceConditions?.holdsQualification,
    reason: (p) => `You hold a relevant qualification (Cert IV, RN, EN, trade certificate). Many awards provide additional pay for qualified staff.`,
    icon: '📜',
  },
  {
    id: 'licence_allowance',
    name: 'Licence/Certificate Allowance',
    amount: '$10-30 per week',
    estimatedValue: 20.00,
    condition: (p) => p.allowanceConditions?.holdsSpecialLicence,
    reason: (p) => `You hold a special licence required for work (forklift, electrical, etc.). This often attracts an allowance.`,
    icon: '🪪',
  },

  // === HAZARDOUS/PHYSICAL CONDITIONS ===
  {
    id: 'height_allowance',
    name: 'Height Work Allowance',
    amount: '$3.50 per hour',
    estimatedValue: 35.00,
    condition: (p) => p.allowanceConditions?.workedAtHeight,
    reason: (p) => `You worked at heights above 15 metres. This typically triggers height money of approximately $3.50/hr.`,
    icon: '🏗️',
  },
  {
    id: 'confined_space',
    name: 'Confined Space Allowance',
    amount: '$2.98 per hour',
    estimatedValue: 29.80,
    condition: (p) => p.allowanceConditions?.workedInConfinedSpace,
    reason: (p) => `You worked in a confined space. This hazardous work condition attracts additional pay.`,
    icon: '🚧',
  },
  {
    id: 'underground_allowance',
    name: 'Underground Allowance',
    amount: '$4.20 per hour',
    estimatedValue: 42.00,
    condition: (p) => p.allowanceConditions?.workedUnderground,
    reason: (p) => `You worked underground. This attracts an additional allowance under most awards.`,
    icon: '⛏️',
  },
  {
    id: 'dirty_work',
    name: 'Dirty Work Allowance',
    amount: '$1.38 per hour',
    estimatedValue: 13.80,
    condition: (p) => p.allowanceConditions?.workedInDirtyConditions,
    reason: (p) => `You worked in dirty, dusty, or offensive conditions. This attracts an hourly allowance.`,
    icon: '🧹',
  },
  {
    id: 'extreme_weather',
    name: 'Adverse Weather Allowance',
    amount: '$1.38 per hour',
    estimatedValue: 13.80,
    condition: (p) => p.allowanceConditions?.workedInExtremeWeather,
    reason: (p) => `You worked in extreme temperatures (46°C+ heat or 0°C or below). This attracts weather/climate allowance.`,
    icon: '🌡️',
  },
  {
    id: 'cold_room',
    name: 'Cold Work Allowance',
    amount: '$0.52 per hour',
    estimatedValue: 5.20,
    condition: (p) => p.allowanceConditions?.workedInColdRoom,
    reason: (p) => `You worked in a freezer or cool room (0°C or below). Retail, hospitality, and food industries typically pay this allowance.`,
    icon: '🥶',
  },
  {
    id: 'dangerous_goods',
    name: 'Dangerous Goods Allowance',
    amount: '$0.88 per hour',
    estimatedValue: 8.80,
    condition: (p) => p.allowanceConditions?.transportedDangerousGoods,
    reason: (p) => `You handled or transported dangerous goods. Transport and logistics workers are entitled to additional pay for this.`,
    icon: '☢️',
  },

  // === SHIFT/ROSTER CONDITIONS ===
  {
    id: 'night_shift',
    name: 'Night Shift Allowance',
    amount: '15% loading',
    estimatedValue: 0,
    condition: (p) => p.allowanceConditions?.workedNights,
    reason: (p) => `You worked night shifts (between 8pm-6am). Night shift work attracts a 15% loading on top of your base rate.`,
    icon: '🌙',
  },
  {
    id: 'on_call',
    name: 'On-Call Allowance',
    amount: '$21.80 per day',
    estimatedValue: 21.80,
    condition: (p) => p.allowanceConditions?.wasOnCall,
    reason: (p) => `You were on-call or available to be called in outside normal hours. This attracts a daily allowance.`,
    icon: '📞',
  },
  {
    id: 'call_back',
    name: 'Call-Back Allowance',
    amount: 'Minimum 3 hours pay',
    estimatedValue: 75.00,
    condition: (p) => p.allowanceConditions?.wasCalledBack,
    reason: (p) => `You were called back to work after finishing a shift. Most awards guarantee a minimum payment (usually 3 hours) for call-backs.`,
    icon: '🔔',
  },
  {
    id: 'split_shift',
    name: 'Split Shift Allowance',
    amount: '$15.50 per day',
    estimatedValue: 15.50,
    condition: (p) => p.allowanceConditions?.workedSplitShift,
    reason: (p) => `You worked a split or broken shift. Hospitality, retail, and transport awards often provide additional pay for split shifts.`,
    icon: '⏸️',
  },
  {
    id: 'weekend_penalty',
    name: 'Weekend Penalty Rates',
    amount: '150-200%',
    estimatedValue: 0,
    condition: (p) => p.workedWeekend,
    reason: (p) => `You worked on Saturday or Sunday. Weekend work typically attracts penalty rates of 150% (Saturday) or 200% (Sunday).`,
    icon: '📅',
  },
  {
    id: 'public_holiday',
    name: 'Public Holiday Penalty',
    amount: '250%',
    estimatedValue: 0,
    condition: (p) => p.workedPublicHoliday,
    reason: (p) => `You worked on a public holiday. This attracts double time and a half (250%) under most awards.`,
    icon: '🎉',
  },

  // === LOCATION/TRAVEL CONDITIONS ===
  {
    id: 'remote_site',
    name: 'Site/Remote Allowance',
    amount: '$15-50 per day',
    estimatedValue: 30.00,
    condition: (p) => p.allowanceConditions?.workedRemoteSite,
    reason: (p) => `You worked at a remote site or away from your usual base. Construction, mining, and civil awards provide site allowances.`,
    icon: '🏕️',
  },
  {
    id: 'living_away',
    name: 'Living Away From Home Allowance',
    amount: '$95+ per night',
    estimatedValue: 95.00,
    condition: (p) => p.allowanceConditions?.stayedAwayFromHome,
    reason: (p) => `You stayed overnight away from home for work. This typically covers accommodation and incidental expenses.`,
    icon: '🏨',
  },
  {
    id: 'forklift_allowance',
    name: 'Forklift/Heavy Machinery Allowance',
    amount: '$1.25 per hour',
    estimatedValue: 12.50,
    condition: (p) => p.allowanceConditions?.operatedForklift,
    reason: (p) => `You operated a forklift or heavy machinery. Warehousing and manufacturing awards often pay additional for this.`,
    icon: '🚜',
  },
];

// List of all common award allowances for education
const allCommonAllowances = [
  { name: 'Meal Allowance', description: 'When working overtime or extended hours without notice' },
  { name: 'Travel Allowance', description: 'Using personal vehicle for work purposes' },
  { name: 'Tool Allowance', description: 'Tradespersons supplying their own tools' },
  { name: 'First Aid Allowance', description: 'Appointed first aiders with certificates' },
  { name: 'Leading Hand Allowance', description: 'Supervising 1 or more employees' },
  { name: 'Height Allowance', description: 'Working at heights above 15 metres' },
  { name: 'Confined Space Allowance', description: 'Working in confined or restricted areas' },
  { name: 'Underground Allowance', description: 'Working below ground level' },
  { name: 'Dirty Work Allowance', description: 'Dirty, dusty, or offensive conditions' },
  { name: 'Wet Work Allowance', description: 'Working in wet conditions' },
  { name: 'Site Allowance', description: 'Construction site work' },
  { name: 'Living Away Allowance', description: 'Working away from usual residence' },
  { name: 'Adverse Weather Allowance', description: 'Extreme heat or cold conditions' },
  { name: 'Night Shift Allowance', description: 'Working between 8pm and 6am' },
  { name: 'On-Call Allowance', description: 'Being available outside normal hours' },
  { name: 'Cold Places Allowance', description: 'Working in refrigerated areas' },
  { name: 'Hot Places Allowance', description: 'Working near furnaces or extreme heat' },
  { name: 'Laser Equipment Allowance', description: 'Operating laser equipment' },
  { name: 'Explosive Powered Tools', description: 'Using explosive powered tools' },
  { name: 'Scaffolding Allowance', description: 'Erecting scaffolding over certain heights' },
];

// Detect potential allowances based on conditions
function detectPotentialAllowances(params: any): any[] {
  const detected: any[] = [];
  
  for (const rule of allowanceRules) {
    if (rule.condition(params)) {
      detected.push({
        id: rule.id,
        name: rule.name,
        amount: rule.amount,
        estimatedValue: rule.estimatedValue,
        reason: rule.reason(params),
        icon: rule.icon,
      });
    }
  }
  
  return detected;
}

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
    advancedPayslip,
    allowanceConditions,
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

  // Calculate match score if advanced payslip base rate is provided
  let matchScore = 0;
  if (advancedPayslip?.payslipBaseRate) {
    const rateDifference = Math.abs(baseRate - advancedPayslip.payslipBaseRate);
    const percentageDifference = (rateDifference / baseRate) * 100;
    matchScore = Math.max(0, 100 - percentageDifference * 2);
  }

  // Calculate hours worked
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [finishHour, finishMinute] = finishTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const finishMinutes = finishHour * 60 + finishMinute;
  const totalMinutes = finishMinutes - startMinutes - breakMinutes;
  const totalHours = totalMinutes / 60;

  // Calculate base pay and overtime
  const standardDayHours = employmentType === 'Casual' ? 8 : 7.6;
  const regularHours = Math.min(totalHours, standardDayHours);
  const overtimeHours = Math.max(0, totalHours - standardDayHours);
  
  let basePay = regularHours * baseRate;
  let overtimePay = 0;
  let overtimeAt150Hours = 0;
  let overtimeAt200Hours = 0;
  let weekendPay = 0;
  let publicHolidayPay = 0;
  let allowances = 0;

  // Apply casual loading if applicable
  if (employmentType === 'Casual') {
    const casualLoading = basePay * 0.25;
    basePay += casualLoading;
  }

  // Calculate overtime: first 2 hours at 1.5x, rest at 2x
  if (overtimeHours > 0) {
    overtimeAt150Hours = Math.min(overtimeHours, 2);
    overtimeAt200Hours = Math.max(0, overtimeHours - 2);
    overtimePay = (overtimeAt150Hours * baseRate * 0.5) + (overtimeAt200Hours * baseRate);
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

  // Detect potential allowances
  const potentialAllowances = detectPotentialAllowances({
    workedOver10Hours,
    droveOwnCar,
    workedWeekend,
    workedPublicHoliday,
    allowanceConditions,
    totalHours,
    baseRate,
  });

  return {
    baseRate,
    awardPayTotal,
    possibleUnderpayment,
    matchScore,
    potentialAllowances,
    breakdown: {
      regularHours,
      basePay,
      overtimeAt150Hours,
      overtimeAt200Hours,
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
    advancedPayslip,
    allowanceConditions,
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
    if (workArea && cls.clause_description) {
      const workAreaLower = workArea.toLowerCase();
      const clauseDescLower = cls.clause_description.toLowerCase();
      
      if (!workAreaLower.includes(clauseDescLower) && !clauseDescLower.includes(workAreaLower)) {
        return false;
      }
    }

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
        advancedPayslip,
        allowanceConditions,
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
    return new Response(
      JSON.stringify({
        error: 'Could not calculate pay for any classification',
        details: 'Unable to find valid pay rates for the selected work area.',
        classificationsChecked: classificationsToCheck.length,
        workArea,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Sort by match score then by possible underpayment
  results.sort((a, b) => {
    if (advancedPayslip?.payslipBaseRate) {
      return (b.matchScore || 0) - (a.matchScore || 0);
    }
    return b.possibleUnderpayment - a.possibleUnderpayment;
  });

  const underpayments = results.map(r => r.possibleUnderpayment);
  const overallMinUnderpayment = Math.min(...underpayments);
  const overallMaxUnderpayment = Math.max(...underpayments);

  // Calculate total hours for allowance detection
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [finishHour, finishMinute] = finishTime.split(':').map(Number);
  const totalMinutes = (finishHour * 60 + finishMinute) - (startHour * 60 + startMinute) - breakMinutes;
  const totalHours = totalMinutes / 60;

  // Detect potential allowances
  const potentialAllowances = detectPotentialAllowances({
    workedOver10Hours,
    droveOwnCar,
    workedWeekend,
    workedPublicHoliday,
    allowanceConditions,
    totalHours,
    baseRate: results[0]?.baseRate || 0,
  });

  // Determine common entitlements
  const commonEntitlements: string[] = [];
  if (workedWeekend) commonEntitlements.push('Weekend penalty rates');
  if (workedPublicHoliday) commonEntitlements.push('Public holiday penalty rates');
  if (droveOwnCar) commonEntitlements.push('Motor vehicle allowance ($20)');
  if (workedOver10Hours) commonEntitlements.push('Meal allowance ($15)');
  
  const userEnteredOvertime = advancedPayslip && (
    (advancedPayslip.hoursAt150 && advancedPayslip.hoursAt150 > 0) || 
    (advancedPayslip.hoursAt200 && advancedPayslip.hoursAt200 > 0)
  );
  
  if (!userEnteredOvertime) {
    const standardDayHours = employmentType === 'Casual' ? 8 : 7.6;
    if (totalHours > standardDayHours) {
      const otHours = totalHours - standardDayHours;
      if (otHours > 2) {
        commonEntitlements.push(`Overtime at 1.5x (first 2 hrs) and 2x (${(otHours - 2).toFixed(1)} hrs)`);
      } else {
        commonEntitlements.push(`Overtime at 1.5x (${otHours.toFixed(1)} hrs)`);
      }
    }
  }
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
      potentialAllowances,
      allAwardAllowances: allCommonAllowances,
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
      advancedPayslip,
      allowanceConditions,
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
        advancedPayslip,
        allowanceConditions,
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

    // Calculate base pay and overtime
    const standardDayHours = employmentType === 'Casual' ? 8 : 7.6;
    const regularHours = Math.min(totalHours, standardDayHours);
    const overtimeHours = Math.max(0, totalHours - standardDayHours);
    
    let basePay = regularHours * baseRate;
    let overtimePay = 0;
    let overtimeAt150Hours = 0;
    let overtimeAt200Hours = 0;
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

    // Calculate overtime: first 2 hours at 1.5x, rest at 2x
    if (overtimeHours > 0) {
      overtimeAt150Hours = Math.min(overtimeHours, 2);
      overtimeAt200Hours = Math.max(0, overtimeHours - 2);
      
      const ot150Pay = overtimeAt150Hours * baseRate * 0.5;
      const ot200Pay = overtimeAt200Hours * baseRate;
      overtimePay = ot150Pay + ot200Pay;
      
      if (overtimeAt150Hours > 0) {
        reasons.push(`Overtime at 1.5x (${overtimeAt150Hours.toFixed(2)} hrs): +$${ot150Pay.toFixed(2)}`);
      }
      if (overtimeAt200Hours > 0) {
        reasons.push(`Overtime at 2x (${overtimeAt200Hours.toFixed(2)} hrs): +$${ot200Pay.toFixed(2)}`);
      }
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
      allowances += 20;
      reasons.push('Motor vehicle allowance: +$20.00');
    }

    if (workedOver10Hours) {
      allowances += 15;
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

    // Detect potential allowances
    const potentialAllowances = detectPotentialAllowances({
      workedOver10Hours,
      droveOwnCar,
      workedWeekend,
      workedPublicHoliday,
      allowanceConditions,
      totalHours,
      baseRate,
    });

    // Add match score and payslip validation if advanced payslip provided
    let matchScore = 0;
    let rateWarning = null;
    if (advancedPayslip?.payslipBaseRate) {
      const rateDifference = Math.abs(baseRate - advancedPayslip.payslipBaseRate);
      const percentageDifference = (rateDifference / advancedPayslip.payslipBaseRate) * 100;
      matchScore = Math.max(0, 100 - percentageDifference * 2);
      
      if (percentageDifference > 10) {
        rateWarning = `Your payslip shows $${advancedPayslip.payslipBaseRate}/hr, but the award rate for this classification is $${baseRate.toFixed(2)}/hr. You may be on a different classification level or enterprise agreement.`;
      }
    }

    const result = {
      awardPayTotal,
      actualPaid,
      underpayment,
      baseRate,
      matchScore,
      rateWarning,
      reasons,
      potentialAllowances,
      allAwardAllowances: allCommonAllowances,
      breakdown: {
        regularHours,
        basePay,
        overtimeAt150Hours,
        overtimeAt200Hours,
        overtimePay,
        weekendPay,
        publicHolidayPay,
        allowances,
        advancedPayslip: advancedPayslip || null,
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
