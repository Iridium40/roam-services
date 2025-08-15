import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignatureData {
  fullName: string;
  email: string;
  effectiveDate: string;
  agreedToCodeOfConduct: boolean;
  timestamp: Date;
}

interface ProviderCodeOfConductProps {
  onAccepted?: (signatureData: SignatureData) => void;
  businessName?: string;
  className?: string;
}

export default function ProviderCodeOfConduct({
  onAccepted,
  businessName = "",
  className = "",
}: ProviderCodeOfConductProps) {
  const [signatureData, setSignatureData] = useState({
    fullName: "",
    email: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    agreedToCodeOfConduct: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSignature = async () => {
    if (!signatureData.fullName || !signatureData.email || !signatureData.agreedToCodeOfConduct) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and agree to the Code of Conduct.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const signatureComplete: SignatureData = {
        ...signatureData,
        timestamp: new Date(),
      };

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Code of Conduct Accepted",
        description: "Thank you for acknowledging our service provider standards.",
      });

      onAccepted?.(signatureComplete);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process acknowledgment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewPDF = () => {
    // This would generate/show a PDF preview in a real implementation
    toast({
      title: "PDF Preview",
      description: "PDF preview functionality would open here.",
    });
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card className="border-border/50">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileText className="w-8 h-8 text-roam-blue" />
            <Badge variant="secondary" className="bg-roam-light-blue/10 text-roam-blue">
              Service Provider Standards
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold">
            ROAM Service Provider Code of Conduct
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Please review and acknowledge our professional standards and expectations
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Code of Conduct Content */}
          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to ROAM! As a service provider on our platform, you play a crucial role in 
                delivering exceptional concierge services to our clients. To ensure a positive experience 
                for everyone involved, we uphold high standards of professionalism and conduct. Here's 
                what you need to know:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    1. Professionalism
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Maintain a professional demeanor at all times when interacting with 
                    clients and fellow service providers. Respect client privacy and confidentiality.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    2. Service Excellence
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Strive for excellence in every service you provide. Understand 
                    and fulfill client requests promptly and efficiently.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    3. Communication
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Communicate clearly and courteously with clients and respond 
                    promptly to inquiries and requests.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    4. Platform Compliance
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Adhere to ROAM's policies and guidelines while using the 
                    platform. This includes accurate reporting, proper use of 
                    tools provided, and compliance with all applicable laws and regulations.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    5. Continuous Learning
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Engage with ROAM's training resources and stay updated on 
                    best practices to enhance your skills and knowledge.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    6. Conflict Resolution
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    Handle any issues or conflicts with professionalism and aim to 
                    resolve them amicably. By adhering to these principles, you contribute to the 
                    positive reputation of ROAM and help create memorable experiences for our clients. Thank 
                    you for being part of our community - we're here to support your success every step 
                    of the way!
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed text-sm">
                  This code of conduct aims to reflect the professionalism and 
                  commitment expected from concierge service providers while maintaining the 
                  supportive tone reminiscent of ROAM's training and support materials.
                </p>
              </div>
            </div>
          </div>

          {/* Preview PDF Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handlePreviewPDF}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Preview PDF</span>
            </Button>
          </div>

          {/* Signature Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-roam-blue mr-2" />
              Electronic Acknowledgment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={signatureData.fullName}
                  onChange={(e) =>
                    setSignatureData(prev => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="Enter your full legal name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={signatureData.email}
                  onChange={(e) =>
                    setSignatureData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreedToCodeOfConduct"
                  checked={signatureData.agreedToCodeOfConduct}
                  onCheckedChange={(checked) =>
                    setSignatureData(prev => ({
                      ...prev,
                      agreedToCodeOfConduct: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="agreedToCodeOfConduct" className="text-sm leading-relaxed">
                  I acknowledge that I have read, understood, and agree to abide by the 
                  ROAM Service Provider Code of Conduct. I understand that failure to comply 
                  with these standards may result in suspension or termination from the platform.
                </Label>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>Effective Date: {signatureData.effectiveDate}</span>
                {businessName && <span>Business: {businessName}</span>}
              </div>

              <Button
                onClick={handleSignature}
                disabled={isSubmitting || !signatureData.fullName || !signatureData.email || !signatureData.agreedToCodeOfConduct}
                className="w-full bg-roam-blue hover:bg-roam-blue/90"
              >
                {isSubmitting ? "Processing..." : "Acknowledge Code of Conduct"}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
