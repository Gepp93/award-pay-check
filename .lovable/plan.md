Rebuild `src/pages/Pricing.tsx` to state the new freemium model, keeping the existing design system, shared nav, footer, and scroll-reveal animation used on Why AwardPay / How It Works.

LAYOUT
- Wrap the page in the same container style as the rebuilt pages (max-width 1200, centered, Plus Jakarta Sans, background from `index.css`).
- Use `<ApNav />` for the nav (replacing the current `<PublicNavBar />`) and the same `ap-footer` block at the bottom.
- Hero: centered green `ap-eyebrow` pill, centered H1 with gold swash on the last word, one centered lede line, all animated via `data-reveal`.
- Three pricing tiers side-by-side on desktop (3-column grid), single column on mobile.
- No card grids, feature boxes, icon-in-circle rows, FAQ, testimonial cards, or CTA band anywhere else on the page.
- One small centered muted reassurance line under the tiers.

HERO COPY
- H1: "Simple pricing. Pay only when it's worth it." with gold swash on "worth it".
- Lede: "Checking your pay is always free. You only pay once you've seen what you're owed."

TIER CARDS
- Three `Card` components from the shadcn UI kit, styled with the design tokens.
- Tier 1: Free — "See if you're underpaid" — list: Snap one payslip, check against official Fair Work rates, headline result (rough amount + issue count), no account needed. Button: "Check my payslip — free".
- Tier 2: Full report — $10 one-time — highlighted as "Most popular" with gold accent border or tag, slightly raised shadow. List: everything in Free, itemised missing penalties/loadings/allowances with amounts, total owed for that period, step-by-step recovery instructions, downloadable PDF. Button: "Check my payslip".
- Tier 3: Back-pay pack — $30 one-time — "Build your full claim across multiple payslips". List: everything in Full report, up to 5 payslips checked, combined total back-pay figure, single claim summary with recovery steps for the whole period. Button: "Check my payslip".
- Every button routes to `/new-check-step-1` via `useNavigate`. No on-page checkout or payment flow.

REASSURANCE LINE
- Centered muted text under the tiers: "Every check starts free — you only pay once you've seen what you're owed. Prices in AUD. Your payslip is read, then discarded. AwardPay is an interpretation tool, not legal advice."

TECHNICAL
- Reuse the local `useReveal()` hook (IntersectionObserver + reduced-motion) from WhyAwardPay/HowItWorks.
- Apply `data-reveal` to hero elements and tier cards, with staggered transition delays on list items.
- Remove the old subscription state/effect, Stripe checkout handler, FAQ accordion, and extra sections.
- Keep a single SEO block with updated title/description for the new pricing.
- Use `Check` icon from lucide-react for tier feature lists.

FILES TOUCHED
- `src/pages/Pricing.tsx` (rewrite)
- `src/index.css` (no changes unless the existing scroll-reveal tokens need a tiny pricing-specific helper, but current selectors are sufficient)

WHAT STAYS UNCHANGED
- Routing, Edge Functions, calculation logic, Supabase data, other pages, nav component, footer component, design tokens.