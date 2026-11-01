# Step 1 only: check whether live hosting serves separate page files

## What is known
- The site has no standalone page files today, so live hosting cannot answer this question yet.
- The editor preview runs a development server, not the production host. A result there would not prove how the live site behaves.

## Smallest test
1. Add two tiny files that nobody visits, marked noindex and with no links to them:
   - `public/hosting-probe/index.html` containing the text "PROBE-DIR"
   - `public/hosting-probe-flat.html` containing the text "PROBE-FLAT"
2. Fetch them on the static preview host using raw HTML, as Googlebot would: `/hosting-probe`, `/hosting-probe/` and `/hosting-probe-flat`. Compare each with the generic app shell.
3. The preview cannot fully prove how production behaves. To confirm it on www.awardpay.com.au, a publish is needed. I will ask your approval for that separately. The publish would carry only these two files on top of the current live version, with no other changes.
4. After testing, delete both files and report the result:
   - **The folder file is served at /hosting-probe:** build-time pre-rendering works, so continue with the rest of the plan once you approve.
   - **Only the generic shell is served:** pre-rendering will not reach Google. I will report the smallest supported alternative and make no framework change without your approval.

## Unchanged
Checker, routing, Stripe, report protection, enquiries and Engine v2. Nothing is published without your approval.
