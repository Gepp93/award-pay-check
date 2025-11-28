import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { Calendar, DollarSign, Download, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadCalculations(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCalculations = async (userId: string) => {
    const { data } = await supabase
      .from("calculations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setCalculations(data);
    }
  };

  const handleExport = () => {
    toast.info("PDF export coming soon!");
  };

  const handleEmail = () => {
    toast.info("Email feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Calculations</h1>
          <p className="text-muted-foreground">
            Review and export your saved pay calculations
          </p>
        </div>

        <div className="grid gap-4">
          {calculations.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-lg border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No calculations saved yet.
                </p>
                <Button
                  onClick={() => navigate("/calculator")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Create Your First Calculation
                </Button>
              </CardContent>
            </Card>
          ) : (
            calculations.map((calc) => (
              <Card
                key={calc.id}
                className="bg-card/50 backdrop-blur-lg border-border hover:shadow-glow transition-all"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-accent" />
                      {format(new Date(calc.created_at), "PPP")}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExport}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleEmail}>
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Shift Details
                      </p>
                      <p className="font-medium">
                        {calc.shift_data.startTime} - {calc.shift_data.endTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {calc.shift_data.dayOfWeek}, {calc.shift_data.breakMinutes} min break
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-8 w-8 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Pay
                        </p>
                        <p className="text-2xl font-bold text-success">
                          ${calc.breakdown.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
