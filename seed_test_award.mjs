import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing env vars');

const supabase = createClient(url, key, { auth: { persistSession: false } });

const award_code = 'TEST_AWARD_001';
const slug = 'test-retail-award';

// Clean first
await supabase.from('award_pages').delete().eq('slug', slug);
await supabase.from('awards').delete().eq('award_code', award_code);

const { error: awardError } = await supabase.from('awards').insert({
  award_code,
  name: 'Test Retail Award',
  slug,
  industry: 'Retail',
  effective_date: '2026-07-01',
  rates_json: {
    classifications: [
      { level: 'Level 1', hourly: 24.10, casual_hourly: 30.13 },
      { level: 'Level 2', hourly: 25.50, casual_hourly: 31.88 },
    ],
  },
});

if (awardError) throw awardError;

const { error: pageError } = await supabase.from('award_pages').insert({
  slug,
  award_code,
  title: 'Am I underpaid under the Test Retail Award?',
  meta_description: 'Check your Test Retail Award payslip for underpayment with AwardPay.',
  body_json: {
    h1: 'Are you underpaid under the Test Retail Award?',
    intro: [
      'The Test Retail Award sets minimum pay rates for retail workers in Australia.',
      'AwardPay compares your payslip against these rates to find missing money.',
    ],
    underpayment_signs: [
      'Your hourly rate is below the award minimum for your classification.',
      'Saturday or Sunday penalty rates are missing from your payslip.',
      'You are not paid overtime for hours worked past your ordinary hours.',
    ],
    rates_note: 'These rates are provided as an example. Always check your own payslip and classification.',
    faq: [
      { q: 'How do I know my classification?', a: 'Your classification is usually listed on your payslip or employment contract.' },
      { q: 'What if my rate looks wrong?', a: 'Upload your payslip to AwardPay and we will flag any discrepancies.' },
    ],
    cta_copy: 'Check your payslip for $10',
  },
  status: 'published',
  generated_at: new Date().toISOString(),
});

if (pageError) throw pageError;

console.log('Seeded test award and page');
