

# Remove Paywall, Add Email Capture + Paid Report/Recovery Upsell

## Overview

Replace the current $30 subscription paywall and auth wall with a completely free calculator experience. After calculation, add a lightweight email capture step before showing full results. Below results, add a conversion section offering two paid products via Stripe: a $9 PDF Report and a $49 Recovery Service.

---

## Database Changes

### New table: `leads`
Stores email captures and associated calculation data (no auth required).

```sql
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  calculation_data jsonb,
  shift_details jsonb,
  created_at timestamptz DEFAULT now(),
  stripe_session_id text,
  product_purchased text,
  payment_status text DEFAULT 'none'
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (no auth required)
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading own lead by id (for thank-you page)
CREATE POLICY "Anyone can read leads by id"
  ON public.leads FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow updates for payment status
CREATE POLICY "Service role can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true);
```

---

## Stripe Integration

Enable Stripe via the Lovable Stripe tool to create two products:
1. **Official PDF Report** -- $9 AUD (one-time)
2. **Recovery Service** -- $49 AUD (one-time)

Stripe Checkout sessions will be created via an edge function, passing the `lead_id` as metadata so we can link payment to the lead.

---

## New/Modified Files

### 1. Edge Function: `supabase/functions/create-checkout/index.ts`
- Accepts `leadId`, `product` ("report" or "recovery"), and `email`
- Creates a Stripe Checkout Session for the correct product/price
- Sets `success_url` to `/thank-you?session_id={CHECKOUT_SESSION_ID}&product={product}`
- Sets `cancel_url` back to results page
- Returns the checkout URL

### 2. Edge Function: `supabase/functions/stripe-webhook/index.ts`
- Listens for `checkout.session.completed`
- Updates the `leads` table with `payment_status = 'paid'` and `product_purchased`
- For $9 report: triggers PDF generation and email delivery via the existing `generate-pdf-report` + `send-email-report` functions
- For $49 recovery: sends notification email to `support@awardpay.com.au` with lead data

### 3. New Page: `src/pages/ThankYou.tsx`
- Reads `product` and `session_id` from URL params
- For report ($9): "Your report is being generated and will be emailed to you shortly"
- For recovery ($49): "We've received your claim request. Our team will review your case and be in touch within 2 business days."
- Add route in `App.tsx`

### 4. Modified: `src/pages/NewCheck_Step3_Result.tsx` (Major rewrite)

**Remove:**
- `useSubscription` hook usage
- `AuthWall` component (full-screen auth overlay)
- `PaywallBlur` component (blur wrapper)
- `UpgradeCTA` component ($30 subscription prompt)
- All `isPremium` conditional checks -- show everything to everyone
- Auth loading state gating

**Add -- Email Capture Gate (before results):**
- New state: `emailCaptured`, `capturedEmail`, `savingEmail`
- If email not yet captured, show a simple card:
  - Heading: "Where should we send your results?"
  - Email input field
  - "Show My Results" button
  - Small text: "Free forever. No spam."
- On submit: save email + calculation data to `leads` table, set `emailCaptured = true`
- Results then display fully unblurred, no auth required

**Add -- Conversion Section (after results, only if underpaid):**
- Heading: "You May Be Owed $[amount]"
- Subheading: "Get your official underpayment report to take to your employer or Fair Work Australia"
- Card 1: "Official PDF Report -- $9"
  - Bullets: Detailed pay breakdown, Official Fair Work rates used, Ready to present to your employer, Tax deductible
  - Button: "Get My Report -- $9" (calls create-checkout edge function)
- Card 2: "Let Us Handle It For You -- $49"
  - Bullets: We lodge the claim for you, Fair Work complaint prepared, No paperwork on your end, Money back if no underpayment found
  - Button: "Start My Claim -- $49" (calls create-checkout edge function)

### 5. Modified: `src/App.tsx`
- Add route for `/thank-you` -> `ThankYou` page

### 6. Cleanup
- Remove or simplify `src/hooks/useSubscription.ts` references from results page
- The Subscription page (`/subscription`) can remain but is no longer linked from the results flow

---

## Technical Details

### Email Capture Flow
1. User completes Steps 1-2 (no auth needed, already working)
2. Step 3 loads with results in `location.state`
3. Before showing results, an email capture card appears
4. User enters email, clicks "Show My Results"
5. Edge function or direct Supabase insert saves to `leads` table (anon access via RLS policy)
6. Full results display -- no blur, no paywall

### Stripe Checkout Flow
1. User clicks "Get My Report -- $9" or "Start My Claim -- $49"
2. Frontend calls `create-checkout` edge function with `leadId` and `product`
3. Edge function creates Stripe Checkout Session and returns URL
4. User redirects to Stripe, pays
5. Stripe webhook fires, updates lead record
6. For report: triggers PDF generation + email
7. For recovery: sends notification to support
8. User lands on `/thank-you` page

### Security Considerations
- `leads` table allows anonymous inserts (intentional for conversion)
- SELECT policy is permissive (leads contain only email, no sensitive auth data)
- Stripe webhook validates signature before processing
- Edge functions handle Stripe API key via secrets

