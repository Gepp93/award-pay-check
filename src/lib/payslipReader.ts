import { supabase } from "@/integrations/supabase/client";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

export interface ParsedPayslip {
  classification_or_role?: string;
  employment_type?: "Full-time" | "Part-time" | "Casual";
  pay_frequency?: "weekly" | "fortnightly" | "monthly";
  award_name_or_code?: string;
  employee_age?: number;
  pay_period_start?: string;
  pay_period_end?: string;
  ordinary_hours?: number;
  base_hourly_rate?: number;
  gross_pay?: number;
  total_paid?: number;
  line_items?: { description: string; hours?: number; rate?: number; amount?: number; type?: string }[];
  unreadable?: boolean;
}

export const PAYSLIP_ACCEPT = "image/*,application/pdf";
const MAX_IMAGE_LENGTH = 4_000_000;

const readBlob = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("conversion"));
  reader.onerror = () => reject(new Error("conversion"));
  reader.readAsDataURL(blob);
});

const imageFrom = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("image_decode"));
  image.src = src;
});

async function jpeg(file: File): Promise<string> {
  let raw: string;
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
    try {
      const page = await document.getPage(1);
      const first = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 1600 / Math.max(first.width, first.height)) });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas_unavailable");
      await page.render({ canvasContext: context, viewport }).promise;
      raw = canvas.toDataURL("image/jpeg", 0.8);
    } finally { await document.destroy(); }
  } else {
    raw = await readBlob(file);
    try { await imageFrom(raw); }
    catch {
      if (!/hei[cf]/i.test(file.type + file.name)) throw new Error("image_decode");
      const convert = (await import("heic2any")).default;
      const converted = await convert({ blob: file, toType: "image/jpeg", quality: 0.8 });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      if (!blob) throw new Error("heic_conversion");
      raw = await readBlob(blob);
    }
  }
  const image = await imageFrom(raw);
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas_unavailable");
  context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const payload = canvas.toDataURL("image/jpeg", 0.8);
  canvas.width = 0; canvas.height = 0;
  if (payload.length > MAX_IMAGE_LENGTH) throw new Error("image_too_large");
  return payload;
}

/** One bounded read plus one retry; image data never enters storage or diagnostics. */
export async function readPayslip(file: File, signal: AbortSignal): Promise<ParsedPayslip> {
  let image: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal.aborted) throw new Error("cancelled");
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal.addEventListener("abort", cancel, { once: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error("timeout")); }, 25_000);
      });
      const operation = async () => {
        image ??= await jpeg(file);
        if (controller.signal.aborted) throw new Error("timeout");
        const { data, error } = await supabase.functions.invoke("ai-parse-payslip", {
          body: { image }, signal: controller.signal,
        });
        if (error) {
          const status = "context" in error && error.context instanceof Response ? error.context.status : 0;
          throw new Error(status ? `reader_${status}` : "reader_network");
        }
        if (!data?.payslip) throw new Error("no_fields");
        return data.payslip as ParsedPayslip;
      };
      return await Promise.race([operation(), timeout]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "reader_failed";
      console.warn("Payslip reader", { reason: /^[a-z_0-9]+$/.test(reason) ? reason : "reader_failed", attempt: attempt + 1 });
      if (attempt === 1 || signal.aborted) throw new Error(reason);
    } finally {
      if (timer) clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
    }
  }
  throw new Error("reader_failed");
}