import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerProfile() {
  const { customer, updateCustomerProfile, uploadCustomerAvatar, loading } =
    useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: customer?.first_name || "",
    lastName: customer?.last_name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    dateOfBirth: "",
    bio: "",
    imageUrl: customer?.image_url || "",
  });

  // Function to load full customer profile data from database
  const loadCustomerProfile = async () => {
    if (!customer?.customer_id) return;

    setLoadingProfile(true);
    try {
      console.log("CustomerProfile: Loading full profile data...");
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Get the stored access token
      const storedToken = localStorage.getItem("roam_access_token");
      if (storedToken) {
        directSupabaseAPI.currentAccessToken = storedToken;
      }

      // Fetch the customer profile data
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/customer_profiles?user_id=eq.${customer.customer_id}&select=*`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const profiles = await response.json();
        if (profiles && profiles.length > 0) {
          const profile = profiles[0];
          console.log("CustomerProfile: Loaded profile data:", profile);

          setProfileData({
            firstName: profile.first_name || customer.first_name || "",
            lastName: profile.last_name || customer.last_name || "",
            email: profile.email || customer.email || "",
            phone: profile.phone || customer.phone || "",
            dateOfBirth: profile.date_of_birth || "",
            bio: profile.bio || "",
            imageUrl: profile.image_url || customer.image_url || "",
          });
        } else {
          console.log(
            "CustomerProfile: No profile data found, using customer data",
          );
          // Use customer data as fallback
          setProfileData({
            firstName: customer.first_name || "",
            lastName: customer.last_name || "",
            email: customer.email || "",
            phone: customer.phone || "",
            dateOfBirth: "",
            bio: "",
            imageUrl: customer.image_url || "",
          });
        }
      } else {
        console.log(
          "CustomerProfile: Failed to load profile data, using customer data",
        );
        // Use customer data as fallback
        setProfileData({
          firstName: customer.first_name || "",
          lastName: customer.last_name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          dateOfBirth: "",
          bio: "",
          imageUrl: customer.image_url || "",
        });
      }
    } catch (error) {
      console.error("CustomerProfile: Error loading profile data:", error);
      // Use customer data as fallback
      setProfileData({
        firstName: customer.first_name || "",
        lastName: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        dateOfBirth: "",
        bio: "",
        imageUrl: customer.image_url || "",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load full profile data when customer data changes
  useEffect(() => {
    if (customer?.customer_id) {
      loadCustomerProfile();
    } else {
      // Check if we have a stored token but no customer data
      const storedToken = localStorage.getItem("roam_access_token");
      const storedCustomer = localStorage.getItem("roam_customer");

      if (!storedToken || !storedCustomer) {
        console.log("CustomerProfile: No valid authentication found");
        // Could add a redirect to login here if needed
      }
    }
  }, [customer]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg">Please sign in to view your profile.</p>
          <Button asChild className="mt-4 bg-roam-blue hover:bg-roam-blue/90">
            <Link to="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading your profile...</p>
        </Card>
      </div>
    );
  }

  const initials =
    `${customer.first_name.charAt(0)}${customer.last_name.charAt(0)}`.toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("CustomerProfile: Starting save with data:", {
        customerId: customer?.customer_id,
        profileData: profileData,
      });

      // Add validation
      if (!customer?.customer_id) {
        throw new Error("No customer ID found. Please sign in again.");
      }

      console.log("CustomerProfile: Calling updateCustomerProfile with:", {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        bio: profileData.bio,
        imageUrl: profileData.imageUrl,
      });

      await updateCustomerProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        bio: profileData.bio,
        imageUrl: profileData.imageUrl,
      });

      console.log(
        "CustomerProfile: Profile saved successfully, reloading data...",
      );

      // Reload the profile data to ensure UI shows the latest saved data
      await loadCustomerProfile();

      setIsEditing(false);

      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      const errorMessage = error.message || error;

      // Show a more user-friendly error message
      if (
        errorMessage.includes("session has expired") ||
        errorMessage.includes("sign in again")
      ) {
        toast({
          title: "Session Expired",
          description:
            "Your session has expired. Please sign in again to save your changes.",
          variant: "destructive",
        });
        // Optionally redirect to login or show login modal
      } else {
        toast({
          title: "Update Failed",
          description: `Failed to save profile: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadCustomerAvatar(file);
      setProfileData((prev) => ({ ...prev, imageUrl }));
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been successfully updated.",
        variant: "default",
      });
      console.log("Avatar uploaded successfully");
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone || "",
      dateOfBirth: "",
      bio: "",
      imageUrl: customer.image_url || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM Logo"
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  My <span className="text-roam-blue">Profile</span>
                </h1>
                <p className="text-lg text-foreground/70">
                  Manage your personal information and preferences.
                </p>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-roam-blue hover:bg-roam-blue/90"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Picture Section */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage
                        src={
                          profileData.imageUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${customer.first_name}${customer.last_name}`
                        }
                        alt={`${customer.first_name} ${customer.last_name}`}
                      />
                      <AvatarFallback className="bg-roam-blue text-white text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Button
                          size="sm"
                          className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-roam-blue hover:bg-roam-blue/90"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                          disabled={uploading}
                          type="button"
                        >
                          {uploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <p className="text-foreground/60">ROAM Customer</p>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information Section */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              firstName: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="p-3 bg-accent/20 rounded-md">
                          {customer.first_name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              lastName: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="p-3 bg-accent/20 rounded-md">
                          {customer.last_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="p-3 bg-accent/20 rounded-md">
                        {customer.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="(555) 123-4567"
                      />
                    ) : (
                      <div className="p-3 bg-accent/20 rounded-md">
                        {customer.phone || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Date of Birth
                    </Label>
                    {isEditing ? (
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="p-3 bg-accent/20 rounded-md">
                        {profileData.dateOfBirth || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">About Me</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            bio: e.target.value,
                          })
                        }
                        placeholder="Tell us a bit about yourself..."
                        rows={4}
                      />
                    ) : (
                      <div className="p-3 bg-accent/20 rounded-md min-h-[100px]">
                        {profileData.bio || "No bio provided"}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={handleSave}
                        className="bg-roam-blue hover:bg-roam-blue/90 flex-1"
                        disabled={saving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
