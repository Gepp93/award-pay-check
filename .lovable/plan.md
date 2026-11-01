# Targeted SEO fixes (approved scope)

## Audit summary (live, 1 Nov 2026)
- Non-www subpages return 404 instead of redirecting. This is a domain-settings fix you need to make: add awardpay.com.au as a domain that redirects to www, replacing the GoDaddy forwarding.
- Every URL sends the homepage title and description, and no canonical, until JavaScript runs. Subpages look like duplicates to Google.
- The sitemap is missing /employers and the award pages.
- Award pages (/underpaid/...) are public but not linked and not in the sitemap. Their accuracy has not been checked.

## Steps
1. **Check that hosting serves route files first.** Add one small test file at a sub-path (for example `/pricing/index.html` from the build) and confirm on the preview/static host that `/pricing` returns that file, not the generic shell. I can only fully confirm on the live site after you approve a publish. If the host still returns the generic shell, I stop and report back. The fallback is the server-rendered template upgrade, which needs your separate approval.
2. **Sitemap:** add `https://www.awardpay.com.au/employers`. Leave out lastmod dates.
3. **Pre-render at build time** these pages only: `/`, `/how-it-works`, `/pricing`, `/why-awardpay`, `/contact`, `/employers`, plus the award pages that pass step 5. Each gets its own title, description, a www canonical and the real page content rendered from the same components, so there is no hidden text. Not pre-rendered: `/check`, sign-in, reports, dashboard, payment pages and `/v2/*`.
4. **No hydration mismatch:** the app takes over the pre-rendered page using the same components. Anything that depends on the browser or the account (sign-in state, carousel) renders the same as the signed-out first view.
5. **Award page audit:** compare each `/underpaid/<slug>` page's rates and claims with current Fair Work pay guides and the Fair Work website. Each page is marked index (accurate), fix needed (listed with the correct cited figure, not changed without your approval) or noindex. Only accurate pages go into the sitemap and get pre-rendered.
6. **Verify:** run the existing tests and the production build. Fetch the raw HTML for each affected route, with no JavaScript run, and check its title, description, canonical and content. Run a browser check that pages look and work the same.
7. Do not publish. Report back for approval.

## Unchanged
Checker, Stripe checkout, report protection, employer enquiries, Engine v2 access, design.

## Technical details
- Post-build script (`scripts/prerender.ts`, run after `vite build`): renders the listed routes with `react-dom/server` + `StaticRouter` + `HelmetProvider`, injecting the head tags and markup into `dist/<route>/index.html`. The client switches to `hydrateRoot` when the root already contains pre-rendered markup.
- Remove the static canonical from `index.html` if one exists, so each page has a single canonical.
- Record the pre-render rule in AGENTS.md. Add these tasks to roadmap.md.
