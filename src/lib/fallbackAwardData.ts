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
    { description: 'Saturday', rate: '150%', conditions: 'First 2 hours' },
    { description: 'Saturday', rate: '200%', conditions: 'After 2 hours' },
    { description: 'Sunday', rate: '200%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Overtime - Monday to Friday', rate: '150%', conditions: 'First 2 hours' },
    { description: 'Overtime - Monday to Friday', rate: '200%', conditions: 'After 2 hours' },
    { description: 'Night work', rate: '150%', conditions: 'After midnight' }
  ],
  'MA000003': [ // Fast Food Industry Award
    { description: 'Saturday', rate: '125%', conditions: 'All hours' },
    { description: 'Sunday', rate: '150%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Evening (7pm-midnight)', rate: '115%', conditions: 'Monday to Friday' },
    { description: 'Late Night (midnight-6am)', rate: '125%', conditions: 'Monday to Friday' }
  ],
  'MA000004': [ // General Retail Industry Award
    { description: 'Saturday', rate: '125%', conditions: 'All hours' },
    { description: 'Sunday', rate: '200%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Evening (6pm-9pm)', rate: '125%', conditions: 'Monday to Friday' },
    { description: 'Late Night (after 9pm)', rate: '150%', conditions: 'Monday to Friday' }
  ],
  'MA000009': [ // Hospitality Industry (General) Award
    { description: 'Saturday', rate: '150%', conditions: 'All hours' },
    { description: 'Sunday', rate: '175%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Late Night (midnight-7am)', rate: '115%', conditions: 'Monday to Friday' }
  ],
  'MA000034': [ // Nurses Award
    { description: 'Saturday', rate: '150%', conditions: 'All hours' },
    { description: 'Sunday', rate: '175%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Afternoon Shift', rate: '112.5%', conditions: '1pm-11pm' },
    { description: 'Night Shift', rate: '115%', conditions: '11pm-7am' }
  ],
  'MA000010': [ // Health Professionals Award
    { description: 'Saturday', rate: '150%', conditions: 'All hours' },
    { description: 'Sunday', rate: '175%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Afternoon/Evening Shift', rate: '112.5%', conditions: 'After 6pm' },
    { description: 'Night Shift', rate: '115%', conditions: 'After 11pm' }
  ],
  'MA000025': [ // Road Transport and Distribution Award
    { description: 'Saturday', rate: '150%', conditions: 'All hours' },
    { description: 'Sunday', rate: '200%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Night Loading', rate: '115%', conditions: '9pm-6am' }
  ],
  'MA000088': [ // Cleaning Services Award
    { description: 'Saturday', rate: '150%', conditions: 'All hours' },
    { description: 'Sunday', rate: '200%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' }
  ],
  'MA000022': [ // Electrical Award
    { description: 'Saturday', rate: '150%', conditions: 'First 2 hours' },
    { description: 'Saturday', rate: '200%', conditions: 'After 2 hours' },
    { description: 'Sunday', rate: '200%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Overtime', rate: '150%', conditions: 'First 2 hours' },
    { description: 'Overtime', rate: '200%', conditions: 'After 2 hours' }
  ],
  'MA000084': [ // Manufacturing Award
    { description: 'Saturday', rate: '150%', conditions: 'All hours' },
    { description: 'Sunday', rate: '200%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' },
    { description: 'Afternoon Shift', rate: '115%', conditions: '6pm-midnight' },
    { description: 'Night Shift', rate: '130%', conditions: 'Midnight-6am' }
  ],
  'MA000076': [ // Storage Services Award
    { description: 'Saturday', rate: '150%', conditions: 'All hours' },
    { description: 'Sunday', rate: '200%', conditions: 'All hours' },
    { description: 'Public Holiday', rate: '250%', conditions: 'All hours' }
  ]
};

