import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WizardProvider } from "./contexts/WizardContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Step1_WhoAreYou from "./pages/Step1_WhoAreYou";
import Step2_ShiftDetails from "./pages/Step2_ShiftDetails";
import Step3_Result from "./pages/Step3_Result";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WizardProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/step1-who-are-you" element={<Step1_WhoAreYou />} />
            <Route path="/step2-shift-details" element={<Step2_ShiftDetails />} />
            <Route path="/step3-result" element={<Step3_Result />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WizardProvider>
  </QueryClientProvider>
);

export default App;
