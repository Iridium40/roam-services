import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProviderCodeOfConduct from "@/components/ProviderCodeOfConduct";
import { useToast } from "@/hooks/use-toast";

export default function ProviderCodeOfConductPage() {
  const { toast } = useToast();

  const handleCodeOfConductAccepted = (signatureData: any) => {
    console.log('Code of Conduct acknowledged:', signatureData);
    
    toast({
      title: "Code of Conduct Acknowledged",
      description: "Thank you for acknowledging our service provider standards. You can now proceed with your application.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/provider-portal">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Portal
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                    alt="ROAM Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
                  ROAM
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <ProviderCodeOfConduct
            onAccepted={handleCodeOfConductAccepted}
            className="max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
