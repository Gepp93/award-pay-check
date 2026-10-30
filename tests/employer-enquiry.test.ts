import { test } from "node:test";
import assert from "node:assert/strict";
import { saveAndNotify } from "../supabase/functions/employer-enquiry/delivery.ts";

test("notification is sent only after enquiry storage succeeds", async () => {
  let sends = 0;
  await assert.rejects(saveAndNotify(async () => { throw new Error("storage failed"); }, async () => { sends++; return { sent: true }; }, async () => {}));
  assert.equal(sends, 0);
});
test("email failure preserves successful saved-enquiry response", async () => {
  let saved = false;
  const result = await saveAndNotify(async () => { saved = true; return { id: "enquiry-1", notifiedAt: null }; }, async () => { throw new Error("delivery failed"); }, async () => { throw new Error("must not mark"); });
  assert.equal(saved, true);
  assert.deepEqual(result, { ok: true, notification: "pending" });
});
test("retry of notified enquiry does not send another notification", async () => {
  let sends = 0;
  let notifiedAt: string | null = null;
  const save = async () => ({ id: "enquiry-1", notifiedAt });
  const send = async (id: string) => { assert.equal(id, "enquiry-1"); sends++; return { sent: true }; };
  const mark = async () => { notifiedAt = "2026-10-30T09:00:00Z"; };
  await saveAndNotify(save, send, mark);
  await saveAndNotify(save, send, mark);
  assert.equal(sends, 1);
});
test("suppressed notification never marks saved enquiry as sent", async () => {
  let marked = false;
  const result = await saveAndNotify(async () => ({ id: "enquiry-1", notifiedAt: null }), async () => ({ sent: false }), async () => { marked = true; });
  assert.equal(marked, false);
  assert.equal(result.ok, true);
});