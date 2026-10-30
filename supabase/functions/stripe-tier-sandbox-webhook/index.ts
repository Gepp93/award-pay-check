import { tierWebhookHandler } from "../_shared/tier-webhook-handler.ts";
Deno.serve(tierWebhookHandler("sandbox"));