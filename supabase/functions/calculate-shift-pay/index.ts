import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ====== EXISTING ALLOWANCE DETECTION ENGINE ======
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

// ====== AWARD-SPECIFIC RULES ENGINE (NEW) ======

// Input shape for entitlement calculation
interface ShiftInput {
  awardCode: string;
  employmentType: 'Full-time' | 'Part-time' | 'Casual';
  date: string;
  startTime: string;
  finishTime: string;
  breakMinutes: number;
  workedWeekend: boolean;
  workedPublicHoliday: boolean;
  allowanceConditions: {
    workedAtHeight?: boolean;
    workedInConfinedSpace?: boolean;
    workedUnderground?: boolean;
    workedInDirtyConditions?: boolean;
    workedInExtremeWeather?: boolean;
    workedInColdRoom?: boolean;
    workedNights?: boolean;
    wasOnCall?: boolean;
    wasCalledBack?: boolean;
    workedSplitShift?: boolean;
    usedOwnTools?: boolean;
    isFirstAider?: boolean;
    isLeadingHand?: boolean;
    droveOwnCar?: boolean;
    workedRemoteSite?: boolean;
    stayedAwayFromHome?: boolean;
    woreUniform?: boolean;
    holdsSpecialLicence?: boolean;
    holdsQualification?: boolean;
    transportedDangerousGoods?: boolean;
    operatedForklift?: boolean;
    mealProvided?: boolean;
  };
  actualPaid?: number;
}

// Award-specific allowance rule
interface AwardAllowanceRule {
  id: string;
  awardCode: string;           // e.g. "MA000009" for Hospitality
  allowanceCode: string;       // Must match FWC API allowance key
  name: string;
  description: string;
  conditions: {
    minShiftLengthHours?: number;
    requiresOvertime?: boolean;
    minOvertimeHours?: number;
    requiresBeyondRoster?: boolean;
    requiresNoMealProvided?: boolean;
    requiredFlags?: string[];  // Keys from allowanceConditions
  };
}

// Output from entitlement engine
interface EntitlementResult {
  totalHours: number;
  ordinaryHours: number;
  overtimeHours: number;
  allowances: {
    id: string;
    name: string;
    amount: number;
    reason: string;
  }[];
}

