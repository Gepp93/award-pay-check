import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      // Redirect authenticated users to the new wizard
      navigate("/new-check-step-1");
    };

    checkUserAndRedirect();
  }, [navigate]);

  return null;
};

export default Dashboard;
