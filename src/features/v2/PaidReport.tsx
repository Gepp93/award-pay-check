import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, Loader2, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tierCall, billingError, downloadTierPdf } from "./tierApi";
import TierOffers from "./TierOffers";

export default function PaidReport() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState("");
  const download = async () => {
    try {
      const latest = await tierCall({ action: "report", reportId: id });
      setReport(latest);
      if (!latest.pdfUnlocked || !latest.result) { setError("PDF access is not active. Check your payment status."); return; }
      await downloadTierPdf(latest.id);
    } catch (e) { setError(billingError(e)); }
  };
  const load = async () => { setError(""); try { setReport(await tierCall({ action: "report", reportId: id })); } catch (e) { setError(billingError(e)); } };
  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
    <Link to="/v2/reports" className="text-sm font-bold text-primary">My assessment reports</Link>
    <h1 className="mt-4 text-3xl font-extrabold">Your saved wage assessment</h1>
    <p className="mt-3 text-sm text-ink-2">Complete for supported wage items only. A potential difference is not a verified debt. Your report records the calculation as it was saved.</p>
    {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}
    {!report && !error && <Loader2 className="mt-6 animate-spin" />}
    {report && <>
      <p className="mt-6 text-3xl font-extrabold">Potential comparable difference: ${((report.summary.underpaymentCents ?? 0) / 100).toFixed(2)}</p>
      <Button variant="outline" className="mt-4" onClick={() => void load()}><RefreshCw /> Check payment status</Button>
      {report.result ? <>
        <h2 className="mt-8 text-xl font-bold">{report.result.rulePack?.name ?? report.result.award}</h2>
        <p className="mt-2">{report.result.classification}</p>
        {report.pdfUnlocked && <div className="mt-5 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Date</th><th>Working</th><th className="text-right">Award minimum</th></tr></thead><tbody>{report.result.lines.map((line: any, k: number) => <tr key={k} className="border-t border-border"><td className="py-3 pr-3">{line.date}</td><td className="py-3 pr-3">{line.explanation}<br /><span className="text-xs text-ink-3">{line.sources.map((s: any) => `${s.description} ${s.clause ?? ""}`).join("; ")}</span></td><td className="text-right">${(line.amountCents / 100).toFixed(2)}</td></tr>)}</tbody></table></div>}
        {report.pdfUnlocked ? <Button className="mt-6" onClick={() => void download()}><Download /> Download detailed PDF</Button> : <p className="mt-5 flex gap-2 text-sm text-ink-2"><Lock className="h-4 w-4" />Pay Check includes this assessment, not a PDF. A detailed report is a separate purchase.</p>}
      </> : <p className="my-6 flex gap-2"><Lock />This assessment is saved. Details unlock only after verified payment.</p>}
      <ul className="my-6 list-disc pl-5 text-sm text-ink-2">{report.summary.exclusions.map((x: string) => <li key={x}>{x}</li>)}</ul>
      {!report.pdfUnlocked && <TierOffers reportId={report.id} />}
    </>}
  </main>;
}