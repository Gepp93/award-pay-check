import { useRef, useState } from "react";
import { ArrowRight, Briefcase, ClipboardCheck, FileText, Mail, ShieldCheck, UserPlus, Users } from "lucide-react";
import { z } from "zod";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

const SERVICES = [
  { icon: UserPlus, title: "New employee award and classification research", body: "Hiring someone new? We research which award or agreement may apply, the likely classification, and the minimum rates, penalties and allowances to consider." },
  { icon: Users, title: "Existing employee pay and entitlement reviews", body: "We review how current employees are paid against the award considerations that may apply to their role, hours and arrangements." },
  { icon: ShieldCheck, title: "Payroll compliance risk reviews", body: "A scoped look at your pay setup to highlight areas of potential risk, such as overtime, weekend penalties or missed allowances." },
];
const RECEIVE = ["The research we performed", "Applicable award or agreement considerations", "Classifications", "Minimum rates", "Penalties and overtime", "Allowances", "Findings", "Limitations", "Recommended next steps"];
const STEPS = ["Enquire", "We review your requirements", "Receive a quote", "Research and written findings"];

const schema = z.object({
  businessName: z.string().trim().min(1, "Enter your business name").max(150),
  contactName: z.string().trim().min(1, "Enter your name").max(100),
  workEmail: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(30).regex(/^[0-9+()\s-]*$/, "Numbers only"),
  industry: z.string().trim().min(1, "Enter your industry").max(80),
  employeeCount: z.string().min(1, "Choose a range"),
  service: z.string().min(1, "Choose a service"),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
  consent: z.literal(true, { errorMap: () => ({ message: "Please agree to be contacted" }) }),
});
type Form = { businessName: string; contactName: string; workEmail: string; phone: string; industry: string; employeeCount: string; service: string; message: string; consent: boolean };
const EMPTY: Form = { businessName: "", contactName: "", workEmail: "", phone: "", industry: "", employeeCount: "", service: "", message: "", consent: false };
const selectCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function EnquiryForm() {
  const [f, setF] = useState<Form>(EMPTY);
  const [hp, setHp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [failure, setFailure] = useState("");
  const started = useRef(Date.now());
  const submissionId = useRef(crypto.randomUUID());
  const set = (k: keyof Form) => (v: any) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure("");
    const p = schema.safeParse(f);
    if (!p.success) {
      const errs: Record<string, string> = {};
      p.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      setErrors(errs); return;
    }
    setErrors({}); setState("sending");
    const { data, error } = await supabase.functions.invoke("employer-enquiry", {
      body: { ...p.data, website: hp, elapsedMs: Date.now() - started.current, submissionId: submissionId.current },
    });
    if (error || !data?.ok) {
      let msg = "We couldn't send your enquiry. Please try again, or email support@awardpay.com.au.";
      try { const b = await (error as any)?.context?.json?.(); if (b?.error) msg = b.error; } catch { /* keep default */ }
      setFailure(msg); setState("idle"); return;
    }
    setState("done");
  };

  if (state === "done") return (
    <div role="status" className="rounded-lg border border-primary bg-primary-soft p-6">
      <p className="text-lg font-bold">Thanks — your enquiry has been received.</p>
      <p className="mt-2 text-ink-2">We'll review your requirements and reply by email. If it's urgent, contact <a className="font-semibold text-primary underline" href="mailto:support@awardpay.com.au">support@awardpay.com.au</a>.</p>
    </div>
  );

  const field = (k: keyof Form, label: string, el: React.ReactNode) => (
    <div>
      <Label htmlFor={k}>{label}</Label>
      <div className="mt-1.5">{el}</div>
      {errors[k] && <p id={`${k}-err`} className="mt-1 text-sm text-destructive">{errors[k]}</p>}
    </div>
  );
  const aria = (k: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-err` : undefined });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-soft md:grid-cols-2 md:p-8">
      {field("businessName", "Business name", <Input id="businessName" maxLength={150} autoComplete="organization" value={f.businessName} onChange={(e) => set("businessName")(e.target.value)} {...aria("businessName")} />)}
      {field("contactName", "Contact name", <Input id="contactName" maxLength={100} autoComplete="name" value={f.contactName} onChange={(e) => set("contactName")(e.target.value)} {...aria("contactName")} />)}
      {field("workEmail", "Work email", <Input id="workEmail" type="email" maxLength={255} autoComplete="email" value={f.workEmail} onChange={(e) => set("workEmail")(e.target.value)} {...aria("workEmail")} />)}
      {field("phone", "Phone (optional)", <Input id="phone" type="tel" maxLength={30} autoComplete="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} {...aria("phone")} />)}
      {field("industry", "Industry", <Input id="industry" maxLength={80} placeholder="e.g. Hospitality" value={f.industry} onChange={(e) => set("industry")(e.target.value)} {...aria("industry")} />)}
      {field("employeeCount", "Approximate employee count",
        <select id="employeeCount" className={selectCls} value={f.employeeCount} onChange={(e) => set("employeeCount")(e.target.value)} {...aria("employeeCount")}>
          <option value="">Choose…</option><option value="1">1</option><option value="2-9">2–9</option><option value="10-49">10–49</option><option value="50-199">50–199</option><option value="200+">200+</option>
        </select>)}
      <div className="md:col-span-2">{field("service", "Service required",
        <select id="service" className={selectCls} value={f.service} onChange={(e) => set("service")(e.target.value)} {...aria("service")}>
          <option value="">Choose…</option>
          <option value="new-employee">New employee award and classification research</option>
          <option value="existing-review">Existing employee pay and entitlement review</option>
          <option value="compliance-risk">Payroll compliance risk review</option>
          <option value="not-sure">Not sure yet</option>
        </select>)}</div>
      <div className="md:col-span-2">{field("message", "Message",
        <Textarea id="message" rows={5} maxLength={2000} placeholder="Briefly describe the roles and what you'd like reviewed." value={f.message} onChange={(e) => set("message")(e.target.value)} {...aria("message")} />)}
        <p className="mt-1 text-xs text-ink-3">Please don't include payslips, tax file numbers or employees' personal details. We'll ask for what we need once the scope is agreed.</p>
      </div>
      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} name="website" /></label>
      </div>
      <div className="md:col-span-2">
        <div className="flex items-start gap-3">
          <Checkbox id="consent" checked={f.consent} onCheckedChange={(v) => set("consent")(v === true)} {...aria("consent")} className="mt-0.5" />
          <Label htmlFor="consent" className="font-normal leading-snug">I agree to AwardPay contacting me about this enquiry. We use your details only to respond and never sell them.</Label>
        </div>
        {errors.consent && <p id="consent-err" className="mt-1 text-sm text-destructive">{errors.consent}</p>}
      </div>
      {failure && <p role="alert" className="md:col-span-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{failure}</p>}
      <div className="md:col-span-2">
        <Button type="submit" variant="gold" size="lg" disabled={state === "sending"} className="w-full md:w-auto">
          {state === "sending" ? "Sending…" : <>Request an Employer Review <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}

export default function Employers() {
  return (
    <main>
      <SEO title="AwardPay for Employers — Award and pay research for Australian businesses"
        description="Scoped, human-reviewed award research for Australian employers: classifications, minimum rates, penalties, overtime and allowances, with written findings."
        path="/employers" />
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-20">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary"><Briefcase className="h-3.5 w-3.5" /> AwardPay for Employers</span>
        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl">Pay your people right. Know where you stand.</h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-2">From hiring your first employee to reviewing your payroll, AwardPay helps Australian businesses understand the awards, classifications, pay rates and entitlements that may apply.</p>
        <p className="mt-4 text-lg font-bold text-primary">We do the award research, so you don't have to.</p>
        <Button asChild variant="gold" size="lg" className="mt-8"><a href="#enquire">Request an Employer Review <ArrowRight className="h-4 w-4" /></a></Button>
      </section>

      <section className="bg-card py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-3xl font-extrabold">How we can help</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-border bg-background p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-ink-2">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-8 md:py-16">
        <div>
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="mt-3 text-3xl font-extrabold">What you receive</h2>
          <p className="mt-3 text-ink-2">A written report covering, as relevant to the agreed scope:</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {RECEIVE.map((r) => <li key={r} className="flex items-start gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{r}</li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold">How it works</h2>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest font-bold text-forest-foreground">{i + 1}</span>
                <span className="font-semibold">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-md bg-gold-soft p-4 text-sm">Each review is scoped and human-reviewed. We confirm whether we can help before quoting. Our findings are research and general guidance, not legal advice, and are not a guarantee or certification of compliance.</p>
        </div>
      </section>

      <section id="enquire" className="scroll-mt-20 bg-card py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h2 className="text-3xl font-extrabold">Request an Employer Review</h2>
          <p className="mt-2 text-ink-2">Tell us what you need. There's no obligation — we'll reply with questions or a quote.</p>
          <div className="mt-8"><EnquiryForm /></div>
          <p className="mt-6 flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-primary" /> Questions first? Email <a className="font-semibold text-primary underline" href="mailto:support@awardpay.com.au">support@awardpay.com.au</a></p>
        </div>
      </section>
    </main>
  );
}
