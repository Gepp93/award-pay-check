import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, FileText, Lock, Mail, ShieldCheck, Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { startSubscriptionCheckout } from "@/lib/paymentLinks";
import { THREE_MONTH_PASS } from "@/lib/plans";

type Mode = "signin" | "signup" | "forgot";

/** 2.0 sign-in. Uses the same auth calls, guest-pass claim and redirects as /auth. */
export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const initial = (location.state as any)?.mode || params.get("mode");
  const [mode, setMode] = useState<Mode>(initial === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirect = params.get("redirect");
  const rt = params.get("returnTo");
  const returnTo = (location.state as any)?.returnTo || (rt && rt.startsWith("/") && !rt.startsWith("//") ? rt : null);

  useEffect(() => { setError(null); setNotice(null); }, [mode]);

  const afterAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { error: claimError } = await supabase.rpc("claim_my_passes");
      if (claimError) console.error("claim_my_passes error:", claimError);
    }
    if (redirect === "checkout") {
      navigate("/pricing");
    } else if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) navigate(redirect);
    else if (returnTo) navigate(returnTo);
    else navigate("/reports");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterAuth();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}${returnTo || "/reports"}` },
        });
        if (error) throw error;
        if (data.session) await afterAuth();
        else setNotice("Check your email and tap the link to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If an account exists for that email, we've sent a link to reset your password.");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const sub = redirect === "checkout"
    ? `Sign ${mode === "signup" ? "up" : "in"} to choose your AwardPay option.`
    : mode === "signin" ? "Sign in to access your payslip checks, reports and account."
    : mode === "signup" ? "Save your reports and purchases in one place."
    : "Enter your email and we'll send you a reset link.";

  return (
    <main className="mx-auto max-w-xl px-4 py-8 md:py-12">
      <Link to="/v2" className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
      <h1 className="mt-6 text-center text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-3 text-center text-ink-2">{sub}</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input id="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-12 text-base" />
          </div>
        </div>
        {mode !== "forgot" && (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input id="password" type={show ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-12 pr-12 text-base" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-ink-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="rounded-md bg-primary-soft px-3 py-2 text-sm text-foreground">{notice}</p>}
        <Button type="submit" size="lg" className="h-12 w-full text-base transition-transform active:scale-[0.99]" disabled={loading || !email || (mode !== "forgot" && !password)}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"} <ArrowRight className="h-4 w-4" /></>}
        </Button>
        {mode === "signin" && (
          <div className="text-right"><button type="button" onClick={() => setMode("forgot")} className="text-sm font-semibold text-primary underline underline-offset-4">Forgot password?</button></div>
        )}
        <p className="border-t border-border pt-5 text-center text-sm text-ink-2">
          {mode === "signin" ? <>Don't have an account? <button type="button" onClick={() => setMode("signup")} className="font-semibold text-primary underline underline-offset-4">Sign up</button></>
            : <>Already have an account? <button type="button" onClick={() => setMode("signin")} className="font-semibold text-primary underline underline-offset-4">Sign in</button></>}
        </p>
      </form>

      <ul className="mt-8 grid gap-4 rounded-2xl bg-primary-soft/60 p-5 text-center sm:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Secure account", d: "Password sign-in with email confirmation for new accounts." },
          { icon: FileText, t: "Your checks in one place", d: "Reports you unlock are saved to My reports." },
          { icon: CreditCard, t: "Keep your pass", d: "A pass bought with the same email is linked when you sign in." },
        ].map(({ icon: I, t, d }) => (
          <li key={t} className="px-2">
            <I className="mx-auto h-7 w-7 text-primary" aria-hidden />
            <p className="mt-2 text-sm font-bold">{t}</p>
            <p className="mt-1 text-xs text-ink-2">{d}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
