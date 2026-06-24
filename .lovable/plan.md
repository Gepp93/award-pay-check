# Plan: rebuild three content pages, lighter and shorter

Rebuild `WhyAwardPay.tsx`, `HowItWorks.tsx`, and `Contact.tsx` from the supplied spec. No card grids, no icon tiles — headings, one-liners, real `<ul>` bullets, one gold CTA per page.

## Shared structure (all three pages)

Each page uses the same shell already used by `Index.tsx`:

- Same `.ap-nav` top nav with brand, links (Why AwardPay / How it works / Pricing / Contact), Sign in ghost link, and a gold "Check my payslip" button.
- Page content in a single `.ap-wrap` column with generous vertical spacing (`.ap-section`).
- Same `.ap-footer` with "AwardPay" mark and `© 2026 AwardPay · Pay checks are estimates based on Fair Work Modern Award data.`
- `<SEO>` tag with a sensible title/description and `path` set.

A small local component on each page provides the final CTA block: H2 "See what you're owed" + gold button → `/new-check-step-1`.

## Page content

**WhyAwardPay.tsx**
1. Hero: H1 "Why AwardPay exists" + one-line lede (verbatim).
2. H2 "The problem" + 4-item `<ul>`.
3. H2 "What AwardPay does" + 4-item `<ul>`.
4. H2 "Where our data comes from" + single `<p>` (no bullets).
5. H2 "Who it's for" + single `<p>`.
6. Final CTA block.

**HowItWorks.tsx**
1. Hero: H1 "How AwardPay checks your pay" + one-line lede.
2. H2 "Three steps" + ordered `<ol>` with the three lines.
3. H2 "What we check" + 4-item `<ul>`.
4. One muted `<p>` (no heading): "AwardPay is an interpretation tool based on official Fair Work data, not legal advice."
5. Final CTA block.

**Contact.tsx**
1. Hero: H1 "Get in touch" + one-line lede.
2. Centred large green `<a href="mailto:support@awardpay.com.au">` followed by small muted "We usually reply within 24–48 hours."
3. Footer copyright reads "© 2026 AwardPay" (no extra trailing clause on this page per spec).
4. No final CTA section, no extra cards.

## Styling approach

Use existing tokens — no new CSS classes, no Tailwind redesign:

- Headings: `font-bold` with `text-3xl`/`text-2xl` and `tracking-tight`, dark `text-foreground`.
- Body: `text-[17px] text-foreground/80 leading-relaxed`, `max-w-2xl` for readability.
- Bullets: native `<ul class="list-disc pl-5 space-y-2">` and `<ol class="list-decimal pl-5 space-y-2">` — no boxes, no icons.
- Section spacing: `.ap-section` (already 64px top/bottom) inside `.ap-wrap`.
- Gold CTA: existing `.ap-btn .ap-btn-gold .ap-btn-lg` button calling `navigate("/new-check-step-1")`.
- Contact email link: inline style/utility classes for centred, large, `text-primary`, bold.

## Constraints honoured

- Single gold CTA per page (Why and HowItWorks), Contact has none per spec.
- No testimonials, no invented stats, no "create free account" copy.
- No changes to calculations, routes, Edge Functions, Supabase, or any data flow.
- Reuses the design tokens and `.ap-*` classes already in `src/index.css`.
- Existing imports that become unused (Card, Button, lucide icons) are simply removed from the rewritten files.

## Files touched

- `src/pages/WhyAwardPay.tsx` — full rewrite.
- `src/pages/HowItWorks.tsx` — full rewrite.
- `src/pages/Contact.tsx` — full rewrite.

Nothing else changes.
