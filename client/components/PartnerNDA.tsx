import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Shield,
  AlertCircle,
  CheckCircle,
  Download,
  ArrowRight,
} from "lucide-react";

interface PartnerNDAProps {
  onAccepted?: (signatureData: SignatureData) => void;
  onCancel?: () => void;
  businessName?: string;
  className?: string;
}

interface SignatureData {
  fullName: string;
  effectiveDate: string;
  agreedToNDA: boolean;
  timestamp: Date;
}

export default function PartnerNDA({ 
  onAccepted, 
  onCancel, 
  businessName,
  className 
}: PartnerNDAProps) {
  const [signatureData, setSignatureData] = useState<SignatureData>({
    fullName: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    agreedToNDA: false,
    timestamp: new Date(),
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!signatureData.fullName || !signatureData.effectiveDate || !signatureData.agreedToNDA) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onAccepted) {
        onAccepted({
          ...signatureData,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error submitting NDA:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePreviewPDF = () => {
    // In a real implementation, this would generate and download a PDF
    alert("PDF preview would open in a new window. This is a demo implementation.");
  };

  return (
    <div className={className}>
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            ROAM Service Partner Non-Disclosure Agreement
          </CardTitle>
          <Badge variant="outline" className="border-roam-blue text-roam-blue">
            Required for Partnership
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* NDA Content */}
          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border">
            <div className="space-y-4 text-sm leading-relaxed">
              <p className="text-center text-lg font-semibold text-gray-900">
                ROAM Service Partner Non-Disclosure Agreement
              </p>

              <p>
                This Non-Disclosure Agreement ("Agreement") is entered into, by and among the following parties:
              </p>

              <div className="ml-4 space-y-1">
                <p>1. ROAM Member, individually referred to as "Member" or "User",</p>
                <p>2. ROAM 30A LLC (d.b.a. ROAM), a Florida corporation with its principal place of business located at 618 Cannonball Lane, Inlet Beach FL. 42461, referred to as "Platform",</p>
                <p>3. ROAM Service Partner or Business Entity Name, individually or collectively referred to as "Service Partner", collectively referred to as the "Parties" and individually as a "Party".</p>
              </div>

              <p>
                WHEREAS, the Parties wish to engage in discussions related to [describe the purpose of the interaction, e.g., "the provision and receipt of certain services related to "], (the "Purpose");
              </p>

              <p>
                WHEREAS, in the course of these discussions, the Parties may disclose to each other certain confidential and proprietary information that the disclosing Party desires the receiving Party to treat as confidential.
              </p>

              <p>
                NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the Parties agree as follows:
              </p>

              <div className="space-y-3">
                <p className="font-semibold">1. Definition of Confidential Information</p>
                <p>
                  For purposes of this Agreement, "Confidential Information" shall include all information, regardless of whether it is in tangible form, disclosed by any Party to the other Parties that is marked or designated as confidential or that, under the circumstances of disclosure, ought to be treated as confidential. Confidential Information includes, without limitation, personal information, location data of the Member, operational processes, and business strategies. Confidential Information does not include information that is publicly known through no breach of this Agreement by the receiving Party.
                </p>

                <p className="font-semibold">2. Obligations of Confidentiality</p>
                <div className="ml-4 space-y-2">
                  <p>a. The Service Partner and the ROAM 30A LLC agree not to disclose the Member's location or personal information to any third party, including on social media or any other public forum.</p>
                  <p>b. The Service Partner and the ROAM 30A LLC agree to take all reasonable precautions to protect the confidentiality of the Confidential Information and to prevent the unauthorized disclosure to any third party.</p>
                  <p>c. The Service Partner will be held responsible for any breach of this Agreement.</p>
                  <p>d. ROAM 30A LLC will be held harmless by the Member and will not be deemed at fault in the event of a breach of this Agreement by the Service Partner.</p>
                </div>

                <p>
                  The obligations of this Agreement shall remain in effect for [term, e.g., "two (2) years"] from the date of disclosure of any Confidential Information or until the Confidential Information disclosed under this Agreement ceases to be confidential.
                </p>

                <p>
                  In the event of a breach or threatened breach by the Service Partner of the provisions of this Agreement, the Member and ROAM 30A LLC shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies provided by law or equity.
                </p>

                <p>
                  This Agreement shall be governed by and construed in accordance with the laws of Florida, without regard to its conflict of law principles.
                </p>

                <p>
                  This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior agreements, whether written or oral, relating to such subject matter.
                </p>

                <p className="font-semibold">
                  IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.
                </p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Electronic Signature</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full legal name"
                  value={signatureData.fullName}
                  onChange={(e) =>
                    setSignatureData(prev => ({
                      ...prev,
                      fullName: e.target.value
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={signatureData.effectiveDate}
                  onChange={(e) =>
                    setSignatureData(prev => ({
                      ...prev,
                      effectiveDate: e.target.value
                    }))
                  }
                  required
                />
              </div>
            </div>

            {businessName && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Business/Entity:</strong> {businessName}
                </p>
              </div>
            )}

            <div className="flex items-start space-x-3 mt-6">
              <Checkbox
                id="agreementConsent"
                checked={signatureData.agreedToNDA}
                onCheckedChange={(checked) =>
                  setSignatureData(prev => ({
                    ...prev,
                    agreedToNDA: checked as boolean
                  }))
                }
                className="mt-1"
              />
              <Label htmlFor="agreementConsent" className="text-sm leading-relaxed">
                I have read, understood, and agree to be bound by the terms of this 
                Non-Disclosure Agreement. I understand that this is a legally binding 
                agreement and that my electronic signature has the same legal effect 
                as a handwritten signature.
              </Label>
            </div>
          </div>

          {/* Important Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This agreement protects customer privacy and 
              business confidentiality. Violation of this agreement may result in 
              immediate termination of your partnership and legal action.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={generatePreviewPDF}
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Preview PDF
              </Button>
              
              {onCancel && (
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </Button>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                !signatureData.fullName ||
                !signatureData.effectiveDate ||
                !signatureData.agreedToNDA ||
                isSubmitting
              }
              className="bg-roam-blue hover:bg-roam-blue/90"
              size="lg"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sign & Accept Agreement
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
