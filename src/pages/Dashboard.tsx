import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/NavBar";
import { Calendar, DollarSign, Download, Mail, Award, Briefcase, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState<any[]>([]);
  const [awardInfo, setAwardInfo] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      loadUserData(session.user.id);
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

  const loadUserData = async (userId: string) => {
    // Load award info
    const { data: profileData } = await supabase
      .from("profiles")
      .select("award_id, award_name, award_code, industry, job_type, employment_type, onboarding_completed")
      .eq("id", userId)
      .single();

    if (profileData?.onboarding_completed) {
      setAwardInfo({
        awardId: profileData.award_id,
        awardName: profileData.award_name,
        awardCode: profileData.award_code,
        industry: profileData.industry,
        jobType: profileData.job_type,
        employmentType: profileData.employment_type,
      });
    }

    // Load calculations
    const { data: calcData } = await supabase
      .from("calculations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (calcData) {
      setCalculations(calcData);
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
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Your award information and calculation history
          </p>
        </div>

        {awardInfo && (
          <Card className="bg-card/50 backdrop-blur-lg border-border shadow-card mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Award className="h-6 w-6 text-accent" />
                    Your Award
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Selected during onboarding
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/onboarding")}
                >
                  Update Award
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                    <p className="text-sm text-muted-foreground mb-1">Award Name</p>
                    <p className="font-semibold text-lg">{awardInfo.awardName}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Award Code</p>
                    <p className="font-mono font-medium">{awardInfo.awardCode}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Industry</p>
                      <p className="font-medium">{awardInfo.industry}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserCircle className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Job Classification</p>
                      <p className="font-medium">{awardInfo.jobType}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-accent mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Employment Type</p>
                      <p className="font-medium">{awardInfo.employmentType}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Calculation History</h2>
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