// ====== AWARD-SPECIFIC ALLOWANCE RULES DATABASE ======
const awardSpecificRules: AwardAllowanceRule[] = [
  // === HOSPITALITY AWARD (MA000009) ===
  {
    id: "hospitality_meal_allowance",
    awardCode: "MA000009",
    allowanceCode: "meal_allowance",
    name: "Meal Allowance",
    description: "Applies when an employee works more than 1 hour of overtime beyond their rostered finish time and no meal is provided.",
    conditions: {
      requiresOvertime: true,
      minOvertimeHours: 1,
      requiresBeyondRoster: true,
      requiresNoMealProvided: true
    }
  },
  {
    id: "hospitality_split_shift",
    awardCode: "MA000009",
    allowanceCode: "split_shift_allowance",
    name: "Split Shift Allowance",
    description: "Applies when shift has unpaid break of more than 2 hours.",
    conditions: {
      requiredFlags: ["workedSplitShift"]
    }
  },
  {
    id: "hospitality_uniform",
    awardCode: "MA000009",
    allowanceCode: "laundry_allowance",
    name: "Laundry/Uniform Allowance",
    description: "When required to wear and launder a uniform or special clothing.",
    conditions: {
      requiredFlags: ["woreUniform"]
    }
  },
  
  // === GENERAL RETAIL AWARD (MA000004) ===
  {
    id: "retail_meal_allowance",
    awardCode: "MA000004",
    allowanceCode: "meal_allowance",
    name: "Meal Allowance",
    description: "When required to work overtime of more than 1.5 hours without being given 24 hours notice.",
    conditions: {
      requiresOvertime: true,
      minOvertimeHours: 1.5,
      requiresNoMealProvided: true
    }
  },
  {
    id: "retail_cold_work",
    awardCode: "MA000004",
    allowanceCode: "cold_work_allowance",
    name: "Cold Work Allowance",
    description: "Working in cold room/freezer at 0°C or below.",
    conditions: {
      requiredFlags: ["workedInColdRoom"]
    }
  },
  {
    id: "retail_first_aid",
    awardCode: "MA000004",
    allowanceCode: "first_aid_allowance",
    name: "First Aid Allowance",
    description: "Appointed first aider holding current first aid certificate.",
    conditions: {
      requiredFlags: ["isFirstAider"]
    }
  },
  
  // === FAST FOOD AWARD (MA000003) ===
  {
    id: "fastfood_meal_allowance",
    awardCode: "MA000003",
    allowanceCode: "meal_allowance",
    name: "Meal Allowance",
    description: "Entitled to a meal break or meal allowance after 5 hours work.",
    conditions: {
      minShiftLengthHours: 5,
      requiresNoMealProvided: true
    }
  },
  {
    id: "fastfood_laundry",
    awardCode: "MA000003",
    allowanceCode: "laundry_allowance",
    name: "Laundry Allowance",
    description: "When required to launder uniform or special clothing.",
    conditions: {
      requiredFlags: ["woreUniform"]
    }
  },
  
  // === BUILDING & CONSTRUCTION AWARD (MA000020) ===
  {
    id: "construction_meal_allowance",
    awardCode: "MA000020",
    allowanceCode: "meal_allowance",
    name: "Meal Allowance",
    description: "When required to work overtime and unable to return home for meal.",
    conditions: {
      requiresOvertime: true,
      minOvertimeHours: 1.5,
      requiresNoMealProvided: true
    }
  },
  {
    id: "construction_tool_allowance",
    awardCode: "MA000020",
    allowanceCode: "tool_allowance",
    name: "Tool Allowance",
    description: "Tradesperson required to provide own tools.",
    conditions: {
      requiredFlags: ["usedOwnTools"]
    }
  },
  {
    id: "construction_height_allowance",
    awardCode: "MA000020",
    allowanceCode: "height_allowance",
    name: "Height Allowance",
    description: "Working at heights above specified levels.",
    conditions: {
      requiredFlags: ["workedAtHeight"]
    }
  },
  {
    id: "construction_confined_space",
    awardCode: "MA000020",
    allowanceCode: "confined_space_allowance",
    name: "Confined Space Allowance",
    description: "Working in confined or restricted areas.",
    conditions: {
      requiredFlags: ["workedInConfinedSpace"]
    }
  },
  {
    id: "construction_underground",
    awardCode: "MA000020",
    allowanceCode: "underground_allowance",
    name: "Underground Allowance",
    description: "Working below ground level.",
    conditions: {
      requiredFlags: ["workedUnderground"]
    }
  },
  {
    id: "construction_dirty_work",
    awardCode: "MA000020",
    allowanceCode: "dirty_work_allowance",
    name: "Dirty Work Allowance",
    description: "Working in dirty, dusty, or offensive conditions.",
    conditions: {
      requiredFlags: ["workedInDirtyConditions"]
    }
  },
  {
    id: "construction_first_aid",
    awardCode: "MA000020",
    allowanceCode: "first_aid_allowance",
    name: "First Aid Allowance",
    description: "Appointed first aider with current qualifications.",
    conditions: {
      requiredFlags: ["isFirstAider"]
    }
  },
  {
    id: "construction_leading_hand",
    awardCode: "MA000020",
    allowanceCode: "leading_hand_allowance",
    name: "Leading Hand Allowance",
    description: "Supervising other employees.",
    conditions: {
      requiredFlags: ["isLeadingHand"]
    }
  },
  
  // === NURSES AWARD (MA000034) ===
  {
    id: "nurses_on_call",
    awardCode: "MA000034",
    allowanceCode: "on_call_allowance",
    name: "On-Call Allowance",
    description: "Required to be available outside normal hours.",
    conditions: {
      requiredFlags: ["wasOnCall"]
    }
  },
  {
    id: "nurses_uniform",
    awardCode: "MA000034",
    allowanceCode: "uniform_allowance",
    name: "Uniform Allowance",
    description: "Required to wear and launder a uniform.",
    conditions: {
      requiredFlags: ["woreUniform"]
    }
  },
  {
    id: "nurses_qualification",
    awardCode: "MA000034",
    allowanceCode: "qualification_allowance",
    name: "Qualification Allowance",
    description: "Holding relevant nursing qualifications (RN, EN, etc.).",
    conditions: {
      requiredFlags: ["holdsQualification"]
    }
  },
  
  // === CLEANING AWARD (MA000022) ===
  {
    id: "cleaning_height",
    awardCode: "MA000022",
    allowanceCode: "height_allowance",
    name: "Height Allowance",
    description: "Working at heights above specified levels.",
    conditions: {
      requiredFlags: ["workedAtHeight"]
    }
  },
  {
    id: "cleaning_first_aid",
    awardCode: "MA000022",
    allowanceCode: "first_aid_allowance",
    name: "First Aid Allowance",
    description: "Appointed first aider.",
    conditions: {
      requiredFlags: ["isFirstAider"]
    }
  },
  {
    id: "cleaning_cold_work",
    awardCode: "MA000022",
    allowanceCode: "cold_work_allowance",
    name: "Cold Work Allowance",
    description: "Working in refrigerated areas at 0°C or below.",
    conditions: {
      requiredFlags: ["workedInColdRoom"]
    }
  },
  
  // === ROAD TRANSPORT AWARD (MA000038) ===
  {
    id: "transport_dangerous_goods",
    awardCode: "MA000038",
    allowanceCode: "dangerous_goods_allowance",
    name: "Dangerous Goods Allowance",
    description: "Transporting dangerous goods.",
    conditions: {
      requiredFlags: ["transportedDangerousGoods"]
    }
  },
  {
    id: "transport_living_away",
    awardCode: "MA000038",
    allowanceCode: "living_away_allowance",
    name: "Living Away From Home Allowance",
    description: "Required to stay overnight away from home.",
    conditions: {
      requiredFlags: ["stayedAwayFromHome"]
    }
  },
  {
    id: "transport_meal_allowance",
    awardCode: "MA000038",
    allowanceCode: "meal_allowance",
    name: "Meal Allowance",
    description: "When required to work overtime and no meal provided.",
    conditions: {
      requiresOvertime: true,
      minOvertimeHours: 1,
      requiresNoMealProvided: true
    }
  },
  
  // === MANUFACTURING AWARD (MA000010) ===
  {
    id: "manufacturing_tool_allowance",
    awardCode: "MA000010",
    allowanceCode: "tool_allowance",
    name: "Tool Allowance",
    description: "Tradesperson required to provide own tools.",
    conditions: {
      requiredFlags: ["usedOwnTools"]
    }
  },
  {
    id: "manufacturing_first_aid",
    awardCode: "MA000010",
    allowanceCode: "first_aid_allowance",
    name: "First Aid Allowance",
    description: "Appointed first aider.",
    conditions: {
      requiredFlags: ["isFirstAider"]
    }
  },
  {
    id: "manufacturing_leading_hand",
    awardCode: "MA000010",
    allowanceCode: "leading_hand_allowance",
    name: "Leading Hand Allowance",
    description: "Supervising other employees.",
    conditions: {
      requiredFlags: ["isLeadingHand"]
    }
  },
  {
    id: "manufacturing_forklift",
    awardCode: "MA000010",
    allowanceCode: "forklift_allowance",
    name: "Forklift Allowance",
    description: "Operating forklift or heavy machinery.",
    conditions: {
      requiredFlags: ["operatedForklift"]
    }
  },
  {
    id: "manufacturing_cold_work",
    awardCode: "MA000010",
    allowanceCode: "cold_work_allowance",
    name: "Cold Work Allowance",
    description: "Working in cold environments at 0°C or below.",
    conditions: {
      requiredFlags: ["workedInColdRoom"]
    }
  },
  
  // === CLERKS AWARD (MA000002) ===
  {
    id: "clerks_meal_allowance",
    awardCode: "MA000002",
    allowanceCode: "meal_allowance",
    name: "Meal Allowance",
    description: "When required to work overtime of more than 2 hours without notice.",
    conditions: {
      requiresOvertime: true,
      minOvertimeHours: 2,
      requiresNoMealProvided: true
    }
  },
  {
    id: "clerks_first_aid",
    awardCode: "MA000002",
    allowanceCode: "first_aid_allowance",
    name: "First Aid Allowance",
    description: "Appointed first aider.",
    conditions: {
      requiredFlags: ["isFirstAider"]
    }
  },
];

