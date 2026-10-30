import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/** Public page reached from the password-reset email. */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    toast.success("Password updated");
    navigate("/reports");
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-extrabold">Set a new password</h1>
      {!ready ? (
        <p className="mt-6 text-center text-ink-2">Open this page from the link in your reset email. <Link to="/auth" className="font-semibold text-primary underline">Back to sign in</Link></p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 text-base" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="h-12 w-full" disabled={loading || password.length < 6}>{loading ? "Saving…" : "Save new password"}</Button>
        </form>
      )}
    </main>
  );
}
