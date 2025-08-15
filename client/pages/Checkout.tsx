import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  CreditCard,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface BookingData {
  businessId: string;
  date: string;
  time: string;
  services: any[];
  addons: any[];
  providerId: string | null;
  deliveryType: string;
  customerLocation: string | null;
  customerLocationData: any;
  specialRequests: string;
  total: number;
}

interface CustomerForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customer, isCustomer } = useAuth();

  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Customer form state
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    specialRequests: "",
  });

  // Load booking data from sessionStorage
  useEffect(() => {
    const storedBookingData = sessionStorage.getItem("bookingData");
    if (storedBookingData) {
      const data = JSON.parse(storedBookingData);
      setBookingData(data);
      setCustomerForm(prev => ({
        ...prev,
        specialRequests: data.specialRequests || "",
      }));
      fetchBusinessData(data.businessId);
    } else {
      // No booking data found, redirect back to home
      toast({
        title: "No Booking Data",
        description: "Please start your booking from the beginning.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [navigate, toast]);

  // Pre-populate customer information for authenticated users
  useEffect(() => {
    console.log("Checkout useEffect - customer:", customer, "isCustomer:", isCustomer);
    if (customer && isCustomer) {
      console.log("Pre-populating customer form with authenticated user data:", customer);
      const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      console.log("Generated full name:", fullName);
      setCustomerForm(prev => ({
        ...prev,
        customerName: fullName,
        customerEmail: customer.email || "",
        customerPhone: customer.phone || "",
      }));
    } else {
      console.log("Not pre-populating - customer:", !!customer, "isCustomer:", isCustomer);
    }
  }, [customer, isCustomer]);

  const fetchBusinessData = async (businessId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("business_profiles")
        .select(`
          id,
          business_name,
          business_address,
          business_city,
          business_state,
          business_zip,
          contact_phone,
          contact_email
        `)
        .eq("id", businessId)
        .single();

      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error("Error fetching business data:", error);
      toast({
        title: "Error",
        description: "Failed to load business information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CustomerForm, value: string) => {
    setCustomerForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!customerForm.customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return false;
    }

    if (!customerForm.customerEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.customerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmitBooking = async () => {
    if (!validateForm() || !bookingData) return;

    setSubmitting(true);
    try {
      // Prepare booking data for submission
      const bookingPayload = {
        business_id: bookingData.businessId,
        customer_id: customer?.customer_id || null,
        guest_name: !customer ? customerForm.customerName : null,
        guest_email: !customer ? customerForm.customerEmail : null,
        guest_phone: !customer ? customerForm.customerPhone : null,
        service_date: bookingData.date,
        service_time: bookingData.time,
        provider_id: bookingData.providerId,
        delivery_type: bookingData.deliveryType,
        customer_location: bookingData.customerLocation,
        customer_location_data: bookingData.customerLocationData,
        special_requests: customerForm.specialRequests,
        total_amount: bookingData.total,
        status: "pending",
        booking_items: [
          ...bookingData.services.map(service => ({
            type: "service",
            service_id: service.services.id,
            quantity: service.quantity,
            price: service.business_price,
          })),
          ...bookingData.addons.map(addon => ({
            type: "addon",
            addon_id: addon.service_addons.id,
            quantity: addon.quantity,
            price: addon.custom_price || addon.service_addons.base_price,
          })),
        ],
      };

      console.log("Submitting booking:", bookingPayload);

      const { data, error } = await supabase
        .from("bookings")
        .insert([bookingPayload])
        .select()
        .single();

      if (error) throw error;

      // Clear booking data from sessionStorage
      sessionStorage.removeItem("bookingData");

      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been successfully submitted.",
      });

      // Navigate based on authentication status
      if (customer && isCustomer) {
        // Authenticated customer - go to their bookings
        navigate("/customer/bookings");
      } else {
        // Guest booking - redirect to home with success message
        navigate("/", { 
          state: { 
            bookingSuccess: true, 
            bookingId: data.id 
          } 
        });
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roam-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!bookingData || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Booking Not Found
          </h1>
          <p className="text-foreground/60 mb-6">
            Please start your booking from the beginning.
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
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground/70">
                  Welcome, {customer?.first_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Complete Your Booking
            </h1>
            <p className="text-foreground/60">
              Review your booking details and provide your contact information.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-roam-blue" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      type="text"
                      value={customerForm.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerForm.customerEmail}
                      onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                      placeholder="Enter your email"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={customerForm.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      placeholder="Enter your phone number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      value={customerForm.specialRequests}
                      onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                      placeholder="Any special instructions or requests..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Business Info */}
                  <div>
                    <h4 className="font-semibold mb-2">{business.business_name}</h4>
                    <p className="text-sm text-foreground/60">
                      {business.business_address}, {business.business_city}, {business.business_state}
                    </p>
                  </div>

                  <Separator />

                  {/* Date & Time */}
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-roam-blue" />
                    <span className="text-sm">{formatDate(bookingData.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-roam-blue" />
                    <span className="text-sm">{formatTime(bookingData.time)}</span>
                  </div>

                  {/* Location */}
                  {bookingData.deliveryType === "mobile" && bookingData.customerLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-roam-blue" />
                      <span className="text-sm">{bookingData.customerLocation}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Services */}
                  <div>
                    <h4 className="font-semibold mb-2">Services</h4>
                    {bookingData.services.map((service, index) => (
                      <div key={index} className="flex justify-between text-sm mb-1">
                        <span>{service.services.name} × {service.quantity}</span>
                        <span>${service.business_price * service.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add-ons */}
                  {bookingData.addons.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Add-ons</h4>
                      {bookingData.addons.map((addon, index) => (
                        <div key={index} className="flex justify-between text-sm mb-1">
                          <span>{addon.service_addons.name} × {addon.quantity}</span>
                          <span>
                            ${(addon.custom_price || addon.service_addons.base_price) * addon.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-roam-blue">${bookingData.total}</span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitBooking}
                    disabled={submitting}
                    className="w-full bg-roam-blue hover:bg-roam-blue/90 mt-6"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-foreground/60 text-center mt-4">
                    By confirming, you agree to our{" "}
                    <a
                      href="https://app.termly.io/policy-viewer/policy.html?policyUUID=8bd3c211-2aaa-4626-9910-794dc2d85aff"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-roam-blue hover:underline"
                    >
                      terms & conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://app.termly.io/policy-viewer/policy.html?policyUUID=64dec2e3-d030-4421-86ff-a3e7864709d8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-roam-blue hover:underline"
                    >
                      privacy policy
                    </a>.
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
