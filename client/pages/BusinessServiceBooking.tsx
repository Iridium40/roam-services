import { useState, useEffect } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Star,
  MapPin,
  Shield,
  ChevronRight,
  Building,
  DollarSign,
  Users,
  UserCheck,
  Shuffle,
  Plus,
  Minus,
  CheckCircle,
  Home,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";

export default function BusinessServiceBooking() {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isCustomer } = useAuth();

  const selectedDate = searchParams.get("date");
  const selectedTime = searchParams.get("time");
  const preSelectedServiceId = searchParams.get("serviceId");

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] =
    useState<string>("no-preference");
  const [deliveryType, setDeliveryType] = useState<string>("");
  const [customerLocation, setCustomerLocation] = useState<string>("");
  const [customerLocationData, setCustomerLocationData] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>("");

  const fetchSavedLocations = async (retryCount = 0) => {
    if (!customer?.customer_id) return;

    try {
      const { data, error } = await supabase
        .from("customer_locations")
        .select("*")
        .eq("customer_id", customer.id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        // Check if this is a JWT expiration error
        if (
          (error.message?.includes("JWT") ||
            error.message?.includes("401") ||
            error.code === "PGRST301") &&
          retryCount === 0
        ) {
          console.log("JWT error in fetchSavedLocations, refreshing token...");
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (!refreshError && refreshData?.session) {
            console.log("Session refreshed, retrying saved locations fetch...");
            return await fetchSavedLocations(1);
          }
        }
        throw error;
      }
      setSavedLocations(data || []);
    } catch (error) {
      console.error("Error fetching saved locations:", error);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchBusinessData();
    }
  }, [businessId]);

  useEffect(() => {
    if (customer?.customer_id) {
      fetchSavedLocations();
    }
  }, [customer?.customer_id]);

  const fetchBusinessData = async (retryCount = 0) => {
    try {
      setLoading(true);

      // Fetch business details
      const businessResponse = await supabase
        .from("business_profiles")
        .select(
          `
          id,
          business_name,
          business_type,
          logo_url,
          image_url,
          verification_status,
          is_featured,
          contact_email,
          phone,
          website_url
        `,
        )
        .eq("id", businessId)
        .eq("is_active", true)
        .single();

      // Fetch services
      const servicesResponse = await supabase
        .from("business_services")
        .select(
          `
          id,
          service_id,
          business_price,
          delivery_type,
          services (
            id,
            name,
            description,
            duration_minutes
          )
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true);

      // Fetch addons
      const addonsResponse = await supabase
        .from("business_addons")
        .select(
          `
          id,
          addon_id,
          custom_price,
          service_addons (
            id,
            name,
            description,
            base_price
          )
        `,
        )
        .eq("business_id", businessId)
        .eq("is_available", true);

      // Fetch providers
      const providersResponse = await supabase
        .from("providers")
        .select(
          `
          id,
          first_name,
          last_name,
          bio,
          experience_years,
          image_url,
          average_rating,
          total_reviews
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true);

      // Check for authentication errors
      const authErrors = [
        businessResponse,
        servicesResponse,
        addonsResponse,
        providersResponse,
      ].filter((response) => response.status === 401);

      if (authErrors.length > 0 && retryCount === 0) {
        console.log("JWT token expired, refreshing session...");
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Token refresh failed:", refreshError);
          toast({
            title: "Authentication Error",
            description:
              "Your session has expired. Please refresh the page and sign in again.",
            variant: "destructive",
          });
          return;
        }

        if (refreshData?.session) {
          console.log("Session refreshed successfully, retrying...");
          return await fetchBusinessData(1);
        }
      }

      const { data: businessData, error: businessError } = businessResponse;
      if (businessError || !businessData) {
        console.error(
          "Business not found, using fallback data:",
          businessError?.message || businessError,
        );
        const fallbackBusiness = {
          id: businessId,
          business_name: "Smith Health & Wellness",
          business_type: "small_business",
          logo_url:
            "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop",
          image_url: null,
          verification_status: "approved",
          contact_email: "info@smithhealthwellness.com",
          phone: "(555) 123-4567",
          website_url: null,
        };
        setBusiness(fallbackBusiness);
      } else {
        setBusiness(businessData);
      }

      const { data: servicesData, error: servicesError } = servicesResponse;
      // Use fallback service data if no services found
      if (!servicesData || servicesData.length === 0) {
        console.log("No services found, using fallback data");
        const fallbackServices = [
          {
            id: "fallback-service-1",
            service_id: preSelectedServiceId || "fallback-service-1",
            business_price: 85,
            delivery_type: "mobile",
            services: {
              id: preSelectedServiceId || "fallback-service-1",
              name: "60 Minute Massage",
              description: "Relaxing full-body massage therapy session",
              duration_minutes: 60,
            },
          },
        ];
        setServices(fallbackServices);
      } else {
        setServices(servicesData);
      }

      const { data: addonsData, error: addonsError } = addonsResponse;
      setAddons(addonsData || []);

      const { data: providersData, error: providersError } = providersResponse;
      setProviders(providersData || []);

      // Auto-select service if specified
      if (preSelectedServiceId && servicesData) {
        const preSelected = servicesData.find(
          (s) => s.service_id === preSelectedServiceId,
        );
        if (preSelected) {
          setSelectedServices([{ ...preSelected, quantity: 1 }]);
          setDeliveryType(preSelected.delivery_type);
        }
      }
    } catch (error: any) {
      console.error("Error fetching business data:", error);

      // Check if this is a JWT expiration error and we haven't retried yet
      if (
        (error.message?.includes("JWT") ||
          error.message?.includes("401") ||
          error.status === 401) &&
        retryCount === 0
      ) {
        console.log("JWT error detected, attempting token refresh...");
        try {
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (!refreshError && refreshData?.session) {
            console.log("Session refreshed, retrying business data fetch...");
            return await fetchBusinessData(1);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }

        toast({
          title: "Authentication Error",
          description:
            "Your session has expired. Please refresh the page and sign in again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to load business information",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const addService = (service: any) => {
    const existing = selectedServices.find((s) => s.id === service.id);
    if (existing) {
      setSelectedServices(
        selectedServices.map((s) =>
          s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s,
        ),
      );
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
      if (!deliveryType) {
        setDeliveryType(service.delivery_type);
      }
    }
  };

  const removeService = (serviceId: string) => {
    const existing = selectedServices.find((s) => s.id === serviceId);
    if (existing && existing.quantity > 1) {
      setSelectedServices(
        selectedServices.map((s) =>
          s.id === serviceId ? { ...s, quantity: s.quantity - 1 } : s,
        ),
      );
    } else {
      setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
    }
  };

  const addAddon = (addon: any) => {
    const existing = selectedAddons.find((a) => a.id === addon.id);
    if (existing) {
      setSelectedAddons(
        selectedAddons.map((a) =>
          a.id === addon.id ? { ...a, quantity: a.quantity + 1 } : a,
        ),
      );
    } else {
      setSelectedAddons([...selectedAddons, { ...addon, quantity: 1 }]);
    }
  };

  const removeAddon = (addonId: string) => {
    const existing = selectedAddons.find((a) => a.id === addonId);
    if (existing && existing.quantity > 1) {
      setSelectedAddons(
        selectedAddons.map((a) =>
          a.id === addonId ? { ...a, quantity: a.quantity - 1 } : a,
        ),
      );
    } else {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addonId));
    }
  };

  const calculateTotal = () => {
    const serviceTotal = selectedServices.reduce(
      (sum, service) => sum + service.business_price * service.quantity,
      0,
    );
    const addonTotal = selectedAddons.reduce(
      (sum, addon) =>
        sum +
        (addon.custom_price || addon.service_addons.base_price) *
          addon.quantity,
      0,
    );
    return serviceTotal + addonTotal;
  };

  const handleLocationChange = (
    address: string,
    placeData?: google.maps.places.PlaceResult,
  ) => {
    setCustomerLocation(address);
    if (placeData) {
      setCustomerLocationData(placeData);
    } else {
      setCustomerLocationData(null);
    }
  };

  const handleContinueToCheckout = () => {
    if (selectedServices.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service to continue",
        variant: "destructive",
      });
      return;
    }

    if (deliveryType === "mobile" && !customerLocation.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter your location for mobile service",
        variant: "destructive",
      });
      return;
    }

    // Prepare booking data
    const bookingData = {
      businessId,
      date: selectedDate,
      time: selectedTime,
      services: selectedServices,
      addons: selectedAddons,
      providerId:
        selectedProvider === "no-preference" ? null : selectedProvider,
      deliveryType,
      customerLocation: deliveryType === "mobile" ? customerLocation : null,
      customerLocationData:
        deliveryType === "mobile" ? customerLocationData : null,
      specialRequests,
      total: calculateTotal(),
    };

    // Store in sessionStorage and navigate to checkout
    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate("/checkout");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roam-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading booking details...</p>
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
                <Link
                  to={`/book-service/${preSelectedServiceId}/businesses?date=${selectedDate}&time=${selectedTime}`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Businesses
                </Link>
              </Button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Indicator */}
      <div className="bg-background/50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Date & Time
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Business Selected
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-roam-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-roam-blue">
                  Book Service
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={
                          business?.logo_url || business?.image_url || undefined
                        }
                      />
                      <AvatarFallback>
                        <Building className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold">
                          {business?.business_name}
                        </h1>
                        {business?.is_featured && (
                          <Badge className="bg-roam-yellow text-gray-900">
                            <Star className="w-4 h-4 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-foreground/70">
                        Professional{" "}
                        {business?.business_type?.replace("_", " ")} services
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {business?.verification_status === "approved" && (
                          <Badge className="bg-green-100 text-green-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-sm text-foreground/60">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {selectedDate ? formatDate(selectedDate) : ""}
                          </span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{selectedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {service.services.name}
                            </h3>
                            <p className="text-sm text-foreground/70 mb-2">
                              {service.services.description}
                            </p>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-roam-blue">
                                ${service.business_price}
                              </span>
                              <Badge variant="outline">
                                {service.services.duration_minutes} min
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedServices.find(
                              (s) => s.id === service.id,
                            ) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeService(service.id)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center">
                                  {selectedServices.find(
                                    (s) => s.id === service.id,
                                  )?.quantity || 0}
                                </span>
                              </>
                            )}
                            <Button
                              size="sm"
                              onClick={() => addService(service)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Addons Selection */}
              {addons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add-ons (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {addons.map((addon) => (
                        <div key={addon.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">
                                {addon.service_addons.name}
                              </h3>
                              <p className="text-sm text-foreground/70 mb-2">
                                {addon.service_addons.description}
                              </p>
                              <span className="text-lg font-bold text-roam-blue">
                                $
                                {addon.custom_price ||
                                  addon.service_addons.base_price}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedAddons.find(
                                (a) => a.id === addon.id,
                              ) && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeAddon(addon.id)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-8 text-center">
                                    {selectedAddons.find(
                                      (a) => a.id === addon.id,
                                    )?.quantity || 0}
                                  </span>
                                </>
                              )}
                              <Button size="sm" onClick={() => addAddon(addon)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Provider Preference */}
              {providers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Provider Preference (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedProvider}
                      onValueChange={setSelectedProvider}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem
                          value="no-preference"
                          id="no-preference"
                        />
                        <Label
                          htmlFor="no-preference"
                          className="flex items-center gap-2"
                        >
                          <Shuffle className="w-4 h-4 text-roam-blue" />
                          No Preference (Business Choice)
                        </Label>
                      </div>
                      {providers.map((provider) => (
                        <div
                          key={provider.id}
                          className="flex items-center space-x-2 p-3 border rounded-lg"
                        >
                          <RadioGroupItem
                            value={provider.id}
                            id={provider.id}
                          />
                          <Label
                            htmlFor={provider.id}
                            className="flex items-center gap-3 flex-1"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={provider.image_url || undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {provider.first_name[0]}
                                {provider.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {provider.first_name} {provider.last_name}
                              </div>
                              {provider.average_rating && (
                                <div className="flex items-center gap-1 text-sm text-foreground/60">
                                  <Star className="w-3 h-3 text-roam-warning fill-current" />
                                  <span>{provider.average_rating}</span>
                                  <span>({provider.total_reviews || 0})</span>
                                </div>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Location Input for Mobile Services */}
              {deliveryType === "mobile" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Service Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Saved Locations */}
                      {savedLocations.length > 0 && (
                        <div>
                          <Label>Choose from Saved Locations</Label>
                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {savedLocations.map((location) => (
                              <Button
                                key={location.id}
                                variant="outline"
                                onClick={() => {
                                  const fullAddress = `${location.street_address}${location.unit_number ? `, ${location.unit_number}` : ""}, ${location.city}, ${location.state} ${location.zip_code}`;
                                  setCustomerLocation(fullAddress);
                                  setCustomerLocationData(null);
                                }}
                                className="w-full justify-start text-left h-auto p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-roam-light-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    {location.location_type === "Home" ? (
                                      <Home className="w-4 h-4 text-roam-blue" />
                                    ) : location.location_type === "Condo" ? (
                                      <Building className="w-4 h-4 text-roam-blue" />
                                    ) : location.location_type === "Hotel" ? (
                                      <Building className="w-4 h-4 text-roam-blue" />
                                    ) : (
                                      <MapPin className="w-4 h-4 text-roam-blue" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {location.location_name}
                                      </span>
                                      {location.is_primary && (
                                        <Badge className="bg-roam-yellow text-gray-900 text-xs">
                                          Primary
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-foreground/60">
                                      {location.street_address}, {location.city}
                                      , {location.state}
                                    </div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Manual Address Input */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="location">
                            {savedLocations.length > 0
                              ? "Or Enter a New Address"
                              : "Your Address"}
                          </Label>
                          {savedLocations.length === 0 && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              asChild
                              className="h-auto p-0 text-roam-blue"
                            >
                              <Link to="/customer/locations" target="_blank">
                                <Plus className="w-3 h-3 mr-1" />
                                Save locations for faster booking
                              </Link>
                            </Button>
                          )}
                        </div>
                        <div className="mt-1">
                          <GooglePlacesAutocomplete
                            value={customerLocation}
                            onChange={handleLocationChange}
                            placeholder="Start typing your address..."
                            className="w-full"
                          />
                        </div>
                        {customerLocationData && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            ✓ Address validated with Google Maps
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Special Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Special Requests (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any special instructions or requests for your appointment..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Services</h4>
                      {selectedServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between text-sm mb-1"
                        >
                          <span>
                            {service.services.name} × {service.quantity}
                          </span>
                          <span>
                            ${service.business_price * service.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Addons */}
                  {selectedAddons.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Add-ons</h4>
                      {selectedAddons.map((addon) => (
                        <div
                          key={addon.id}
                          className="flex justify-between text-sm mb-1"
                        >
                          <span>
                            {addon.service_addons.name} × {addon.quantity}
                          </span>
                          <span>
                            $
                            {(addon.custom_price ||
                              addon.service_addons.base_price) * addon.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-roam-blue">${calculateTotal()}</span>
                  </div>

                  {/* Continue Button */}
                  <Button
                    onClick={handleContinueToCheckout}
                    disabled={selectedServices.length === 0}
                    className="w-full bg-roam-blue hover:bg-roam-blue/90"
                    size="lg"
                  >
                    Continue to Checkout
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Help Text */}
                  <div className="text-xs text-foreground/60 space-y-1">
                    <p>• Select your desired services and add-ons</p>
                    <p>• Choose your preferred provider (optional)</p>
                    <p>• Final booking confirmation in next step</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
