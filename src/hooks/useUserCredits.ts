import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export function useUserCredits() {
  const { user, loading: authLoading } = useAuthUser();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setCredits(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("user_credits")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) console.error("useUserCredits:", error);
    setCredits((data?.credits as number) ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refetch();
  }, [authLoading, refetch]);

  return { credits, loading, refetch };
}