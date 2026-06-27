# Phase 2 / Step A — Accounts, gated report, persistence (no Stripe yet)

Scope guardrails: do NOT touch the calculation engine, `/check` upload, or Step 1/2 logic. The `FullReport` component (on-screen report + client-side PDF) stays as-is and is reused on the new `/report/:id` page.

---

## 1. Auth wiring (Supabase, existing `/auth` page)

- Verify the existing `src/pages/Auth.tsx` supports email/password sign up + sign in + sign out and uses `emailRedirectTo: window.location.origin`. Patch only if a flow is missing — do not redesign the page.
- Support "return where you came from":
  - When Step 3 sends an unauthenticated user to auth, navigate with `state: { returnTo: '/new-check-step-3', returnState: location.state, pendingProduct: 'full_report' | 'backpay_pack' }`.
  - After successful sign-in/sign-up, `Auth.tsx` reads `location.state.returnTo` and `navigate(returnTo, { state: returnState })` so Step 3's `result`/`shiftDetails` survive.
- Add `src/hooks/useAuthUser.ts`: tiny hook returning `{ user, loading }`. Subscribes to `supabase.auth.onAuthStateChange` and calls `getUser()` on mount. Used by Step 3 and the new Report page. No global context needed.

## 2. Database — `reports` table (migration)

```sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  result jsonb not null,
  inputs jsonb not null,
  owed_amount numeric not null default 0,
  product text not null check (product in ('full_report','backpay_pack')),
  payment_status text not null default 'free' check (payment_status in ('free','paid')),
  stripe_session_id text
);

grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;

alter table public.reports enable row level security;

create policy "Owners read own reports"
  on public.reports for select to authenticated
  using (user_id = auth.uid());

create policy "Owners insert own reports"
  on public.reports for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owners update own reports"
  on public.reports for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

No anon access. No client DELETE. The future Stripe webhook will flip `payment_status` using the service role — no client policy needed for that.

## 3. Step 3 becomes the FREE TEASER (`NewCheck_Step3_Result.tsx`)

- Keep the existing owed/unsure headline block exactly as-is.
- REMOVE the unlocked `<FullReport />` render and the TEMP unlocked CTAs.
- Render a new `<LockedTeaser />` block below the headline showing only:
  - Count: "We found **N** potential allowances and entitlements you may be missing."
  - 2–3 category names pulled from `result.potentialAllowances` (e.g. "Meal, Tool, First Aid"). No `$` amounts, no `reason` text, no per-item rows.
  - One line: "Unlock the full report to see each one, the exact amounts, and how to claim it."
- CTAs (replace existing): primary `Unlock full report — $10` (product `full_report`), secondary `Check up to 5 payslips — $30` (product `backpay_pack`).
- Click handler `handleUnlock(product)`:
  1. If `!user` → `navigate('/auth', { state: { returnTo: '/new-check-step-3', returnState: location.state, pendingProduct: product } })` and stop.
  2. If signed in → `supabase.from('reports').insert({ user_id, result, inputs, owed_amount, product, payment_status: 'free' }).select('id').single()` then `navigate('/report/' + id)`.
  3. `inputs` payload = `{ shiftDetails, advancedPayslip }` (everything `FullReport` already needs).
  4. `owed_amount` = `isUnsureMode ? overallMaxUnderpayment : underpayment`.
- Auto-resume: on mount, if `user` is present AND `location.state.pendingProduct` is set (user just came back from `/auth`), call `handleUnlock(pendingProduct)` once.
- Delete the dead `LockedBreakdown` component left over from the previous turn.

## 4. New page `/report/:id` (`src/pages/Report.tsx` + route)

- Add route in `src/App.tsx`: `<Route path="/report/:id" element={<Report />} />`.
- Behaviour:
  - `useAuthUser()`. While loading → spinner. If no user → redirect to `/auth` with `returnTo: '/report/' + id`.
  - Fetch `supabase.from('reports').select('*').eq('id', id).maybeSingle()`. RLS ensures only the owner gets a row.
  - Not found / not owner → friendly "Report not available" card with a button back to `/new-check-step-1`.
  - If `payment_status === 'paid'` → render `<FullReport result={row.result} shiftDetails={row.inputs.shiftDetails} advancedPayslip={row.inputs.advancedPayslip} />` (its existing PDF button keeps working unchanged).
  - Else → render the same headline + `<LockedTeaser />` used on Step 3, plus the two unlock buttons. Buttons currently do nothing real (Stripe is next step) — wire them to a stub `handleStartCheckout(product)` that just `console.log`s for now.
  - TEMP dev-only block, clearly commented `// TEMP: remove when Stripe is live`: a small "Simulate payment (dev)" button that runs `supabase.from('reports').update({ payment_status: 'paid' }).eq('id', id)` then refetches, so we can verify the unlocked view.

## 5. Files touched

- Add: `src/hooks/useAuthUser.ts`, `src/pages/Report.tsx`, `src/components/report/LockedTeaser.tsx`, one Supabase migration.
- Edit: `src/App.tsx` (route), `src/pages/NewCheck_Step3_Result.tsx` (teaser + CTAs + auto-resume; drop dead `LockedBreakdown`), `src/pages/Auth.tsx` (honour `returnTo`/`returnState` if not already).
- Untouched: `FullReport.tsx`, calculator engine, edge functions, Step 1, Step 2, `/check`, marketing pages.

## 6. Out of scope (next step)

- Stripe Checkout session creation, webhook flipping `payment_status` to `paid`, removal of the "Simulate payment (dev)" button, `/thank-you` redirect handling for the new product flow.
