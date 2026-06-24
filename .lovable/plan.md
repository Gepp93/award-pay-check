# Plan: theme un-break + Contact/HowItWorks rebuild

## Part A — Apply verbatim (safe, no JSX risk)

**File 1: `src/index.css`** — replace entire contents with the provided CSS.
Key change: re-adds the legacy compatibility tokens (`--gradient-primary`, `--gradient-hero`, `--gradient-card`, `--gradient-shine`, `--gradient-mesh`, `--shadow-glow`, `--shadow-card`, `--shadow-elevated`) pointed at the new green/gold palette. This instantly un-breaks every page still referencing `bg-gradient-primary`, `shadow-glow`, etc. (Auth, Subscription, Pricing, WhyAwardPay, the "Get In Touch" highlight, "Get Started" buttons, icon circles).

**File 2: `tailwind.config.ts`** — replace entire contents with the provided config.
Key change: re-adds `backgroundImage` entries (`gradient-primary`, `gradient-hero`, `gradient-card`, `gradient-shine`, `gradient-mesh`) and `boxShadow` (`glow`, `card`, `elevated`) so the Tailwind classes resolve to the new tokens. Also formalises the `gold`, `clay`, `success`, `primary.soft`, `primary.press`, `gold.soft`, `gold.ink`, `gold.press` colour scales.

These two files alone fix the invisible-text/buttons issue across the entire app, with zero risk to calculations, routing, edge functions, or data flow.

## Part B — Blocker on Contact and HowItWorks rebuilds

Files 3 and 4 (`src/pages/Contact.tsx` and `src/pages/HowItWorks.tsx`) in your message **have all JSX tags stripped out** during transmission — only attribute strings and visible copy remain (e.g. `Contact`, `How it works` with no surrounding `<a>`/`<div>`/`<section>` markup, no `className` props, no fragment/root element). Pasting them verbatim would not compile — TSX cannot parse bare text between `return (` and `);`. This is the same JSX-stripping issue we hit on the landing-page rebuild.

I cannot apply files 3 and 4 verbatim as requested without breaking the build.

## Recommended path

1. **Apply Part A now** (Files 1 & 2 verbatim) — un-breaks the invisible-button issue everywhere immediately. Zero ambiguity, zero reconstruction.
2. **Choose one option for Part B:**
   - **B1 (recommended):** Re-paste `src/pages/Contact.tsx` and `src/pages/HowItWorks.tsx` inside fenced ` ```tsx ` blocks (or as file attachments). I then apply them verbatim, exactly as specified.
   - **B2:** I reconstruct both files from the visible copy, CSS classes (`ap-nav`, `ap-hero`, `ap-section`, `ap-steps`, `ap-band`, `ap-final`, `ap-footer`, `ap-check-grid`) and the structure visible in your stripped paste. Copy, routes, classes and tokens will match; specific element nesting is my reconstruction, not your verbatim code.
   - **B3:** Skip Contact/HowItWorks for now. Leave the existing pages in place — they will still render correctly once Part A lands because the legacy gradient tokens are restored.

## Verification after Part A

- Reload `/contact`: the word "Touch" in "Get In Touch" is visible (green highlight restored via `--gradient-primary` or whichever token the existing page uses).
- Reload `/auth`, `/subscription`, `/pricing`, `/why-awardpay`, `/how-it-works`: all primary buttons render with a visible green background; icon circles render with their soft tinted backgrounds.
- Landing page (`/`) is unaffected — it uses the new `ap-*` classes which already match the new palette.
- No calculation, routing, edge function, or Supabase changes.

## Tell me which Part B option you want and I'll proceed.
