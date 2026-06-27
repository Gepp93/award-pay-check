## What's left

Based on recent work (PDF/HEIC conversion on /check, guard.ts origin allow-list, Step 2 validation fix), the freemium check flow is functionally complete end-to-end: upload → parse → Step 1 → Step 2 → email gate → Step 3 results, plus $9 PDF and $49 Recovery upsells.

Open items I can see still worth doing (not blockers, confirm which you want):
1. **Mobile upload bug** (below) — small, fix now.
2. Smoke-test the full flow on the live preview after the recent guard.ts + Step 2 fixes to confirm no regressions.
3. Remove the `console.log` diagnostic added to `supabase/functions/_shared/guard.ts` once you've confirmed the Lovable preview origin is being accepted (it's noisy in function logs).
4. Optional polish: surface a "We support PDF, JPG, PNG, HEIC" hint on the error state of /check so users understand retry options.

Tell me which of 2–4 to action — otherwise the only thing I'll fix is the mobile photo-picker issue.

## Mobile upload bug — fix

**Problem:** On mobile, tapping the upload area opens the camera directly with no option to pick an existing payslip photo or PDF from the Files app / Photos library.

**Cause:** In `src/pages/CheckUpload.tsx` the `<input type="file">` has `capture="environment"`. On iOS/Android this attribute forces the OS to launch the rear camera and bypass the normal file picker. Combined with `accept=".pdf,.heic,.heif,image/*"`, the camera wins.

**Fix (one file, one line):**
- Remove the `capture="environment"` attribute from the file input in `CheckUpload.tsx`.
- That's it — without `capture`, mobile browsers show the native chooser ("Photo Library / Take Photo / Choose File"), which still lets the user take a new photo *and* lets them pick an existing image or PDF.

**Out of scope:**
- No change to the conversion pipeline (`fileToJpegDataUrl`, pdf.js, heic2any).
- No change to `ai-parse-payslip`, guard.ts, calculation engine, or routing.
- No new "Take photo" vs "Upload file" split buttons unless you want that as a follow-up.

**Verification:** Open `/check` on a mobile viewport, tap the upload area, confirm the native picker offers both camera and file/photo options; upload a PDF and a HEIC and confirm both still reach Step 1.
