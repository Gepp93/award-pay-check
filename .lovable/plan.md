# Trusted Paper — Visual Redesign Plan

A pure reskin. No calculation, edge function, routing, or data-flow changes. Every page keeps current behaviour; only tokens, fonts, layout, and component appearance change.

## Design direction

"Trusted Paper" — editorial, document-like, calm authority. Australian-grounded without kitsch. Warm paper background, deep eucalyptus green as the brand/structure colour, honey/amber reserved exclusively for the money moment, clay red only for underpaid alerts.

## Phase 1 — Foundation (apply first, then check in)

1. **`src/index.css`**
   - Replace `:root` light tokens with the exact HSL values supplied (background warm paper, eucalyptus primary, honey accent, clay destructive, hairline border, radius 0.75rem).
   - Update `.dark` to a tuned counterpart that preserves the same character (warm dark ink background, lighter eucalyptus primary, same accent).
   - **Delete** `--gradient-primary`, `--gradient-hero`, `--gradient-card`, `--gradient-shine`, `--gradient-mesh`, `--shadow-glow`, `--shadow-elegant` and any `.bg-gradient-*`, `.text-gradient`, `.shadow-glow` utilities.
   - Add one shadow token: `--shadow-paper: 0 1px 2px hsl(220 22% 14% / 0.04), 0 8px 24px -12px hsl(220 22% 14% / 0.08);`
   - Add Fraunces + Inter Google Fonts `@import` at the top.
   - Set `body { font-family: 'Inter', ...; background: hsl(var(--background)); color: hsl(var(--foreground)); }` and `h1,h2,h3,h4 { font-family: 'Fraunces', serif; font-feature-settings: 'ss01'; }`.
   - Add `.font-display` (Fraunces) and a `.money` utility (Fraunces, tabular-nums, tight tracking) for dollar figures.
   - Add a subtle `.rule-line` and `.perforated-edge` utility (dashed/dotted hairline using `--border`) — the one ownable payslip motif.

2. **`tailwind.config.ts`**
   - `fontFamily.sans = ['Inter', ...]`, `fontFamily.display = ['Fraunces', 'serif']`, `fontFamily.serif = ['Fraunces', 'serif']`.
   - Add `boxShadow.paper` mapping to `var(--shadow-paper)`. Remove any custom glow/elegant shadow extensions.
   - Keep semantic colour mappings (primary/accent/destructive/etc. resolve from tokens — no hex changes needed in the config beyond what's already token-driven).
   - Remove any `backgroundImage` gradient extensions.

3. **`index.html`** — add Fraunces + Inter `<link>` preconnect/stylesheet as a perf fallback alongside the CSS import.

4. **Global component primitives (token-only edits, no API changes):**
   - `src/components/ui/button.tsx` — default = solid `bg-primary text-primary-foreground` (no gradient). Outline + ghost stay quiet. Remove any `shadow-glow`/gradient variants by remapping them to `bg-primary` / `shadow-paper`. Reduce default radius to `rounded-md` (matches new `--radius`).
   - `src/components/ui/card.tsx` — `bg-card border border-border shadow-paper rounded-lg`. No glow.
   - `src/components/ui/input.tsx` — hairline border, focus ring uses `--ring` (eucalyptus).

**Checkpoint with user** after Phase 1 — the whole app will already look dramatically different because everything reads from these tokens.

## Phase 2 — Two key screens (then check in again)

5. **`src/pages/Index.tsx` (landing)**
   - Kill the full-bleed gradient hero. Replace with an editorial left-aligned hero: small eyebrow label, large Fraunces h1, supporting Inter paragraph, single solid green CTA + quiet secondary, generous whitespace, max-width content column (~ `max-w-3xl` for text, `max-w-6xl` page).
   - Remove gradient-circle icons in feature/section blocks — switch to plain lucide line icons at `text-primary` with no background, or drop them.
   - Trust/stats strip rendered as a thin ruled row (hairline top + bottom border, Fraunces numbers).
   - Keep all copy, sections, routes, CTAs and tracking unchanged.

6. **`src/pages/NewCheck_Step3_Result.tsx` (the money moment)**
   - The "$X you may be owed" figure: Fraunces, very large, `text-accent` (honey), tabular-nums, with a hand-drawn-style honey underline (simple `border-b-2 border-accent` or thin SVG marker). This is the *only* place amber appears.
   - Result card: white, hairline border, `shadow-paper`, perforated-edge motif along the bottom (dashed `--border` line) so it reads like a payslip stub.
   - Status chip: green check + "Looks correct" OR clay-red dot + "Underpaid". No red anywhere else.
   - Subtle count-up animation on the dollar figure on mount (lightweight `requestAnimationFrame` or a tiny hook — no new dependency). Soft fade/slide for sections.
   - All values, state, lead capture and downstream flows untouched.

**Checkpoint with user** — confirm direction on landing + result before propagating.

## Phase 3 — Roll out across remaining pages

Apply the same patterns (editorial left-aligned hero, paper cards, solid green buttons, no gradient/glow, Fraunces for headings + money) to:

- `Pricing.tsx`, `HowItWorks.tsx`, `WhyAwardPay.tsx`
- `NewCheck_Step1_WhoAreYou.tsx`, `NewCheck_Step2_ShiftDetails.tsx`
- `AppDashboard.tsx`, `Dashboard.tsx`, `Profile.tsx`, `Subscription.tsx`, `ThankYou.tsx`, `Auth.tsx`, `Contact.tsx`
- `AwardOverview.tsx`, `AwardFinder.tsx`, `WeeklyPayCheck.tsx`, `Calculator.tsx`, `Onboarding.tsx`
- Shared: `PublicNavBar.tsx`, `NavBar.tsx`, wizard `ProgressIndicator.tsx`, weekly-pay + calculator + award-overview cards.

Each page: remove gradient backgrounds, gradient text, glow shadows, gradient-circle icons. Re-anchor layouts left, raise heading sizes in Fraunces, tighten to a content column. Preserve every prop, handler, route, and piece of business logic.

## Out of scope

- No changes to `src/lib/payCalculator.ts`, `src/types/payCheck.ts`, any `supabase/functions/**`, any migration, RLS, or data fetching.
- No copy rewrites beyond what naturally falls out of layout (e.g. eyebrow labels). If a section is dropped visually, it stays in the DOM.
- No new dependencies. Count-up uses a tiny inline hook.

## Technical notes

- Token-first: because shadcn components consume CSS variables, most of the reskin lands in Phase 1. Page edits are mostly removing `bg-gradient-*`/`text-gradient`/`shadow-glow` class strings and re-shaping hero layouts.
- Accessibility: verify eucalyptus on paper ≥ AA for body; honey accent only used at large display sizes where AA-large applies; clay red passes on white.
- Dark mode: tuned but secondary priority — the brand pages are light. Will sanity-check after Phase 1.

Awaiting approval before touching files.