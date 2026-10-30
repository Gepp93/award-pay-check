# Make the 2.0 homepage and public design live, keep Engine v2 admin-only

## Why the live homepage is the old one

This is not a caching or domain problem. Production is serving exactly what was published:

- The site's home address (`/`) still shows the older homepage ("Are you being underpaid?", upload hero, +$76.14 card).
- The 2.0 homepage ("Working hard. Getting paid right?", industry cards) only exists at `/v2`.
- At the last release, every `/v2` page was deliberately put behind the admin-only gate, as approved then. So ordinary visitors can't reach the 2.0 homepage at all, and the public How it works and Pricing pages are still the older versions.

## What changes

1. **Public 2.0 pages, open to everyone**
   - `/` shows the 2.0 homepage.
   - `/how-it-works` and `/pricing` show the 2.0 versions. Pricing still shows only the single $30 / 90-day pass, using the same shared offer details and the same live checkout link.
   - Contact and Why AwardPay stay at their current addresses and use the 2.0 header and footer.
2. **Where the public industry cards lead**
   - Picking an industry on the public homepage opens the live, tested checker (`/check`) with that industry already filled in, so the industry question isn't asked twice.
   - The live checker still asks for job, award and classification, and nothing is chosen automatically. Results, the preliminary-estimate warning, payments, reports and PDFs don't change.
3. **Kept admin-only (no change to the existing gate)**
   - These `/v2` pages stay admin-only: industry → intent picker, upload, Engine v2 questions, results, sign-in preview, and the `calculate-award-pay-v2` function.
   - The admin role check on the server also stays as it is.
   - Public pages won't link to any of these.
4. **Old homepage**
   - The old homepage stays in the code but is no longer linked. That gives us a one-line way to switch back.

## Checks before asking you to publish

- Signed out on the live web address (simulated): `/`, `/how-it-works` and `/pricing` show the 2.0 design, and every `/v2/*` page plus the Engine v2 function are still refused.
- Industry card → `/check`: the industry is filled in, award and classification must be confirmed, and the preliminary warning shows.
- Pricing shows A$30 and the checkout link hasn't changed. Sign-in, My Reports and the dashboard work.
- Desktop and 390px mobile screenshots, the full automated test suite (151+) and the build.
- Your admin account can still reach every `/v2` page.

After you approve publishing: check the same pages on www.awardpay.com.au, and if anything critical breaks, switch back to the previous version.

## Technical details

- `src/App.tsx`: point `/`, `/how-it-works` and `/pricing` at `V2Home`, `V2HowItWorks` and `V2Pricing` inside a new public `V2Layout` route (outside `V2Gate`). Keep the gated `/v2/*` children as they are.
- `Home.tsx`, `Layout.tsx` and `HowItWorks.tsx`: in public mode, links go to `/check?industry=<id>`, `/pricing` and `/how-it-works`, not `/v2/check`, `/v2/industry` and so on. Gated `/v2` keeps its current links. Pass this as a `public` prop or context so the components aren't duplicated.
- `GuidedCheck.tsx`: read the `industry` value once, map the 2.0 industry ID to the matching v1 industry label, and start at the job step. Unknown values are ignored. No change to model or calculation code.
- Remove the "preview" banner from the public layout.
- Add a small test that the industry ID mapping and public links never point into `/v2`.
- `AGENTS.md`: update the 2.0 rule. Public marketing pages use the 2.0 design; checker/engine routes stay gated.
- No changes to the database, Stripe, auth, Engine v1 or v2 formulas, or saved reports.
