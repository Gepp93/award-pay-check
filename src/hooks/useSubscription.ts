import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
  subscriptionStatus: string | null;
  userId: string | null;
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
        const [profileResult, adminResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("subscription_status")
            .eq("id", user.id)
            .maybeSingle(),
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        ]);

        const subscriptionStatus = profileResult.data?.subscription_status || "free";
        const isAdmin = adminResult.data === true;
        
        const hasActiveSubscription = ["active", "monthly", "yearly"].includes(subscriptionStatus);
        const isPremium = isAdmin || hasActiveSubscription;

        if (isMounted) {
          setState({
            isPremium,
            isAdmin,
            loading: false,
            subscriptionStatus,
            userId: user.id,
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
