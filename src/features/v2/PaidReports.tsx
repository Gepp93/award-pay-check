import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { tierCall, billingError } from "./tierApi";
export default function PaidReports() {
  const [reports, setReports] = useState<any[]>([]); const [error, setError] = useState("");
  useEffect(() => { tierCall({ action: "reports" }).then(data => setReports(data.reports ?? [])).catch(e => setError(billingError(e))); }, []);
  return <main className="mx-auto max-w-4xl px-4 py-10"><h1 className="text-3xl font-extrabold">My assessment reports</h1>{error && <p role="alert" className="mt-4 text-destructive">{error}</p>}<ul className="mt-6 divide-y divide-border">{reports.map(r => <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><p className="font-bold">Supported wage assessment</p><p className="text-sm text-ink-2">{new Date(r.created_at).toLocaleDateString("en-AU")} · {r.assessment_unlocked ? "Assessment unlocked" : "Payment pending"}</p></div><Button asChild variant="outline"><Link to={`/v2/report/${r.id}`}>Open report</Link></Button></li>)}</ul><Button asChild className="mt-6"><Link to="/v2/questions">Start another assessment</Link></Button></main>;
}