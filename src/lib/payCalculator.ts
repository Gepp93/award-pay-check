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

    // Apply weekend/public holiday penalties
    if (shift.isPublicHoliday) {
      effectiveRate = baseRate * 2.5; // Public holiday typically 2.5x
      penaltyApplied = true;
    } else if (shift.isWeekend) {
      if (shift.dayOfWeek === "Saturday") {
        effectiveRate = baseRate * 1.5;
      } else if (shift.dayOfWeek === "Sunday") {
        effectiveRate = baseRate * 1.75;
      }
      penaltyApplied = true;
    }

    // Standard hours threshold
    const standardHours = 7.6;
    let regularHours = Math.min(totalHours, standardHours);
    let overtimeHours = totalHours > standardHours ? totalHours - standardHours : 0;

    shouldEarn += regularHours * effectiveRate;

    if (overtimeHours > 0) {
      const overtimeRate = effectiveRate * 1.5;
      shouldEarn += overtimeHours * overtimeRate;
    }

    // Apply allowances
    if (shift.boughtOwnMeal && totalHours > 5) {
      shouldEarn += 20.10; // Standard meal allowance
      if (shift.actualPaid < shouldEarn && shift.actualPaid > 0) {
        missingMoney.push(`Missing meal allowance on ${shift.dayOfWeek}`);
      }
    }

    if (shift.travelWithCar) {
      shouldEarn += 15.00; // Simplified travel allowance
      if (shift.actualPaid < shouldEarn && shift.actualPaid > 0) {
        missingMoney.push(`No travel allowance on ${shift.dayOfWeek}`);
      }
    }

    // Check for missing overtime
    if (overtimeHours > 0 && shift.actualPaid > 0) {
      const expectedWithOvertime = regularHours * effectiveRate + overtimeHours * effectiveRate * 1.5;
      const withoutOvertime = totalHours * effectiveRate;
      if (Math.abs(shift.actualPaid - withoutOvertime) < Math.abs(shift.actualPaid - expectedWithOvertime)) {
        missingMoney.push(`Overtime rate not applied after ${standardHours} hours on ${shift.dayOfWeek}`);
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