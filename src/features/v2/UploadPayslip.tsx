import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Camera, CheckCircle2, CloudUpload, FileText, Loader2, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PAYSLIP_ACCEPT, readPayslip, type ParsedPayslip } from "@/lib/payslipReader";
import { IndustryChip, Stepper } from "./Layout";
import { useV2 } from "./store";
import { editField, fieldsFromPayslip, type Field, type FieldKey } from "./payslipFields";

type State =
  | { kind: "idle" }
  | { kind: "reading"; name: string }
  | { kind: "done"; fields: Field[]; demo: boolean; unreadable: boolean; award?: string; role?: string }
  | { kind: "error"; message: string };

const DEMO: ParsedPayslip = {
  pay_period_start: "2026-06-01", pay_period_end: "2026-06-14", ordinary_hours: 76, base_hourly_rate: 32.5,
  line_items: [{ description: "Ordinary hours", hours: 76, rate: 32.5, amount: 2470, type: "ordinary" }],
};

const ERRORS: Record<string, string> = {
  reader_429: "Lots of people are checking right now, so we couldn't read your file. Wait a few minutes and try again, or answer a few questions instead.",
  reader_credits: "Our payslip reader is paused right now. You can answer a few questions instead — your industry is saved.",
  image_too_large: "That file is too large to read. Try a smaller photo or the first page of the PDF, or answer a few questions instead.",
  unreadable: "We couldn't make out a payslip in that file. Try a clearer, uncropped photo or PDF, or answer a few questions instead.",
};

const badge = (f: Field) => f.source === "payslip"
  ? <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary"><CheckCircle2 className="h-3 w-3" />From payslip</span>
  : f.source === "user"
    ? <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-foreground"><Pencil className="h-3 w-3" />Entered by you</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-foreground"><AlertTriangle className="h-3 w-3" />Missing or unclear</span>;

export default function UploadPayslip() {
  const navigate = useNavigate();
  const { update } = useV2();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [confirmed, setConfirmed] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  const handle = async (file?: File) => {
    if (!file) return;
    abort.current?.abort();
    const c = new AbortController(); abort.current = c;
    setConfirmed(false);
    setState({ kind: "reading", name: file.name });
    try {
      const data = await readPayslip(file, c.signal);
      const fields = fieldsFromPayslip(data);
      if (data.unreadable && fields.every(f => f.source === "missing")) throw new Error("unreadable");
      setState({ kind: "done", fields, demo: false, unreadable: !!data.unreadable, award: data.award_name_or_code, role: data.classification_or_role });
    } catch (e) {
      if (c.signal.aborted) return;
      const reason = String((e as Error)?.message ?? "");
      setState({ kind: "error", message: ERRORS[reason] ?? "We couldn't read that file. Try a clearer photo or PDF, or answer a few questions instead — your industry is saved." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      if (camRef.current) camRef.current.value = "";
    }
  };

  const edit = (k: FieldKey, v: string) => { if (state.kind === "done") { setConfirmed(false); setState({ ...state, fields: editField(state.fields, k, v) }); } };

  const confirm = () => {
    if (state.kind !== "done" || !confirmed) return;
    const val = (k: FieldKey) => state.fields.find(f => f.key === k)?.value ?? "";
    if (!state.demo) update({ hoursPerWeek: val("ordinary_hours"), hourlyRate: val("base_hourly_rate"), payslip: state.fields, result: null });
    navigate(state.demo ? "/v2/results" : "/v2/questions");
  };

  const missing = state.kind === "done" ? state.fields.filter(f => f.source === "missing").length : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <Stepper current={1} />
      <IndustryChip />
      <div className="grid gap-8 lg:grid-cols-[5fr_7fr]">
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
            <input ref={fileRef} type="file" aria-label="Choose a payslip file" accept={`${PAYSLIP_ACCEPT},.heic,.heif`} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />
            <input ref={camRef} type="file" aria-label="Take a payslip photo" accept="image/*" capture="environment" className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-ink-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Your file is read once and never stored. Only the first page of a PDF is read.</p>
          <Button variant="link" className="mt-1 px-0" onClick={() => navigate("/v2/questions")}>Skip — answer questions instead</Button>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sheet" aria-live="polite">
          {state.kind === "idle" && (
            <div className="text-ink-2">
              <p className="font-bold text-foreground">What we read</p>
              <p className="mt-2 text-sm">Employer, pay period, hours, rates, overtime, weekend and public holiday pay, allowances and gross pay — only what's printed. You'll check and edit everything before we use it.</p>
              <Button variant="secondary" className="mt-6" onClick={() => setState({ kind: "done", fields: fieldsFromPayslip(DEMO), demo: true, unreadable: false })}>Show example</Button>
            </div>
          )}
          {state.kind === "reading" && (
            <div className="py-6" role="status">
              <p className="flex items-center gap-3 font-semibold"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Reading {state.name}…</p>
              <p className="mt-2 text-sm text-ink-2">This usually takes 10–30 seconds. Keep this page open.</p>
              <Button variant="link" className="mt-2 px-0" onClick={() => { abort.current?.abort(); setState({ kind: "idle" }); }}>Cancel</Button>
            </div>
          )}
          {state.kind === "error" && (
            <div role="alert">
              <p className="flex items-center gap-2 font-bold text-destructive"><AlertTriangle className="h-5 w-5" /> We couldn't read your payslip</p>
              <p className="mt-2 text-sm text-ink-2">{state.message}</p>
              <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => navigate("/v2/questions")}>Answer questions</Button><Button variant="outline" onClick={() => setState({ kind: "idle" })}>Try again</Button></div>
            </div>
          )}
          {state.kind === "done" && (
            <div>
              {state.demo
                ? <p className="rounded-md bg-gold-soft px-3 py-2 text-xs font-bold">Example data — not read from a real payslip</p>
                : <p className="rounded-md bg-primary-soft px-3 py-2 text-xs font-bold text-primary">Read from your payslip — please check every detail</p>}
              {state.unreadable && <p className="mt-2 rounded-md bg-gold-soft px-3 py-2 text-xs font-bold">Parts of this file were hard to read. Double-check the values below.</p>}
              {missing > 0 && <p className="mt-2 text-sm text-ink-2">{missing} {missing === 1 ? "detail wasn't" : "details weren't"} found. Add {missing === 1 ? "it" : "them"} if you know, or leave blank.</p>}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {state.fields.map(f => (
                  <label key={f.key} className={cn("text-sm font-bold", f.key === "allowances" || f.key === "employer_name" ? "sm:col-span-2" : "")}>
                    <span className="flex flex-wrap items-center justify-between gap-2">{f.label}{badge(f)}</span>
                    <Input
                      className={cn("mt-1 h-12 text-base font-normal", f.source === "missing" && "border-gold bg-gold-soft/40")}
                      type={f.kind === "date" ? "date" : "text"} inputMode={f.kind === "money" || f.kind === "number" ? "decimal" : undefined}
                      value={f.value} placeholder="Not found — add it" onChange={(e) => edit(f.key, e.target.value)} />
                  </label>
                ))}
              </div>
              {(state.award || state.role) && (
                <p className="mt-4 text-xs text-ink-3">Printed on payslip: {[state.role, state.award].filter(Boolean).join(" · ")}. We won't pick your award from this — you'll confirm it in the questions.</p>
              )}
              <label className="mt-6 flex items-start gap-3 text-sm">
                <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
                <span>These details match my payslip (or I've corrected them).</span>
              </label>
              <Button className="mt-4 h-12 w-full" disabled={!confirmed} onClick={confirm}>Confirm and continue</Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
