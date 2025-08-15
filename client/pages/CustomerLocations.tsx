import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MapPin,
  Home,
  Building,
  Users,
  Plus,
  Edit,
  Trash2,
  Star,
  ChevronLeft,
  Shield,
  Clock,
  Map,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";

interface CustomerLocation {
  id: string;
  customer_id: string;
  location_name: string;
  street_address: string;
  unit_number?: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  is_primary: boolean;
  is_active: boolean;
  access_instructions?: string;
  created_at: string;
  location_type: "Home" | "Condo" | "Hotel" | "Other" | null;
}

interface LocationFormData {
  location_name: string;
  street_address: string;
  unit_number: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  is_primary: boolean;
  access_instructions: string;
  location_type: "Home" | "Condo" | "Hotel" | "Other" | null;
}

export default function CustomerLocations() {
  const { customer } = useAuth();
  const { toast } = useToast();

  const [locations, setLocations] = useState<CustomerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<CustomerLocation | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    location_name: "",
    street_address: "",
    unit_number: "",
    city: "",
    state: "",
    zip_code: "",
    is_primary: false,
    access_instructions: "",
    location_type: "Home",
  });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      location_name: "",
      street_address: "",
      unit_number: "",
      city: "",
      state: "",
      zip_code: "",
      is_primary: false,
      access_instructions: "",
      location_type: "Home",
    });
    setEditingLocation(null);
  };

  const createDefaultLocation = async () => {
    try {
      setLoading(true);
      console.log("Creating default location...");

      const { data: locationId, error } = await supabase.rpc(
        "ensure_customer_default_location",
      );

      console.log("Default location creation result:", { locationId, error });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default location created successfully",
      });

      // Refresh locations
      await fetchLocations();
    } catch (error: any) {
      console.error("Error creating default location:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create default location",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    if (!customer?.customer_id) return;

    try {
      setLoading(true);
      console.log("Fetching locations for customer:", customer);

      // Get the current user to use the auth user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      console.log("Using auth user ID for customer_locations query:", user.id);

      // Fetch customer locations using auth user ID
      const { data, error } = await supabase
        .from("customer_locations")
        .select("*")
        .eq("customer_id", user.id) // Use auth user ID as per database schema
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      console.log("Customer locations query result:", { data, error });

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error("Error fetching locations:", error);
      const errorMessage =
        error?.message || error?.error?.message || "Unknown error";
      toast({
        title: "Error",
        description: `Failed to load your locations: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [customer?.customer_id]);

  const handleAddressChange = (
    address: string,
    placeData?: google.maps.places.PlaceResult,
  ) => {
    setFormData((prev) => ({ ...prev, street_address: address }));

    if (placeData && placeData.address_components) {
      const components = placeData.address_components;
      const getComponent = (type: string) =>
        components.find((comp) => comp.types.includes(type))?.long_name || "";

      setFormData((prev) => ({
        ...prev,
        city: getComponent("locality") || getComponent("sublocality"),
        state: getComponent("administrative_area_level_1"),
        zip_code: getComponent("postal_code"),
        latitude: placeData.geometry?.location?.lat(),
        longitude: placeData.geometry?.location?.lng(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.customer_id || submitting) return;

    try {
      setSubmitting(true);

      // Get the current user to use the auth user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      console.log("Submitting location with auth user ID:", user.id);
      console.log("Form data:", formData);

      // Validate required fields
      if (
        !formData.location_name.trim() ||
        !formData.street_address.trim() ||
        !formData.city.trim() ||
        !formData.state.trim() ||
        !formData.zip_code.trim()
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // If setting as primary, update other locations first
      if (formData.is_primary) {
        await supabase
          .from("customer_locations")
          .update({ is_primary: false })
          .eq("customer_id", user.id);
      }

      const locationData = {
        customer_id: user.id,
        location_name: formData.location_name.trim(),
        street_address: formData.street_address.trim(),
        unit_number: formData.unit_number.trim() || null,
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        is_primary: formData.is_primary,
        access_instructions: formData.access_instructions.trim() || null,
        location_type: formData.location_type,
      };

      let error, data;
      console.log("Location data to save:", locationData);

      if (editingLocation) {
        console.log("Updating existing location:", editingLocation.id);
        ({ error, data } = await supabase
          .from("customer_locations")
          .update(locationData)
          .eq("id", editingLocation.id));
      } else {
        console.log("Inserting new location");
        ({ error, data } = await supabase
          .from("customer_locations")
          .insert([locationData]));
      }

      console.log("Database operation result:", { error, data });

      if (error) {
        console.error("Database error details:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Location ${editingLocation ? "updated" : "added"} successfully`,
      });

      setFormOpen(false);
      resetForm();
      fetchLocations();
    } catch (error: any) {
      console.error("Error saving location:", error);
      const errorMessage =
        error?.message || error?.error?.message || JSON.stringify(error);
      toast({
        title: "Error",
        description: `Failed to ${editingLocation ? "update" : "add"} location: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (location: CustomerLocation) => {
    setEditingLocation(location);
    setFormData({
      location_name: location.location_name,
      street_address: location.street_address,
      unit_number: location.unit_number || "",
      city: location.city,
      state: location.state,
      zip_code: location.zip_code,
      latitude: location.latitude,
      longitude: location.longitude,
      is_primary: location.is_primary,
      access_instructions: location.access_instructions || "",
      location_type: location.location_type,
    });
    setFormOpen(true);
  };

  const handleDelete = async (location: CustomerLocation) => {
    try {
      const { error } = await supabase
        .from("customer_locations")
        .update({ is_active: false })
        .eq("id", location.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location deleted successfully",
      });

      fetchLocations();
    } catch (error: any) {
      console.error("Error deleting location:", error);
      const errorMessage =
        error?.message || error?.error?.message || "Unknown error";
      toast({
        title: "Error",
        description: `Failed to delete location: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const setPrimary = async (location: CustomerLocation) => {
    try {
      // Get the current user to use the auth user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      // Remove primary from all locations
      await supabase
        .from("customer_locations")
        .update({ is_primary: false })
        .eq("customer_id", user.id);

      // Set this location as primary
      const { error } = await supabase
        .from("customer_locations")
        .update({ is_primary: true })
        .eq("id", location.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Primary location updated",
      });

      fetchLocations();
    } catch (error: any) {
      console.error("Error setting primary location:", error);
      const errorMessage =
        error?.message || error?.error?.message || "Unknown error";
      toast({
        title: "Error",
        description: `Failed to update primary location: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const getLocationIcon = (type: string | null) => {
    switch (type) {
      case "Home":
        return Home;
      case "Condo":
        return Building;
      case "Hotel":
        return Building;
      case "Other":
        return MapPin;
      default:
        return MapPin;
    }
  };

  const openInGoogleMaps = (location: CustomerLocation) => {
    const address = `${location.street_address}${location.unit_number ? `, ${location.unit_number}` : ""}, ${location.city}, ${location.state} ${location.zip_code}`;

    // If we have coordinates, use them for more accuracy
    if (location.latitude && location.longitude) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
      window.open(mapsUrl, "_blank");
    } else {
      // Otherwise use the address
      const encodedAddress = encodeURIComponent(address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(mapsUrl, "_blank");
    }
  };

  const getLocationTypeColor = (type: string | null) => {
    switch (type) {
      case "Home":
        return "bg-green-100 text-green-800";
      case "Condo":
        return "bg-blue-100 text-blue-800";
      case "Hotel":
        return "bg-purple-100 text-purple-800";
      case "Other":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roam-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading your locations...</p>
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
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-roam-blue"
              >
                <Link to="/home">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground/70">
                Welcome, {customer?.first_name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Locations</h1>
              <p className="text-foreground/70">
                Manage your saved addresses for mobile service delivery
              </p>
            </div>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-roam-blue hover:bg-roam-blue/90"
                  onClick={() => {
                    resetForm();
                    setFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingLocation ? "Edit Location" : "Add New Location"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="location_name">Location Name *</Label>
                      <Input
                        id="location_name"
                        value={formData.location_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location_name: e.target.value,
                          }))
                        }
                        placeholder="e.g., Home, Work, Mom's House"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="location_type">Location Type *</Label>
                      <Select
                        value={formData.location_type || undefined}
                        onValueChange={(
                          value: "Home" | "Condo" | "Hotel" | "Other",
                        ) =>
                          setFormData((prev) => ({
                            ...prev,
                            location_type: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select location type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Condo">Condo</SelectItem>
                          <SelectItem value="Hotel">Hotel</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="street_address">Street Address *</Label>
                      <div className="mt-1">
                        <GooglePlacesAutocomplete
                          value={formData.street_address}
                          onChange={handleAddressChange}
                          placeholder="Start typing your address..."
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="unit_number">Unit/Apt/Suite</Label>
                      <Input
                        id="unit_number"
                        value={formData.unit_number}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            unit_number: e.target.value,
                          }))
                        }
                        placeholder="Apt 2B, Unit 5, etc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="City"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                        placeholder="State"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code">ZIP Code *</Label>
                      <Input
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            zip_code: e.target.value,
                          }))
                        }
                        placeholder="ZIP Code"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="access_instructions">
                        Access Instructions
                      </Label>
                      <Textarea
                        id="access_instructions"
                        value={formData.access_instructions}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            access_instructions: e.target.value,
                          }))
                        }
                        placeholder="Gate code, parking instructions, how to find the entrance, etc."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center space-x-2">
                      <Switch
                        id="is_primary"
                        checked={formData.is_primary}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_primary: checked,
                          }))
                        }
                      />
                      <Label htmlFor="is_primary">
                        Set as primary location
                      </Label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormOpen(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                    >
                      {submitting
                        ? "Saving..."
                        : editingLocation
                          ? "Update Location"
                          : "Add Location"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Locations List */}
          {locations.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-roam-light-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-roam-blue" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Locations Saved</h3>
              <p className="text-foreground/60 mb-6">
                Add your first location to make booking mobile services easier
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    resetForm();
                    setFormOpen(true);
                  }}
                  className="bg-roam-blue hover:bg-roam-blue/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Location
                </Button>
                <Button
                  onClick={createDefaultLocation}
                  variant="outline"
                  className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                  disabled={loading}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Create Default Location
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {locations.map((location) => {
                const IconComponent = getLocationIcon(location.location_type);
                return (
                  <Card
                    key={location.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-roam-light-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-6 h-6 text-roam-blue" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">
                                {location.location_name}
                              </h3>
                              {location.location_type && (
                                <Badge
                                  className={getLocationTypeColor(
                                    location.location_type,
                                  )}
                                >
                                  {location.location_type}
                                </Badge>
                              )}
                              {location.is_primary && (
                                <Badge className="bg-roam-yellow text-gray-900">
                                  <Star className="w-3 h-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <div className="text-foreground/70 space-y-1">
                              <p>{location.street_address}</p>
                              {location.unit_number && (
                                <p>Unit: {location.unit_number}</p>
                              )}
                              <p>
                                {location.city}, {location.state}{" "}
                                {location.zip_code}
                              </p>
                              {location.access_instructions && (
                                <p className="text-sm italic">
                                  Instructions: {location.access_instructions}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-foreground/50">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Added{" "}
                                {new Date(
                                  location.created_at,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!location.is_primary && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPrimary(location)}
                              title="Set as primary"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInGoogleMaps(location)}
                            title="View in Google Maps"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Map className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(location)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Location
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "
                                  {location.location_name}"? This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(location)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
