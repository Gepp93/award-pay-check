import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ApNav } from "@/components/ApNav";
import SEO from "@/components/SEO";
import { Loader2, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/wizard/ProgressIndicator";
import { takePreloadedPayslip } from "@/lib/pendingPayslip";

// Tiny scroll-reveal hook (same pattern used on Why / How / Pricing).
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      el.style.transition = "opacity .6s ease, transform .6s ease";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

type Status = "idle" | "preparing" | "reading" | "error";

const readAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

async function downscaleJpeg(dataUrl: string, maxEdge = 1600, quality = 0.85): Promise<string> {
  const img = await loadImage(dataUrl);
  const longest = Math.max(img.width, img.height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

async function pdfToJpegDataUrl(file: File): Promise<string> {
  const pdfjsLib: any = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function heicToJpegDataUrl(file: File): Promise<string> {
  const heic2any = (await import("heic2any")).default as any;
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const blob = Array.isArray(out) ? out[0] : out;
  return readAsDataUrl(blob as Blob);
}

async function fileToJpegDataUrl(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  let raw: string;
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    raw = await pdfToJpegDataUrl(file);
  } else if (type.includes("heic") || type.includes("heif") || name.endsWith(".heic") || name.endsWith(".heif")) {
    raw = await heicToJpegDataUrl(file);
  } else {
    raw = await readAsDataUrl(file);
  }
  return downscaleJpeg(raw, 1600, 0.85);
}

export default function CheckUpload() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  useReveal();

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setErrorMsg("");
    setStatus("preparing");
    let image: string;
    try {
      image = await fileToJpegDataUrl(file);
    } catch (err) {
      console.error("file conversion failed", err);
      setStatus("error");
      setErrorMsg(
        "We couldn't read that file — try a JPG or PNG, or enter your details manually."
      );
      return;
    }
    setStatus("reading");
    try {
      const { data, error } = await supabase.functions.invoke("ai-parse-payslip", {
        body: { image },
      });
      if (error) throw error;
      const payslip = data?.payslip;
      if (!data?.success || !payslip || payslip.unreadable === true) {
        setStatus("error");
        setErrorMsg(
          "We couldn't read that clearly — try a sharper photo, or enter your details manually."
        );
        return;
      }
      navigate("/new-check-step-1", { state: { parsedPayslip: payslip } });
    } catch (err) {
      console.error("ai-parse-payslip failed", err);
      setStatus("error");
      setErrorMsg(
        "We couldn't read that clearly — try a sharper photo, or enter your details manually."
      );
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  useEffect(() => {
    const file = takePreloadedPayslip();
    if (file) void handleFile(file);
  }, []);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const goManual = () => navigate("/new-check-step-1");

  return (
    <div>
      <SEO
        title="Check your payslip — free AI payslip checker | AwardPay"
        description="Snap a photo or upload your payslip — AwardPay reads it and checks it against official Fair Work rates. Free, no account."
        path="/check"
      />
      <ApNav />

      <main className="checker-page checker-form">
        <ProgressIndicator currentStep={1} />
        <header className="checker-heading">
          <div className="ap-eyebrow">Free pay check</div>
          <h1>Check your payslip</h1>
          <p>Snap a photo or upload your payslip — we'll read it and check it against official Fair Work rates.</p>
        </header>
        <div>
          <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={openPicker}
            role="button" tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
            className="checker-upload">
            <input ref={inputRef} type="file" accept=".pdf,.heic,.heif,image/*" onChange={onChange}
              className="hidden" disabled={status === "reading" || status === "preparing"} />
            {status === "reading" || status === "preparing" ? (
              <div className="checker-reading" role="status">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Reading your payslip…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Camera className="h-10 w-10 text-primary" />
                <div className="text-base font-semibold">Take a photo or upload your payslip</div>
                <div className="text-[13px] text-muted-foreground">PDF, JPG, PNG or HEIC.</div>
                <Button type="button" onClick={(e) => { e.stopPropagation(); openPicker(); }}>Choose payslip</Button>
              </div>
            )}
          </div>

          {status === "error" && (
            <div
              role="alert"
              style={{
                marginTop: 16,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                borderRadius: 6,
                padding: "16px 18px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle className="h-5 w-5" style={{ color: "hsl(var(--foreground))", flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{errorMsg}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <Button
                    
                    onClick={() => {
                      setStatus("idle");
                      setErrorMsg("");
                      openPicker();
                    }}
                  >
                    Try a sharper photo
                  </Button>
                  <Button variant="link" onClick={goManual} style={{ cursor: "pointer" }}>
                    Enter manually
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "hsl(var(--muted-foreground))",
              marginTop: 18,
            }}
          >
            Your payslip is read, then discarded. Free. No account needed.
          </p>

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <a
              onClick={goManual}
              style={{
                cursor: "pointer",
                color: "hsl(var(--primary))",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              No payslip handy? Enter your details manually
            </a>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid hsl(var(--border))", padding: "24px 0", textAlign: "center", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
        AwardPay is an interpretation tool, not legal advice.
      </footer>
    </div>
  );
}