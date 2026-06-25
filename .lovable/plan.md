# Plan: Accept PDF / HEIC / images on /check by converting to JPEG in the browser

Goal: `/check` should accept payslips as PDF, HEIC/HEIF, JPG, PNG, or WEBP, and always send `ai-parse-payslip` a JPEG data URL (longest edge ≤ 1600px). The edge function and the rest of the flow are not touched.

## 1. Dependencies

Install in the frontend only:

- `pdfjs-dist` — render PDF page 1 to a canvas.
- `heic2any` — convert HEIC/HEIF blobs to JPEG in the browser.

No other packages, no edge function changes, no routing changes.

## 2. Changes to `src/pages/CheckUpload.tsx`

### File input + helper text

- `accept=".pdf,.heic,.heif,image/*"` on both the hidden `<input type="file">` and the drag-and-drop handler's validation.
- Helper text under the drop zone becomes: **"PDF, JPG, PNG or HEIC."**
- Drag-and-drop accepts the same set.

### New conversion pipeline (added as local helpers in the same file)

A single async `fileToJpegDataUrl(file: File): Promise<string>` that branches on type and always returns a JPEG data URL:

1. **PDF** (`file.type === "application/pdf"` or `.pdf` extension)
   - Dynamic import of `pdfjs-dist`:
     ```ts
     const pdfjsLib = await import("pdfjs-dist");
     const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
     pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
     ```
     The `?url` import is the Vite-correct way to ship the worker; this is the usual breakage point.
   - `getDocument({ data: await file.arrayBuffer() })`, get page 1.
   - `page.getViewport({ scale: 2 })`, render to an offscreen `<canvas>`.
   - `canvas.toDataURL("image/jpeg", 0.85)`.

2. **HEIC / HEIF** (`type` includes `heic`/`heif` or extension `.heic`/`.heif`)
   - Dynamic import of `heic2any`.
   - `const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 })`.
   - Read that blob as a data URL via `FileReader.readAsDataURL`.

3. **Other images** (JPG / PNG / WEBP / generic `image/*`)
   - Read directly with `FileReader.readAsDataURL`.

Then pass the result through a **downscale step**:

`downscaleJpeg(dataUrl: string, maxEdge = 1600, quality = 0.85): Promise<string>`

- Load into an `Image`, draw to a canvas sized so the longest edge ≤ 1600px (keep aspect ratio; if already smaller, leave dimensions alone but still re-export as JPEG so PNG/WEBP become JPEG).
- Return `canvas.toDataURL("image/jpeg", 0.85)`.

`fileToJpegDataUrl` returns the post-downscale value.

### Upload handler changes

Current flow (read file → base64 → invoke `ai-parse-payslip` → navigate) becomes:

1. Set a new `preparing` UI state with message **"Preparing your file…"** (shown in place of / next to the existing uploading state).
2. `const imageDataUrl = await fileToJpegDataUrl(file)` — wrapped in try/catch.
3. On failure, surface error: **"We couldn't read that file — try a JPG or PNG, or enter your details manually."** with the existing "Enter manually" link.
4. On success, swap state to the existing "uploading/analyzing" state and call:
   ```ts
   supabase.functions.invoke("ai-parse-payslip", { body: { image: imageDataUrl } })
   ```
   exactly as today. Same `parsedPayslip` handling, same `navigate("/new-check-step-1", { state: { parsedPayslip } })`.
5. The existing "unreadable" branch from the edge function is unchanged.

### UI states (existing visuals reused)

- `idle` → drop zone (with updated helper text).
- `preparing` → "Preparing your file…" (new copy, same spinner card).
- `analyzing` → existing "Reading your payslip…" card.
- `error` → existing error card, new copy when conversion fails.

No layout or design-system changes — same `ap-` classes, same hero, same footer.

## 3. Out of scope (explicitly not touched)

- `supabase/functions/ai-parse-payslip/index.ts` — unchanged. It keeps receiving `{ image: <jpeg data url> }`.
- Calculation engine, Step 1/2/3, routing, Supabase schema, auth.
- Multi-page PDFs — only page 1 is rendered, as specified.

## 4. Technical notes

- All conversion runs client-side; nothing extra sent over the wire.
- `pdfjs-dist` and `heic2any` are dynamically imported so the `/check` route only pays the bundle cost on first upload, not on initial page load.
- The `?url` worker import works with Vite 5 + `pdfjs-dist` v4 (ESM worker at `pdfjs-dist/build/pdf.worker.min.mjs`). If the installed `pdfjs-dist` is older and ships only `pdf.worker.min.js`, the import path swaps to that filename — same `?url` pattern. Verified after install.
- Downscale-to-1600px-longest-edge keeps phone photos under ~300–500 KB JPEG, which is well within the edge function's payload limits and keeps OpenAI vision fast.

## 5. Files touched

- `src/pages/CheckUpload.tsx` — accept list, helper text, conversion pipeline, new "preparing" state, new error copy.
- `package.json` / lockfile — adds `pdfjs-dist` and `heic2any`.

Nothing else.
