import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Check, ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ApNav } from "@/components/ApNav";
import SEO from "@/components/SEO";
import { AllowancesSection } from "@/components/wizard/AllowancesSection";
import Result from "@/pages/NewCheck_Step3_Result";
import { supabase } from "@/integrations/supabase/client";
import { takePreloadedPayslip } from "@/lib/pendingPayslip";
import { readPayslip, PAYSLIP_ACCEPT, type ParsedPayslip } from "@/lib/payslipReader";
import { calculateAnswers } from "./calculate";
import { applyPayslip, dateOffset, defaults, INDUSTRIES, JOBS, SAVE_KEY, shiftHours, matchAwards, industryAwards, typicalShifts, type Answers, type Award, type Classification, type Step } from "./model";

const TITLES: Partial<Record<Step, [string, string]>> = {
  start: ["Let's check your pay", "Takes about 60 seconds. Official Fair Work rates."],
  job: ["What do you do?", "Choose the job that best describes your work."],
  industry: ["Which industry do you work in?", "This helps narrow down your award."],
  award: ["Confirm your award", "An award sets the minimum pay and conditions for your job."],
  employment: ["How are you employed?", "Your employment type affects loading and entitlements."],
  level: ["What's your level?", "Not sure? We'll check across the available levels."],
  age: ["Are you under 21?", "This award includes junior classifications."],
  pay: ["What were you paid?", "Use gross pay before tax. Your hourly rate or total is enough."],
  hours: ["When did you work?", "Choose your days, then confirm or adjust the shifts."],
  allowances: ["Did any of these apply?", "Nice — that's the hard part done. Just one optional check."],
  review: ["Ready to check your pay?", "Everything in one place. Change anything that doesn't look right."],
};
const CONDITION_ROWS = [
  ["droveOwnCar", "Used my own car for work"], ["usedOwnTools", "Supplied my own tools"], ["isFirstAider", "Performed first aid duties"],
  ["isLeadingHand", "Supervised other employees"], ["woreUniform", "Washed a required uniform"], ["workedNights", "Worked nights"],
  ["workedAtHeight", "Worked at height"], ["workedInConfinedSpace", "Worked in a confined space"], ["workedUnderground", "Worked underground"],
  ["workedInDirtyConditions", "Worked in dirty conditions"], ["workedInExtremeWeather", "Worked in extreme weather"],
  ["workedInColdRoom", "Worked in a cold room"], ["wasOnCall", "Was on call"], ["wasCalledBack", "Was called back to work"],
  ["workedSplitShift", "Worked a split shift"], ["holdsSpecialLicence", "Used a required special licence"],
  ["transportedDangerousGoods", "Transported dangerous goods"], ["workedRemoteSite", "Worked at a remote site"],
  ["stayedAwayFromHome", "Stayed away from home for work"], ["operatedForklift", "Operated a forklift"], ["holdsQualification", "Used a required qualification"],
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRESETS = [["Morning 6–2", "06:00", "14:00"], ["Day 9–5", "09:00", "17:00"], ["Evening 4–11", "16:00", "23:00"], ["Night 10–6", "22:00", "06:00"]];
const VALID_STEPS = Object.keys(TITLES).concat(["loading", "result"]);

export default function GuidedCheck() {
  const location = useLocation(); const navigate = useNavigate();
  const [a, setA] = useState<Answers>(defaults);
  const [awards, setAwards] = useState<Award[]>([]); const [classes, setClasses] = useState<Classification[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(true); const [loadingClasses, setLoadingClasses] = useState(false);
  const [fetchError, setFetchError] = useState(""); const [error, setError] = useState("");
  const [search, setSearch] = useState(""); const [allAwards, setAllAwards] = useState(false); const [junior, setJunior] = useState(false);
  const [reading, setReading] = useState(false); const [readCount, setReadCount] = useState(0); const [fallback, setFallback] = useState(false);
  const [parsed, setParsed] = useState<ParsedPayslip>(); const [resume, setResume] = useState<{ answers: Answers; step: Step }>();
  const [restored, setRestored] = useState(false); const [reviewEdit, setReviewEdit] = useState(false);
  const [stage, setStage] = useState(0); const [resultState, setResultState] = useState<any>();
  const input = useRef<HTMLInputElement>(null); const touched = useRef(new Set<string>()); const controller = useRef<AbortController>();
  const activeStep = useRef<Step>("start"); const mounted = useRef(true); const resultMade = useRef(false);
  const hash = location.hash.slice(1); const step: Step = VALID_STEPS.includes(hash) ? hash as Step : "start";
  activeStep.current = step;
  const sequence: Step[] = ["job", "award", "employment", "level", ...(classes.some(c => /junior|under \d|\b(?:1[5-9]|20) years/i.test(c.classification)) ? ["age" as Step] : []), "pay", "hours", "allowances", "review"];
  const number = Math.max(1, sequence.indexOf(step === "industry" ? "job" : step) + 1);
  const validJobs = useMemo(() => JOBS.map(j => ({ ...j, codes: j.codes.filter(code => awards.some(x => x.code === code)) })).filter(j => j.codes.length), [awards]);
  const suggested = matchAwards(a.job, awards, parsed?.award_name_or_code, parsed?.employer_name);
  const hasSuggestion = Boolean(a.awardCode || suggested.length);
  const searchOpen = allAwards || !hasSuggestion;
  const title = TITLES[step];

  function go(next: Step, replace = false) { setError(""); navigate({ pathname: "/check", hash: next === "start" ? "" : `#${next}` }, { replace }); window.scrollTo(0, 0); }
  function update(patch: Partial<Answers>) { Object.keys(patch).forEach(k => touched.current.add(k)); setA(prev => ({ ...prev, ...patch })); }
  function advance(current = step) {
    if (reviewEdit) { setReviewEdit(false); go("review"); return; }
    const index = sequence.indexOf(current); const next = sequence[index + 1] ?? "review";
    go(next === "age" && a.age !== undefined ? "pay" : next);
  }
  function back() { if (reviewEdit) { setReviewEdit(false); go("review"); return; } const index = sequence.indexOf(step); go(index > 0 ? sequence[index - 1] : "start"); }
  function tag(key: string) { return a.fromPayslip.includes(key) ? <span className="ledger-label text-primary bg-primary-soft px-2 py-1 rounded-sm">From your payslip</span> : null; }
  function choice(label: string, selected: boolean, action: () => void, detail?: string) {
    return <Button variant="outline" className={`checker-choice ${selected ? "is-selected" : ""}`} onClick={action} key={label}>
      <span className="choice-radio" aria-hidden="true" /><span className="flex-1 min-w-0">{label}{detail && <span className="block text-sm font-normal text-ink-2">{detail}</span>}</span><ChevronRight className="h-4 w-4 shrink-0" />
    </Button>;
  }
  async function loadAwards() {
    setLoadingAwards(true); setFetchError("");
    try {
      const { data, error } = await supabase.functions.invoke("get-awards", { body: { search: "" } });
      if (error || !Array.isArray(data?.results)) throw new Error();
      setAwards(data.results.map((x: any) => ({ code: x.code, name: x.name })).filter((x: Award) => x.code && x.name).sort((x: Award, y: Award) => x.name.localeCompare(y.name)));
    } catch { setFetchError("The official award list couldn't load. Your answers are kept."); }
    finally { setLoadingAwards(false); }
  }
  useEffect(() => {
    mounted.current = true; void loadAwards();
    try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null"); if (saved?.version === 1 && saved.answers && VALID_STEPS.includes(saved.step)) { setResume(saved); go("start", true); } } catch { localStorage.removeItem(SAVE_KEY); }
    setRestored(true);
    const file = takePreloadedPayslip(); if (file) void handleFile(file);
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!restored || resume || resultMade.current || step === "start" || step === "result") return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, answers: a, step: step === "loading" ? "review" : step })); } catch { /* Storage unavailable: flow remains usable. */ }
  }, [a, step, restored, resume]);
  useEffect(() => { if (step === "result" && !resultState) go("review", true); }, [step, resultState]);
  useEffect(() => {
    if (!parsed || !awards.length) return;
    setA(prev => applyPayslip(prev, parsed, awards, touched.current));
  }, [parsed, awards]);
  useEffect(() => {
    if (!a.awardCode) return;
    let cancelled = false; setLoadingClasses(true); setClasses([]);
    supabase.functions.invoke("get-classifications", { body: { awardId: a.awardCode } }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setFetchError("Levels couldn't load. You can still choose not sure."); return; }
      const rows: Classification[] = data?.results ?? []; setClasses(rows);
      const printed = parsed?.classification_or_role?.toLowerCase();
      const match = printed && rows.find(c => c.classification?.toLowerCase() === printed);
      if (match && !touched.current.has("classificationId")) setA(prev => ({ ...prev, classificationId: match.classification_fixed_id, classificationName: match.classification, workArea: match.clause_description ?? "", fromPayslip: [...new Set([...prev.fromPayslip, "classificationId"])] }));
    }).finally(() => { if (!cancelled) setLoadingClasses(false); });
    return () => { cancelled = true; };
  }, [a.awardCode, parsed]);
  useEffect(() => {
    if (!a.awardCode) return;
    let cancelled = false;
    supabase.functions.invoke("get-allowances", { body: { awardId: a.awardCode } }).then(({ data }) => {
      if (cancelled) return;
      const types: string[] = [...new Set<string>((data?.results ?? []).map((x: any) => x.allowance_type_description || x.allowance_description).filter(Boolean))];
      setA(prev => ({ ...prev, allowances: types.length ? types.slice(0, 12).map(type => prev.allowances.find(x => x.type === type) ?? { type, received: false, amount_per_period: 0 }) : ["travel", "meal", "site", "remote work"].map(type => ({ type, received: false, amount_per_period: 0 })) }));
    });
    return () => { cancelled = true; };
  }, [a.awardCode]);

  async function handleFile(file: File) {
    controller.current?.abort(); const current = new AbortController(); controller.current = current;
    setResume(undefined); setReading(true); setFallback(false); setReadCount(0);
    const move = setTimeout(() => { if (mounted.current && activeStep.current === "start") go("job"); }, 6000);
    try {
        const p = await readPayslip(file, current.signal);
      if (!mounted.current || current.signal.aborted) return;
      setParsed(p); setReadCount(Object.entries(p).filter(([k, value]) => k !== "unreadable" && k !== "line_items" && value !== null && value !== undefined).length);
      if (p.unreadable) setFallback(true);
      if (activeStep.current === "start") go("job");
    } catch {
      if (!mounted.current || current.signal.aborted) return;
      setFallback(true); if (activeStep.current === "start") go("job");
    } finally { clearTimeout(move); if (!current.signal.aborted && mounted.current) setReading(false); }
  }
  function selectAward(award: Award) { update({ awardCode: award.code, awardName: award.name, classificationId: null, classificationName: "Not sure — check across all levels", workArea: "" }); advance("award"); }
  function selectJob(job: { title: string; codes: string[] }) {
    const award = awards.find(x => x.code === job.codes[0]);
    update({ job: job.title, ...(award ? { awardCode: award.code, awardName: award.name, classificationId: null, workArea: "" } : {}) }); setSearch(""); advance("job");
  }
  function prepareHours() {
    if (!a.shifts.length && !a.usePayslipHours && a.employmentType === "Full-time") update({ shifts: typicalShifts(a.weekStart), rosterScope: "typical-week" });
    advance("pay");
  }
  function toggleDay(offset: number) {
    const date = dateOffset(a.weekStart, offset); const exists = a.shifts.some(s => s.date === date);
    update({ usePayslipHours: false, rosterScope: a.rosterScope ?? "typical-week", shifts: exists ? a.shifts.filter(s => s.date !== date) : [...a.shifts, { date, day_of_week: new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long" }), start: "09:00", finish: "17:00", break_minutes: 30 }].sort((x, y) => x.date.localeCompare(y.date)) });
  }
  async function checkPay() {
    if (!a.awardCode) { setError("Choose your award before checking."); return; }
    if (!a.rate && !a.gross) { setError("Enter your hourly rate or gross pay to compare."); return; }
    setError(""); go("loading"); const start = Date.now();
    try {
      const state = await calculateAnswers(a, setStage);
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 2500 - (Date.now() - start))));
      resultMade.current = true; try { localStorage.removeItem(SAVE_KEY); } catch { /* Storage must not prevent results. */ } setResultState(state); go("result");
    } catch (e) { go("review"); setError(e instanceof Error ? e.message : "Your answers are saved. Please try again."); }
  }

  if (step === "result" && resultState) return <Result resultState={resultState} />;
  const visibleAwards = searchOpen ? (search ? awards.filter(x => `${x.code} ${x.name}`.toLowerCase().includes(search.toLowerCase())) : a.industry && a.industry !== "Other" ? industryAwards(a.industry, awards) : allAwards ? awards : []) : [...new Map([...(a.awardCode ? awards.filter(x => x.code === a.awardCode) : []), ...suggested].map(x => [x.code, x])).values()];
  const showClasses = classes.filter(c => junior || !/apprentice|junior|trainee|school.leaver|plus \d year|under \d|\b(?:1[5-9]|20) years/i.test(`${c.classification} ${c.clause_description}`));
  const reviewRows: [Step, string, string][] = [["job", "Job", a.job || "Not sure"], ["award", "Award", a.awardName], ["employment", "Employment", a.employmentType], ["level", "Level", a.classificationName], ["pay", "Pay", `${a.frequency} · ${a.gross ? `$${a.gross} gross` : `$${a.rate}/hr`}`], ["hours", "Hours", a.usePayslipHours ? `${a.hours} ordinary hours from your payslip` : `${a.shifts.length} shifts · ${a.shifts.reduce((t, s) => t + shiftHours(s), 0).toFixed(1)} hrs`], ["allowances", "Allowances", Object.values(a.conditions).some(Boolean) ? "Work conditions selected" : "None / not sure"]];

  return <><SEO title="Check your pay | AwardPay" description="A guided Australian award pay check using official Fair Work rates." path="/check" /><ApNav />
    <main className={`checker-page checker-form ${["hours", "allowances", "review"].includes(step) ? "checker-has-primary" : ""}`}>
      <input ref={input} type="file" className="hidden" accept={PAYSLIP_ACCEPT} aria-label="Upload payslip" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void handleFile(f); }} />
      {step !== "start" && step !== "loading" && <div className="mb-8"><div className="flex justify-between items-center mb-3"><Button variant="ghost" size="sm" onClick={back} className="px-0"><ArrowLeft className="h-4 w-4" />Back</Button><span className="font-mono text-[13px] text-ink-3">Step {number} of {sequence.length}</span></div><div role="progressbar" aria-label="Check progress" aria-valuenow={number} aria-valuemin={0} aria-valuemax={sequence.length} className="flex gap-1">{sequence.map((s, i) => <span key={s} className={`h-[3px] flex-1 ${i < number ? "bg-primary" : "bg-rule"}`} />)}</div></div>}
      {(reading || readCount > 0) && <div role="status" className="flex gap-2 items-center text-sm text-primary mb-5">{reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{reading ? "Reading your payslip…" : `Filled ${a.fromPayslip.length || readCount} answers from your payslip`}</div>}
      {fallback && <div className="border-t border-rule py-4 mb-4"><p>No worries, we'll grab the details with a few quick questions.</p><Button variant="link" onClick={() => input.current?.click()} className="px-0">Try another photo</Button></div>}
      {title && <header className="checker-heading"><h1>{title[0]}</h1><p>{title[1]}</p></header>}
      {fetchError && <div role="status" className="mb-5 text-ink-2">{fetchError}<Button variant="link" onClick={() => void loadAwards()}>Retry</Button></div>}
      {error && <p role="alert" className="text-clay mb-5">{error}</p>}

      {step === "start" && <div className="space-y-4">{resume && <section className="border-t border-b border-rule py-5 space-y-3"><h2 className="text-xl">Pick up where you left off</h2><Button onClick={() => { setA({ ...defaults(), ...resume.answers }); touched.current = new Set(Object.keys(resume.answers)); const next = resume.step; setResume(undefined); go(next); }}>Resume my check</Button><Button variant="link" onClick={() => { setResume(undefined); localStorage.removeItem(SAVE_KEY); }}>Start again</Button></section>}
        <Button variant="outline" className="checker-choice" onClick={() => input.current?.click()}><Camera className="h-7 w-7 text-primary" /><span className="flex-1">Upload a payslip<span className="block text-sm font-normal text-ink-2">Fastest — we fill in the details for you</span><span className="ledger-label text-primary">Recommended</span></span><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" className="checker-choice" onClick={() => { setResume(undefined); go("job"); }}><span className="flex-1">Answer a few questions<span className="block text-sm font-normal text-ink-2">No payslip? No problem</span></span><ChevronRight className="h-4 w-4" /></Button>
        <p className="text-sm text-ink-2">Your payslip image is never saved.</p></div>}

      {step === "job" && <div className="space-y-3">{tag("job")}{a.job && <>{choice(a.job, true, () => { const award = suggested[0]; if (award) update({ awardCode: award.code, awardName: award.name }); advance(); }, "Looks right")}</>}
        <Label htmlFor="job-search">Job title</Label><div className="relative"><Search className="absolute left-3 top-4 h-4 w-4 text-ink-3" /><Input id="job-search" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your job, e.g. barista" /></div>
        {loadingAwards ? <p role="status">Loading official awards…</p> : validJobs.filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase())).slice(0, search ? 12 : 8).map(j => choice(j.title, a.job === j.title, () => selectJob(j)))}
        {choice("Other / not sure", false, () => { update({ job: search || "Not sure" }); setSearch(""); go("industry"); })}</div>}
      {step === "industry" && <div className="space-y-3">{INDUSTRIES.map(industry => choice(industry, a.industry === industry, () => { update({ industry }); setAllAwards(industry === "Other"); go("award"); }))}{choice("I'm not sure", false, () => { setAllAwards(true); go("award"); })}</div>}
      {step === "award" && <div className="space-y-3">{tag("awardCode")}<p className="text-ink-2">{hasSuggestion ? "Most people in this job are covered by…" : "Find the award that covers your work."}</p>{searchOpen && <><Label htmlFor="award-search">Search all awards</Label><Input id="award-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Award name or code" /></>}
        {visibleAwards.map(award => choice(award.name, a.awardCode === award.code, () => selectAward(award), award.code))}
        {!searchOpen && <Button variant="link" className="px-0" onClick={() => { setAllAwards(true); setSearch(""); }}>Search all awards</Button>}
        {hasSuggestion && <Button variant="link" className="px-0" onClick={() => { const award = awards.find(x => x.code === a.awardCode) ?? suggested[0]; if (award) selectAward(award); else { setAllAwards(true); setError("Choose a likely award so we can check official rates."); } }}>I'm not sure — use the suggested award</Button>}{!visibleAwards.length && <p className="text-ink-2">Search by award name or code, or go back to choose an industry.</p>}</div>}
      {step === "employment" && <div className="space-y-3">{tag("employmentType")}{["Full-time", "Part-time", "Casual"].map(type => choice(type, a.employmentType === type, () => { update({ employmentType: type }); advance(); }))}{choice("I'm not sure", false, () => { update({ employmentType: "Full-time" }); advance(); }, "Use full-time; you can change this in review")}</div>}
      {step === "level" && <div className="space-y-3">{tag("classificationId")}{choice("Not sure — check across all levels", !a.classificationId, () => { update({ classificationId: null, classificationName: "Not sure — check across all levels", workArea: "" }); advance(); })}{loadingClasses && <p role="status">Loading official classifications…</p>}{showClasses.map(c => choice(c.classification, a.classificationId === c.classification_fixed_id, () => { update({ classificationId: c.classification_fixed_id, classificationName: c.classification, workArea: c.clause_description ?? "" }); advance(); }, c.clause_description))}<Button variant="link" className="px-0" onClick={() => setJunior(!junior)}>{junior ? "Hide apprentice/junior levels" : "Show apprentice/junior levels"}</Button></div>}
      {step === "age" && <div className="space-y-3">{choice("Yes", (a.age ?? 21) < 21, () => { update({ age: 20 }); setJunior(true); setReviewEdit(false); go("level"); }, "Choose your exact junior classification on the next screen")}{choice("No", a.age === 21, () => { update({ age: 21 }); advance("age"); })}{choice("I'm not sure", false, () => { update({ age: 21 }); advance("age"); }, "Continue with adult levels; confirm before relying on your result")}</div>}
      {step === "pay" && <div className="space-y-5"><div><Label>Pay frequency</Label>{tag("frequency")}<div className="grid grid-cols-3 gap-2 mt-2">{(["weekly", "fortnightly", "monthly"] as const).map(value => <Button key={value} variant={a.frequency === value ? "default" : "outline"} onClick={() => update({ frequency: value })} className="capitalize px-2">{value}</Button>)}</div></div>
        <div><Label htmlFor="pay-rate">Hourly rate you're paid</Label>{tag("rate")}<div className="checker-affix checker-affix-money mt-2"><span>$</span><Input id="pay-rate" type="number" min="0" step="0.01" value={a.rate} onChange={e => update({ rate: e.target.value })} /></div><Button variant="link" className="px-0" onClick={() => { update({ rate: "" }); document.getElementById("pay-gross")?.focus(); }}>Not sure — I'll enter the total instead</Button></div>
        <div><Label htmlFor="pay-gross">Total gross pay for this period</Label>{tag("gross")}<div className="checker-affix checker-affix-money mt-2"><span>$</span><Input id="pay-gross" type="number" min="0" step="0.01" value={a.gross} onChange={e => update({ gross: e.target.value })} /></div></div>
        <div><Label htmlFor="pay-state">State or territory</Label><select id="pay-state" value={a.state} onChange={e => update({ state: e.target.value })} className="border p-3 mt-2">{["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"].map(s => <option key={s}>{s}</option>)}</select></div>
        <Button className="w-full" onClick={() => { if ((!a.rate && !a.gross) || Number(a.rate || 0) < 0 || Number(a.gross || 0) < 0) setError("Enter either your rate or gross pay. Use your payslip or bank record if you're unsure."); else prepareHours(); }}>Looks right</Button><p className="text-[13px] text-ink-3">Not sure about one figure? Leave it blank and use the other.</p></div>}
      {step === "hours" && <div className="space-y-5"><div className="flex flex-wrap gap-2">{a.fromPayslip.includes("shifts") ? tag("shifts") : tag("hours")}</div>{a.frequency === "monthly" && a.rosterScope !== "period" && !a.usePayslipHours && <p className="text-ink-2">Enter a typical week; we’ll compare it with 1/4.33 of your monthly gross pay. Your result covers that week.</p>}{a.hours && !a.shifts.some(s => s.fromPayslip) && choice(`Use the hours from my payslip (${Number(a.hours).toFixed(1)} hrs)`, a.usePayslipHours, () => update({ usePayslipHours: true }), "Checks the printed hour buckets; use a roster to check specific days and public holidays.")}
        {a.hours && a.usePayslipHours && <Button variant="link" className="px-0" onClick={() => update({ usePayslipHours: false })}>Build my roster instead</Button>}
        {!a.usePayslipHours && <><div><Label htmlFor="period-start">Pay period starts</Label><Input id="period-start" type="date" value={a.weekStart} onChange={e => { const next = e.target.value; if (!next) return; const delta = Math.round((new Date(`${next}T12:00:00`).getTime() - new Date(`${a.weekStart}T12:00:00`).getTime()) / 86400000); update({ weekStart: next, shifts: a.shifts.map(s => ({ ...s, date: dateOffset(s.date, delta), day_of_week: new Date(`${dateOffset(s.date, delta)}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long" }) })) }); }} /></div>
          {a.rosterScope !== "period" && <div className="flex flex-wrap gap-2"><Button variant="outline" className="h-auto whitespace-normal" onClick={() => update({ shifts: typicalShifts(a.weekStart), rosterScope: "typical-week" })}>Copy a typical week: Mon–Fri 9–5</Button><Button variant="outline" onClick={() => update({ shifts: typicalShifts(a.weekStart, 3), rosterScope: "typical-week" })}>3 shifts</Button></div>}
           {Array.from({ length: a.frequency === "fortnightly" ? 2 : 1 }, (_, week) => <section key={week} className="border-t border-rule pt-4"><h2 className="text-base mb-3">Week {week + 1}</h2><div className="checker-day-chips">{DAYS.map((day, i) => { const offset = week * 7 + i; const date = dateOffset(a.weekStart, offset); const actualDay = new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", { weekday: "short" }); return <Button key={day} aria-label={`${actualDay} week ${week + 1}`} aria-pressed={a.shifts.some(s => s.date === date)} variant={a.shifts.some(s => s.date === date) ? "default" : "outline"} className="px-0 text-sm" onClick={() => toggleDay(offset)}>{actualDay}</Button>; })}</div>{week === 1 && <Button variant="link" className="px-0" onClick={() => update({ shifts: [...a.shifts.filter(s => s.date < dateOffset(a.weekStart, 7) || s.date >= dateOffset(a.weekStart, 14)), ...a.shifts.filter(s => s.date < dateOffset(a.weekStart, 7)).map(s => ({ ...s, date: dateOffset(s.date, 7) }))] })}>Same as week 1</Button>}</section>)}
          {a.shifts.map((s, shiftIndex) => <section key={`${s.date}-${shiftIndex}`} className="border-t border-rule pt-4 space-y-3"><h3 className="text-base">{s.day_of_week} <span className="text-ink-3 font-mono text-[13px]">{s.date}</span> {s.fromPayslip && <span className="ledger-label text-primary">From your payslip</span>}</h3>{s.fromPayslip && <p className="text-sm text-ink-2">Confirm the date and times for these printed hours.</p>}{s.fromPayslip && <div><Label htmlFor={`shift-date-${shiftIndex}`}>Shift date</Label><Input id={`shift-date-${shiftIndex}`} type="date" value={s.date} onChange={e => { const date = e.target.value; if (date) update({ shifts: a.shifts.map((x, index) => index === shiftIndex ? { ...x, date, day_of_week: new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long" }) } : x) }); }} /></div>}<div className="flex flex-wrap gap-2">{PRESETS.map(([label, start, finish]) => <Button variant="outline" size="sm" key={label} className="text-sm px-3" onClick={() => update({ shifts: a.shifts.map((x, index) => index === shiftIndex ? { ...x, start, finish } : x) })}>{label}</Button>)}</div><div className="grid grid-cols-3 gap-2">{(["start", "finish", "break_minutes"] as const).map(key => <div key={key}><Label htmlFor={`${s.date}-${shiftIndex}-${key}`}>{key === "start" ? "Start" : key === "finish" ? "Finish" : "Break (min)"}</Label><Input id={`${s.date}-${shiftIndex}-${key}`} type={key === "break_minutes" ? "number" : "time"} min="0" value={s[key]} onChange={e => update({ shifts: a.shifts.map((x, index) => index === shiftIndex ? { ...x, [key]: key === "break_minutes" ? Number(e.target.value) : e.target.value } : x) })} /></div>)}</div><div className="flex gap-2 items-center"><Checkbox id={`${s.date}-${shiftIndex}-holiday`} checked={Boolean(s.publicHoliday)} onCheckedChange={v => update({ shifts: a.shifts.map((x, index) => index === shiftIndex ? { ...x, publicHoliday: v === true } : x) })} /><Label htmlFor={`${s.date}-${shiftIndex}-holiday`}>I worked a public holiday</Label></div></section>)}
          <div><Label htmlFor="hours-total">Not sure of your roster? Enter total ordinary hours</Label><Input id="hours-total" type="number" min="0" value={a.hours} onChange={e => update({ hours: e.target.value })} /><Button variant="link" className="px-0" onClick={() => { if (Number(a.hours) > 0) update({ usePayslipHours: true }); else setError("Enter the total hours you worked so we can compare your pay."); }}>I'm not sure — use total hours</Button></div></>}
        {a.usePayslipHours && <p className="text-[13px] text-ink-3">Day-specific penalties need your roster. Ordinary hours alone cannot confirm which days or public holidays you worked.</p>}
        <div className="checker-primary"><Button className="w-full" onClick={() => { if (a.usePayslipHours ? Number(a.hours) > 0 : a.shifts.length > 0 && a.shifts.every(s => s.start && s.finish && s.break_minutes >= 0 && shiftHours(s) > 0)) advance(); else setError("Add at least one shift or your total hours."); }}>Looks right</Button></div></div>}
      {step === "allowances" && <div className="space-y-4">{CONDITION_ROWS.filter(([key]) => ["droveOwnCar", "woreUniform", "isFirstAider", "workedNights"].includes(key) || /construction|building|manufacturing|electrical/i.test(a.awardName) || a.conditions[key]).map(([key, label]) => <Button key={key} variant="outline" className={`checker-choice ${a.conditions[key] ? "is-selected" : ""}`} aria-pressed={Boolean(a.conditions[key])} onClick={() => update({ conditions: { ...a.conditions, [key]: !a.conditions[key] } })}><span className="choice-radio" />{label}</Button>)}
        <details className="border-t border-rule py-3"><summary className="cursor-pointer text-primary">More work conditions</summary><div className="space-y-3 mt-3">{CONDITION_ROWS.map(([key, label]) => <Button key={key} variant="outline" className={`checker-choice ${a.conditions[key] ? "is-selected" : ""}`} aria-pressed={Boolean(a.conditions[key])} onClick={() => update({ conditions: { ...a.conditions, [key]: !a.conditions[key] } })}>{label}</Button>)}</div></details>
        <AllowancesSection allowances={a.allowances} onUpdateAllowance={(index, allowance) => update({ allowances: a.allowances.map((x, i) => i === index ? allowance : x) })} />
        <div className="checker-primary"><Button className="w-full" onClick={() => advance()}>Looks right</Button></div><Button variant="link" className="px-0" onClick={() => { update({ conditions: {}, allowances: a.allowances.map(x => ({ ...x, received: false, amount_per_period: 0 })) }); advance(); }}>None / not sure</Button></div>}
      {step === "review" && <div><dl>{reviewRows.map(([target, label, value]) => <div key={target} className="flex items-start justify-between gap-4 py-4 border-t border-rule"><div className="min-w-0"><dt className="ledger-label">{label}</dt><dd className="mt-1 break-words">{value || "Not sure"}</dd></div><Button variant="link" size="sm" aria-label={`Edit ${label.toLowerCase()}`} onClick={() => { setReviewEdit(true); go(target); }}>Edit</Button></div>)}</dl><div className="checker-primary"><Button className="w-full" onClick={() => void checkPay()}>Check my pay</Button></div><Button variant="link" className="px-0" onClick={() => { setReviewEdit(true); go("job"); }}>I'm not sure — review my answers</Button></div>}
      {step === "loading" && <section role="status" aria-live="polite" className="py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mb-6" /><h1 className="text-[28px] leading-[34px] mb-6">Checking against Fair Work rates…</h1><ol className="space-y-4">{["Matching your award", "Loading official pay rates", "Checking every shift"].map((text, i) => <li key={text} className={`flex gap-3 items-center ${stage >= i ? "text-foreground" : "text-ink-3"}`}>{stage > i ? <Check className="h-4 w-4 text-primary" /> : stage === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-mono text-[13px]">0{i + 1}</span>}{text}</li>)}</ol></section>}
      <p className="text-[13px] text-ink-3 mt-8">AwardPay is an interpretation tool, not legal advice.</p>
    </main></>;
}