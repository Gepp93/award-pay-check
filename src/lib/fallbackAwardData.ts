// Fallback data for common awards when API returns empty results
// Based on Fair Work Commission Modern Awards

export interface FallbackPenalty {
  description: string;
  rate: string;
  conditions?: string;
}

export interface FallbackAllowance {
  name: string;
  amount: string;
  description: string;
  conditions?: string;
}

export const fallbackPenalties: Record<string, FallbackPenalty[]> = {
  'MA000020': [ // Building and Construction General On-site Award
    {
      description: 'Saturday',
      rate: '150%',
      conditions: 'First 2 hours'
    },
    {
      description: 'Saturday',
      rate: '200%',
      conditions: 'After 2 hours'
    },
    {
      description: 'Sunday',
      rate: '200%',
      conditions: 'All hours'
    },
    {
      description: 'Public Holiday',
      rate: '250%',
      conditions: 'All hours'
    },
    {
      description: 'Overtime - Monday to Friday',
      rate: '150%',
      conditions: 'First 2 hours'
    },
    {
      description: 'Overtime - Monday to Friday',
      rate: '200%',
      conditions: 'After 2 hours'
    },
    {
      description: 'Night work',
      rate: '150%',
      conditions: 'After midnight'
    }
  ]
};

export const fallbackAllowances: Record<string, FallbackAllowance[]> = {
  'MA000020': [ // Building and Construction General On-site Award
    {
      name: 'Tool Allowance',
      amount: '$28.00 per week',
      description: 'For employees required to supply and maintain tools',
      conditions: 'Paid to tradespersons who supply their own tools'
    },
    {
      name: 'Industry Allowance',
      amount: '$2.21 per hour',
      description: 'Payable to all employees to compensate for industry-specific conditions',
      conditions: 'All employees except apprentices in first year'
    },
    {
      name: 'Meal Allowance',
      amount: '$20.50 per meal',
      description: 'When working overtime and not notified before end of previous day',
      conditions: 'After working 1.5 hours overtime'
    },
    {
      name: 'Travel Allowance - Daily',
      amount: '$26.90 per day',
      description: 'When required to travel to work locations outside normal area',
      conditions: 'Radial distance from GPO'
    },
    {
      name: 'First Aid Allowance',
      amount: '$17.95 per week',
      description: 'For employees holding current first aid certificate and appointed by employer',
      conditions: 'Must be nominated first aider'
    },
    {
      name: 'Leading Hand Allowance - 2-5 employees',
      amount: '$52.40 per week',
      description: 'For employees placed in charge of 2-5 other employees',
      conditions: 'Appointed as leading hand'
    },
    {
      name: 'Leading Hand Allowance - 6-10 employees',
      amount: '$76.20 per week',
      description: 'For employees placed in charge of 6-10 other employees',
      conditions: 'Appointed as leading hand'
    },
    {
      name: 'Leading Hand Allowance - 11+ employees',
      amount: '$97.50 per week',
      description: 'For employees placed in charge of 11 or more other employees',
      conditions: 'Appointed as leading hand'
    },
    {
      name: 'Height Work Allowance',
      amount: '$3.50 per hour',
      description: 'For work at heights above 15 metres from ground level',
      conditions: 'When working above 15m'
    },
    {
      name: 'Underground Allowance',
      amount: '$3.50 per hour',
      description: 'For work underground',
      conditions: 'All underground work'
    },
    {
      name: 'Confined Space Allowance',
      amount: '$3.50 per hour',
      description: 'For work in confined spaces',
      conditions: 'When working in confined spaces'
    },
    {
      name: 'Heavy Vehicle/Mobile Plant',
      amount: '$1.25 per hour',
      description: 'For employees required to hold and use special licence',
      conditions: 'When operating heavy vehicles or mobile plant requiring special licence'
    },
    {
      name: 'Explosive Powered Tools',
      amount: '$2.21 per day',
      description: 'For employees using explosive powered tools',
      conditions: 'When using explosive powered tools'
    },
    {
      name: 'Laser Equipment',
      amount: '$1.90 per hour',
      description: 'For employees required to use laser equipment',
      conditions: 'When operating laser equipment'
    },
    {
      name: 'Plumbing Work in Sewers',
      amount: '$0.83 per hour',
      description: 'For plumbers working on live sewers',
      conditions: 'When performing plumbing work on live sewers'
    },
    {
      name: 'Hot Work Allowance',
      amount: '$1.38 per hour',
      description: 'For work in places where temperature exceeds 46°C',
      conditions: 'When temperature exceeds 46 degrees Celsius'
    },
    {
      name: 'Cold Work Allowance',
      amount: '$1.38 per hour',
      description: 'For work in places where temperature is 0°C or below',
      conditions: 'When temperature is at or below 0 degrees Celsius'
    },
    {
      name: 'Wet Work Allowance',
      amount: '$1.38 per hour',
      description: 'For employees working in wet conditions',
      conditions: 'When working in rain or using water'
    },
    {
      name: 'Dirty Work Allowance',
      amount: '$1.38 per hour',
      description: 'For work of an unusually dirty or offensive nature',
      conditions: 'When performing unusually dirty work'
    }
  ]
};

export function getFallbackPenalties(awardId: string): FallbackPenalty[] {
  return fallbackPenalties[awardId] || [];
}

export function getFallbackAllowances(awardId: string): FallbackAllowance[] {
  return fallbackAllowances[awardId] || [];
}
