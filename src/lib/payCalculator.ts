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
