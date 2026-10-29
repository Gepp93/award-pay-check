import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import UnderpaidAward from "./pages/UnderpaidAward";
import V2Layout from "./features/v2/Layout";
import V2Home from "./features/v2/Home";
import V2Industry from "./features/v2/IndustryPick";
import V2Guided from "./features/v2/Guided";
import V2Upload from "./features/v2/UploadPayslip";
import V2Results from "./features/v2/Results";
import V2Questions from "./features/v2/EngineQuestions";
import V2Pricing from "./features/v2/Pricing";
import V2SignIn from "./features/v2/SignIn";
import V2HowItWorks from "./features/v2/HowItWorks";
import ResetPassword from "./pages/ResetPassword";

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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/award-finder" element={<AwardFinder />} />
          <Route path="/award-overview" element={<AwardOverview />} />
          <Route path="/weekly-pay-check" element={<WeeklyPayCheck />} />
          {import.meta.env.DEV && <Route path="/debug-classifications" element={<DebugClassifications />} />}
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/app-dashboard" element={<AppDashboard />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/why-awardpay" element={<WhyAwardPay />} />
          <Route path="/check" element={<CheckUpload />} />
          <Route path="/new-check-step-1" element={<Navigate to="/check" replace />} />
          <Route path="/new-check-step-2" element={<Navigate to="/check" replace />} />
          <Route path="/new-check-step-3" element={<NewCheck_Step3_Result />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/reports" element={<MyReports />} />
          <Route path="/payment-complete" element={<PaymentComplete />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/underpaid/:slug" element={<UnderpaidAward />} />
          <Route path="/v2" element={<V2Layout />}>
            <Route index element={<V2Home />} />
            <Route path="industry" element={<V2Industry />} />
            <Route path="check" element={<V2Guided />} />
            <Route path="upload" element={<V2Upload />} />
            <Route path="questions" element={<V2Questions />} />
            <Route path="results" element={<V2Results />} />
            <Route path="pricing-preview" element={<Navigate to="/v2/pricing" replace />} />
            <Route path="pricing" element={<V2Pricing />} />
            <Route path="sign-in" element={<V2SignIn />} />
            <Route path="how-it-works" element={<V2HowItWorks />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