// ====== ENTITLEMENT ENGINE ======
function calculateEntitlements(
  input: ShiftInput, 
  awardAllowances: any[]
): EntitlementResult {
  // Calculate hours
  const [startHour, startMinute] = input.startTime.split(':').map(Number);
  const [finishHour, finishMinute] = input.finishTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const finishMinutes = finishHour * 60 + finishMinute;
  const totalMinutes = finishMinutes - startMinutes - input.breakMinutes;
  const totalHours = totalMinutes / 60;
  
  // Standard hours threshold
  const standardDayHours = input.employmentType === 'Casual' ? 8 : 7.6;
  const ordinaryHours = Math.min(totalHours, standardDayHours);
  const overtimeHours = Math.max(0, totalHours - standardDayHours);
  
  // Find matching allowances
  const detectedAllowances: EntitlementResult['allowances'] = [];
  
  // Filter rules for this award
  const rulesForAward = awardSpecificRules.filter(
    rule => rule.awardCode === input.awardCode
  );
  
  console.log(`Entitlement engine: Found ${rulesForAward.length} rules for award ${input.awardCode}`);
  
  for (const rule of rulesForAward) {
    let conditionsMet = true;
    let reason = rule.description;
    
    // Check minShiftLengthHours
    if (rule.conditions.minShiftLengthHours !== undefined) {
      if (totalHours < rule.conditions.minShiftLengthHours) {
        conditionsMet = false;
      }
    }
    
    // Check requiresOvertime
    if (rule.conditions.requiresOvertime) {
      if (overtimeHours <= 0) {
        conditionsMet = false;
      }
    }
    
    // Check minOvertimeHours
    if (rule.conditions.minOvertimeHours !== undefined) {
      if (overtimeHours < rule.conditions.minOvertimeHours) {
        conditionsMet = false;
      }
    }
    
    // Check requiresNoMealProvided
    if (rule.conditions.requiresNoMealProvided) {
      if (input.allowanceConditions?.mealProvided === true) {
        conditionsMet = false;
      }
    }
    
    // Check requiredFlags
    if (rule.conditions.requiredFlags) {
      for (const flag of rule.conditions.requiredFlags) {
        const flagKey = flag as keyof typeof input.allowanceConditions;
        if (!input.allowanceConditions?.[flagKey]) {
          conditionsMet = false;
          break;
        }
      }
    }
    
    if (conditionsMet) {
      // Find amount from FWC API allowances
      let amount = 0;
      const searchTerms = rule.allowanceCode.replace(/_/g, ' ').toLowerCase();
      
      const matchingAllowance = awardAllowances.find(a => {
        const allowanceName = (a.name || a.allowance || '').toLowerCase();
        const allowanceDesc = (a.description || '').toLowerCase();
        return allowanceName.includes(searchTerms) || 
               allowanceDesc.includes(searchTerms) ||
               searchTerms.split(' ').some(term => allowanceName.includes(term));
      });
      
      if (matchingAllowance) {
        // Extract numeric value from rate if available
        const rateStr = matchingAllowance.rate || matchingAllowance.amount || matchingAllowance.description || '0';
        const numericMatch = rateStr.toString().match(/\$?([\d.]+)/);
        amount = numericMatch ? parseFloat(numericMatch[1]) : 0;
      }
      
      console.log(`Entitlement engine: Rule ${rule.id} matched, amount: $${amount}`);
      
      detectedAllowances.push({
        id: rule.id,
        name: rule.name,
        amount,
        reason,
      });
    }
  }
  
  console.log(`Entitlement engine: Detected ${detectedAllowances.length} award-specific allowances`);
  
  return {
    totalHours,
    ordinaryHours,
    overtimeHours,
    allowances: detectedAllowances,
  };
}

