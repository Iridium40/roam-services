import { useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ProviderSelector } from "@/components/ProviderSelector";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  DollarSign,
  Globe,
  Check,
  ArrowLeft,
  Users,
  Shield,
  Camera,
  ExternalLink,
  Briefcase,
  Award,
  Heart,
  Share2,
  UserCheck,
  Car,
  Video,
  Building,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessData {
  business: any;
  services: any[];
  addons: any[];
  location: any;
  hours: any[];
  providers: any[];
  reviews: any[];
  stats: {
    totalBookings: number;
    averageRating: number;
    totalReviews: number;
    yearsInBusiness: number;
  };
}

export default function BusinessProfile() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isCustomer } = useAuth();
  const [searchParams] = useSearchParams();

  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview",
  );
  const [selectedService, setSelectedService] = useState<any>(null);
  const [providerSelectorOpen, setProviderSelectorOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );
  const [deliveryTypeModalOpen, setDeliveryTypeModalOpen] = useState(false);
  const [pendingService, setPendingService] = useState<any>(null);

  useEffect(() => {
    if (businessId) {
      fetchBusinessData();
    } else {
      console.error("No business ID provided");
      toast({
        title: "Invalid Business Link",
        description: "The business link you followed is invalid.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [businessId]);

  // Handle service pre-selection from URL parameters
  useEffect(() => {
    const serviceId = searchParams.get("service");
    console.log("Looking for service ID:", serviceId);
    console.log("Available services:", businessData?.services);

    if (serviceId && businessData?.services) {
      console.log(
        "Service structure check:",
        businessData.services.map((s) => ({
          businessServiceId: s.id,
          serviceId: s.service_id,
          serviceDetails: s.services?.id,
          serviceName: s.services?.name,
        })),
      );

      // Try multiple ways to find the service
      let service = businessData.services.find(
        (s) => s.services?.id === serviceId,
      );
      if (!service) {
        service = businessData.services.find((s) => s.service_id === serviceId);
      }

      console.log("Found service:", service);

      if (service) {
        setSelectedService(service);
        console.log("Selected service:", service.services?.name);
      } else {
        console.log("Service not found in business services");
      }
    }
  }, [searchParams, businessData?.services]);

  const fetchBusinessData = async (retryCount = 0) => {
    try {
      setLoading(true);

      // Validate business ID is a proper UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!businessId || !uuidRegex.test(businessId)) {
        throw new Error(`Invalid business ID format: ${businessId}`);
      }

      // Fetch business profile
      const businessResponse = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .single();

      // Fetch business services with service details
      const servicesResponse = await supabase
        .from("business_services")
        .select(
          `
          id,
          business_price,
          delivery_type,
          is_active,
          services:service_id (
            id,
            name,
            description,
            image_url,
            duration_minutes,
            min_price,
            service_subcategories:subcategory_id (
              id,
              service_subcategory_type,
              service_categories (
                id,
                service_category_type
              )
            )
          )
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true);

      // Fetch business addons
      const addonsResponse = await supabase
        .from("business_addons")
        .select(
          `
          *,
          addons:addon_id (
            name,
            description,
            image_url
          )
        `,
        )
        .eq("business_id", businessId)
        .eq("is_available", true);

      // Fetch business location
      const locationResponse = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", businessId)
        .single();

      // Extract business data first to access business_type
      const { data: business, error: businessError } = businessResponse;
      if (businessError) {
        console.error(
          "Business profile query error:",
          businessError?.message || businessError,
        );
        console.error("Business query details:", businessResponse);
        if (businessError.code === "PGRST116") {
          throw new Error(`Business with ID ${businessId} not found`);
        }
        throw new Error(
          `Failed to load business data: ${businessError.message}`,
        );
      }

      // Fetch providers - now we can safely access business.business_type
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
          cover_image_url,
          average_rating,
          total_reviews,
          verification_status,
          provider_role,
          total_bookings,
          completed_bookings
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true)
        .in(
          "provider_role",
          business.business_type === "independent"
            ? ["provider", "owner"]
            : ["provider"],
        );

      // Check for authentication errors
      const authErrors = [
        businessResponse,
        servicesResponse,
        addonsResponse,
        locationResponse,
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

      if (!business) {
        throw new Error(`Business with ID ${businessId} not found`);
      }

      // Check if business is active and show warning if not
      if (!business.is_active) {
        console.warn("Business is not active:", business.business_name);
      }

      const { data: services, error: servicesError } = servicesResponse;
      console.log("Services query result:", { services, servicesError });

      const { data: addons, error: addonsError } = addonsResponse;
      const { data: location, error: locationError } = locationResponse;

      // Business hours are included in the business profile as JSONB
      const hours = business.business_hours || {};

      const { data: providers, error: providersError } = providersResponse;
      console.log("Providers query result:", { providers, providersError });

      // Mock reviews data (you can implement this based on your reviews table structure)
      const reviews = [
        {
          id: 1,
          customer_name: "Sarah Johnson",
          rating: 5,
          comment:
            "Amazing service! The staff was professional and the results exceeded my expectations.",
          service_name: "Hair Styling",
          date: "2024-01-15",
          verified: true,
        },
        {
          id: 2,
          customer_name: "Michael Chen",
          rating: 5,
          comment:
            "Great experience from start to finish. Will definitely be returning!",
          service_name: "Massage Therapy",
          date: "2024-01-10",
          verified: true,
        },
      ];

      // Mock stats (you can calculate these from actual booking data)
      const stats = {
        totalBookings: 1250,
        averageRating: 4.8,
        totalReviews: reviews.length,
        yearsInBusiness: business.years_in_business || 5,
      };

      setBusinessData({
        business,
        services: services || [],
        addons: addons || [],
        location: location || null,
        hours: hours || [],
        providers: providers || [],
        reviews,
        stats,
      });
    } catch (error: any) {
      console.error("Error fetching business data:", error?.message || error);
      console.error("Business ID:", businessId);

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

      const isNotFoundError = error?.message?.includes("not found");

      toast({
        title: isNotFoundError ? "Business Not Found" : "Error",
        description: isNotFoundError
          ? "The business you're looking for doesn't exist or may have been removed."
          : error.message || "Failed to load business information",
        variant: "destructive",
      });

      // Navigate back to home page after a short delay
      setTimeout(() => navigate("/"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async (service: any) => {
    // Check if session is still valid and refresh if needed
    try {
      if (!isCustomer) {
        // Try to refresh session first
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError || !refreshData?.session) {
          toast({
            title: "Sign in required",
            description: "Please sign in to book services",
            variant: "destructive",
          });
          return;
        }
      }

      // Check if service offers both delivery types
      if (service.delivery_type === "both_locations") {
        setPendingService(service);
        setDeliveryTypeModalOpen(true);
      } else {
        setSelectedService(service);
        setProviderSelectorOpen(true);
      }
    } catch (error) {
      console.error("Error handling book service:", error);
      toast({
        title: "Authentication Error",
        description: "Please refresh the page and try again",
        variant: "destructive",
      });
    }
  };

  const handleDeliveryTypeSelection = (deliveryType: string) => {
    if (pendingService) {
      // Create a modified service object with the selected delivery type
      const serviceWithDeliveryType = {
        ...pendingService,
        delivery_type: deliveryType,
      };

      setSelectedService(serviceWithDeliveryType);
      setDeliveryTypeModalOpen(false);
      setPendingService(null);
      setProviderSelectorOpen(true);
    }
  };

  const handleProviderSelection = (providerId: string | null) => {
    setSelectedProviderId(providerId);
    if (selectedService) {
      // Preserve date and time parameters from the current URL
      const selectedDate = searchParams.get("date");
      const selectedTime = searchParams.get("time");
      const promotionId = searchParams.get("promotion");
      const promoCode = searchParams.get("promo_code");
      const deliveryType = searchParams.get("deliveryType");
      const location = searchParams.get("location");
      const address = searchParams.get("address");

      let bookingUrl = `/book/${businessId}?service=${selectedService.id}`;
      if (providerId) {
        bookingUrl += `&provider=${providerId}`;
      }
      if (selectedDate) {
        bookingUrl += `&date=${selectedDate}`;
      }
      if (selectedTime) {
        bookingUrl += `&time=${selectedTime}`;
      }
      if (promotionId) {
        bookingUrl += `&promotion=${promotionId}`;
      }
      if (promoCode) {
        bookingUrl += `&promo_code=${promoCode}`;
      }
      if (deliveryType) {
        bookingUrl += `&deliveryType=${deliveryType}`;
      }
      if (location) {
        bookingUrl += `&location=${location}`;
      }
      if (address) {
        bookingUrl += `&address=${address}`;
      }

      navigate(bookingUrl);
    }
  };

  const handleBookBusiness = () => {
    // Preserve all parameters from the current URL
    const selectedDate = searchParams.get("date");
    const selectedTime = searchParams.get("time");
    const promotionId = searchParams.get("promotion");
    const promoCode = searchParams.get("promo_code");
    const deliveryType = searchParams.get("deliveryType");
    const location = searchParams.get("location");
    const address = searchParams.get("address");

    let bookingUrl = `/book/${businessId}`;
    const params = new URLSearchParams();

    if (selectedDate) {
      params.append("date", selectedDate);
    }
    if (selectedTime) {
      params.append("time", selectedTime);
    }
    if (promotionId) {
      params.append("promotion", promotionId);
    }
    if (promoCode) {
      params.append("promo_code", promoCode);
    }
    if (deliveryType) {
      params.append("deliveryType", deliveryType);
    }
    if (location) {
      params.append("location", location);
    }
    if (address) {
      params.append("address", address);
    }

    if (params.toString()) {
      bookingUrl += `?${params.toString()}`;
    }

    navigate(bookingUrl);
  };

  const formatBusinessHours = (hours: any) => {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return daysOfWeek.map((day) => {
      const dayHours = hours[day];
      if (!dayHours || !dayHours.open || !dayHours.close) {
        return { day, hours: "Closed" };
      }

      // Convert 24-hour format to 12-hour format
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const period = hour24 >= 12 ? "PM" : "AM";
        return `${hour12}:${minutes} ${period}`;
      };

      return {
        day,
        hours: `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roam-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading business profile...</p>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Business Not Found
          </h1>
          <p className="text-foreground/60 mb-6">
            The business you're looking for could not be found.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-roam-blue hover:bg-roam-blue/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const {
    business,
    services,
    addons,
    location,
    hours,
    providers,
    reviews,
    stats,
  } = businessData;
  const formattedHours = formatBusinessHours(hours);

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
                  to={(() => {
                    const serviceId = searchParams.get("service");
                    const date = searchParams.get("date");
                    const time = searchParams.get("time");

                    if (serviceId && date && time) {
                      return `/book-service/${serviceId}/businesses?date=${date}&time=${time}`;
                    }
                    return "/home";
                  })()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">
                    Back to Business Selection
                  </span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-8 w-auto"
              />
            </div>
            {isCustomer && (
              <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="sm">
                  <Link to="/my-bookings">My Bookings</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div
          className="h-64 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: business.cover_image_url
              ? `url(${business.cover_image_url})`
              : `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&h=400&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-32 mb-8">
            <Card className="p-6 bg-background/70 backdrop-blur-sm border-border/30 relative">
              {/* Heart icon in top right corner */}
              <div className="absolute top-4 right-4 z-10">
                <FavoriteButton
                  type="business"
                  itemId={business.id}
                  size="sm"
                  variant="ghost"
                  showText={false}
                  className="hover:bg-background/80 p-2"
                />
              </div>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={business.logo_url || business.image_url || undefined}
                    alt={business.business_name}
                  />
                  <AvatarFallback className="text-2xl">
                    {business.business_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                        {business.business_name}
                      </h1>
                      <p className="text-foreground/70 text-base sm:text-lg mb-3">
                        {business.business_description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Business Location Address */}
                        {businessData?.location && (
                          <div className="flex items-center gap-1 text-sm text-foreground/70">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {[
                                businessData.location.address_line1,
                                businessData.location.city,
                                businessData.location.state,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-roam-warning fill-current" />
                          <span className="font-semibold">
                            {stats.averageRating}
                          </span>
                          <span className="text-foreground/60 text-sm">
                            ({stats.totalReviews} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hide Book Now button when user is in booking flow */}
                    {!searchParams.get("service") &&
                      !searchParams.get("date") &&
                      !searchParams.get("time") && (
                        <Button
                          size="lg"
                          className="bg-roam-blue hover:bg-roam-blue/90 w-full sm:w-auto"
                          onClick={handleBookBusiness}
                        >
                          <Calendar className="w-5 h-5 mr-2" />
                          Book Now
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs - Hidden on mobile */}
          <TabsList className="hidden sm:grid w-full grid-cols-5 gap-1 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">
              Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="team">Team ({providers.length})</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Mobile Dropdown - Hidden on desktop */}
          <div className="mb-6 sm:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="services">
                  Services ({services.length})
                </SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="team">Team ({providers.length})</SelectItem>
                <SelectItem value="reviews">
                  Reviews ({reviews.length})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* About */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    About {business.business_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground/80 leading-relaxed">
                    {business.business_description ||
                      "Professional service provider offering quality services to the community."}
                  </p>

                  {business.specialties && (
                    <div>
                      <h4 className="font-semibold mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {business.specialties.map(
                          (specialty: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-roam-blue text-roam-blue"
                            >
                              {specialty}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-roam-light-blue/10 rounded-lg">
                      <div className="text-2xl font-bold text-roam-blue">
                        {stats.totalBookings}+
                      </div>
                      <div className="text-sm text-foreground/60">
                        Happy Clients
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.yearsInBusiness}
                      </div>
                      <div className="text-sm text-foreground/60">
                        Years Experience
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info & Hours */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {business.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-foreground/60" />
                        <span className="text-sm">{business.phone}</span>
                      </div>
                    )}
                    {business.contact_email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-foreground/60" />
                        <span className="text-sm">
                          {business.contact_email}
                        </span>
                      </div>
                    )}
                    {business.website_url && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-foreground/60" />
                        <a
                          href={business.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-roam-blue hover:underline flex items-center gap-1"
                        >
                          Visit Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-foreground/60 mt-0.5" />
                        <div className="text-sm">
                          <div>{location.address_line1}</div>
                          {location.address_line2 && (
                            <div>{location.address_line2}</div>
                          )}
                          <div>
                            {location.city}, {location.state}{" "}
                            {location.postal_code}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Hours Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {formattedHours.slice(0, 3).map((dayHours, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="font-medium">{dayHours.day}</span>
                          <span className="text-foreground/60">
                            {dayHours.hours}
                          </span>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab("hours")}
                        className="w-full mt-2 text-roam-blue hover:text-roam-blue"
                      >
                        View All Hours
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            {/* Preselected Service Section */}
            {selectedService && (
              <Card className="border-2 border-roam-blue bg-roam-blue/5 mb-8">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg sm:text-xl text-roam-blue">
                        Selected Service
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                        Ready to book •{" "}
                        {searchParams.get("date") &&
                          new Date(
                            searchParams.get("date")!,
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                        {searchParams.get("time") &&
                          `at ${searchParams.get("time")}`}
                      </p>
                    </div>
                    <Badge className="bg-roam-yellow text-gray-900">
                      Selected
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    {selectedService.services?.image_url && (
                      <img
                        src={selectedService.services.image_url}
                        alt={selectedService.services?.name}
                        className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 w-full">
                      <h3 className="text-lg font-semibold mb-2">
                        {selectedService.services?.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {selectedService.services?.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {selectedService.services?.duration_minutes} minutes
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />$
                          {selectedService.business_price}
                        </div>
                        {selectedService.delivery_type && (
                          <Badge variant="outline" className="text-xs">
                            {selectedService.delivery_type ===
                            "customer_location"
                              ? "Mobile"
                              : selectedService.delivery_type ===
                                  "business_location"
                                ? "Business"
                                : "Virtual"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                          onClick={() => setProviderSelectorOpen(true)}
                          className="bg-roam-blue hover:bg-roam-blue/90 w-full sm:w-auto"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">
                            Choose Provider
                          </span>
                          <span className="sm:hidden">Choose Provider</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setSelectedService(null);
                            // Remove service from URL
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete("service");
                            navigate(`?${newParams.toString()}`, {
                              replace: true,
                            });
                          }}
                        >
                          Change Service
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Grid - Only show when no service is selected */}
            {!selectedService && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Available Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <Card
                      key={service.id}
                      className={`hover:shadow-lg transition-all duration-200 group ${
                        selectedService?.id === service.id
                          ? "ring-2 ring-roam-blue border-roam-blue"
                          : ""
                      }`}
                    >
                      <div className="relative">
                        {service.services?.image_url && (
                          <img
                            src={service.services.image_url}
                            alt={service.services?.name}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        )}
                        <div className="absolute top-3 right-3">
                          <FavoriteButton
                            type="service"
                            itemId={service.service_id}
                            size="sm"
                            variant="ghost"
                            className="bg-white/90 hover:bg-white"
                          />
                        </div>
                      </div>

                      <CardContent className="p-6">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">
                              {service.services?.name}
                            </h3>
                            {selectedService?.id === service.id && (
                              <Badge className="bg-roam-yellow text-gray-900 text-xs">
                                Pre-selected
                              </Badge>
                            )}
                          </div>
                          <p className="text-foreground/70 text-sm mb-3 line-clamp-2">
                            {service.services?.description}
                          </p>

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-roam-blue" />
                              <span className="text-xl font-bold text-roam-blue">
                                $
                                {service.business_price || service.custom_price}
                              </span>
                            </div>
                            {service.services?.duration_minutes && (
                              <Badge
                                variant="outline"
                                className="border-roam-blue text-roam-blue"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {service.services.duration_minutes} min
                              </Badge>
                            )}
                          </div>

                          {service.services?.service_subcategories && (
                            <Badge variant="secondary" className="text-xs mb-2">
                              {
                                service.services.service_subcategories
                                  .service_categories?.service_category_type
                              }
                            </Badge>
                          )}

                          {/* Delivery Type Badge */}
                          {service.delivery_type && (
                            <div className="flex gap-2 mb-4">
                              {service.delivery_type === "both_locations" ? (
                                <>
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-blue-500 text-blue-700 bg-blue-50"
                                  >
                                    <Building className="w-3 h-3 mr-1" />
                                    Business
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-green-500 text-green-700 bg-green-50"
                                  >
                                    <Car className="w-3 h-3 mr-1" />
                                    Mobile
                                  </Badge>
                                </>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    service.delivery_type ===
                                    "customer_location"
                                      ? "border-green-500 text-green-700 bg-green-50"
                                      : service.delivery_type ===
                                          "business_location"
                                        ? "border-blue-500 text-blue-700 bg-blue-50"
                                        : "border-purple-500 text-purple-700 bg-purple-50"
                                  }`}
                                >
                                  {service.delivery_type ===
                                  "customer_location" ? (
                                    <>
                                      <Car className="w-3 h-3 mr-1" />
                                      Mobile
                                    </>
                                  ) : service.delivery_type ===
                                    "business_location" ? (
                                    <>
                                      <Building className="w-3 h-3 mr-1" />
                                      Business
                                    </>
                                  ) : (
                                    <>
                                      <Video className="w-3 h-3 mr-1" />
                                      Virtual
                                    </>
                                  )}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Button
                            className="w-full bg-roam-blue hover:bg-roam-blue/90"
                            onClick={() => handleBookService(service)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book This Service
                          </Button>
                          {providers.length > 0 && (
                            <div className="text-xs text-center text-foreground/60 flex items-center justify-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              Choose your preferred provider during booking
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {services.length === 0 && (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No Services Available
                </h3>
                <p className="text-foreground/60">
                  This business hasn't added any services yet.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formattedHours.map((dayHours, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0"
                    >
                      <span className="font-medium">{dayHours.day}</span>
                      <span
                        className={`${dayHours.hours === "Closed" ? "text-red-500" : "text-foreground/80"}`}
                      >
                        {dayHours.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            {selectedProviderId && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <UserCheck className="w-5 h-5" />
                    <span className="font-medium">
                      {
                        providers.find((p) => p.id === selectedProviderId)
                          ?.first_name
                      }{" "}
                      {
                        providers.find((p) => p.id === selectedProviderId)
                          ?.last_name
                      }{" "}
                      is your preferred provider
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProviderId(null);
                        toast({
                          title: "Provider Preference Cleared",
                          description:
                            "No provider preference set. The business will assign the best available provider.",
                        });
                      }}
                      className="ml-auto text-green-600 hover:text-green-700"
                    >
                      Clear Preference
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className={`hover:shadow-lg transition-shadow ${
                    selectedProviderId === provider.id
                      ? "ring-2 ring-green-500 bg-green-50"
                      : ""
                  }`}
                >
                  <CardContent className="p-6 text-center relative">
                    {selectedProviderId === provider.id && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Preferred
                        </Badge>
                      </div>
                    )}
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarImage src={provider.image_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {provider.first_name[0]}
                        {provider.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <h3 className="text-lg font-semibold mb-2">
                      {provider.first_name} {provider.last_name}
                    </h3>

                    {provider.bio && (
                      <p className="text-sm text-foreground/70 mb-3 line-clamp-3">
                        {provider.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-4 mb-4">
                      {provider.experience_years && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-roam-blue">
                            {provider.experience_years}
                          </div>
                          <div className="text-xs text-foreground/60">
                            Years Exp.
                          </div>
                        </div>
                      )}
                      {provider.average_rating && (
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-roam-warning fill-current" />
                            <span className="font-bold">
                              {provider.average_rating}
                            </span>
                          </div>
                          <div className="text-xs text-foreground/60">
                            ({provider.total_reviews || 0} reviews)
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {provider.provider_role && (
                        <Badge
                          variant="outline"
                          className="text-xs border-roam-blue text-roam-blue"
                        >
                          {provider.provider_role.replace("_", " ")}
                        </Badge>
                      )}
                      {provider.experience_years && (
                        <Badge variant="outline" className="text-xs">
                          {provider.experience_years} years exp.
                        </Badge>
                      )}
                      {provider.verification_status === "verified" && (
                        <Badge
                          variant="outline"
                          className="text-xs border-green-500 text-green-600"
                        >
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="w-full border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        <Link to={`/provider/${provider.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      <FavoriteButton
                        type="provider"
                        itemId={provider.id}
                        showText={true}
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {providers.length === 0 && (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
                <p className="text-foreground/60">
                  This business hasn't added any team members yet.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Reviews Summary */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-center">Overall Rating</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-roam-blue mb-2">
                    {stats.averageRating}
                  </div>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= stats.averageRating ? "text-roam-warning fill-current" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-foreground/60">
                    {stats.totalReviews} reviews
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="lg:col-span-3 space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {review.customer_name}
                            </span>
                            {review.verified && (
                              <Badge
                                variant="outline"
                                className="text-xs border-green-500 text-green-600"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= review.rating ? "text-roam-warning fill-current" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-foreground/60">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-foreground/80 mb-2">
                        {review.comment}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {review.service_name}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}

                {reviews.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No Reviews Yet
                    </h3>
                    <p className="text-foreground/60">
                      Be the first to leave a review for this business!
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Provider Selection Modal */}
      {/* Delivery Type Selection Modal */}
      <Dialog
        open={deliveryTypeModalOpen}
        onOpenChange={setDeliveryTypeModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Service Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              This service can be delivered at a business location or as a
              mobile service. Please choose your preferred option:
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start border-blue-500 hover:bg-blue-50"
                onClick={() => handleDeliveryTypeSelection("business_location")}
              >
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Business Location</div>
                    <div className="text-sm text-gray-500">
                      Service at the business location
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start border-green-500 hover:bg-green-50"
                onClick={() => handleDeliveryTypeSelection("customer_location")}
              >
                <div className="flex items-center space-x-3">
                  <Car className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Mobile Service</div>
                    <div className="text-sm text-gray-500">
                      Service comes to your location
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setDeliveryTypeModalOpen(false);
                setPendingService(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProviderSelector
        isOpen={providerSelectorOpen}
        onClose={() => setProviderSelectorOpen(false)}
        providers={providers}
        serviceName={selectedService?.services?.name || "Service"}
        onConfirm={handleProviderSelection}
        selectedProviderId={selectedProviderId}
      />
    </div>
  );
}
