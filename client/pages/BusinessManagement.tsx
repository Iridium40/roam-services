import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Plus,
  Edit,
  Save,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Star,
  CheckCircle,
  AlertCircle,
  Trash2,
  MoreHorizontal,
  Camera,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type {
  BusinessProfile,
  BusinessLocation,
  Provider,
} from "@/lib/database.types";

export default function BusinessManagement() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [teamMembers, setTeamMembers] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      // Get current user and provider data
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: provider } = await supabase
        .from("providers")
        .select("business_id, provider_role")
        .eq("user_id", user.id)
        .single();

      if (!provider || (provider.provider_role !== "owner" && provider.provider_role !== "dispatcher")) {
        navigate("/provider-dashboard");
        return;
      }

      // Load business profile
      const { data: businessData } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", provider.business_id)
        .single();

      if (businessData) {
        setBusiness(businessData);
      }

      // Load business locations
      const { data: locationsData } = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", provider.business_id)
        .order("is_primary", { ascending: false });

      if (locationsData) {
        setLocations(locationsData);
      }

      // Load team members
      const { data: teamData } = await supabase
        .from("providers")
        .select("*")
        .eq("business_id", provider.business_id);

      if (teamData) {
        setTeamMembers(teamData);
      }
    } catch (error) {
      console.error("Error loading business data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveBusiness = async () => {
    if (!business) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_profiles")
        .update(business)
        .eq("id", business.id);

      if (error) throw error;

      // Show success message
      alert("Business information saved successfully!");
    } catch (error) {
      console.error("Error saving business:", error);
      alert("Error saving business information");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-semibold">Loading business data...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Business Not Found</h2>
          <p className="text-foreground/70 mb-4">
            Unable to load business information.
          </p>
          <Button asChild>
            <Link to="/provider-dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/provider-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-xl font-bold">Business Management</h1>
            </div>
            <Button
              onClick={saveBusiness}
              disabled={saving}
              className="bg-roam-blue hover:bg-roam-blue/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
            >
              Business Details
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
            >
              Locations
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
            >
              Services & Pricing
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
            >
              Team Management
            </TabsTrigger>
            <TabsTrigger
              value="hours"
              className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
            >
              Business Hours
            </TabsTrigger>
          </TabsList>

          {/* Business Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Business Logo */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Logo</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center mx-auto">
                    <Building className="w-16 h-16 text-white" />
                  </div>
                  <Button
                    variant="outline"
                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={business.business_name}
                        onChange={(e) =>
                          setBusiness({
                            ...business,
                            business_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={business.contact_email || ""}
                        onChange={(e) =>
                          setBusiness({
                            ...business,
                            contact_email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={business.phone || ""}
                        onChange={(e) =>
                          setBusiness({ ...business, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website URL</Label>
                      <Input
                        id="website"
                        type="url"
                        value={business.website_url || ""}
                        onChange={(e) =>
                          setBusiness({
                            ...business,
                            website_url: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Verification Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          business.verification_status === "approved"
                            ? "bg-green-100 text-green-800"
                            : business.verification_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {business.verification_status === "approved" && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {business.verification_status}
                      </Badge>
                      {business.verification_status === "approved" && (
                        <span className="text-sm text-green-600">
                          Your business is verified
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Business Locations</h2>
              <Button className="bg-roam-blue hover:bg-roam-blue/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {location.location_name}
                        </CardTitle>
                        {location.is_primary && (
                          <Badge className="bg-roam-blue text-white mt-1">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium">{location.address_line1}</p>
                      {location.address_line2 && (
                        <p>{location.address_line2}</p>
                      )}
                      <p>
                        {location.city}, {location.state} {location.postal_code}
                      </p>
                    </div>

                    {location.offers_mobile_services && (
                      <div className="flex items-center gap-2 text-sm text-roam-blue">
                        <MapPin className="w-4 h-4" />
                        Mobile services: {location.mobile_service_radius} mile
                        radius
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Services & Pricing Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Services & Pricing</h2>
              <Button className="bg-roam-blue hover:bg-roam-blue/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Service Catalog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Deep Tissue Massage",
                      price: 120,
                      duration: "90 min",
                      active: true,
                      delivery: ["mobile", "in_person"],
                    },
                    {
                      name: "Swedish Massage",
                      price: 90,
                      duration: "60 min",
                      active: true,
                      delivery: ["mobile", "in_person"],
                    },
                    {
                      name: "Sports Recovery Massage",
                      price: 110,
                      duration: "75 min",
                      active: false,
                      delivery: ["mobile"],
                    },
                    {
                      name: "Prenatal Massage",
                      price: 100,
                      duration: "60 min",
                      active: true,
                      delivery: ["in_person"],
                    },
                  ].map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={service.active}
                          className="data-[state=checked]:bg-roam-blue"
                        />
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-foreground/60">
                            {service.duration}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-roam-blue">
                            ${service.price}
                          </p>
                          <div className="flex gap-1">
                            {service.delivery.map((type) => (
                              <Badge
                                key={type}
                                variant="secondary"
                                className="text-xs"
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Team Management</h2>
              <Button className="bg-roam-blue hover:bg-roam-blue/90">
                <Plus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <Card
                  key={member.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {member.first_name} {member.last_name}
                        </h3>
                        <p className="text-sm text-foreground/60 capitalize">
                          {member.provider_role}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {member.email}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <Badge
                            className={
                              member.verification_status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {member.verification_status}
                          </Badge>
                          {member.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-roam-warning fill-current" />
                              <span className="text-xs">
                                {member.average_rating}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Business Hours Tab */}
          <TabsContent value="hours" className="space-y-6">
            <h2 className="text-2xl font-bold">Business Hours</h2>

            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24">
                        <Label className="font-medium">{day}</Label>
                      </div>
                      <Switch className="data-[state=checked]:bg-roam-blue" />
                      <div className="flex gap-2">
                        <Select defaultValue="09:00">
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem
                                key={i}
                                value={`${i.toString().padStart(2, "0")}:00`}
                              >
                                {`${i.toString().padStart(2, "0")}:00`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-foreground/60">to</span>
                        <Select defaultValue="17:00">
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem
                                key={i}
                                value={`${i.toString().padStart(2, "0")}:00`}
                              >
                                {`${i.toString().padStart(2, "0")}:00`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
