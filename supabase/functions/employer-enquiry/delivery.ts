// Keep persistence independent of email delivery; retries reuse the stored ID.
export async function saveAndNotify(
  save: () => Promise<{ id: string; notifiedAt: string | null }>,
  send: (id: string) => Promise<{ sent: boolean }>,
  markNotified: (id: string) => Promise<void>,
): Promise<{ ok: true; notification: "sent" | "pending" }> {
  const saved = await save(); // A save failure must never produce success.
  if (saved.notifiedAt) return { ok: true, notification: "sent" };
  try {
    const result = await send(saved.id);
    if (result.sent) {
      await markNotified(saved.id);
      return { ok: true, notification: "sent" };
    }
  } catch {
    // Enquiry is already durable. Do not expose message data or email errors.
    console.warn("employer-enquiry notification pending");
  }
  return { ok: true, notification: "pending" };
}