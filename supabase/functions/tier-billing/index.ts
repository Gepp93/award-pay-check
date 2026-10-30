import { tierBillingHandler } from "../_shared/tier-billing-handler.ts";
Deno.serve(tierBillingHandler("live"));
