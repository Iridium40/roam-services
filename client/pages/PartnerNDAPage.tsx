import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PartnerNDA from "@/components/PartnerNDA";
import { useToast } from "@/hooks/use-toast";

export default function PartnerNDAPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNDAAccepted = (signatureData: any) => {
    console.log('NDA signed:', signatureData);
    
    toast({
      title: "NDA Signed Successfully",
      description: "Your Non-Disclosure Agreement has been recorded. You can now proceed with the onboarding process.",
      variant: "default",
    });

    // Redirect to next step in onboarding or dashboard
    navigate("/provider-dashboard", {
      state: {
        message: "NDA completed successfully! Your partnership application is progressing.",
        ndaCompleted: true,
      },
    });
  };

  const handleCancel = () => {
    navigate("/provider-portal");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/provider-portal" className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Portal</span>
                </Link>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
                ROAM
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Partner Non-Disclosure Agreement
            </h1>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              As part of the ROAM partner onboarding process, we require all service 
              partners to sign our Non-Disclosure Agreement to protect customer privacy 
              and maintain the confidentiality of sensitive information.
            </p>
          </div>

          {/* NDA Component */}
          <PartnerNDA
            onAccepted={handleNDAAccepted}
            onCancel={handleCancel}
            businessName="Service Provider Business" // This could be passed from props or state
            className="mb-8"
          />

          {/* Additional Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-yellow-900 mb-2">
              What happens after signing?
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Your NDA signature will be securely stored</li>
              <li>• You'll receive a copy via email for your records</li>
              <li>• You can proceed with document verification</li>
              <li>• Background check and final approval process begins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
