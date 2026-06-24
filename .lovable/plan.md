## Alignment-only tweak (Why AwardPay, How It Works, Contact)

No copy, nav, footer, routing, or token changes. Only alignment + one color fix.

### Shared pattern (all three pages)

Wrap each section's content in a centered column:

```tsx
<div className="mx-auto max-w-[760px]">
  <h2 className="ap-h2 text-center">…</h2>
  <p className="text-center …">…</p>           {/* intro/lede paragraphs */}
  <ul className="list-disc pl-6 text-left mt-4 space-y-2">…</ul>
  {/* or <ol className="list-decimal pl-6 text-left …"> */}
</div>
```

Rules:
- Hero `h1` and hero intro sentence: add `text-center`, wrapped in `mx-auto max-w-[760px]`.
- Every section `h2` ("The problem", "What AwardPay does", "Where our data comes from", "Who it's for", "Three steps", "What we check"): add `text-center`.
- Every `<ul>` / `<ol>`: keep inside the same `mx-auto max-w-[760px]` wrapper, add `text-left` and `list-disc pl-6` (or `list-decimal pl-6`) so bullets sit on the left edge of the centered column.
- Standalone descriptive `<p>` blocks under a heading (e.g. "Where our data comes from", "Who it's for", the muted disclaimer on How It Works): `text-center` is fine since they're single short paragraphs.
- Final CTA block: already centered — leave as-is.
- No changes to `.ap-nav`, `.ap-footer`, `.ap-btn`, or any `ap-*` class.

### WhyAwardPay.tsx

- Hero: center H1 + lede.
- "The problem" — centered h2, left-aligned `<ul>` inside 760px column.
- "What AwardPay does" — same.
- "Where our data comes from" — centered h2, centered single `<p>`.
- "Who it's for" — centered h2, centered single `<p>`.
- Final CTA — unchanged.

### HowItWorks.tsx

- Hero: center H1 + lede.
- "Three steps" — centered h2, left-aligned `<ol className="list-decimal pl-6 text-left">` inside 760px column.
- "What we check" — centered h2, left-aligned `<ul>` inside 760px column.
- Muted disclaimer `<p>` — centered.
- Final CTA — unchanged.

### Contact.tsx

- Hero H1 "Get in touch":
  - Remove any `bg-clip-text`, `text-transparent`, gradient span, or highlighted wrapper around "touch".
  - Heading becomes a single `<h1 className="ap-h1 text-center">Get in touch</h1>` rendered in the normal dark foreground color (inherits from `.ap-h1`, no per-word styling).
- Intro sentence: `text-center`, in 760px column.
- Mailto link + 24–48 hours line: already centered — leave as-is.
- Footer "© 2026 AwardPay" — unchanged.

### Files touched

- `src/pages/WhyAwardPay.tsx`
- `src/pages/HowItWorks.tsx`
- `src/pages/Contact.tsx`

Nothing else changes.
