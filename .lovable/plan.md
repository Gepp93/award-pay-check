
# SEO: Per-Page Metadata and Sitemap

## Problem
All pages share the same title and meta description from `index.html`. Search engines see identical metadata regardless of which page they crawl, hurting indexing and rankings.

## Plan

### 1. Install react-helmet-async
Add the `react-helmet-async` package for dynamic per-page head tags.

### 2. Wrap App in HelmetProvider
Add `<HelmetProvider>` wrapper in `src/App.tsx`.

### 3. Create reusable SEO component
Build `src/components/SEO.tsx` that accepts `title`, `description`, and `path` props, rendering `<Helmet>` with title, meta description, og:title, og:description, og:url (using `https://awardpay.com.au`), and twitter tags.

### 4. Add SEO metadata to each public page

| Page | Title | Description |
|------|-------|-------------|
| `/` (Index) | Are You Being Underpaid? Award Pay Calculator Australia \| AwardPay | Free Australian award pay calculator. Check if you're being underpaid - 1 in 5 workers lose $1,542/year. Verify penalty rates, overtime and allowances in 60 seconds. |
| `/why-awardpay` | Why AwardPay? Understanding Australian Award Pay \| AwardPay | Australian Modern Awards are complex. AwardPay simplifies award pay rules so every worker knows exactly what they're owed. |
| `/how-it-works` | How AwardPay Works - Award Pay Calculator Explained \| AwardPay | See how AwardPay checks your pay against official Fair Work Commission data. Enter shifts, get an instant breakdown of rates, penalties and allowances. |
| `/pricing` | Pricing - Affordable Award Pay Checking \| AwardPay | Check your Australian award pay from $10/month. Verify overtime, penalty rates and allowances with AwardPay's accurate calculator. |
| `/contact` | Contact Us - AwardPay Support \| AwardPay | Get in touch with the AwardPay team. Email support@awardpay.com.au for help with your award pay questions. |

### 5. Create sitemap.xml
Create `public/sitemap.xml` with all public URLs using the domain **https://awardpay.com.au**:
- https://awardpay.com.au/
- https://awardpay.com.au/why-awardpay
- https://awardpay.com.au/how-it-works
- https://awardpay.com.au/pricing
- https://awardpay.com.au/contact

### 6. Update robots.txt
Add `Sitemap: https://awardpay.com.au/sitemap.xml` directive.

---

### Files Changed
- **New**: `src/components/SEO.tsx`, `public/sitemap.xml`
- **Modified**: `src/App.tsx` (HelmetProvider), `src/pages/Index.tsx`, `src/pages/WhyAwardPay.tsx`, `src/pages/HowItWorks.tsx`, `src/pages/Pricing.tsx`, `src/pages/Contact.tsx` (add SEO component), `public/robots.txt`
