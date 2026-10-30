import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { tierCall, billingError } from "./tierApi";
export default function PaidReports() {
  const [reports, setReports] = useState<any[]>([]); const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const suffix = new URLSearchParams(window.location.search).get("billing") === "sandbox" ? "?billing=sandbox" : "";
  const manage = async (action: "portal" | "cancel") => { try { const data = await tierCall({ action }); if (data.url) window.location.assign(data.url); else setError("Cancellation scheduled for the end of your paid period."); } catch (e) { setError(billingError(e)); } };
  useEffect(() => { tierCall({ action: "status" }).then(data => setActive(data.subscriptions?.length > 0)).catch(() => undefined); }, []);
  useEffect(() => { tierCall({ action: "reports" }).then(data => setReports(data.reports ?? [])).catch(e => setError(billingError(e))); }, []);
  return <main className="mx-auto max-w-4xl px-4 py-10"><h1 className="text-3xl font-extrabold">My assessment reports</h1>{active && <div className="my-5 flex flex-wrap gap-3"><Button variant="outline" onClick={() => void manage("portal")}>Manage billing</Button><Button variant="outline" onClick={() => { if (window.confirm("Cancel renewal at the end of your paid period?")) void manage("cancel"); }}>Cancel renewal</Button></div>}{error && <p role="alert" className="mt-4 text-destructive">{error}</p>}<ul className="mt-6 divide-y divide-border">{reports.map(r => <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><p className="font-bold">Supported wage assessment</p><p className="text-sm text-ink-2">{new Date(r.created_at).toLocaleDateString("en-AU")} · Check current payment access</p></div><Button asChild variant="outline"><Link to={`/v2/report/${r.id}${suffix}`}>Open report</Link></Button></li>)}</ul><Button asChild className="mt-6"><Link to="/v2/questions">Start another assessment</Link></Button></main>;
}