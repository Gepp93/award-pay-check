import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/ui/badge";
import { User, Loader2, Shield } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const Profile = () => {
  const navigate = useNavigate();
  const { isAdmin } = useSubscription();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndLoadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    checkUserAndLoadProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="checker-page checker-form">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-semibold">Profile</h1>
          {isAdmin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
        </div>

        {/* Account Info */}
        <section className="border-t-2 border-foreground pt-6">
          <header className="checker-heading">
            <h2 className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </h2>
            <p>Your account details</p>
          </header>
          <div className="space-y-4 divide-y divide-rule [&>div]:py-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account Created</label>
              <p className="text-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
              </p>
            </div>
            {profile?.award_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Award</label>
                <p className="text-foreground">{profile.award_name}</p>
              </div>
            )}
            {profile?.classification_name && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Classification</label>
                <p className="text-foreground">{profile.classification_name}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
