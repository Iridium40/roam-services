import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  CreditCard,
  Building2,
  Star,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Users,
  Settings,
  Banknote,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import StripeIdentityVerification from "@/components/StripeIdentityVerification";

export default function ProviderApplicationPhase2() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Get approval token from URL
  const approvalToken = searchParams.get('token');

  const [formData, setFormData] = useState({
    // Tax Information
    taxIdType: "", // ssn, ein
    taxId: "",
    businessEin: "",
    
    // Banking (Plaid Connection)
    bankAccountConnected: false,
    selectedAccountId: "",
    
    // Detailed Service Configuration
    serviceSettings: [] as any[],
    
    // Pricing
    hourlyRates: {} as Record<string, number>,
    mobileFees: {} as Record<string, number>,
    
    // Staff (if applicable)
    hasStaff: false,
    staffMembers: [] as any[],
    
    // Availability
    weeklyAvailability: {},
    timeZone: "America/New_York",
    
    // Profile Details
    profilePhotos: [] as File[],
    detailedBio: "",
    specialCertifications: [] as string[],
    
    // Platform Setup Complete
    setupComplete: false,
  });

  const steps = [
    {
      id: 1,
      title: "Identity Verification",
      description: "Complete Stripe Identity verification",
      icon: Shield,
    },
    {
      id: 2,
      title: "Tax & Banking",
      description: "Tax information and bank account setup",
      icon: CreditCard,
    },
    {
      id: 3,
      title: "Service Configuration",
      description: "Detailed pricing and service setup",
      icon: Settings,
    },
    {
      id: 4,
      title: "Profile & Availability",
      description: "Complete your provider profile",
      icon: Star,
    },
    {
      id: 5,
      title: "Platform Setup",
      description: "Final platform configuration",
      icon: CheckCircle,
    },
  ];

  useEffect(() => {
    // Verify approval token and load provider data
    if (!approvalToken) {
      toast({
        title: "Access Denied",
        description: "You need a valid approval link to access this page.",
        variant: "destructive",
      });
      return;
    }
    
    // Load approved provider data from backend
    loadProviderData();
  }, [approvalToken]);

  const loadProviderData = async () => {
    try {
      // Here you would fetch the approved provider data using the token
      // This would include the Phase 1 information they submitted
      console.log("Loading provider data for token:", approvalToken);
    } catch (error) {
      console.error("Error loading provider data:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleVerificationComplete = (verificationData: any) => {
    setIdentityVerified(true);
    setVerificationPending(false);
    console.log('Identity verification completed:', verificationData);
    
    toast({
      title: "Identity Verified",
      description: "Your identity has been successfully verified.",
    });
  };

  const handleVerificationPending = () => {
    setVerificationPending(true);
    setIdentityVerified(false);
  };

  const handlePlaidConnection = async () => {
    try {
      // Initialize Plaid Link
      // This would open Plaid Link modal for bank account connection
      console.log("Initializing Plaid Link...");
      
      // Simulate successful connection
      setBankConnected(true);
      setFormData(prev => ({
        ...prev,
        bankAccountConnected: true,
      }));
      
      toast({
        title: "Bank Account Connected",
        description: "Your bank account has been successfully connected for payouts.",
      });
    } catch (error) {
      console.error("Plaid connection error:", error);
      toast({
        title: "Connection Error", 
        description: "Failed to connect bank account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Submit final provider setup
      // This would create the full provider account and activate them
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Setup Complete!",
        description: "Your provider account is now active. Welcome to ROAM!",
      });
      
      // Redirect to provider dashboard
      window.location.href = '/provider/dashboard';
      
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "There was an error completing your setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show error if no token
  if (!approvalToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You need a valid approval link to access the Phase 2 onboarding process.
            </p>
            <Button asChild className="w-full">
              <Link to="/provider-portal">Return to Provider Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
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
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="border-green-600 text-green-600">
                ✓ Approved
              </Badge>
              <div className="text-sm text-roam-blue font-medium">Phase 2: Financial Setup</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Congratulations! You've been approved!</h1>
            <p className="text-gray-600">
              Complete your financial setup to start accepting bookings and earning with ROAM.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      currentStep > step.id
                        ? "bg-roam-blue border-roam-blue text-white"
                        : currentStep === step.id
                          ? "border-roam-blue text-roam-blue"
                          : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden md:block w-16 h-1 mx-2 ${
                        currentStep > step.id ? "bg-roam-blue" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold">{steps[currentStep - 1].title}</h2>
              <p className="text-foreground/70">{steps[currentStep - 1].description}</p>
            </div>
          </div>

          {/* Form Content */}
          <Card className="border-border/50">
            <CardContent className="p-8">
              {/* Step 1: Identity Verification */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Complete Identity Verification</h3>
                    <p className="text-gray-600">
                      Stripe Identity verification is required for tax reporting and payment processing.
                    </p>
                  </div>

                  <StripeIdentityVerification
                    onVerificationComplete={handleVerificationComplete}
                    onVerificationPending={handleVerificationPending}
                    className="mb-6"
                  />

                  {(identityVerified || verificationPending) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-900">
                            Identity Verification {identityVerified ? 'Complete' : 'In Progress'}
                          </h4>
                          <p className="text-sm text-green-800 mt-1">
                            {identityVerified 
                              ? 'Your identity has been verified. You can proceed to the next step.'
                              : 'Your identity verification is being processed. This usually takes a few minutes.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Tax & Banking */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tax Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="taxIdType">Tax ID Type *</Label>
                        <Select
                          value={formData.taxIdType}
                          onValueChange={(value) => setFormData({...formData, taxIdType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ssn">Social Security Number (SSN)</SelectItem>
                            <SelectItem value="ein">Employer Identification Number (EIN)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="taxId">
                          {formData.taxIdType === 'ein' ? 'EIN' : 'SSN'} *
                        </Label>
                        <Input
                          id="taxId"
                          value={formData.taxId}
                          onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                          placeholder={formData.taxIdType === 'ein' ? 'XX-XXXXXXX' : 'XXX-XX-XXXX'}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Bank Account Connection</h3>
                    
                    {!bankConnected ? (
                      <div className="text-center py-8">
                        <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium mb-2">Connect Your Bank Account</h4>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Securely connect your bank account using Plaid for fast and reliable payouts.
                        </p>
                        <Button 
                          onClick={handlePlaidConnection}
                          className="bg-roam-blue hover:bg-roam-blue/90"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Connect Bank Account
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-900">Bank Account Connected</h4>
                            <p className="text-sm text-green-800 mt-1">
                              Your bank account has been connected successfully. Payouts will be processed automatically.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Service Configuration */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Service Pricing</h3>
                    <p className="text-gray-600 mb-6">
                      Set your rates for each service. You can adjust these later in your dashboard.
                    </p>
                    
                    <div className="space-y-4">
                      {/* This would be dynamically generated based on services selected in Phase 1 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Massage Therapy</Label>
                          <p className="text-xs text-gray-500">60-minute session</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="massage-rate">Hourly Rate</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="massage-rate"
                              type="number"
                              placeholder="150"
                              className="pl-9"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Travel & Mobile Fees</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mobile-fee">Mobile Service Fee</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="mobile-fee"
                              type="number"
                              placeholder="25"
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="travel-radius">Travel Radius (miles)</Label>
                          <Input
                            id="travel-radius"
                            type="number"
                            placeholder="15"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Profile & Availability */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Complete Your Profile</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="detailed-bio">Detailed Bio</Label>
                        <Textarea
                          id="detailed-bio"
                          value={formData.detailedBio}
                          onChange={(e) => setFormData({...formData, detailedBio: e.target.value})}
                          placeholder="Share your experience, training, specialties, and what makes your services unique..."
                          rows={6}
                          className="resize-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Profile Photos</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <p className="text-sm text-gray-600">
                            Upload professional photos (optional but recommended)
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Availability Setup</h3>
                    <p className="text-gray-600 mb-4">
                      Set your general availability. You can always adjust this in your dashboard.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        You'll be able to configure detailed availability, blackout dates, and specific time slots in your provider dashboard after setup is complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Platform Setup Complete */}
              {currentStep === 5 && (
                <div className="space-y-6 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold">You're All Set!</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Your provider account setup is complete. You're now ready to start accepting bookings and earning with ROAM.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
                    <h4 className="font-medium text-green-900 mb-3">What's Next:</h4>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li>• Access your provider dashboard</li>
                      <li>• Set detailed availability and scheduling preferences</li>
                      <li>• Start receiving booking requests from customers</li>
                      <li>• Track your earnings and manage your business</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    onClick={handleNext}
                    className="bg-roam-blue hover:bg-roam-blue/90"
                    disabled={!isStepValidPhase2(currentStep)}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "Activating Account..." : "Complete Setup & Go Live"}
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  function isStepValidPhase2(step: number): boolean {
    switch (step) {
      case 1:
        return identityVerified || verificationPending;
      case 2:
        return !!(formData.taxIdType && formData.taxId && bankConnected);
      case 3:
        return true; // Service configuration is optional for now
      case 4:
        return true; // Profile completion is optional for now
      case 5:
        return true;
      default:
        return true;
    }
  }
}
