import { CalendarDays, Camera, ChevronRight, FileText, MessageSquareText, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { onUpload: () => void; onManual: () => void };

export default function CheckEntry({ onUpload, onManual }: Props) {
  return <>
    <div className="check-entry-options">
      <Button variant="outline" className="check-entry-choice" onClick={onUpload}>
        <span className="check-entry-icon bg-primary-soft text-primary" aria-hidden="true"><FileText /><Camera className="check-entry-camera" /></span>
        <span className="check-entry-copy"><span className="check-entry-label"><Zap aria-hidden="true" />FASTEST OPTION</span><span className="check-entry-title">Upload a payslip</span><span className="check-entry-description">We'll read your payslip and help fill in your details.</span></span>
        <ChevronRight className="check-entry-arrow" aria-hidden="true" />
      </Button>
      <Button variant="outline" className="check-entry-choice" onClick={onManual}>
        <span className="check-entry-icon bg-gold-soft text-foreground" aria-hidden="true"><CalendarDays /></span>
        <span className="check-entry-copy"><span className="check-entry-title">Enter your hours &amp; pay</span><span className="check-entry-description">No payslip needed. Tell us your job, hours worked and what you were paid.</span></span>
        <ChevronRight className="check-entry-arrow" aria-hidden="true" />
      </Button>
    </div>
    <ul className="check-entry-trust">
      <li><ShieldCheck aria-hidden="true" /><span><strong>Private by design</strong><span>Your information is handled securely.</span></span></li>
      <li><Zap aria-hidden="true" /><span><strong>Australian award rates</strong><span>Compare pay against relevant award rates.</span></span></li>
      <li><MessageSquareText aria-hidden="true" /><span><strong>Clear explanations</strong><span>Understand possible pay differences.</span></span></li>
    </ul>
  </>;
}