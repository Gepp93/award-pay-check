import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, Shield } from "lucide-react";
import { PublicNavBar } from "@/components/PublicNavBar";

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const product = searchParams.get("product");

  const isReport = product === "report";

  return (
    <>
      <PublicNavBar />
      <div className="min-h-screen flex items-center justify-center p-4 bg-background pt-24">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Thank You!</h1>
              {isReport ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">Official PDF Report</span>
                  </div>
                  <p className="text-muted-foreground">
                    Your report is being generated and will be emailed to you shortly.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <Shield className="h-5 w-5" />
                    <span className="font-semibold">Recovery Service</span>
                  </div>
                  <p className="text-muted-foreground">
                    We've received your claim request. Our team will review your case and be in touch within 2 business days.
                  </p>
                </>
              )}
            </div>

            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