export const fallbackAllowances: Record<string, FallbackAllowance[]> = {
  'MA000020': [ // Building and Construction General On-site Award
    { name: 'Tool Allowance', amount: '$28.00 per week', description: 'For employees required to supply and maintain tools', conditions: 'Paid to tradespersons who supply their own tools' },
    { name: 'Industry Allowance', amount: '$2.21 per hour', description: 'Payable to all employees to compensate for industry-specific conditions', conditions: 'All employees except apprentices in first year' },
    { name: 'Meal Allowance', amount: '$20.50 per meal', description: 'When working overtime and not notified before end of previous day', conditions: 'After working 1.5 hours overtime' },
    { name: 'Travel Allowance - Daily', amount: '$26.90 per day', description: 'When required to travel to work locations outside normal area', conditions: 'Radial distance from GPO' },
    { name: 'First Aid Allowance', amount: '$17.95 per week', description: 'For employees holding current first aid certificate and appointed by employer', conditions: 'Must be nominated first aider' },
    { name: 'Leading Hand Allowance - 2-5 employees', amount: '$52.40 per week', description: 'For employees placed in charge of 2-5 other employees', conditions: 'Appointed as leading hand' },
    { name: 'Leading Hand Allowance - 6-10 employees', amount: '$76.20 per week', description: 'For employees placed in charge of 6-10 other employees', conditions: 'Appointed as leading hand' },
    { name: 'Leading Hand Allowance - 11+ employees', amount: '$97.50 per week', description: 'For employees placed in charge of 11 or more other employees', conditions: 'Appointed as leading hand' },
    { name: 'Height Work Allowance', amount: '$3.50 per hour', description: 'For work at heights above 15 metres from ground level', conditions: 'When working above 15m' },
    { name: 'Underground Allowance', amount: '$3.50 per hour', description: 'For work underground', conditions: 'All underground work' },
    { name: 'Confined Space Allowance', amount: '$3.50 per hour', description: 'For work in confined spaces', conditions: 'When working in confined spaces' },
    { name: 'Heavy Vehicle/Mobile Plant', amount: '$1.25 per hour', description: 'For employees required to hold and use special licence', conditions: 'When operating heavy vehicles or mobile plant requiring special licence' },
    { name: 'Hot Work Allowance', amount: '$1.38 per hour', description: 'For work in places where temperature exceeds 46°C', conditions: 'When temperature exceeds 46 degrees Celsius' },
    { name: 'Cold Work Allowance', amount: '$1.38 per hour', description: 'For work in places where temperature is 0°C or below', conditions: 'When temperature is at or below 0 degrees Celsius' },
    { name: 'Wet Work Allowance', amount: '$1.38 per hour', description: 'For employees working in wet conditions', conditions: 'When working in rain or using water' },
    { name: 'Dirty Work Allowance', amount: '$1.38 per hour', description: 'For work of an unusually dirty or offensive nature', conditions: 'When performing unusually dirty work' }
  ],
  'MA000003': [ // Fast Food Industry Award
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime for more than 1.5 hours without notice', conditions: 'Overtime without prior notice' },
    { name: 'Laundry Allowance', amount: '$1.49 per shift', description: 'When required to launder employer-supplied uniform', conditions: 'Must launder uniform' },
    { name: 'First Aid Allowance', amount: '$2.54 per day', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' }
  ],
  'MA000004': [ // General Retail Industry Award
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime for more than 1.5 hours without notice', conditions: 'Overtime without prior notice' },
    { name: 'Laundry Allowance', amount: '$6.50 per week', description: 'When required to wear and launder special uniform', conditions: 'Employer-required uniform' },
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Cold Work Allowance', amount: '$0.52 per hour', description: 'For work in freezer/cool room at 0°C or below', conditions: 'Working in freezer sections' },
    { name: 'Broken Shift Allowance', amount: '$4.70 per day', description: 'When shift is broken into separate periods', conditions: 'Split shift rostered' }
  ],
  'MA000009': [ // Hospitality Industry (General) Award
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime for more than 2 hours without notice', conditions: 'Overtime without prior notice' },
    { name: 'Uniform/Laundry Allowance', amount: '$6.50 per week', description: 'When required to launder employer-supplied uniform', conditions: 'Must launder uniform' },
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Split Shift Allowance', amount: '$15.50 per day', description: 'When shift is split into two portions', conditions: 'Working split shift' },
    { name: 'Tool Allowance (Cooks)', amount: '$2.16 per day', description: 'For cooks who provide their own tools', conditions: 'Supply own cooking tools' },
    { name: 'Cold Work Allowance', amount: '$0.52 per hour', description: 'For work in freezer/cool room', conditions: 'Working in cold storage areas' }
  ],
  'MA000034': [ // Nurses Award
    { name: 'Uniform Allowance', amount: '$1.23 per shift', description: 'When required to wear uniform', conditions: 'Wearing employer-required uniform' },
    { name: 'On-Call Allowance', amount: '$21.80 per 24 hours', description: 'When required to be available outside normal hours', conditions: 'Rostered on-call' },
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'In-Charge Allowance', amount: '$25.40 per shift', description: 'When in charge of facility during shift', conditions: 'Appointed in-charge' },
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime without notice', conditions: 'Overtime without notice' }
  ],
  'MA000010': [ // Health Professionals Award
    { name: 'On-Call Allowance (weekday)', amount: '$21.80 per 24 hours', description: 'When required to be available on weekdays', conditions: 'On-call weekdays' },
    { name: 'On-Call Allowance (weekend)', amount: '$43.60 per 24 hours', description: 'When required to be available on weekends', conditions: 'On-call weekends/public holidays' },
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime without notice', conditions: 'Overtime without notice' },
    { name: 'Uniform Allowance', amount: '$6.50 per week', description: 'When required to wear and launder special clothing', conditions: 'Employer-required uniform' }
  ],
  'MA000025': [ // Road Transport and Distribution Award
    { name: 'Meal Allowance', amount: '$15.80 per meal', description: 'When required to work more than 2 hours overtime', conditions: 'Overtime exceeds 2 hours' },
    { name: 'Overnight Allowance', amount: '$95.00 per night', description: 'When required to stay overnight away from home', conditions: 'Required to stay away' },
    { name: 'Dangerous Goods Licence', amount: '$0.88 per hour', description: 'When carrying dangerous goods requiring licence', conditions: 'Transporting dangerous goods' },
    { name: 'Driver Trainer Allowance', amount: '$15.50 per day', description: 'When training other drivers', conditions: 'Appointed as trainer' },
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Leading Hand Allowance', amount: '$38.00 per week', description: 'For employees supervising others', conditions: 'Supervising 3+ employees' }
  ],
  'MA000088': [ // Cleaning Services Award
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime without notice', conditions: 'Overtime without notice' },
    { name: 'Height Allowance', amount: '$3.50 per hour', description: 'For work at heights above 15 metres', conditions: 'Working at heights' },
    { name: 'Leading Hand Allowance', amount: '$38.00 per week', description: 'For employees supervising others', conditions: 'Supervising 3+ employees' },
    { name: 'Broken Shift Allowance', amount: '$4.70 per day', description: 'When shift is broken into separate periods', conditions: 'Split shift rostered' },
    { name: 'Toilet Cleaning Allowance', amount: '$0.92 per hour', description: 'When cleaning public toilets', conditions: 'Cleaning public toilets' }
  ],
  'MA000022': [ // Electrical Award
    { name: 'Tool Allowance', amount: '$28.00 per week', description: 'For employees supplying own tools', conditions: 'Supply own tools' },
    { name: 'Electrician Licence Allowance', amount: '$45.00 per week', description: 'For holding electrical licence', conditions: 'Licenced electrician' },
    { name: 'First Aid Allowance', amount: '$17.95 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Leading Hand Allowance', amount: '$52.40 per week', description: 'For employees supervising 2-5 others', conditions: 'Supervising 2-5 employees' },
    { name: 'Height Work Allowance', amount: '$3.50 per hour', description: 'For work at heights above 15 metres', conditions: 'Working above 15m' },
    { name: 'Hot Work Allowance', amount: '$1.38 per hour', description: 'Working in extreme heat', conditions: 'Temperature above 46°C' },
    { name: 'Meal Allowance', amount: '$20.50 per meal', description: 'When working overtime', conditions: 'Overtime without notice' }
  ],
  'MA000084': [ // Manufacturing Award
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Leading Hand Allowance', amount: '$38.00 per week', description: 'For employees supervising others', conditions: 'Supervising 3+ employees' },
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime', conditions: 'Overtime without notice' },
    { name: 'Tool Allowance', amount: '$14.80 per week', description: 'For tradespersons supplying tools', conditions: 'Supply own tools' },
    { name: 'Heat Allowance', amount: '$0.62 per hour', description: 'For work in high temperatures', conditions: 'Temperature above 46°C' },
    { name: 'Cold Work Allowance', amount: '$0.62 per hour', description: 'For work in low temperatures', conditions: 'Temperature below 0°C' },
    { name: 'Dust/Fumes Allowance', amount: '$0.62 per hour', description: 'For work in dusty conditions', conditions: 'Dusty or fume conditions' }
  ],
  'MA000076': [ // Storage Services Award (Warehousing)
    { name: 'First Aid Allowance', amount: '$16.66 per week', description: 'For appointed first aid officers', conditions: 'Appointed as first aider' },
    { name: 'Forklift Allowance', amount: '$1.25 per hour', description: 'For operating forklift', conditions: 'Operating forklift' },
    { name: 'Leading Hand Allowance', amount: '$38.00 per week', description: 'For employees supervising others', conditions: 'Supervising 3+ employees' },
    { name: 'Meal Allowance', amount: '$15.75 per meal', description: 'When required to work overtime', conditions: 'Overtime without notice' },
    { name: 'Cold Work Allowance', amount: '$0.52 per hour', description: 'For work in freezer/cool room', conditions: 'Working in cold storage' }
  ]
};

export function getFallbackPenalties(awardId: string): FallbackPenalty[] {
  return fallbackPenalties[awardId] || [];
}

export function getFallbackAllowances(awardId: string): FallbackAllowance[] {
  return fallbackAllowances[awardId] || [];
}
