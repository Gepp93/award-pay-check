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

const claimedUsers = new Set<string>();

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

        // Link guest pass purchases made with this confirmed email (once per session per user).
        if (!claimedUsers.has(user.id)) {
          claimedUsers.add(user.id);
          const { error: claimError } = await supabase.rpc("claim_my_passes");
          if (claimError) console.error("claim_my_passes error:", claimError);
        }

        // Fetch profile and admin status in parallel
        const [profileResult, adminResult, purchaseResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("subscription_status")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
          supabase.from("subscription_purchases").select("product,expires_at").eq("user_id", user.id).eq("status", "paid").order("expires_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

        const purchase = purchaseResult.data;
        const activePass = purchase?.expires_at && new Date(purchase.expires_at).getTime() > Date.now() ? purchase : null;
        const subscriptionStatus = activePass?.product === "three_month_pass" ? "three_month" : activePass?.product === "yearly_access" ? "yearly" : profileResult.data?.subscription_status || "free";
        const isAdmin = adminResult.data === true;
        
        const hasActiveSubscription = Boolean(activePass) || ["active", "monthly", "3month"].includes(subscriptionStatus) || (subscriptionStatus === "yearly" && !purchase);
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
