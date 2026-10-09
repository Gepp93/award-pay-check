import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

const STRIPE_URL = "https://buy.stripe.com/6oUeVe0kk9Zn4XZ5Nz6AM04";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for redirect params from URL and location state
  const redirectParam = searchParams.get("redirect");
  const isCheckoutRedirect = redirectParam === "checkout";
  
  // Support return navigation from pay check wizard
  const returnTo = (location.state as any)?.returnTo;
  const returnState = (location.state as any)?.returnState;
  const modeFromState = (location.state as any)?.mode;

  // Set initial login/signup mode from state
  useEffect(() => {
    if (modeFromState === 'signin') {
      setIsLogin(true);
    } else if (modeFromState === 'signup') {
      setIsLogin(false);
    }
  }, [modeFromState]);

  const handlePostAuthRedirect = () => {
    if (isCheckoutRedirect) {
      // Redirect to Stripe checkout for 3-month pass
      window.location.href = STRIPE_URL;
    } else if (redirectParam) {
      // Generic redirect, e.g. app-dashboard after a subscription purchase
      navigate(redirectParam);
    } else if (returnTo) {
      // Return to the page the user came from (state preserved if provided)
      navigate(returnTo, returnState ? { state: returnState } : undefined);
    } else {
      // Default redirect
      navigate("/new-check-step-1");
    }
  };


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        handlePostAuthRedirect();
      } else {
        const redirectUrl = `${window.location.origin}/new-check-step-1`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        toast.success("Account created! Please check your email.");
        handlePostAuthRedirect();
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navigation Bar */}
      <header className="ap-nav">
        <div className="ap-wrap">
          <div className="flex justify-between items-center h-16">
            <div 
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-semibold text-xl cursor-pointer"
            >
              <span className="ap-mark" />
              <span className="text-foreground">AwardPay</span>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-foreground/70 hover:text-foreground"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Auth Card */}
      <div className="checker-page flex items-center justify-center">
        <section className="w-full max-w-[400px] checker-form">
        <header className="checker-heading">
          <h1 className="text-[28px] leading-[34px]">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p>
            {isCheckoutRedirect
              ? `Sign ${isLogin ? "in" : "up"} to complete your 3-month access pass`
              : redirectParam
                ? `Sign ${isLogin ? "in" : "up"} to activate your 12-month pass`
                : returnTo
                  ? `Sign ${isLogin ? "in" : "up"} to see your pay check results`
                  : isLogin
                    ? "Sign in to access your calculations"
                    : "Start checking your award pay today"}
          </p>

        </header>
        <div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-card"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Button variant="link"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary underline whitespace-normal h-auto"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default Auth;
