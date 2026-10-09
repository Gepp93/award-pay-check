import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export const ProgressIndicator = ({ currentStep }: ProgressIndicatorProps) => {
  const steps = [
    { number: 1, label: "Payslip" },
    { number: 2, label: "Your job" },
    { number: 3, label: "Result" },
  ];

  return (
    <nav className="checker-progress no-print" aria-label="Pay check progress">
      <ol>
        {steps.map((step) => (
          <li key={step.number} aria-current={currentStep === step.number ? "step" : undefined}
            className={cn(currentStep === step.number ? "is-current" : "", currentStep > step.number ? "is-complete" : "")}>
            {currentStep > step.number && <Check className="h-3.5 w-3.5 text-primary" aria-label="Completed" />}
            <span className="font-mono">0{step.number}</span><span>{step.label}</span>
          </li>
        ))}
      </ol>
      <div className="checker-progress-bar" aria-hidden="true">
        {steps.map((step) => <span key={step.number} className={currentStep >= step.number ? "bg-primary" : "bg-border"} />)}
      </div>
    </nav>
  );
};
