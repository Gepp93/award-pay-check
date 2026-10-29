import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Camera, CloudUpload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PAYSLIP_ACCEPT, readPayslip, type ParsedPayslip } from "@/lib/payslipReader";
import { Stepper } from "./Layout";
import { useV2 } from "./store";

type State = { kind: "idle" } | { kind: "reading"; name: string } | { kind: "done"; data: ParsedPayslip; demo: boolean } | { kind: "error"; message: string };

const DEMO: ParsedPayslip = { pay_period_start: "2026-06-01", pay_period_end: "2026-06-14", ordinary_hours: 76, base_hourly_rate: 32.5, award_name_or_code: "Electrical, Electronic and Communications Contracting Award 2020" };

export default function UploadPayslip() {
  const navigate = useNavigate();
  const { update } = useV2();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  const handle = async (file?: File) => {
    if (!file) return;
    abort.current?.abort();
    const c = new AbortController(); abort.current = c;
    setState({ kind: "reading", name: file.name });
    try {
      const data = await readPayslip(file, c.signal);
      if (data.unreadable) throw new Error("unreadable");
      setState({ kind: "done", data, demo: false });
    } catch (e) {
      if (c.signal.aborted) return;
      const busy = /429|unavailable/i.test(String((e as Error)?.message));
      setState({ kind: "error", message: busy
        ? "Our payslip reader is unavailable right now, so we couldn't read your file. You can answer a few questions instead."
        : "We couldn't read that file. Try a clearer photo or PDF, or answer a few questions instead." });
    }
  };

  const edit = (k: keyof ParsedPayslip, v: string) => state.kind === "done" && setState({ ...state, data: { ...state.data, [k]: k === "award_name_or_code" || k.startsWith("pay_period") ? v : Number(v) || undefined } });

  const confirm = () => {
    if (state.kind !== "done") return;
    if (!state.demo) update({ hoursPerWeek: state.data.ordinary_hours ? String(state.data.ordinary_hours) : "", hourlyRate: state.data.base_hourly_rate ? String(state.data.base_hourly_rate) : "" });
    navigate("/v2/results");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Stepper current={1} />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h1 className="text-3xl font-extrabold">Upload your payslip</h1>
          <p className="mt-2 text-ink-2">Take a photo or upload a PDF — we'll try to read it for you.</p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
            className={cn("mt-6 flex flex-col items-center rounded-lg border-2 border-dashed bg-card p-10 text-center", drag ? "border-primary bg-primary-soft" : "border-rule-strong")}>
            <CloudUpload className="h-12 w-12 text-primary" />
            <p className="mt-3 font-semibold">Drag and drop your payslip here</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => fileRef.current?.click()}><FileText /> Choose a file</Button>
              <Button variant="outline" onClick={() => camRef.current?.click()}><Camera /> Take a photo</Button>
            </div>
            <p className="mt-4 text-xs text-ink-3">PDF, JPG, PNG or HEIC (iPhone photos)</p>
            <input ref={fileRef} type="file" accept={`${PAYSLIP_ACCEPT},.heic,.heif`} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />
          </div>
          <Button variant="link" className="mt-3 px-0" onClick={() => navigate("/v2/check")}>Skip — answer questions instead</Button>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sheet" aria-live="polite">
          {state.kind === "idle" && (
            <div className="text-ink-2">
              <p className="font-bold text-foreground">What we read</p>
              <p className="mt-2 text-sm">Pay period, hours, hourly rate and award, if they're printed. You'll check and edit everything before we use it.</p>
              <Button variant="secondary" className="mt-6" onClick={() => setState({ kind: "done", data: DEMO, demo: true })}>Show example</Button>
            </div>
          )}
          {state.kind === "reading" && <p className="flex items-center gap-3 font-semibold"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Reading {state.name}…</p>}
          {state.kind === "error" && (
            <div role="alert">
              <p className="flex items-center gap-2 font-bold text-destructive"><AlertTriangle className="h-5 w-5" /> We couldn't read your payslip</p>
              <p className="mt-2 text-sm text-ink-2">{state.message}</p>
              <div className="mt-4 flex gap-3"><Button onClick={() => navigate("/v2/check")}>Answer questions</Button><Button variant="outline" onClick={() => setState({ kind: "idle" })}>Try again</Button></div>
            </div>
          )}
          {state.kind === "done" && (
            <div>
              {state.demo
                ? <p className="rounded-md bg-gold-soft px-3 py-2 text-xs font-bold">Example data — not read from a real payslip</p>
                : <p className="rounded-md bg-primary-soft px-3 py-2 text-xs font-bold text-primary">Read from your payslip — please check these details</p>}
              <div className="mt-4 grid gap-4">
                {([["pay_period_start", "Pay period start"], ["pay_period_end", "Pay period end"], ["ordinary_hours", "Ordinary hours"], ["base_hourly_rate", "Hourly rate ($)"], ["award_name_or_code", "Award"]] as const).map(([k, l]) => (
                  <label key={k} className="text-sm font-bold">{l}
                    <Input className="mt-1 h-12 text-base font-normal" value={state.data[k] ?? ""} placeholder="Not found — add it" onChange={(e) => edit(k, e.target.value)} />
                  </label>
                ))}
              </div>
              <Button className="mt-6 h-12 w-full" onClick={confirm}>Continue</Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