// Fallback list if FWC API fails - only used as last resort
const fallbackAllowances = [
  { name: 'Meal Allowance', description: 'When working overtime or extended hours without notice' },
  { name: 'Travel Allowance', description: 'Using personal vehicle for work purposes' },
  { name: 'Tool Allowance', description: 'Tradespersons supplying their own tools' },
  { name: 'First Aid Allowance', description: 'Appointed first aiders with certificates' },
  { name: 'Leading Hand Allowance', description: 'Supervising 1 or more employees' },
];

// Fetch award-specific allowances from the FWC API
async function fetchAwardAllowances(awardCode: string, fwcApiKey: string): Promise<{ name: string; description: string }[]> {
  try {
    console.log(`Fetching allowances for award: ${awardCode}`);
    
    const response = await fetch(
      `https://api.fwc.gov.au/api/v1/awards/${awardCode}/allowances`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': fwcApiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log(`Failed to fetch allowances for ${awardCode}: ${response.status}`);
      return fallbackAllowances;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`No allowances found for award ${awardCode}`);
      return fallbackAllowances;
    }

    // Transform FWC API response to our format
    const allowances = data.results.map((allowance: any) => ({
      name: allowance.allowance || allowance.description || 'Allowance',
      description: allowance.clause_description || allowance.rate_description || 'Check your award for details',
    }));

    console.log(`Fetched ${allowances.length} allowances for award ${awardCode}`);
    return allowances;
  } catch (error) {
    console.error('Error fetching award allowances:', error);
    return fallbackAllowances;
  }
}

