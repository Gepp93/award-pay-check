## Goal

Bring Why AwardPay and How It Works to life with motion + small hero touches, while keeping the current clean structure (centered headings, left-aligned bullets, no card grids, no boxed tiles). Green/gold tokens, nav, footer, routing untouched. No backend/calc/data changes.

## Files touched

- `src/pages/WhyAwardPay.tsx` — edit
- `src/pages/HowItWorks.tsx` — edit
- `src/index.css` — add a small block of reveal CSS + (if not already present) the gold underline swash + green pill eyebrow styles, reused from the home hero
- (no new components, no new packages — `lucide-react` is already used)

## 1. Reveal-on-scroll (shared utility, inline in each page)

A tiny `useReveal()` hook added at the top of each page file (or duplicated — it's ~15 lines):

- Selects all elements with `data-reveal` inside the page root.
- Creates a single `IntersectionObserver` (threshold 0.15) that adds `is-visible` on first intersection, then `unobserve`s the element. Never re-hides.
- Respects `prefers-reduced-motion`: if reduced, immediately adds `is-visible` to all targets and skips the observer.

CSS in `src/index.css`:

```css
[data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .6s ease-out,transform .6s ease-out;}
[data-reveal].is-visible{opacity:1;transform:none;}
@media (prefers-reduced-motion: reduce){[data-reveal]{opacity:1;transform:none;transition:none;}}
```

Stagger is done per-element with inline `style={{ transitionDelay: `${i*80}ms` }}` on list items.

Targets on both pages: hero H1, hero lede `<p>`, every `<h2>`, every `<li>`, the focal visual, and the final CTA.

## 2. Hero polish (both pages)

Above each H1, a small green pill eyebrow (same token as home hero):

```html
<span class="ap-eyebrow">Why AwardPay</span>   <!-- or "How it works" -->
```

`.ap-eyebrow` in `index.css`: small inline-block, green bg at low opacity, green text, rounded-full, px-3 py-1, text-xs, uppercase tracking. Centered via the existing centered hero column.

Gold underline swash under the LAST word of each H1 — reuse the same approach as home's "underpaid":

- Why page: `Why AwardPay <span class="ap-swash">exists</span>`
- How It Works page: `Three steps to check your <span class="ap-swash">pay</span>`

`.ap-swash` = relative inline span with an absolutely-positioned pseudo-element underline (soft gold, ~6px tall, slightly skewed, sits behind the text via z-index, no layout shift). If the home page already exports an existing class for this, reuse that exact class name instead of adding a new one — I'll grep `src/index.css` and `src/pages/Index.tsx` first and match whatever already powers the "underpaid" swash on the home hero.

## 3. Icon bullets (texture, not boxes)

Replace plain `list-disc` bullets:

- `<ul>` becomes `list-none pl-0 text-left space-y-2 mt-4`.
- Each `<li>` becomes `flex items-start gap-2` with a `<Check className="h-4 w-4 mt-1 shrink-0" style={{color: 'hsl(var(--primary))'}} />` then the text.

How It Works numbered list:

- `<ol>` becomes `list-none pl-0 text-left space-y-3 mt-4`.
- Each `<li>` becomes `flex items-start gap-3` with a leading `<span>` styled as a 24px green circle (`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold`, green bg + white text via existing tokens) holding the step number, then the step text.

No icon-in-circle rows for content — circles only on the numbered step list (which the user explicitly asked for) and inside the focal visual.

## 4. One focal visual per page (no card, no border)

### How It Works — 3-step indicator (above the "Three steps" list)

A centered horizontal row, plain on the page background:

```text
( 📷 ) ───── ( ✓ ) ───── ( $ )
```

- Three small green-bordered circles (~40px), each containing a lucide icon: `Camera`, `Scale`, `DollarSign`.
- Connected by a thin 1px horizontal line in the same green at ~30% opacity.
- Each circle has `data-reveal` with a 0/150/300 ms delay so they cascade left→right.
- Implemented as a flex row, no `<Card>`, no border around the whole thing.

### Why AwardPay — count-up stat (between "The problem" and "What AwardPay does")

Centered, no box:

- Large bold gold number `$1,542` rendered in Plus Jakarta Sans (`font-family: 'Plus Jakarta Sans', sans-serif` inline, color = gold token).
- Counts from 0 to 1542 over ~1.2s using `requestAnimationFrame` once it enters the viewport (same IntersectionObserver pattern — fires once). Reduced-motion → render final value immediately.
- Caption beneath in muted text: `lost by the average underpaid worker each year`.
- Code comment above it: `// TODO: replace with cited source before publishing`.

## 5. What does NOT change

- No card grids, no boxed feature tiles, no icon-in-circle rows for content sections.
- Centered headings + left-aligned bullets layout stays exactly as-is.
- `.ap-nav`, `.ap-footer`, `.ap-btn`, `.ap-btn-gold`, `.ap-h1`, `.ap-h2`, `.ap-lede`, `.ap-section`, `.ap-wrap` classes untouched.
- Routing (`/new-check-step-1`), SEO component, copy, and section order all unchanged.
- Contact page is not touched.
- No changes to `payCalculator`, Edge Functions, Supabase, types, or any data.

## Verification

After applying I'll open both pages in the preview via Playwright at 1280×1800, scroll through, and screenshot to confirm: pill eyebrow visible, gold swash under last word, bullets show green checks, numbered list shows green circles, focal visual renders without a card, and elements fade/translate in on scroll (cascade visible on the lists).
