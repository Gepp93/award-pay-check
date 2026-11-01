# Live SEO audit (1 Nov 2026) and smallest safe fixes

## Findings (checked on the live site)

| Check | Result |
|---|---|
| Non-www homepage | PASS: 301 to https://www.awardpay.com.au/ |
| Non-www subpages (/pricing, /employers, /check) | FAIL: 404, the path is not kept |
| www public pages return 200 | PASS, but the made-up URL /nonexistent-xyz also returns 200 ("soft 404") |
| Page-specific title/description in the HTML | FAIL: every URL sends the homepage title and description; pages only get their own tags after JavaScript runs |
| Self-referencing canonical in the HTML | FAIL: no canonical in the HTML sent to the crawler; it is added only after JavaScript runs |
| Indexable content without JavaScript | FAIL: about 670 characters of shared text on every URL; page content needs JavaScript |
| robots.txt | PASS: allows crawling and points to the sitemap |
| Sitemap | PARTIAL: 6 correct public pages and no private pages, but /employers and the award pages are missing |
| /employers | PASS: crawlable (200), linked in the site header/footer; FAIL: missing from the sitemap |
| Award pages (/underpaid/...) | Public and return 200, but not in the sitemap and not linked from the site. I have not checked whether their rates are accurate |

## Confirmed blockers, impact and smallest fix

1. **Non-www subpages return 404** (DNS forwarding drops the path). Impact: lost backlinks and Search Console 404s. Fix: in domain settings, add awardpay.com.au as a domain that redirects to www, replacing the GoDaddy forwarding. No code change. You do this in domain settings.
2. **Every page sends the homepage title, description and no canonical.** Impact: Google may treat the subpages as duplicates of the homepage, which matches subpages having almost no impressions. Smallest fix: at build time, pre-render a static HTML file for each public page in the sitemap with its own title, description, canonical and main text. The app, checker and payments stay the same. The bigger alternative is the server-rendered template upgrade.
3. **Made-up URLs return 200.** Impact: low. The pages are already marked noindex, so this is minor. Pre-rendering does not fix it fully. No action needed now.
4. **Sitemap is missing /employers.** Impact: slower discovery. Fix: add one sitemap entry.
5. **Award pages are not linked or listed in the sitemap.** Impact: they get no traffic. Fix: first check each page's figures against current Fair Work rates. Only then add verified pages to the sitemap and link them, for example from the footer. Leave pages that cannot be verified out of the sitemap, or mark them noindex.

## Out of scope / unchanged
No changes to the checker, Stripe, database security, payment entitlements or Engine v2. Nothing is published without approval.

## Technical details
- Pre-render: a post-build step writes `dist/<route>/index.html` for the 7 sitemap routes, with static head tags (route meta taken from the existing Helmet values) and the page's main text.
- Sitemap: add `https://www.awardpay.com.au/employers`. Add `/underpaid/<slug>` only after verification.
- Order: 1 (you, in domain settings), then 4, then 2, then the 5 audit.
