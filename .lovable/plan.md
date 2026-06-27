## Fix: PDF download on Step 3 / FullReport

**Root cause (most likely):** `import jsPDF from "jspdf"` is a default import, but jsPDF v4 only ships the **named** export. `new jsPDF()` throws silently inside the click handler, so nothing downloads. The `jspdf-autotable` plugin is a second fragile dependency that often fails to attach to the jsPDF instance.

### Changes (single file: `src/components/report/FullReport.tsx`)

1. **Imports**
   - Replace `import jsPDF from "jspdf"` with `import { jsPDF } from "jspdf"`.
   - Remove `import autoTable from "jspdf-autotable"` entirely.
   - Add `import { toast } from "@/hooks/use-toast"`.

2. **Rewrite `buildPdf`** using only plain jsPDF text primitives — no autoTable, no plugins.
   - Track a `y` cursor starting at ~48pt, increment per line, page-break when `y > 780` via `doc.addPage(); y = 48;`.
   - Sections, reusing the same data the on-screen report shows (no engine changes):
     - Header: "AwardPay — Pay Check Report", "Generated <date>", period.
     - Headline: owed > 0 → `isUnsure ? "You may be owed up to ~$X" : "You may be owed $X"`, else "Your pay looks correct for this period". Include caveat in unsure mode.
     - **Your details**: employment, award, classification, base rate, hours at base / 1.5x / 2x (from `advancedPayslip`), total paid — rendered as `Label: value` lines.
     - **What's missing**: regular-hours line, 1.5x line, 2x line, award pay total, actually paid, shortfall — each as a label + right-aligned amount via `doc.text(amount, pageW - 48, y, { align: "right" })`. In unsure mode show estimate range string instead of single award total.
     - **Potential allowances**: loop `result.potentialAllowances` — name + amount on one line, wrapped "Why: …" using `doc.splitTextToSize`.
     - **How to recover it**: numbered list from `recoverySteps()`.
     - Footer: "AwardPay provides general information, not legal advice." + `awardpay.com.au · Generated <date>`.
   - `doc.save(`awardpay-report-${new Date().toISOString().slice(0,10)}.pdf`)`.

3. **Handler hardening**
   - Wrap the whole `buildPdf(...)` call in `try/catch`. On error: `console.error("PDF generation failed", err)` and `toast({ title: "Couldn't generate the PDF — please try again.", variant: "destructive" })`.
   - Button is already a shadcn `<Button>` (renders `<button type="button">` by default) and not inside a `<form>` — confirm and leave as-is. Use a dedicated `handleDownload` function for the onClick.

### Out of scope
- Calculation engine, on-screen layout, routing, payment gating.
- The `jspdf-autotable` dependency stays in `package.json` (unused after this change); removing it is a separate cleanup.

### Verification
- Build / tsgo.
- Manually click "Download report (PDF)" on Step 3 in both `mode === 'unsure'` and exact modes; confirm a file downloads and opens.

### Install status
`jspdf ^4.2.1` is already in `package.json` — **no install needed**. `jspdf-autotable ^5.0.8` is also present but will no longer be imported.
