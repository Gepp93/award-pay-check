import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Calculator from "./pages/Calculator";
import Dashboard from "./pages/Dashboard";
import Subscription from "./pages/Subscription";
import Pricing from "./pages/Pricing";
import HowItWorks from "./pages/HowItWorks";
import WhyAwardPay from "./pages/WhyAwardPay";
import Onboarding from "./pages/Onboarding";
import AwardFinder from "./pages/AwardFinder";
import AwardOverview from "./pages/AwardOverview";
import WeeklyPayCheck from "./pages/WeeklyPayCheck";
import DebugClassifications from "./pages/DebugClassifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/award-finder" element={<AwardFinder />} />
          <Route path="/award-overview" element={<AwardOverview />} />
          <Route path="/weekly-pay-check" element={<WeeklyPayCheck />} />
          <Route path="/debug-classifications" element={<DebugClassifications />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/why-awardpay" element={<WhyAwardPay />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
