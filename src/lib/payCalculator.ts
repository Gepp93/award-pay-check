export interface ShiftData {
  startTime: string;
  endTime: string;
  breakMinutes: number;
  dayOfWeek: string;
  baseRate: number;
  awardType: string;
}

export interface PayBreakdown {
  baseHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  basePay: number;
  timeAndHalf: number;
  doubleTime: number;
  allowances: number;
  totalHours: number;
  total: number;
}

export interface WeeklyShift {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workedPast6pm: boolean;
  isWeekend: boolean;
  isPublicHoliday: boolean;
  travelWithCar: boolean;
  boughtOwnMeal: boolean;
  actualPaid: number;
}

export interface WeeklyPayCalculation {
  shifts: Array<{
    id: string;
    shouldEarn: number;
    actualPaid: number;
    difference: number;
  }>;
  totalShouldEarn: number;
  totalActualPaid: number;
  missingMoney: string[];
}

// Australian Modern Award calculation logic (simplified MVP)
export const calculatePay = (shift: ShiftData): PayBreakdown => {
  // Parse times
  const [startHour, startMin] = shift.startTime.split(":").map(Number);
  const [endHour, endMin] = shift.endTime.split(":").map(Number);

  // Calculate total minutes worked
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // Handle overnight shifts
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  // Subtract break
  const workedMinutes = totalMinutes - shift.breakMinutes;
  const totalHours = workedMinutes / 60;

  // Standard hours threshold (7.6 hours/day is common in Australian awards)
  const standardHoursThreshold = 7.6;
  
  // Calculate base hours and overtime
  let baseHours = Math.min(totalHours, standardHoursThreshold);
  let overtimeHours = 0;
  let doubleTimeHours = 0;

  if (totalHours > standardHoursThreshold) {
    const extraHours = totalHours - standardHoursThreshold;
    // First 2 hours overtime at 1.5x
    overtimeHours = Math.min(extraHours, 2);
    // Anything beyond that at 2x
    if (extraHours > 2) {
      doubleTimeHours = extraHours - 2;
    }
  }

  // Weekend penalties (simplified)
  let weekendMultiplier = 1;
  if (shift.dayOfWeek === "Saturday") {
    weekendMultiplier = 1.5;
  } else if (shift.dayOfWeek === "Sunday") {
    weekendMultiplier = 1.75;
  }

  // Calculate pay components
  const basePay = baseHours * shift.baseRate * weekendMultiplier;
  const timeAndHalf = overtimeHours * shift.baseRate * 1.5 * weekendMultiplier;
  const doubleTime = doubleTimeHours * shift.baseRate * 2 * weekendMultiplier;

  // Meal allowances (triggered by shifts > 5 hours in Australia)
  const allowances = totalHours > 5 ? 20.10 : 0;

  const total = basePay + timeAndHalf + doubleTime + allowances;

  return {
    baseHours,
    overtimeHours,
    doubleTimeHours,
    basePay,
    timeAndHalf,
    doubleTime,
    allowances,
    totalHours,
    total,
  };
};

// Helper to find penalty rate from FWC data
const findPenaltyRate = (penalties: any, description: string): number | null => {
  if (!penalties?.results) return null;
  
  const penalty = penalties.results.find((p: any) => 
    p.penalty_description?.toLowerCase().includes(description.toLowerCase())
  );
  
  if (penalty?.penalty_rate) {
    // Parse rate like "150%" or "1.5" or "Time and a half"
    const match = penalty.penalty_rate.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const num = parseFloat(match[1]);
      return num > 10 ? num / 100 : num; // Convert percentage to decimal if needed
    }
  }
  
  return null;
};

