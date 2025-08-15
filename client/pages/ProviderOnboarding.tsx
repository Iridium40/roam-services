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
  User,
  Building,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Camera,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import StripeIdentityVerification from "@/components/StripeIdentityVerification";
import PartnerNDA from "@/components/PartnerNDA";

export default function ProviderOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    socialSecurity: "",
    driversLicense: "",

    // Business Information
    businessName: "",
    businessType: "",
    yearsExperience: "",
    serviceCategories: [] as string[],
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",

    // Verification Documents
    idDocument: null as File | null,
    businessLicense: null as File | null,
    insurance: null as File | null,
    certifications: [] as File[],

    // Professional Details
    bio: "",
    specialties: [] as string[],
    languages: [] as string[],

    // Agreement
    backgroundConsent: false,
    termsAccepted: false,
    privacyAccepted: false,
    ndaAccepted: false,
  });

  const steps = [
    {
      id: 1,
      title: "Personal Info",
      description: "Basic personal information",
      icon: User,
    },
    {
      id: 2,
      title: "Business Details",
      description: "Your business information",
      icon: Building,
    },
    {
      id: 3,
      title: "NDA Agreement",
      description: "Non-disclosure agreement",
      icon: FileText,
    },
    {
      id: 4,
      title: "Verification",
      description: "Identity and document verification",
      icon: Shield,
    },
    {
      id: 5,
      title: "Professional Profile",
      description: "Services and expertise",
      icon: Star,
    },
    {
      id: 6,
      title: "Review & Submit",
      description: "Final review and submission",
      icon: CheckCircle,
    },
  ];

  const serviceCategories = [
    "Beauty & Wellness",
    "Massage Therapy",
    "Personal Training",
    "Healthcare",
    "Home Services",
    "Wellness Coaching",
  ];

  const specialtiesByCategory = {
    "Beauty & Wellness": [
      "Hair Styling",
      "Makeup",
      "Nails",
      "Skincare",
      "Lashes",
    ],
    "Massage Therapy": [
      "Deep Tissue",
      "Swedish",
      "Sports",
      "Prenatal",
      "Hot Stone",
    ],
    "Personal Training": [
      "Weight Training",
      "HIIT",
      "Yoga",
      "Pilates",
      "Cardio",
    ],
    Healthcare: [
      "General Medicine",
      "Physical Therapy",
      "Mental Health",
      "Nutrition",
    ],
    "Home Services": ["Cleaning", "Organization", "Pet Care", "Childcare"],
    "Wellness Coaching": [
      "Life Coaching",
      "Nutrition",
      "Mindfulness",
      "Stress Management",
    ],
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
  };

  const handleVerificationPending = () => {
    setVerificationPending(true);
    setIdentityVerified(false);
  };

  const handleNDAAccepted = (signatureData: any) => {
    console.log('NDA signed:', signatureData);
    setFormData(prev => ({
      ...prev,
      ndaAccepted: true,
    }));
    // Automatically advance to next step
    handleNext();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      // Redirect to success page
      alert(
        "Application submitted successfully! You'll receive an email within 3-5 business days.",
      );
    }, 3000);
  };

  const handleFileUpload = (field: string, file: File) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const toggleServiceCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceCategories: prev.serviceCategories.includes(category)
        ? prev.serviceCategories.filter((c) => c !== category)
        : [...prev.serviceCategories, category],
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
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
            <Badge
              variant="outline"
              className="border-roam-blue text-roam-blue"
            >
              Provider Application
            </Badge>
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
              <h2 className="text-2xl font-bold">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-foreground/70">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <Card className="border-border/50">
            <CardContent className="p-8">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driversLicense">
                        Driver's License # *
                      </Label>
                      <Input
                        id="driversLicense"
                        value={formData.driversLicense}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            driversLicense: e.target.value,
                          })
                        }
                        placeholder="License number"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">
                          Why we need this information
                        </h4>
                        <p className="text-sm text-yellow-800 mt-1">
                          This information is required for identity verification
                          and background checks to ensure the safety and trust
                          of our platform. All data is encrypted and securely
                          stored.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessName: e.target.value,
                          })
                        }
                        placeholder="Your Business Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type *</Label>
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, businessType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sole_proprietorship">
                            Sole Proprietorship
                          </SelectItem>
                          <SelectItem value="llc">LLC</SelectItem>
                          <SelectItem value="corporation">
                            Corporation
                          </SelectItem>
                          <SelectItem value="partnership">
                            Partnership
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">
                      Years of Experience *
                    </Label>
                    <Select
                      value={formData.yearsExperience}
                      onValueChange={(value) =>
                        setFormData({ ...formData, yearsExperience: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Service Categories *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {serviceCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={category}
                            checked={formData.serviceCategories.includes(
                              category,
                            )}
                            onCheckedChange={() =>
                              toggleServiceCategory(category)
                            }
                          />
                          <Label
                            htmlFor={category}
                            className="text-sm font-normal"
                          >
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Business Address *</Label>
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        placeholder="Street Address"
                        value={formData.businessAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessAddress: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="City"
                          value={formData.businessCity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessCity: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="State"
                          value={formData.businessState}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessState: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="ZIP Code"
                          value={formData.businessZip}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              businessZip: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: NDA Agreement */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">
                      Non-Disclosure Agreement
                    </h3>
                    <p className="text-gray-600">
                      Please review and sign our NDA to protect customer privacy and confidential information.
                    </p>
                  </div>

                  <PartnerNDA
                    onAccepted={handleNDAAccepted}
                    businessName={formData.businessName}
                    className="max-w-none"
                  />
                </div>
              )}

              {/* Step 4: Identity Verification with Stripe */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <StripeIdentityVerification
                    onVerificationComplete={handleVerificationComplete}
                    onVerificationPending={handleVerificationPending}
                    className="mb-6"
                  />

                  {/* Professional Documents Upload - Only show after identity verification */}
                  {(identityVerified || verificationPending) && (
                    <div className="space-y-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-900">
                              Identity Verification {identityVerified ? 'Complete' : 'In Progress'}
                            </h4>
                            <p className="text-sm text-green-800 mt-1">
                              {identityVerified 
                                ? 'Your identity has been verified. Please upload your professional documents below.'
                                : 'Your identity verification is being processed. You can upload professional documents while we verify your identity.'
                              }
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
                              Upload your professional certifications
                            </p>
                            <p className="text-xs text-gray-500">
                              Massage License, Training Certificates, etc.
                            </p>
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              multiple
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label>Liability Insurance (Optional)</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-roam-blue transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              Professional liability insurance certificate
                            </p>
                            <p className="text-xs text-gray-500">
                              We can help you get coverage if needed
                            </p>
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="backgroundConsent"
                      checked={formData.backgroundConsent}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          backgroundConsent: checked as boolean,
                        })
                      }
                    />
                    <Label
                      htmlFor="backgroundConsent"
                      className="text-sm leading-relaxed"
                    >
                      I consent to a comprehensive background check including
                      criminal history, sex offender registry, and identity
                      verification. I understand this is required for platform
                      approval.
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 5: Professional Profile */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio *</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Tell customers about your experience, training, and what makes your services special..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      This will be shown to customers on your profile
                    </p>
                  </div>

                  {formData.serviceCategories.length > 0 && (
                    <div className="space-y-3">
                      <Label>Specialties</Label>
                      <p className="text-sm text-gray-600">
                        Select your specific areas of expertise:
                      </p>
                      {formData.serviceCategories.map((category) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-sm">{category}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-4">
                            {specialtiesByCategory[
                              category as keyof typeof specialtiesByCategory
                            ]?.map((specialty) => (
                              <div
                                key={specialty}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={specialty}
                                  checked={formData.specialties.includes(
                                    specialty,
                                  )}
                                  onCheckedChange={() =>
                                    toggleSpecialty(specialty)
                                  }
                                />
                                <Label
                                  htmlFor={specialty}
                                  className="text-sm font-normal"
                                >
                                  {specialty}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Languages Spoken</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        "English",
                        "Spanish",
                        "French",
                        "Portuguese",
                        "Italian",
                        "German",
                      ].map((language) => (
                        <div
                          key={language}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={language}
                            checked={formData.languages.includes(language)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData((prev) => ({
                                  ...prev,
                                  languages: [...prev.languages, language],
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  languages: prev.languages.filter(
                                    (l) => l !== language,
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={language}
                            className="text-sm font-normal"
                          >
                            {language}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Review & Submit */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900">
                          Almost Done!
                        </h4>
                        <p className="text-sm text-green-800 mt-1">
                          Please review your information below and agree to the
                          final terms to submit your application.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary of Information */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Personal Information</h4>
                      <p className="text-sm text-gray-600">
                        {formData.firstName} {formData.lastName} •{" "}
                        {formData.email} • {formData.phone}
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Business Information</h4>
                      <p className="text-sm text-gray-600">
                        {formData.businessName} • {formData.businessType} •{" "}
                        {formData.yearsExperience} experience
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Services: {formData.serviceCategories.join(", ")}
                      </p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Specialties</h4>
                      <p className="text-sm text-gray-600">
                        {formData.specialties.join(", ") || "None selected"}
                      </p>
                    </div>
                  </div>

                  {/* Final Agreements */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="termsAccepted"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            termsAccepted: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="termsAccepted"
                        className="text-sm leading-relaxed"
                      >
                        I agree to the ROAM{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-roam-blue"
                        >
                          Terms of Service
                        </Button>{" "}
                        and understand the platform fees and payment structure.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="privacyAccepted"
                        checked={formData.privacyAccepted}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            privacyAccepted: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="privacyAccepted"
                        className="text-sm leading-relaxed"
                      >
                        I have read and agree to the{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-roam-blue"
                        >
                          Privacy Policy
                        </Button>{" "}
                        and consent to the processing of my personal data for
                        verification purposes.
                      </Label>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">
                          What happens next?
                        </h4>
                        <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                          <li>
                            • Background check and document verification (2-3
                            business days)
                          </li>
                          <li>
                            • Admin review of your application (1-2 business
                            days)
                          </li>
                          <li>
                            ��� Email notification with next steps for account
                            setup
                          </li>
                          <li>
                            • Stripe/Plaid integration for payments and payouts
                          </li>
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
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      !formData.termsAccepted ||
                      !formData.privacyAccepted ||
                      !formData.backgroundConsent ||
                      !formData.ndaAccepted
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
}
