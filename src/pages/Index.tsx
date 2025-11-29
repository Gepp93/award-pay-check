import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Check if you were paid correctly
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Simple 3-step wizard to check if you were paid correctly for your last shift.
          Based on Australian Modern Awards.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button 
            size="lg" 
            onClick={() => navigate("/step1-who-are-you")}
            className="text-lg px-8"
          >
            Check my pay →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