// Detect potential allowances based on conditions (existing generic engine)
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
    date,
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

  // Detect potential allowances (generic engine)
  const potentialAllowances = detectPotentialAllowances({
    workedOver10Hours,
    droveOwnCar,
    workedWeekend,
    workedPublicHoliday,
    allowanceConditions,
    totalHours,
    baseRate: results[0]?.baseRate || 0,
  });

  // Fetch award-specific allowances from FWC API
  const awardAllowances = await fetchAwardAllowances(awardCode, fwcApiKey);

  // NEW: Run entitlement engine for award-specific allowances
  const entitlementResult = calculateEntitlements({
    awardCode,
    employmentType: employmentType as 'Full-time' | 'Part-time' | 'Casual',
    date: date || new Date().toISOString().split('T')[0],
    startTime,
    finishTime,
    breakMinutes,
    workedWeekend,
    workedPublicHoliday,
    allowanceConditions: allowanceConditions || {},
  }, awardAllowances);

  // Merge award-specific allowances into potentialAllowances
  const mergedAllowances = [...potentialAllowances];
  for (const allowance of entitlementResult.allowances) {
    if (!mergedAllowances.find(a => a.id === allowance.id)) {
      mergedAllowances.push({
        id: allowance.id,
        name: allowance.name,
        amount: allowance.amount > 0 ? `$${allowance.amount.toFixed(2)}` : 'See award',
        estimatedValue: allowance.amount,
        reason: allowance.reason,
        icon: '📋', // Award-specific icon
      });
    }
  }

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
      potentialAllowances: mergedAllowances,
      allAwardAllowances: awardAllowances,
      breakdown: {
        totalClassificationsAnalyzed: results.length,
        totalClassificationsAvailable: filteredClassifications.length,
        entitlementEngine: {
          totalHours: entitlementResult.totalHours,
          ordinaryHours: entitlementResult.ordinaryHours,
          overtimeHours: entitlementResult.overtimeHours,
          awardSpecificAllowancesDetected: entitlementResult.allowances.length,
        },
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

    // Detect potential allowances (generic engine)
    const potentialAllowances = detectPotentialAllowances({
      workedOver10Hours,
      droveOwnCar,
      workedWeekend,
      workedPublicHoliday,
      allowanceConditions,
      totalHours,
      baseRate,
    });

    // Fetch award-specific allowances from FWC API
    const awardAllowances = await fetchAwardAllowances(awardCode, fwcApiKey);

    // NEW: Run entitlement engine for award-specific allowances
    const entitlementResult = calculateEntitlements({
      awardCode,
      employmentType: employmentType as 'Full-time' | 'Part-time' | 'Casual',
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      finishTime,
      breakMinutes,
      workedWeekend,
      workedPublicHoliday,
      allowanceConditions: allowanceConditions || {},
    }, awardAllowances);

    // Merge award-specific allowances into potentialAllowances
    const mergedAllowances = [...potentialAllowances];
    for (const allowance of entitlementResult.allowances) {
      if (!mergedAllowances.find(a => a.id === allowance.id)) {
        mergedAllowances.push({
          id: allowance.id,
          name: allowance.name,
          amount: allowance.amount > 0 ? `$${allowance.amount.toFixed(2)}` : 'See award',
          estimatedValue: allowance.amount,
          reason: allowance.reason,
          icon: '📋', // Award-specific icon
        });
      }
    }

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
      potentialAllowances: mergedAllowances,
      allAwardAllowances: awardAllowances,
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
        entitlementEngine: {
          totalHours: entitlementResult.totalHours,
          ordinaryHours: entitlementResult.ordinaryHours,
          overtimeHours: entitlementResult.overtimeHours,
          awardSpecificAllowancesDetected: entitlementResult.allowances.length,
        },
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
