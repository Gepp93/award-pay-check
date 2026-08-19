# Programmatic SEO: one landing page per modern award

Purely additive. No existing page, route, component, table, checker, /reports, or the $10 Stripe flow is modified except the two small, explicitly-listed touch points at the bottom.

## 1. Database (new tables only)

Two new tables, exactly as specified:

- `awards` — `award_code` text PK, `name`, `slug` unique, `industry`, `effective_date` date, `rates_json` jsonb
- `award_pages` — `slug` text PK, `award_code` FK to awards, `title`, `meta_description`, `body_json` jsonb, `status` default `'draft'`, `generated_at`, `updated_at`

Access rules: public (anonymous) read of `awards`, and read of `award_pages` only where `status = 'published'`. Writes are service-role only (the generator). Nothing else in the database changes.

## 2. Generator edge function `generate-award-pages`

- Selects `awards` rows with no matching `award_pages` row.
- For each, calls Anthropic `POST https://api.anthropic.com/v1/messages` with `x-api-key` from the `ANTHROPIC_API_KEY` secret, `anthropic-version: 2023-06-01`, model `claude-sonnet-4-6`, `max_tokens: 2000`, and your prompt string verbatim with award name and `rates_json` injected.
- Parses the reply as JSON; on parse failure or missing keys it logs and skips that award — one bad award never aborts the run.
- Upserts `slug, title, meta_description, body_json, status='published', generated_at=now()`.
- Runs sequentially with a short delay between calls.
- Admin-only invocation (requires auth + admin role) so nobody else can burn your API credits.

No pay rate is ever generated, estimated, or hardcoded — the only figures that exist are the ones you type into `rates_json`, and the prompt already instructs the model to defer to "check your own payslip" when a figure is absent. The rates table on the page renders straight from `rates_json`; if it is empty, the page shows the "check your payslip" note instead of a table.

## 3. Page: `/underpaid/:slug`

New route added below the existing ones, above the catch-all. New page component + its own CSS additions only (no edits to shared styles). It:

- Fetches the `award_pages` row by slug (published only), joined to `awards` for `rates_json` and `effective_date`.
- Renders h1, intro, "Are you being underpaid?" signs list, rates table from `rates_json`, rates_note, FAQ, and the CTA using `cta_copy`.
- CTA calls the existing `startSubscriptionCheckout()` in `src/lib/paymentLinks.ts` — the same $10 flow the homepage offer card uses. No new payment code, no new Stripe link.
- Uses the existing `ApNav` header, the same footer markup and the existing green/gold `.ap-` design tokens so it looks native.
- Sets title/description/canonical via the existing `SEO` component, plus FAQPage + BreadcrumbList JSON-LD.
- Unknown or unpublished slug renders the clean 404 page.

## 4. Sitemap

Honest deviation: an edge function cannot serve `https://www.awardpay.com.au/sitemap.xml` — that path is served by your static hosting, and `public/robots.txt` already points there. So instead of an edge function, a `scripts/generate-sitemap.ts` prebuild script queries published `award_pages` and writes `public/sitemap.xml` containing your existing core pages plus every award page. It is capped at a safe maximum entry count. It runs on `predev` and `prebuild`, so the sitemap refreshes each time you publish.

## 5. Indexability — read this one carefully

Your app is a client-rendered Vite SPA. Today `/underpaid/:slug` would ship an empty HTML shell with homepage meta tags; Google can render JS but it is slower and less reliable, and social crawlers see nothing. I will not fake it.

What I will build: a **build-time prerender step**. A prebuild script fetches every published `award_pages` row and writes a real static `dist/underpaid/<slug>/index.html` containing the full h1, intro, signs, rates table, FAQ, and correct `<title>`/description/canonical/og tags in the source — no JavaScript required. React then hydrates over it for the interactive CTA. The page count is capped by a constant well below publish limits.

The tradeoff you must know: prerendering happens at build time, so **a newly generated award page only becomes crawlable static HTML after you publish again**. Generate pages, then hit Publish. That is the honest limit of this stack.

If you later want true on-demand server rendering (new pages live instantly, accurate per-page social previews with no republish), the app can get SSR by upgrading to Lovable's latest template — type "/" in chat and choose "Migrate to TanStack Start", or just ask me. [What the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start)

## Files that touch existing code (your review list)

Only three, all additive lines:

1. `src/App.tsx` — one new `<Route path="/underpaid/:slug">` line above the catch-all.
2. `package.json` — add `predev`/`prebuild` script entries for sitemap + prerender.
3. `public/sitemap.xml` — becomes generated rather than hand-edited (existing URLs preserved).

Everything else is new files: the migration, `supabase/functions/generate-award-pages/`, `src/pages/UnderpaidAward.tsx`, `scripts/generate-sitemap.ts`, `scripts/prerender-award-pages.ts`.

## Manual steps left to you

1. Add the `ANTHROPIC_API_KEY` secret (I can prompt you for it in-chat when we get there).
2. Enter 5–10 awards into the `awards` table with real `name`, `slug`, `industry`, `effective_date`, and `rates_json`.
3. Run the generator, review the generated copy, then Publish so the prerendered HTML ships.
4. Submit `https://www.awardpay.com.au/sitemap.xml` in Google Search Console.

## Build order

1. Migration (tables, grants, RLS)
2. `generate-award-pages` edge function
3. `/underpaid/:slug` page + route
4. Sitemap generator
5. Prerender script + package.json wiring
