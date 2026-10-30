# AwardPay For Employers and enterprise enquiries

## Stop and preserve payment work
- Stop all payment testing and requests for Stripe test credentials.
- Preserve completed security changes and partially prepared test infrastructure without configuring, removing or extending it.
- Do not change Stripe settings, the legacy webhook, account permissions, calculations or customer purchases.
- Do not initiate payments or publish anything.
- When implementation is approved, update the roadmap to mark payment work paused at the owner's request and add the Employers page task. Only this plan is edited while approval is pending.

## Employers page
- Add **AwardPay For Employers** at `/for-employers`, using the existing AwardPay 2.0 header, footer, colours and typography.
- Use relevant workplace imagery and clear employer-focused content about discussing payroll-checking needs and supported award coverage.
- Explain limitations honestly: no claims of guaranteed compliance, enterprise calculators, bulk processing, integrations or account-management features that have not been delivered.
- Add a **For employers** navigation link on desktop and mobile, plus a footer link.

## Enterprise pricing enquiry
- Show **Enterprise pricing — enquire**, not an invented price or another Stripe product.
- Collect name, work email, organisation, employee count, industry and a short description of requirements.
- Initially use a clearly labelled **Open enquiry email** action to prepare an email to the existing `support@awardpay.com.au` address. This avoids a new data store or automatic emails and never falsely reports an enquiry as submitted.
- Keep enterprise enquiries separate from consumer offers and checkout.

## Technical details
- Add a focused Employers page within `src/features/v2` and register it in the public `V2Layout` route group in `src/App.tsx`.
- Reuse existing shared buttons and semantic styling; add page-specific SEO metadata through the existing SEO component.
- Validate enquiry fields and safely encode the email subject/body. Do not request payslips, payroll records or payment details.
- Keep every Engine v2 route and function admin-only. Do not touch billing handlers or payment tests.

## Approval boundaries
- Plan approval authorizes only Employers-page implementation in preview, not publication or payment work.
- Do not run additional tests unless separately approved; report that restriction honestly in the completion summary.
- Preserve the current payment work as unverified where appropriate; do not describe it as launch-ready.
