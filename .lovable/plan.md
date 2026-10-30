# AwardPay: mobile worker carousel + For Employers page

## Email delivery: what's missing
No sending domain is set up for AwardPay, so the site can't email enquiries to support@awardpay.com.au yet. The existing "email report" function is an unfinished placeholder.
- Until email is set up, every enquiry is saved securely in your backend (Cloud → Database → `employer_enquiries`). Nothing gets lost.
- Turning on email alerts later: set up a sending domain (for example notify.awardpay.com.au) through Lovable's email setup. Once it's verified, ask me and I'll add the alert to support@awardpay.com.au. No form changes needed.

## Part 1: Mobile-only worker carousel (homepage)
- Below the `sm` size, the existing industry photo cards become one horizontal swipe row. Each card is about 85% wide, so the edge of the next card shows. Cards snap into place as you swipe.
- Small page dots underneath follow the scroll position. Tapping a dot moves to that card. No autoplay.
- Same photos, wording, links and tap-to-preselect behaviour. "Check my payslip" stays prominent above the cards.
- Screen-reader labels ("Industry 2 of 7"), smooth scrolling on iPhone, and less motion for anyone who has reduced motion turned on.
- Desktop and tablet layout is untouched (the carousel only applies below `sm`).

## Part 2: /employers page
- A new public page inside the existing site layout. "For Employers" is added to the header, mobile menu and footer.
- Sections: hero with your headline, subheadline and supporting line, plus a "Request an Employer Review" button → three services (new employee research, existing employee review, payroll compliance risk review) → what employers receive (scoped written report, using your list) → four-step "How it works" → limitations (human-reviewed research and advice; scope and capability confirmed before quoting; not legal advice; no guarantee of compliance) → enquiry form → link to support@awardpay.com.au.
- Form fields: business name, contact name, work email, optional phone, industry, approximate employee count (ranges), service required, message, and a required consent checkbox. A privacy note asks people not to include payslips or employee personal details.
- Spam protection: a hidden spam trap field, a minimum time before the form can be sent, length checks in the browser and on the server, and a limit of 5 enquiries per hour from the same sender. Bots get a quiet "success" and nothing is saved.
- SEO: its own title, description and canonical address, plus an entry in the sitemap.

## Technical details
- New table `employer_enquiries` (RLS on, no browser read/write; service role only, with GRANTs). New edge function `employer-enquiry` that validates with zod, applies the rate limit by hashed IP (no raw IP stored) and inserts the row.
- Test one submission, confirm the row is saved, then delete only that row.
- Not changed: the checker, Stripe, reports, access protection and Engine v2. No publishing.
