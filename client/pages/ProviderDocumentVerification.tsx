import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Upload,
  FileText,
  Shield,
  Home,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Camera,
  X,
  Users,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DocumentUpload {
  file: File | null;
  uploaded: boolean;
  preview?: string;
}

interface DocumentState {
  driversLicense: DocumentUpload;
  proofOfAddress: DocumentUpload;
  liabilityInsurance: DocumentUpload;
  licenses: DocumentUpload[];
}

export default function ProviderDocumentVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [providerId, setProviderId] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentState>({
    driversLicense: { file: null, uploaded: false },
    proofOfAddress: { file: null, uploaded: false },
    liabilityInsurance: { file: null, uploaded: false },
    licenses: [],
  });

  // Get business and provider info from location state or fetch from database
  useEffect(() => {
    const locationState = location.state as any;
    console.log("Location state:", locationState);

    if (locationState?.businessId) {
      console.log(
        "Setting businessId from location state:",
        locationState.businessId,
      );
      setBusinessId(locationState.businessId);
    }

    // Try multiple ways to get user ID for onboarding flow
    const initializeUserInfo = async () => {
      // Method 1: User from auth context
      if (user?.id) {
        console.log("Using user ID from auth context:", user.id);
        fetchProviderInfo();
        return;
      }

      // Method 2: Try to get session from direct API
      try {
        const { directSupabaseAPI } = await import("@/lib/directSupabase");
        const session = await directSupabaseAPI.getSession();
        if (session?.user?.id) {
          console.log("Found user ID from session:", session.user.id);
          // Temporarily set a user object so fetchProviderInfo can work
          const tempUser = { id: session.user.id, email: session.user.email };
          await fetchProviderInfoWithUserId(tempUser.id);
          return;
        }
      } catch (error) {
        console.log("Could not get session:", error);
      }

      // Method 3: If we have businessId, try to find providers for that business
      if (locationState?.businessId) {
        console.log(
          "Trying to find provider by businessId:",
          locationState.businessId,
        );
        await fetchProviderByBusinessId(locationState.businessId);
      }
    };

    initializeUserInfo();
  }, [user, location.state]);

  const fetchProviderInfo = async () => {
    if (!user?.id) {
      console.log("No user ID available");
      return;
    }
    await fetchProviderInfoWithUserId(user.id);
  };

  const fetchProviderInfoWithUserId = async (userId: string) => {
    console.log("Fetching provider info for user:", userId);

    try {
      // First, let's check if any providers exist for this user
      const { data: allProviders, error: allError } = await supabase
        .from("providers")
        .select("id, business_id, user_id, first_name, last_name, email")
        .eq("user_id", userId);

      console.log("All providers for user:", { allProviders, allError });

      if (allError) {
        console.error("Error querying all providers:", allError);
        throw allError;
      }

      if (!allProviders || allProviders.length === 0) {
        console.log("No providers found for user, retrying in 2 seconds...");
        setTimeout(() => {
          fetchProviderInfoWithUserId(userId);
        }, 2000);
        return;
      }

      // Get the first provider (should be only one typically)
      const provider = allProviders[0];
      console.log(
        "Setting providerId:",
        provider.id,
        "businessId:",
        provider.business_id,
      );
      setProviderId(provider.id);
      if (!businessId) {
        setBusinessId(provider.business_id);
      }
    } catch (error) {
      console.error("Error fetching provider info:", error);
      // Don't show toast error during onboarding as this might be expected
      if (!location.state?.businessId) {
        toast({
          title: "Error",
          description: "Failed to load provider information",
          variant: "destructive",
        });
      }
    }
  };

  const fetchProviderByBusinessId = async (businessIdToSearch: string) => {
    console.log("Fetching providers for businessId:", businessIdToSearch);

    try {
      const { data: businessProviders, error } = await supabase
        .from("providers")
        .select("id, business_id, user_id, first_name, last_name, email")
        .eq("business_id", businessIdToSearch)
        .order("created_at", { ascending: false })
        .limit(5);

      console.log("Providers for business:", { businessProviders, error });

      if (error) {
        console.error("Error querying providers by business:", error);
        return;
      }

      if (businessProviders && businessProviders.length > 0) {
        // For onboarding, we'll use the most recently created provider (likely the owner)
        const provider = businessProviders[0];
        console.log("Setting providerId from business lookup:", provider.id);
        setProviderId(provider.id);
        setBusinessId(businessIdToSearch);
      } else {
        console.log("No providers found for business, will retry...");
        setTimeout(() => {
          fetchProviderByBusinessId(businessIdToSearch);
        }, 2000);
      }
    } catch (error) {
      console.error("Error fetching providers by business:", error);
    }
  };

  // Upload file directly to Supabase storage
  const uploadToStorage = async (
    file: File,
    folderPath: string,
    currentProviderId: string,
    currentBusinessId: string,
  ): Promise<string> => {
    try {
      console.log("Uploading file via Vercel endpoint:", {
        fileName: file.name,
        folderPath,
        fileSize: file.size,
        providerId: currentProviderId,
        businessId: currentBusinessId,
      });

      // Validate required parameters
      if (!currentProviderId || !currentBusinessId) {
        throw new Error(
          `Missing required IDs - providerId: ${currentProviderId}, businessId: ${currentBusinessId}`,
        );
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', folderPath);
      formData.append('providerId', currentProviderId);
      formData.append('businessId', currentBusinessId);

      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required for file upload');
      }

      // Upload via Vercel Edge Function (bypasses RLS)
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Upload API error:", response.status, errorData);
        throw new Error(
          errorData.error || `Upload failed with status ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      if (!result.success || !result.publicUrl) {
        throw new Error('Upload completed but no URL returned');
      }

      console.log("Generated public URL:", result.publicUrl);
      return result.publicUrl;
    } catch (error) {
      console.error("uploadToStorage error:", error);
      throw error;
    }
  };

  // Save document record to database
  const saveDocumentRecord = async (
    documentType: string,
    documentName: string,
    fileUrl: string,
    fileSizeBytes: number,
    expiryDate?: string,
  ) => {
    try {
      console.log("Saving document record:", {
        provider_id: providerId,
        document_type: documentType,
        document_name: documentName,
        file_url: fileUrl,
        file_size_bytes: fileSizeBytes,
      });

      const { error } = await supabase.from("business_documents").insert({
        business_id: businessId, // Using business_id for business-level verification
        document_type: documentType,
        document_name: documentName,
        file_url: fileUrl,
        file_size_bytes: fileSizeBytes,
        verification_status: "pending",
        expiry_date: expiryDate || null,
      });

      if (error) {
        console.error("Database insert error:", error);
        throw new Error(`Database save failed: ${error.message}`);
      }

      console.log("Document record saved successfully");
    } catch (error) {
      console.error("saveDocumentRecord error:", error);
      throw error;
    }
  };

  const handleFileUpload = (
    documentType: keyof Omit<DocumentState, "licenses">,
    file: File,
  ) => {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          file,
          uploaded: true,
          preview: file.type.startsWith("image/") ? preview : undefined,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLicenseUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setDocuments((prev) => ({
        ...prev,
        licenses: [
          ...prev.licenses,
          {
            file,
            uploaded: true,
            preview: file.type.startsWith("image/") ? preview : undefined,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeLicense = (index: number) => {
    setDocuments((prev) => ({
      ...prev,
      licenses: prev.licenses.filter((_, i) => i !== index),
    }));
  };

  const removeDocument = (
    documentType: keyof Omit<DocumentState, "licenses">,
  ) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: { file: null, uploaded: false },
    }));
  };

  // Main submission function
  const handleSubmitDocuments = async () => {
    console.log("Submitting documents with:", {
      businessId,
      providerId,
      userId: user?.id,
    });

    // Debug: Let's check what business and provider records exist
    if (user?.id) {
      try {
        // Check business profiles
        const { data: businesses, error: businessError } = await supabase
          .from("business_profiles")
          .select("id, business_name")
          .limit(10);
        console.log("Available businesses:", { businesses, businessError });

        // Check providers
        const { data: providers, error: providerError } = await supabase
          .from("providers")
          .select("id, user_id, business_id, first_name, last_name")
          .eq("user_id", user.id);
        console.log("Providers for current user:", {
          providers,
          providerError,
        });

        // If we have a specific businessId, check providers for that business
        if (businessId) {
          const { data: businessProviders, error: businessProviderError } =
            await supabase
              .from("providers")
              .select("id, user_id, business_id, first_name, last_name")
              .eq("business_id", businessId);
          console.log("Providers for businessId", businessId, ":", {
            businessProviders,
            businessProviderError,
          });
        }
      } catch (debugError) {
        console.error("Debug query error:", debugError);
      }
    }

    // Try multiple approaches to get missing IDs
    let currentBusinessId = businessId;
    let currentProviderId = providerId;

    // If we're missing either ID, try to fetch them
    if (!currentBusinessId || !currentProviderId) {
      console.log("Missing IDs, attempting comprehensive lookup...");

      // Try to get from location state first
      const locationState = location.state as any;
      if (locationState?.businessId && !currentBusinessId) {
        currentBusinessId = locationState.businessId;
        setBusinessId(currentBusinessId);
        console.log("Got businessId from location state:", currentBusinessId);
      }

      // Try to fetch provider info
      if (user?.id) {
        try {
          const { data: providers, error } = await supabase
            .from("providers")
            .select("id, business_id, user_id")
            .eq("user_id", user.id)
            .limit(1);

          console.log("Provider lookup result:", { providers, error });

          if (providers && providers.length > 0) {
            const provider = providers[0];
            if (!currentProviderId) {
              currentProviderId = provider.id;
              setProviderId(currentProviderId);
              console.log(
                "Got providerId from user lookup:",
                currentProviderId,
              );
            }
            if (!currentBusinessId) {
              currentBusinessId = provider.business_id;
              setBusinessId(currentBusinessId);
              console.log(
                "Got businessId from user lookup:",
                currentBusinessId,
              );
            }
          }
        } catch (error) {
          console.error("Error in provider lookup:", error);
        }
      }

      // Final fallback: try to find any provider for the business
      if (currentBusinessId && !currentProviderId) {
        try {
          const { data: businessProviders, error } = await supabase
            .from("providers")
            .select("id, business_id")
            .eq("business_id", currentBusinessId)
            .limit(1);

          console.log("Business provider lookup:", {
            businessProviders,
            error,
          });

          if (businessProviders && businessProviders.length > 0) {
            currentProviderId = businessProviders[0].id;
            setProviderId(currentProviderId);
            console.log(
              "Got providerId from business lookup:",
              currentProviderId,
            );
          }
        } catch (error) {
          console.error("Error in business provider lookup:", error);
        }
      }
    }

    if (!currentBusinessId) {
      console.error(
        "Business ID is missing:",
        JSON.stringify({
          currentBusinessId,
          currentProviderId,
          originalBusinessId: businessId,
          originalProviderId: providerId,
          userId: user?.id,
        }),
      );
      toast({
        title: "Error",
        description:
          "Business information is missing. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    if (!currentProviderId) {
      console.error(
        "Provider ID is missing:",
        JSON.stringify({
          currentBusinessId,
          currentProviderId,
          originalBusinessId: businessId,
          originalProviderId: providerId,
          userId: user?.id,
        }),
      );
      toast({
        title: "Error",
        description:
          "Provider information is missing. Please try refreshing the page or contact support.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting document upload with valid IDs:", {
      currentBusinessId,
      currentProviderId,
    });

    // Validate required documents
    const requiredDocs = [
      "driversLicense",
      "proofOfAddress",
      "liabilityInsurance",
    ] as const;
    const missingDocs = requiredDocs.filter(
      (docType) => !documents[docType].file,
    );

    if (missingDocs.length > 0) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents before submitting",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setIsSubmitting(true);

    try {
      // Upload documents sequentially to avoid concurrency issues
      console.log("Starting sequential document uploads...");

      // Upload Driver's License
      if (documents.driversLicense.file) {
        console.log("Uploading Driver's License...");
        try {
          const fileUrl = await uploadToStorage(
            documents.driversLicense.file,
            `provider-dl/${currentBusinessId}`,
            currentProviderId,
            currentBusinessId,
          );
          await saveDocumentRecord(
            "drivers_license",
            documents.driversLicense.file.name,
            fileUrl,
            documents.driversLicense.file.size,
          );
          console.log("Driver's License uploaded successfully");
        } catch (error) {
          console.error("Driver's License upload failed:", error);
          throw new Error(`Driver's License upload failed: ${error.message}`);
        }
      }

      // Upload Proof of Address
      if (documents.proofOfAddress.file) {
        console.log("Uploading Proof of Address...");
        try {
          const fileUrl = await uploadToStorage(
            documents.proofOfAddress.file,
            `provider-poa/${currentBusinessId}`,
            currentProviderId,
            currentBusinessId,
          );
          await saveDocumentRecord(
            "proof_of_address",
            documents.proofOfAddress.file.name,
            fileUrl,
            documents.proofOfAddress.file.size,
          );
          console.log("Proof of Address uploaded successfully");
        } catch (error) {
          console.error("Proof of Address upload failed:", error);
          throw new Error(`Proof of Address upload failed: ${error.message}`);
        }
      }

      // Upload Liability Insurance
      if (documents.liabilityInsurance.file) {
        console.log("Uploading Liability Insurance...");
        try {
          const fileUrl = await uploadToStorage(
            documents.liabilityInsurance.file,
            `provider-li/${currentBusinessId}`,
            currentProviderId,
            currentBusinessId,
          );
          await saveDocumentRecord(
            "liability_insurance",
            documents.liabilityInsurance.file.name,
            fileUrl,
            documents.liabilityInsurance.file.size,
          );
          console.log("Liability Insurance uploaded successfully");
        } catch (error) {
          console.error("Liability Insurance upload failed:", error);
          throw new Error(
            `Liability Insurance upload failed: ${error.message}`,
          );
        }
      }

      // Upload Professional Licenses & Certificates
      for (let index = 0; index < documents.licenses.length; index++) {
        const license = documents.licenses[index];
        if (license.file) {
          console.log(`Uploading Professional License ${index + 1}...`);
          try {
            const fileUrl = await uploadToStorage(
              license.file,
              `provider-plc/${currentBusinessId}`,
              currentProviderId,
              currentBusinessId,
            );
            await saveDocumentRecord(
              "professional_license",
              license.file.name,
              fileUrl,
              license.file.size,
            );
            console.log(
              `Professional License ${index + 1} uploaded successfully`,
            );
          } catch (error) {
            console.error(
              `Professional License ${index + 1} upload failed:`,
              error,
            );
            throw new Error(
              `Professional License ${index + 1} upload failed: ${error.message}`,
            );
          }
        }
      }

      console.log("All documents uploaded successfully");

      toast({
        title: "Documents Uploaded",
        description:
          "All documents have been uploaded successfully and are pending verification",
        variant: "default",
      });

      // Navigate to next step or dashboard
      navigate("/provider-dashboard", {
        state: {
          message:
            "Documents uploaded successfully! Your documents are now under review.",
        },
      });
    } catch (error) {
      console.error("Error uploading documents:", error);

      // Extract meaningful error message
      let errorMessage = "Failed to upload documents. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        // Try to extract error message from object
        errorMessage =
          error.message ||
          error.error ||
          error.description ||
          JSON.stringify(error);
      }

      console.error("Detailed error message:", errorMessage);

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setIsSubmitting(false);
    }
  };

  const allRequiredDocumentsUploaded = () => {
    return (
      documents.driversLicense.uploaded &&
      documents.proofOfAddress.uploaded &&
      documents.liabilityInsurance.uploaded
    );
  };

  const handleSubmit = async () => {
    await handleSubmitDocuments();
  };

  const documentRequirements = [
    {
      type: "driversLicense",
      title: "Driver's License",
      description: "Valid government-issued photo ID",
      icon: CreditCard,
      required: true,
      document: documents.driversLicense,
    },
    {
      type: "proofOfAddress",
      title: "Proof of Address",
      description:
        "Utility bill, bank statement, or lease agreement (within 3 months)",
      icon: Home,
      required: true,
      document: documents.proofOfAddress,
    },
    {
      type: "liabilityInsurance",
      title: "Liability Insurance",
      description: "Professional liability insurance certificate",
      icon: Shield,
      required: true,
      document: documents.liabilityInsurance,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link
                  to="/provider-portal"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Portal</span>
                </Link>
              </Button>
            </div>

            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Document Verification</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Please upload the required documents to verify your identity and
              qualifications. All documents will be securely reviewed within
              24-48 hours.
            </p>

            {/* Debug Info in Development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-semibold text-sm mb-2">Debug Info:</h3>
                <div className="text-xs space-y-1">
                  <div>User ID: {user?.id || "Not available"}</div>
                  <div>Business ID: {businessId || "Not set"}</div>
                  <div>Provider ID: {providerId || "Not set"}</div>
                  <div>Location State: {JSON.stringify(location.state)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-roam-blue rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">Registration</span>
              </div>
              <div className="w-16 h-0.5 bg-roam-blue"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-roam-blue rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-roam-blue">
                  Documents
                </span>
              </div>
              <div className="w-16 h-0.5 bg-border"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-border rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-foreground/50" />
                </div>
                <span className="text-sm text-foreground/50">Onboarding</span>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold">Required Documents</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {documentRequirements.map((req) => (
                <Card key={req.type} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-roam-light-blue/20 rounded-lg flex items-center justify-center">
                        <req.icon className="w-5 h-5 text-roam-blue" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{req.title}</h3>
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/70 mb-4">
                      {req.description}
                    </p>

                    {req.document.uploaded ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {req.document.file?.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeDocument(
                                req.type as keyof Omit<
                                  DocumentState,
                                  "licenses"
                                >,
                              )
                            }
                            className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {req.document.preview && (
                          <div className="w-full h-32 rounded-lg overflow-hidden border">
                            <img
                              src={req.document.preview}
                              alt={`${req.title} preview`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-foreground/70 mb-3">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-foreground/50 mb-3">
                          JPG, PNG, PDF up to 10MB
                        </p>
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                req.type as keyof Omit<
                                  DocumentState,
                                  "licenses"
                                >,
                                file,
                              );
                            }
                          }}
                          className="hidden"
                          id={`upload-${req.type}`}
                        />
                        <Label htmlFor={`upload-${req.type}`}>
                          <Button
                            variant="outline"
                            className="cursor-pointer"
                            asChild
                          >
                            <span>
                              <Camera className="w-4 h-4 mr-2" />
                              Choose File
                            </span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Professional Licenses & Certificates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-roam-yellow/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-roam-yellow" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Professional Licenses & Certificates
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/70 mb-4">
                Upload any professional licenses, certifications, or training
                certificates related to the services you offer.
              </p>

              {/* Uploaded Licenses */}
              {documents.licenses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {documents.licenses.map((license, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {license.file?.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLicense(index)}
                        className="ml-auto text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-foreground/70 mb-3">
                  Click to upload licenses or certificates
                </p>
                <p className="text-xs text-foreground/50 mb-3">
                  JPG, PNG, PDF up to 10MB each
                </p>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleLicenseUpload(file);
                    }
                    e.target.value = ""; // Reset input to allow same file upload
                  }}
                  className="hidden"
                  id="upload-licenses"
                />
                <Label htmlFor="upload-licenses">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Add License/Certificate
                    </span>
                  </Button>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> All documents will be securely stored
              and reviewed by our verification team. You'll receive an email
              notification once your documents are approved. The verification
              process typically takes 24-48 hours.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button asChild variant="outline" size="lg">
              <Link to="/provider-portal">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Link>
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={
                !allRequiredDocumentsUploaded() || isSubmitting || uploading
              }
              className="bg-roam-blue hover:bg-roam-blue/90"
              size="lg"
            >
              {isSubmitting || uploading ? (
                <>{uploading ? "Uploading..." : "Processing..."}</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Documents
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
