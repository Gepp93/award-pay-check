import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { tierCall } from "./tierApi";
export default function PaymentReturn() {
  const [checked, setChecked] = useState(false);
  useEffect(() => { tierCall({ action: "status" }).finally(() => setChecked(true)); }, []);
  const suffix = new URLSearchParams(window.location.search).get("billing") === "sandbox" ? "?billing=sandbox" : "";
  return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-3xl font-extrabold">Payment confirmation</h1><p className="my-6">{checked ? "Your report access reflects verified Stripe payment confirmation. Pending payments may take a moment." : "Checking payment confirmation…"}</p><Button asChild><Link to={`/v2/reports${suffix}`}>My assessment reports</Link></Button></main>;
}