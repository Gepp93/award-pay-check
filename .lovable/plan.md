# Plan — $30 Back-Pay Pack as a 5-use credit bundle

Scope guard: do NOT touch the calculation engine, Step 1/2, or `FullReport`. No back-pay aggregation. Each unlock = its own report + its own PDF. Reuse the existing Stripe webhook and `/report/:id` flow.

---

## 1. DB — `user_credits` (migration)

```sql
create table public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits int not null default 0,
  updated_at timestamptz not null default now()
);

grant select on public.user_credits to authenticated;
grant all on public.user_credits to service_role;

alter table public.user_credits enable row level security;

create policy "Users read own credits"
  on public.user_credits for select to authenticated
  using (user_id = auth.uid());
-- no INSERT/UPDATE/DELETE policies → only service_role (webhook + redeem-credit) writes.
```

## 2. Stripe webhook — branch by product

Edit existing `supabase/functions/stripe-webhook/index.ts`. On `checkout.session.completed`:

- Determine product from `session.amount_total` (1000 → `full_report`, 3000 → `backpay_pack`) or `session.metadata.product` if present. Prefer metadata when set; fall back to amount.
- `client_reference_id` = report id (unchanged for both flows).
- `full_report` ($10): existing behaviour — `update reports set payment_status='paid', stripe_session_id=session.id where id = client_reference_id`.
- `backpay_pack` ($30):
  1. Same paid-update on that report (the report they were viewing when they bought).
  2. Resolve `user_id` from that report row.
  3. Upsert into `user_credits`: `insert ... (user_id, 5) on conflict (user_id) do update set credits = user_credits.credits + 5, updated_at = now()`.
- Idempotency: skip if `reports.stripe_session_id` already equals this `session.id` (avoid double-crediting on Stripe webhook retries).

## 3. New edge function — `redeem-credit` (verify_jwt = true)

`supabase/functions/redeem-credit/index.ts`, plus `[functions.redeem-credit] verify_jwt = true` in `supabase/config.toml`.

Body: `{ reportId: string }`. Flow:
1. CORS + origin guard (reuse `_shared/guard.ts`).
2. `getClaims()` → `userId`.
3. Service-role client:
   - Load report; must exist, `user_id === userId`, `payment_status === 'free'`.
   - Load `user_credits.credits` for user; must be `> 0`.
   - Single transactional-ish pair: `update user_credits set credits = credits - 1 where user_id = $1 and credits > 0 returning credits`; if no row returned → 402 "no credits". Then `update reports set payment_status='paid' where id = $1 and payment_status='free'`.
4. Return `{ ok: true, remainingCredits }`.

## 4. Client — credit-aware unlock

New hook `src/hooks/useUserCredits.ts`: reads `user_credits.credits` for current user; exposes `{ credits, refetch }`. Re-fetches on auth change.

Update unlock UI in two places (Step 3 `NewCheck_Step3_Result.tsx` + `Report.tsx`):

- Show "You have **N** report credits left" line above CTAs whenever `credits > 0`.
- `handleUnlock('full_report')` behaviour:
  - If `credits > 0`: call `supabase.functions.invoke('redeem-credit', { body: { reportId } })`. On success → navigate / refetch so the unlocked `FullReport` renders. On failure → toast + fall through to Stripe.
  - Else: open `FULL_REPORT_LINK` (existing $10 Stripe link) with `client_reference_id=reportId`.
- `handleUnlock('backpay_pack')`: always opens `BACKPAY_LINK` ($30 Stripe link) with `client_reference_id=reportId`. Buying the pack also unlocks the current report (handled by webhook) and grants 5 credits for future reports.
- On Step 3 specifically: report row may not exist yet at click time. Keep the current "insert report row → navigate to `/report/:id`" path; for credit redemption, do the insert first, then call `redeem-credit` with the new id, then navigate.

Button copy:
- Primary: if `credits > 0` → "Unlock with 1 credit (N left)"; else → "Unlock full report — $10".
- Secondary: "Back-Pay Pack — 5 reports for $30 (save $20)".

Remove the TEMP "Simulate payment (dev)" button from `Report.tsx` (real Stripe path + credit redemption replaces it).

## 5. Secrets / config

- `BACKPAY_LINK` (Stripe Payment Link, $30, `client_reference_id` collected) — request via `add_secret` and expose via `VITE_BACKPAY_LINK` mirror like the existing $10 link.
- Confirm Stripe Price/amount metadata so the webhook's amount-based branch is correct; if user uses metadata on the Payment Link, prefer `session.metadata.product`.

## 6. Files

- Add: migration, `supabase/functions/redeem-credit/index.ts`, `src/hooks/useUserCredits.ts`.
- Edit: `supabase/functions/stripe-webhook/index.ts`, `supabase/config.toml` (add redeem-credit block), `src/pages/NewCheck_Step3_Result.tsx`, `src/pages/Report.tsx`, `src/components/report/LockedTeaser.tsx` (optional "credits left" prop).
- Untouched: calc engine, `FullReport.tsx`, Step 1/2, `/check`, marketing pages.

## 7. Out of scope

- Credit expiry, gifting/transfer, admin top-ups, refund handling, multi-currency.
