import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ApNav } from "@/components/ApNav";
import SEO from "@/components/SEO";
import { Loader2, Camera, AlertCircle } from "lucide-react";

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

      <section className="ap-wrap ap-section" style={{ paddingTop: 48, paddingBottom: 28 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }} data-reveal>
          <div className="ap-eyebrow" style={{ justifyContent: "center" }}>
            Free pay check
          </div>
          <h1 className="ap-h1" style={{ marginBottom: 18 }}>
            Check your <span className="ap-hl">payslip</span>
          </h1>
          <p className="ap-lede" style={{ margin: "0 auto 12px" }}>
            Snap a photo or upload your payslip — we'll read it and check it against
            official Fair Work rates.
          </p>
        </div>
      </section>

      <section className="ap-wrap" style={{ paddingBottom: 80 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }} data-reveal>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={openPicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
            style={{
              border: "1.5px dashed hsl(var(--border))",
              borderRadius: 16,
              background: "hsl(var(--card))",
              padding: "44px 24px",
              textAlign: "center",
              cursor: status === "reading" ? "default" : "pointer",
              transition: "border-color .2s ease, background .2s ease",
              opacity: status === "reading" ? 0.85 : 1,
            }}
            onMouseEnter={(e) => {
              if (status !== "reading")
                e.currentTarget.style.borderColor = "hsl(var(--primary))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--border))";
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.heic,.heif,image/*"
              capture="environment"
              onChange={onChange}
              style={{ display: "none" }}
              disabled={status === "reading" || status === "preparing"}
            />

            {status === "reading" || status === "preparing" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(var(--primary))" }} />
                <div style={{ fontWeight: 600, fontSize: 17 }}>
                  {status === "preparing" ? "Preparing your file…" : "Reading your payslip…"}
                </div>
                <div style={{ color: "hsl(150 6% 40%)", fontSize: 14 }}>
                  This usually takes a few seconds.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "hsl(var(--primary-soft))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "hsl(var(--primary))",
                  }}
                >
                  <Camera className="h-6 w-6" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Tap to take a photo or upload</div>
                <div style={{ color: "hsl(150 6% 40%)", fontSize: 14, maxWidth: 360 }}>
                  PDF, JPG, PNG or HEIC.
                </div>
                <button
                  type="button"
                  className="ap-btn ap-btn-gold"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPicker();
                  }}
                  style={{ marginTop: 6 }}
                >
                  Choose payslip
                </button>
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
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle className="h-5 w-5" style={{ color: "hsl(var(--gold))", flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{errorMsg}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <button
                    className="ap-btn ap-btn-gold"
                    onClick={() => {
                      setStatus("idle");
                      setErrorMsg("");
                      openPicker();
                    }}
                  >
                    Try a sharper photo
                  </button>
                  <button className="ap-ghost" onClick={goManual} style={{ cursor: "pointer" }}>
                    Enter manually
                  </button>
                </div>
              </div>
            </div>
          )}

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "hsl(150 6% 42%)",
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
      </section>

      <footer style={{ borderTop: "1px solid hsl(var(--border))", padding: "24px 0", textAlign: "center", fontSize: 13, color: "hsl(150 6% 42%)" }}>
        AwardPay is an interpretation tool, not legal advice.
      </footer>
    </div>
  );
}