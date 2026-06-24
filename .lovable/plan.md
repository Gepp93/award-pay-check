# Landing rebuild — plan

## Scope
Replace exactly 4 files with the verbatim contents you supplied:
1. `src/index.css`
2. `tailwind.config.ts`
3. `index.html`
4. `src/pages/Index.tsx`

No other file touched. No calc/Edge Function/routing/Supabase changes. All CTAs continue to route to `/new-check-step-1`. Payslip card stays hardcoded demo content. Stats keep the "replace with cited sources" note. No testimonials added.

## ⚠ Blocker on File 4 (src/pages/Index.tsx)
The `Index.tsx` block in your message has had all JSX tags stripped by the chat renderer. What arrived is e.g.:

```
Pay check
WK ENDING 14 JUN
...
✓Underpayment found
```

with no `<div>`, `<section>`, `<span>`, `className=...`, etc. It also contains a broken JSON-LD fragment (`@context": "https://schema.org",` with no opening brace or wrapping element) and an `OwedFigure` return that is just bare text — both will fail to parse as TSX.

I cannot apply this verbatim — it won't compile, which would break the whole app, not just the landing page. Your rule "If any class or import errors, fix only the error — do not redesign" doesn't cover a file that is ~90% missing markup; reconstructing it is a design act, not an error fix.

Files 1–3 (CSS, Tailwind config, index.html) arrived intact and I can apply those exactly as given.

## How I'd like to proceed — pick one

**A. You re-paste `src/pages/Index.tsx` only**, ideally inside a fenced ```` ```tsx ```` block or as a file attachment, so the JSX survives. I then apply all 4 files verbatim. ← recommended.

**B. I apply files 1–3 verbatim now**, and reconstruct `Index.tsx` from the CSS class names (`.ap-nav`, `.ap-hero`, `.ap-stage`, `.ap-scan`, `.ap-ledger`, `.ap-chip-*`, `.ap-steps`, `.ap-stats`, `.ap-band`, `.ap-final`, `.ap-footer`) plus the visible copy in your message. The structure will match the CSS exactly, but specific element nesting is my reconstruction, not your verbatim code.

**C. I apply files 1–3 verbatim and leave the current `Index.tsx` in place** until you re-send file 4. Landing will look broken (old classes, new tokens) in the meantime.

Which one?
