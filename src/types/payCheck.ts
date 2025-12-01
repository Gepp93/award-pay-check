export interface JobInfo {
  free_text: string;
  industry: string;
  state: string;
  selected_award_code: string;
  award_name: string;
  classification: string;
  classification_id: string | null;
}

export interface Employment {
  type: "full_time" | "part_time" | "casual";
  base_hourly_rate: number;
  pay_period_type: "weekly" | "fortnightly" | "custom";
  actual_pay_for_period: number;
}

export interface HoursWorked {
  date: string;
  day_of_week: string;
  start: string;
  finish: string;
  break_minutes: number;
}

export interface Conditions {
  works_nights: boolean;
  works_weekends: boolean;
  works_public_holidays: boolean;
  does_regular_overtime: "never" | "sometimes" | "often";
}

export interface AllowanceReported {
  type: string;
  received: boolean;
  amount_per_period: number;
}

export interface PayCheckData {
  job_info: JobInfo;
  employment: Employment;
  hours_worked: HoursWorked[];
  conditions: Conditions;
  allowances_reported: AllowanceReported[];
}

export interface PotentialIssue {
  type: string;
  description: string;
  estimatedAmount: number;
}

export interface PayCheckResult {
  awardName: string;
  classification: string;
  periodChecked: string;
  totalShouldHave: number;
  totalActuallyPaid: number;
  difference: number;
  potentialIssues: PotentialIssue[];
}
