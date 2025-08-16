import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  User,
  Building,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ProviderApplicationPhase1() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Primary Contact Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    
    // Business Information
    businessName: "",
    businessType: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    serviceAreas: [] as string[],
    servicesOffered: [] as string[],
    businessDescription: "",
    
    // Documents
    professionalLicense: null as File | null,
    liabilityInsurance: null as File | null,
    businessLicense: null as File | null,
    
    // Verification
    emailVerified: false,
    phoneVerified: false,
    backgroundCheckConsent: false,
    
    // Agreements
    termsAccepted: false,
    privacyAccepted: false,
  });

  const steps = [
    {
      id: 1,
      title: "Contact Information",
      description: "Primary business contact details",
      icon: User,
    },
    {
      id: 2,
      title: "Business Details",
      description: "Business information and services",
      icon: Building,
    },
    {
      id: 3,
      title: "Required Documents",
      description: "Professional credentials and insurance",
      icon: FileText,
    },
    {
      id: 4,
      title: "Verification & Agreement",
      description: "Identity verification and consent",
      icon: CheckCircle,
    },
  ];

  const businessTypes = [
    { label: "Independent Provider", value: "independent" },
    { label: "Small Business", value: "small_business" },
    { label: "Franchise", value: "franchise" },
    { label: "Enterprise", value: "enterprise" },
    { label: "Other", value: "other" },
  ];

  const availableServices = [
    { id: "beauty-wellness", label: "Beauty & Wellness", value: "beauty" },
    { id: "massage-therapy", label: "Massage Therapy", value: "therapy" },
    { id: "personal-training", label: "Personal Training & Fitness", value: "fitness" },
    { id: "healthcare-services", label: "Healthcare Services", value: "healthcare" },
    { id: "iv-therapy", label: "IV Therapy", value: "healthcare" },
    { id: "wellness-coaching", label: "Wellness Coaching", value: "therapy" },
  ];

  const serviceAreaOptions = [
    "Miami-Dade County",
    "Broward County",
    "Palm Beach County",
    "Orange County",
    "Hillsborough County",
    "Pinellas County",
  ];

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

  const handleFileUpload = (field: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      [field]: file,
    }));
  };

  const toggleServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter(a => a !== area)
        : [...prev.serviceAreas, area],
    }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { supabase } = await import("@/lib/supabase");

      // Generate unique application ID for business profile
      const applicationId = crypto.randomUUID();
      const uploadedDocuments: Array<{
        file: File;
        documentType: string;
        folder: string;
        uploadPath?: string;
        fileSize?: number;
      }> = [];

      // Prepare documents for upload
      if (formData.professionalLicense) {
        uploadedDocuments.push({
          file: formData.professionalLicense,
          documentType: 'professional_license',
          folder: 'provider-plc'
        });
      }

      if (formData.liabilityInsurance) {
        uploadedDocuments.push({
          file: formData.liabilityInsurance,
          documentType: 'liability_insurance',
          folder: 'provider-li'
        });
      }

      if (formData.businessLicense) {
        uploadedDocuments.push({
          file: formData.businessLicense,
          documentType: 'business_license',
          folder: 'provider-bl'
        });
      }

      // Upload documents to Supabase storage
      for (let doc of uploadedDocuments) {
        const fileExtension = doc.file.name.split('.').pop();
        const fileName = `${applicationId}_${doc.documentType}_${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('roam-file-storage')
          .upload(`${doc.folder}/${fileName}`, doc.file);

        if (uploadError) {
          throw new Error(`Failed to upload ${doc.documentType}: ${uploadError.message}`);
        }

        doc.uploadPath = uploadData.path;
        doc.fileSize = doc.file.size;
      }

      // Create business profile record
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .insert({
          id: applicationId,
          business_name: formData.businessName,
          contact_email: formData.email,
          phone: formData.phone,
          business_type: formData.businessType,
          service_categories: formData.servicesOffered,
          verification_status: 'pending',
          setup_completed: false,
          setup_step: 1,
          is_active: false,
          verification_notes: JSON.stringify({
            businessDescription: formData.businessDescription,
            businessAddress: {
              street: formData.businessAddress,
              city: formData.businessCity,
              state: formData.businessState,
              zip: formData.businessZip,
            },
            contactInfo: {
              firstName: formData.firstName,
              lastName: formData.lastName,
            },
            agreements: {
              backgroundCheckConsent: formData.backgroundCheckConsent,
              termsAccepted: formData.termsAccepted,
              privacyAccepted: formData.privacyAccepted,
            },
            submittedAt: new Date().toISOString(),
          })
        })
        .select()
        .single();

      if (businessError) {
        throw new Error(`Failed to create business profile: ${businessError.message}`);
      }

      // Create business_documents records for each uploaded document
      const documentRecords = uploadedDocuments.map(doc => ({
        business_id: applicationId,
        document_type: doc.documentType,
        document_name: doc.file.name,
        file_url: doc.uploadPath!,
        file_size_bytes: doc.fileSize!,
        verification_status: 'pending', // Assuming this matches your enum
        created_at: new Date().toISOString(),
      }));

      if (documentRecords.length > 0) {
        const { error: documentsError } = await supabase
          .from('business_documents')
          .insert(documentRecords);

        if (documentsError) {
          // Log error but don't fail the entire application
          console.error('Error creating document records:', documentsError);

          // Optionally, you might want to still throw an error if document tracking is critical
          // throw new Error(`Failed to create document records: ${documentsError.message}`);
        }
      }

      console.log('Application submitted successfully:', {
        businessProfile,
        documentsUploaded: uploadedDocuments.length
      });

      // Redirect to thank you page
      navigate('/provider-application/thank-you');

    } catch (error: any) {
      console.error('Application submission error:', error);
      toast({
        title: "Submission Error",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="text-sm text-roam-blue font-medium">Phase 1: Initial Application</div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
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
                      className={`hidden md:block w-24 h-1 mx-4 ${
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
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Primary Contact</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          This will be the main contact for your business account and approval notifications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        placeholder="Your Business Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type *</Label>
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) => setFormData({...formData, businessType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Business Address *</Label>
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        placeholder="Street Address"
                        value={formData.businessAddress}
                        onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="City"
                          value={formData.businessCity}
                          onChange={(e) => setFormData({...formData, businessCity: e.target.value})}
                        />
                        <Input
                          placeholder="State"
                          value={formData.businessState}
                          onChange={(e) => setFormData({...formData, businessState: e.target.value})}
                        />
                        <Input
                          placeholder="ZIP Code"
                          value={formData.businessZip}
                          onChange={(e) => setFormData({...formData, businessZip: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>


                  <div className="space-y-3">
                    <Label>Services You Offer *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableServices.map(service => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={service.id}
                            checked={formData.servicesOffered.includes(service.value)}
                            onCheckedChange={() => toggleService(service.value)}
                          />
                          <Label htmlFor={service.id} className="text-sm font-normal">
                            {service.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">Business Description *</Label>
                    <Textarea
                      id="businessDescription"
                      value={formData.businessDescription}
                      onChange={(e) => setFormData({...formData, businessDescription: e.target.value})}
                      placeholder="Briefly describe your business, experience, and what makes your services special..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      This helps us understand your business and will be used in the approval process.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Required Documents */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Required for Approval</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                          These documents are required to verify your qualifications and approve your application.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>Professional License/Certification *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-roam-blue transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload your professional license or certification
                        </p>
                        <p className="text-xs text-gray-500">
                          Massage License, Training Certificates, Medical License, etc.
                        </p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="mt-2"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('professionalLicense', file);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Liability Insurance Certificate *</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-roam-blue transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Professional liability insurance certificate
                        </p>
                        <p className="text-xs text-gray-500">
                          Current policy with adequate coverage for your services
                        </p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="mt-2"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('liabilityInsurance', file);
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Business License (if applicable)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-roam-blue transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Business license or registration
                        </p>
                        <p className="text-xs text-gray-500">
                          Required for LLCs, Corporations, and some business types
                        </p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="mt-2"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('businessLicense', file);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Verification & Agreement */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">Almost Done!</h4>
                        <p className="text-sm text-green-800 mt-1">
                          Complete the verification steps below to submit your application.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="backgroundCheckConsent"
                        checked={formData.backgroundCheckConsent}
                        onCheckedChange={(checked) =>
                          setFormData({...formData, backgroundCheckConsent: checked as boolean})
                        }
                      />
                      <Label htmlFor="backgroundCheckConsent" className="text-sm leading-relaxed">
                        I consent to a background check including criminal history and identity verification. 
                        I understand this is required for platform approval and customer safety.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="termsAccepted"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) =>
                          setFormData({...formData, termsAccepted: checked as boolean})
                        }
                      />
                      <Label htmlFor="termsAccepted" className="text-sm leading-relaxed">
                        I agree to the ROAM{" "}
                        <a
                          href="https://app.termly.io/policy-viewer/policy.html?policyUUID=8bd3c211-2aaa-4626-9910-794dc2d85aff"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-roam-blue hover:underline"
                        >
                          Terms & Conditions
                        </a>{" "}
                        and understand the platform policies for providers.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacyAccepted"
                        checked={formData.privacyAccepted}
                        onCheckedChange={(checked) =>
                          setFormData({...formData, privacyAccepted: checked as boolean})
                        }
                      />
                      <Label htmlFor="privacyAccepted" className="text-sm leading-relaxed">
                        I have read and agree to the{" "}
                        <a
                          href="https://app.termly.io/policy-viewer/policy.html?policyUUID=64dec2e3-d030-4421-86ff-a3e7864709d8"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-roam-blue hover:underline"
                        >
                          Privacy Policy
                        </a>{" "}
                        and consent to the processing of my personal data for verification and approval purposes.
                      </Label>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">What happens next?</h4>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                          <li>• Your application will be reviewed within 2-3 business days</li>
                          <li>• Background check and document verification will be conducted</li>
                          <li>• You'll receive an email with the approval decision</li>
                          <li>• If approved, you'll get a secure link to complete Phase 2 (financial setup)</li>
                        </ul>
                      </div>
                    </div>
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
                    disabled={!isStepValid(currentStep)}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      !formData.backgroundCheckConsent ||
                      !formData.termsAccepted ||
                      !formData.privacyAccepted
                    }
                    className="bg-roam-blue hover:bg-roam-blue/90"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
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

  function isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      case 2:
        return !!(formData.businessName && formData.businessType && formData.businessDescription &&
                 formData.servicesOffered.length > 0);
      case 3:
        return !!(formData.professionalLicense && formData.liabilityInsurance);
      case 4:
        return formData.backgroundCheckConsent && formData.termsAccepted && formData.privacyAccepted;
      default:
        return true;
    }
  }
}