// Helper to find allowance amount from FWC data
const findAllowanceAmount = (allowances: any, description: string): number | null => {
  if (!allowances?.results) return null;
  
  const allowance = allowances.results.find((a: any) => 
    a.allowance_type_description?.toLowerCase().includes(description.toLowerCase()) ||
    a.allowance_description?.toLowerCase().includes(description.toLowerCase())
  );
  
  if (allowance?.allowance_amount) {
    // Parse amount like "$20.10" or "20.10"
    const match = allowance.allowance_amount.toString().match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  
  return null;
};

// New function for weekly pay calculations
export const calculateWeeklyPay = (
  shifts: WeeklyShift[],
  baseRate: number,
  penalties: any,
  allowances: any
): WeeklyPayCalculation => {
  const missingMoney: string[] = [];
  const shiftCalculations = shifts.map((shift) => {
    let shouldEarn = 0;

    // Calculate hours worked
    const [startHour, startMin] = shift.startTime.split(":").map(Number);
    const [endHour, endMin] = shift.endTime.split(":").map(Number);
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const workedMinutes = totalMinutes - shift.breakMinutes;
    const totalHours = workedMinutes / 60;

    // Base pay
    let effectiveRate = baseRate;
    let penaltyApplied = false;

    // Apply weekend/public holiday penalties using real FWC data
    if (shift.isPublicHoliday) {
      const publicHolidayRate = findPenaltyRate(penalties, "public holiday") || 2.5;
      effectiveRate = baseRate * publicHolidayRate;
      penaltyApplied = true;
    } else if (shift.isWeekend) {
      if (shift.dayOfWeek === "Saturday") {
        const saturdayRate = findPenaltyRate(penalties, "saturday") || 1.5;
        effectiveRate = baseRate * saturdayRate;
      } else if (shift.dayOfWeek === "Sunday") {
        const sundayRate = findPenaltyRate(penalties, "sunday") || 1.75;
        effectiveRate = baseRate * sundayRate;
      }
      penaltyApplied = true;
    }

    // Standard hours threshold
    const standardHours = 7.6;
    let regularHours = Math.min(totalHours, standardHours);
    let overtimeHours = totalHours > standardHours ? totalHours - standardHours : 0;

    shouldEarn += regularHours * effectiveRate;

    if (overtimeHours > 0) {
      const overtimeRate = findPenaltyRate(penalties, "overtime") || 1.5;
      shouldEarn += overtimeHours * effectiveRate * overtimeRate;
    }

    // Apply allowances using real FWC data
    if (shift.boughtOwnMeal && totalHours > 5) {
      const mealAllowance = findAllowanceAmount(allowances, "meal") || 20.10;
      shouldEarn += mealAllowance;
      if (shift.actualPaid < shouldEarn && shift.actualPaid > 0) {
        missingMoney.push(`Missing meal allowance ($${mealAllowance.toFixed(2)}) on ${shift.dayOfWeek}`);
      }
    }

    if (shift.travelWithCar) {
      const travelAllowance = findAllowanceAmount(allowances, "travel") || findAllowanceAmount(allowances, "vehicle") || 15.00;
      shouldEarn += travelAllowance;
      if (shift.actualPaid < shouldEarn && shift.actualPaid > 0) {
        missingMoney.push(`No travel allowance ($${travelAllowance.toFixed(2)}) on ${shift.dayOfWeek}`);
      }
    }

    // Check for missing overtime
    if (overtimeHours > 0 && shift.actualPaid > 0) {
      const overtimeRate = findPenaltyRate(penalties, "overtime") || 1.5;
      const expectedWithOvertime = regularHours * effectiveRate + overtimeHours * effectiveRate * overtimeRate;
      const withoutOvertime = totalHours * effectiveRate;
      if (Math.abs(shift.actualPaid - withoutOvertime) < Math.abs(shift.actualPaid - expectedWithOvertime)) {
        missingMoney.push(`Overtime rate (${(overtimeRate * 100).toFixed(0)}%) not applied after ${standardHours} hours on ${shift.dayOfWeek}`);
      }
    }

    // Check for missing weekend penalty
    if ((shift.isWeekend || shift.isPublicHoliday) && shift.actualPaid > 0) {
      const withoutPenalty = totalHours * baseRate;
      if (Math.abs(shift.actualPaid - withoutPenalty) < 5) {
        missingMoney.push(`Weekend/holiday penalty missing on ${shift.dayOfWeek}`);
      }
    }

    const difference = shouldEarn - shift.actualPaid;

    return {
      id: shift.id,
      shouldEarn,
      actualPaid: shift.actualPaid,
      difference,
    };
  });

  const totalShouldEarn = shiftCalculations.reduce((sum, calc) => sum + calc.shouldEarn, 0);
  const totalActualPaid = shifts.reduce((sum, shift) => sum + shift.actualPaid, 0);

  return {
    shifts: shiftCalculations,
    totalShouldEarn,
    totalActualPaid,
    missingMoney,
  };
};