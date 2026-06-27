import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
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
import Contact from "./pages/Contact";
import NewCheck_Step1_WhoAreYou from "./pages/NewCheck_Step1_WhoAreYou";
import NewCheck_Step2_ShiftDetails from "./pages/NewCheck_Step2_ShiftDetails";
import NewCheck_Step3_Result from "./pages/NewCheck_Step3_Result";
import AppDashboard from "./pages/AppDashboard";
import Profile from "./pages/Profile";
import ThankYou from "./pages/ThankYou";
import CheckUpload from "./pages/CheckUpload";
import Report from "./pages/Report";
import MyReports from "./pages/MyReports";
import PaymentComplete from "./pages/PaymentComplete";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
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
          <Route path="/app-dashboard" element={<AppDashboard />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/why-awardpay" element={<WhyAwardPay />} />
          <Route path="/check" element={<CheckUpload />} />
          <Route path="/new-check-step-1" element={<NewCheck_Step1_WhoAreYou />} />
          <Route path="/new-check-step-2" element={<NewCheck_Step2_ShiftDetails />} />
          <Route path="/new-check-step-3" element={<NewCheck_Step3_Result />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/reports" element={<MyReports />} />
          <Route path="/payment-complete" element={<PaymentComplete />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
