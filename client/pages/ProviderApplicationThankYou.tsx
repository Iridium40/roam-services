import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Mail,
  Clock,
  Home,
  Shield,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ProviderApplicationThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-roam-blue to-roam-light-blue bg-clip-text text-transparent">
                ROAM
              </span>
            </div>
            <Badge variant="outline" className="border-green-600 text-green-600">
              ✓ Application Submitted
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-8 text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Main Message */}
              <h1 className="text-3xl font-bold mb-4">
                Thank You for Your Application!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Your provider application has been successfully submitted and is now under review.
              </p>

              {/* What Happens Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-8">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  What Happens Next
                </h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Application Review</p>
                      <p className="text-blue-700">Our team will review your application and verify your documents within 2-3 business days.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Background Check</p>
                      <p className="text-blue-700">We'll conduct a comprehensive background check and identity verification for platform safety.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Approval Decision</p>
                      <p className="text-blue-700">You'll receive an email with our decision and next steps for approved applicants.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Financial Setup (If Approved)</p>
                      <p className="text-blue-700">Complete Phase 2 with Stripe Identity verification and bank account setup to start earning.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-8">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Important Information</h4>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                      <li>• Check your email regularly for updates on your application status</li>
                      <li>• The approval email will contain a secure link for Phase 2 setup</li>
                      <li>• If you have questions, contact our support team</li>
                      <li>• Keep your documents and certifications up to date</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Application Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-8">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Application Summary
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Application ID:</span> #APP-{Date.now().toString().slice(-6)}</p>
                  <p><span className="font-medium">Submitted:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="font-medium">Status:</span> <span className="text-blue-600 font-medium">Under Review</span></p>
                  <p><span className="font-medium">Expected Response:</span> Within 2-3 business days</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button 
                  asChild 
                  className="w-full bg-roam-blue hover:bg-roam-blue/90"
                  size="lg"
                >
                  <Link to="/home">
                    <Home className="w-4 h-4 mr-2" />
                    Return to Home
                  </Link>
                </Button>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Link to="/providers">
                      View Provider Information
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Link to="/contact">
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Footer Message */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Thank you for your interest in joining the ROAM provider network. 
                  We look forward to reviewing your application!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
