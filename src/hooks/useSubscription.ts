import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
  subscriptionStatus: string | null;
  userId: string | null;
  expiresAt?: string | null;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    isAdmin: false,
    loading: true,
    subscriptionStatus: null,
    userId: null,
  });

  useEffect(() => {
    let isMounted = true;

    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (isMounted) {
            setState({
              isPremium: false,
              isAdmin: false,
              loading: false,
              subscriptionStatus: null,
              userId: null,
            });
          }
          return;
        }

        // Fetch profile and admin status in parallel
        const [profileResult, adminResult, purchaseResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("subscription_status")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
          supabase.from("subscription_purchases").select("product,expires_at").eq("user_id", user.id).eq("status", "paid").gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

        const activePass = purchaseResult.data;
        const subscriptionStatus = activePass?.product === "three_month_pass" ? "three_month" : activePass?.product === "yearly_access" ? "yearly" : profileResult.data?.subscription_status || "free";
        const isAdmin = adminResult.data === true;
        
        const hasActiveSubscription = Boolean(activePass) || ["active", "monthly", "3month"].includes(subscriptionStatus) || (subscriptionStatus === "yearly" && !purchaseResult.data && !["three_month"].includes(profileResult.data?.subscription_status || ""));
        const isPremium = isAdmin || hasActiveSubscription;

        if (isMounted) {
          setState({
            isPremium,
            isAdmin,
            loading: false,
            subscriptionStatus,
            userId: user.id,
            expiresAt: activePass?.expires_at ?? null,
          });
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        if (isMounted) {
          setState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    checkSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
