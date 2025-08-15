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
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Star,
  DollarSign,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ServiceBookingFlow() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isCustomer } = useAuth();

  // Extract promotion and business parameters
  const promotionId = searchParams.get("promotion");
  const promoCode = searchParams.get("promo_code");
  const businessId = searchParams.get("business_id");
  const autoBook = searchParams.get("auto_book") === "true";

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [step, setStep] = useState(1);

  // Helper function to convert 24-hour time to AM/PM format
  const formatTimeToAMPM = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Generate time slots for booking
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);

  const fetchServiceData = async (retryCount = 0) => {
    try {
      setLoading(true);

      const serviceResponse = await supabase
        .from("services")
        .select(
          `
          id,
          name,
          description,
          min_price,
          duration_minutes,
          image_url,
          service_subcategories (
            service_subcategory_type,
            service_categories (
              service_category_type
            )
          )
        `,
        )
        .eq("id", serviceId)
        .eq("is_active", true);

      // Check for authentication error
      if (serviceResponse.status === 401 && retryCount === 0) {
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
          return await fetchServiceData(1);
        }
      }

      const { data: serviceDataArray, error } = serviceResponse;
      const serviceData = serviceDataArray?.[0];
      if (error || !serviceData) {
        console.error("Service query error:", error);
        console.error("Service ID requested:", serviceId);
        console.error("Query result:", serviceDataArray);
        throw new Error("Service not found");
      }

      setService(serviceData);
    } catch (error: any) {
      console.error("Error fetching service:", error);

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
            console.log("Session refreshed, retrying service data fetch...");
            return await fetchServiceData(1);
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
        description: "Failed to load service information",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time to continue",
        variant: "destructive",
      });
      return;
    }

    // Format the date and time for URL
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const bookingParams = new URLSearchParams({
      date: formattedDate,
      time: selectedTime,
    });

    // Add promotion parameters if present
    if (promotionId) {
      bookingParams.set("promotion", promotionId);
    }
    if (promoCode) {
      bookingParams.set("promo_code", promoCode);
    }
    if (businessId) {
      bookingParams.set("business_id", businessId);
    }
    if (autoBook) {
      bookingParams.set("auto_book", "true");
    }

    navigate(
      `/book-service/${serviceId}/businesses?${bookingParams.toString()}`,
    );
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates and Sundays (example business rule)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roam-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading service information...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Service Not Found
          </h1>
          <p className="text-foreground/60 mb-6">
            The service you're looking for could not be found.
          </p>
          <Button asChild className="bg-roam-blue hover:bg-roam-blue/90">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
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
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-foreground hover:text-roam-blue"
              >
                <Link to="/home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-8 w-auto"
              />
            </div>
            {isCustomer && (
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile: Show avatar only */}
                <div className="sm:hidden">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={customer?.image_url}
                      alt={customer?.first_name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-roam-blue text-white text-sm font-medium">
                      {customer?.first_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Desktop: Show welcome text with small avatar */}
                <div className="hidden sm:flex sm:items-center sm:gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage
                      src={customer?.image_url}
                      alt={customer?.first_name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-roam-blue text-white text-xs font-medium">
                      {customer?.first_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground/70">
                    Welcome, {customer?.first_name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Progress Indicator */}
      <div className="bg-background/50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-roam-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="ml-2 text-xs sm:text-sm font-medium text-roam-blue hidden sm:inline">
                  Select Date & Time
                </span>
                {/* Mobile-only compact label */}
                <span className="ml-1 text-xs font-medium text-roam-blue sm:hidden">
                  Date
                </span>
              </div>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-foreground/20 text-foreground/60 rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <span className="ml-2 text-xs sm:text-sm text-foreground/60 hidden sm:inline">
                  Choose Business
                </span>
                {/* Mobile-only compact label */}
                <span className="ml-1 text-xs text-foreground/60 sm:hidden">
                  Business
                </span>
              </div>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/40" />
              <div className="flex items-center">
                <div className="w-8 h-8 bg-foreground/20 text-foreground/60 rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <span className="ml-2 text-xs sm:text-sm text-foreground/60 hidden sm:inline">
                  Book Service
                </span>
                {/* Mobile-only compact label */}
                <span className="ml-1 text-xs text-foreground/60 sm:hidden">
                  Book
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service Information */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.image_url && (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}

                  <div>
                    <h3 className="font-semibold text-xl mb-2">
                      {service.name}
                    </h3>
                    <p className="text-foreground/70 text-sm mb-3">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-roam-blue" />
                        <span className="text-lg font-bold text-roam-blue">
                          Starting at ${service.min_price}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-roam-blue text-roam-blue"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {service.duration_minutes} min
                      </Badge>
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      {
                        service.service_subcategories?.service_categories
                          ?.service_category_type
                      }
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Date & Time Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Select Your Preferred Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <h4 className="font-semibold mb-3">Choose Date</h4>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={isDateDisabled}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Time Selection */}
                  <div>
                    <h4 className="font-semibold mb-3">Choose Time</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={
                            selectedTime === time ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className={
                            selectedTime === time
                              ? "bg-roam-blue hover:bg-roam-blue/90"
                              : "hover:border-roam-blue hover:text-roam-blue"
                          }
                        >
                          {formatTimeToAMPM(time)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Selection Summary */}
                  {selectedDate && selectedTime && (
                    <div className="p-4 bg-roam-light-blue/10 rounded-lg">
                      <h4 className="font-semibold mb-2 text-roam-blue">
                        Your Selection
                      </h4>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{selectedDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimeToAMPM(selectedTime)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedDate || !selectedTime}
                      className="w-full bg-roam-blue hover:bg-roam-blue/90"
                      size="lg"
                    >
                      Continue to Available Businesses
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* Help Text */}
                  <div className="text-sm text-foreground/60 space-y-2">
                    <p>��� Select your preferred date and time</p>
                    <p>
                      • We'll show you businesses available during this time
                    </p>
                    <p>• You can change this later if needed</p>
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
