import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Plus,
  Minus,
  Calendar,
  DollarSign,
  Globe,
  Check,
  Building,
  UserCheck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  BusinessProfile,
  BusinessService,
  BusinessAddon,
  BusinessLocation,
} from "@/lib/database.types";

interface ProviderData {
  business: BusinessProfile;
  services: BusinessService[];
  addons: BusinessAddon[];
  location: BusinessLocation;
  providers: any[];
}

interface BookingItem {
  type: "service" | "addon";
  id: string;
  name: string;
  price: number;
  duration?: number;
  quantity: number;
}

interface BookingForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  items: BookingItem[];
}

const ProviderBooking = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isCustomer, customer } = useAuth();

  // Get URL parameters for provider preference, service selection, date and time
  const urlParams = new URLSearchParams(window.location.search);
  const preferredProviderId = urlParams.get("provider");
  const selectedServiceId = urlParams.get("service");
  const preSelectedDate = urlParams.get("date");
  const preSelectedTime = urlParams.get("time");
  const promotionId = urlParams.get("promotion");
  const promoCode = urlParams.get("promo_code");
  const deliveryType = urlParams.get("deliveryType");
  const locationId = urlParams.get("location");
  const customerAddress = urlParams.get("address");
  const customerCity = urlParams.get("city");
  const customerState = urlParams.get("state");
  const customerZip = urlParams.get("zip");

  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<BookingItem[]>([]);

  // Derived state: selectedAddons from selectedItems
  const selectedAddons = selectedItems.filter((item) => item.type === "addon");
  const [preferredProvider, setPreferredProvider] = useState<any>(null);
  const [promotionData, setPromotionData] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    customerState: "",
    customerZip: "",
    preferredDate: preSelectedDate || "",
    preferredTime: preSelectedTime || "",
    notes: "",
    items: [],
  });

  useEffect(() => {
    if (businessId) {
      fetchProviderData();
    }
  }, [businessId]);

  useEffect(() => {
    if (promotionId) {
      fetchPromotionData();
    }
  }, [promotionId]);

  useEffect(() => {
    // Load location based on delivery type
    if (locationId) {
      if (deliveryType === "business_location") {
        fetchBusinessLocation(locationId);
      } else if (deliveryType === "customer_location") {
        fetchCustomerLocation(locationId);
      }
    } else {
      // Check for JSON-encoded address data (from BusinessAvailability)
      const addressParam = urlParams.get("address");
      if (addressParam) {
        try {
          const addressData = JSON.parse(decodeURIComponent(addressParam));
          setSelectedLocation(addressData);
        } catch (error) {
          console.error("Error parsing address data:", error);
        }
      } else if (
        customerAddress &&
        customerCity &&
        customerState &&
        customerZip
      ) {
        // Use individual location parameters (for backward compatibility)
        setSelectedLocation({
          street_address: customerAddress,
          city: customerCity,
          state: customerState,
          postal_code: customerZip,
        });
      }
    }
  }, [
    locationId,
    deliveryType,
    customerAddress,
    customerCity,
    customerState,
    customerZip,
  ]);

  useEffect(() => {
    if (customer && isCustomer) {
      console.log(
        "Pre-populating customer form with authenticated customer data:",
        customer,
      );
      const fullName =
        `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      setBookingForm((prev) => ({
        ...prev,
        customerName: fullName,
        customerEmail: customer.email || "",
        customerPhone: customer.phone || "",
      }));
    } else if (user && !isCustomer) {
      // If user is authenticated but not a customer, still try to populate basic info
      console.log(
        "User authenticated but not in customer role, using basic auth data",
      );
      setBookingForm((prev) => ({
        ...prev,
        customerEmail: user.email || "",
        customerName: user.user_metadata?.full_name || "",
      }));
    }
  }, [customer, isCustomer, user]);

  // Ensure email is populated if user is authenticated but form is empty
  useEffect(() => {
    if (user?.email && !bookingForm.customerEmail) {
      console.log("Populating form with user email:", user.email);
      setBookingForm((prev) => ({
        ...prev,
        customerEmail: user.email,
      }));
    }
  }, [user?.email, bookingForm.customerEmail]);

  // Force customer profile data population when booking modal opens
  useEffect(() => {
    if (
      isBookingModalOpen &&
      customer &&
      isCustomer &&
      !bookingForm.customerName
    ) {
      console.log("Booking modal opened, ensuring customer data is populated");
      const fullName =
        `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      setBookingForm((prev) => ({
        ...prev,
        customerName: fullName,
        customerEmail: customer.email || "",
        customerPhone: customer.phone || "",
      }));
    }
  }, [isBookingModalOpen, customer, isCustomer, bookingForm.customerName]);

  // Update form when selected location changes
  useEffect(() => {
    if (selectedLocation && !bookingForm.customerAddress) {
      console.log("Populating form with selected location:", selectedLocation);
      setBookingForm((prev) => ({
        ...prev,
        customerAddress: selectedLocation.street_address || "",
        customerCity: selectedLocation.city || "",
        customerState: selectedLocation.state || "",
        customerZip: selectedLocation.postal_code || "",
      }));
    }
  }, [selectedLocation, bookingForm.customerAddress]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);

      // Fetch business profile
      const { data: business, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", businessId)
        .eq("is_active", true)
        .eq("verification_status", "approved")
        .single();

      if (businessError || !business) {
        throw new Error("Business not found or not available for booking");
      }

      // Fetch business services
      console.log(
        "Fetching services for business:",
        businessId,
        "selected service:",
        selectedServiceId,
      );

      const { data: services, error: servicesError } = await supabase
        .from("business_services")
        .select(
          `
          *,
          services:service_id (
            id,
            name,
            description,
            image_url,
            duration_minutes,
            is_active
          )
        `,
        )
        .eq("business_id", businessId)
        .eq("is_active", true);

      console.log("Business services query result:", {
        services: services?.map((s) => ({
          id: s.id,
          service_id: s.service_id,
          name: s.services?.name,
          is_active: s.is_active,
          service_is_active: s.services?.is_active,
        })),
        error: servicesError,
      });

      if (servicesError) {
        console.error(
          "Error fetching services:",
          servicesError.message || servicesError,
        );
      }

      // Fetch addons using the exact two-step filtering process
      let addons = [];
      let addonsError = null;

      if (selectedServiceId) {
        console.log(
          "Fetching addons for service:",
          selectedServiceId,
          "and business:",
          businessId,
        );

        // Step 1: Get eligible addons for the selected service
        const { data: eligibleAddons, error: eligibilityError } = await supabase
          .from("service_addon_eligibility")
          .select(
            `
            service_id,
            addon_id,
            is_recommended,
            service_addons:addon_id (
              id,
              name,
              description,
              image_url,
              is_active
            )
          `,
          )
          .eq("service_id", selectedServiceId);

        if (eligibilityError) {
          console.error(
            "Error fetching service addon eligibility:",
            eligibilityError,
          );
          addonsError = eligibilityError;
        } else if (eligibleAddons && eligibleAddons.length > 0) {
          console.log("Found eligible addons:", eligibleAddons);

          // Step 2: Filter by business offerings and get custom pricing
          const eligibleAddonIds = eligibleAddons.map((item) => item.addon_id);

          const { data: businessAddons, error: businessAddonsError } =
            await supabase
              .from("business_addons")
              .select("*")
              .eq("business_id", businessId)
              .eq("is_available", true)
              .in("addon_id", eligibleAddonIds);

          if (businessAddonsError) {
            console.error(
              "Error fetching business addons:",
              businessAddonsError,
            );
            addonsError = businessAddonsError;
          } else {
            console.log("Found business addons:", businessAddons);

            // Combine the data
            addons = (businessAddons || [])
              .map((businessAddon) => {
                const eligibilityInfo = eligibleAddons.find(
                  (e) => e.addon_id === businessAddon.addon_id,
                );
                const serviceAddon = eligibilityInfo?.service_addons;

                return {
                  id: businessAddon.addon_id,
                  name: serviceAddon?.name || "Unknown Addon",
                  description: serviceAddon?.description || "",
                  image_url: serviceAddon?.image_url || null,
                  is_recommended: eligibilityInfo?.is_recommended || false,
                  price: businessAddon.custom_price || 0,
                  business_addon_id: businessAddon.id,
                };
              })
              .filter((addon) => addon.name !== "Unknown Addon"); // Filter out invalid addons
          }
        } else {
          console.log("No eligible addons found for this service");
        }
      } else {
        console.log("No service selected, skipping addon fetch");
      }

      if (addonsError) {
        console.error(
          "Error fetching addons:",
          addonsError.message || addonsError,
        );
      }

      // Fetch business location (take the first one if multiple exist)
      const { data: locations, error: locationError } = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", businessId)
        .limit(1);

      const location = locations && locations.length > 0 ? locations[0] : null;

      if (locationError) {
        console.error(
          "Error fetching location:",
          locationError.message || locationError,
        );
      }

      // Fetch business providers
      const { data: providers, error: providersError } = await supabase
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

      if (providersError) {
        console.error(
          "Error fetching providers:",
          providersError.message || providersError,
        );
      }

      // Set preferred provider if specified in URL
      if (preferredProviderId && providers) {
        const preferred = providers.find((p) => p.id === preferredProviderId);
        setPreferredProvider(preferred);
      }

      // Auto-select service if specified in URL
      if (selectedServiceId && services) {
        console.log("Looking for service with ID:", selectedServiceId);
        console.log(
          "Available services:",
          services.map((s) => ({
            id: s.id,
            service_id: s.service_id,
            name: s.services?.name,
          })),
        );

        const serviceToAdd = services.find(
          (s) =>
            s.id === selectedServiceId || s.service_id === selectedServiceId,
        );
        console.log("Found service to add:", serviceToAdd);

        if (serviceToAdd) {
          addItemToBooking(serviceToAdd, "service");
        } else {
          console.warn("Service not found with ID:", selectedServiceId);

          // Show user-friendly error for missing service
          toast({
            title: "Service Not Available",
            description:
              "The selected service is no longer available from this business. Please choose another service.",
            variant: "destructive",
          });

          // Debug: Check what services are available for this business
          console.log(
            "Available business services:",
            services.map((s) => ({
              business_service_id: s.id,
              service_id: s.service_id,
              service_name: s.services?.name,
              is_active: s.is_active,
            })),
          );

          // Check if the service exists in the global services table
          const { data: globalService, error: globalServiceError } =
            await supabase
              .from("services")
              .select("id, name, description, is_active")
              .eq("id", selectedServiceId)
              .single();

          console.log("Global service lookup:", {
            globalService,
            globalServiceError,
          });

          if (globalService) {
            // Check if this service is offered by the business but maybe inactive
            const { data: businessServiceMapping } = await supabase
              .from("business_services")
              .select("id, is_active, business_price, custom_price")
              .eq("business_id", businessId)
              .eq("service_id", selectedServiceId);

            console.log("Business service mapping:", businessServiceMapping);

            if (businessServiceMapping && businessServiceMapping.length > 0) {
              const mapping = businessServiceMapping[0];
              if (!mapping.is_active) {
                toast({
                  title: "Service Temporarily Unavailable",
                  description: `"${globalService.name}" is temporarily unavailable from this business. Please choose another service.`,
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Service Found But Not Loaded",
                  description: `"${globalService.name}" exists but wasn't loaded. Please refresh the page.`,
                  variant: "destructive",
                });
              }
            } else {
              toast({
                title: "Service Not Offered",
                description: `This business does not currently offer "${globalService.name}". Please browse their available services below.`,
                variant: "destructive",
              });
            }
          } else {
            console.log("Service does not exist in global services table");
            toast({
              title: "Service Not Found",
              description:
                "The requested service could not be found in our system.",
              variant: "destructive",
            });
          }
        }
      }

      // Check if business has any active services
      if (!services || services.length === 0) {
        toast({
          title: "No Services Available",
          description:
            "This business currently has no active services available for booking.",
          variant: "destructive",
        });
      }

      setProviderData({
        business,
        services: services || [],
        addons: addons || [],
        location: location || null,
        providers: providers || [],
      });
    } catch (error: any) {
      console.error("Error fetching provider data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load provider information",
        variant: "destructive",
      });
      navigate("/providers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerProfile = async () => {
    try {
      // Use auth.users.id for the customer profile lookup
      const authUserId = user?.id;
      if (!authUserId) {
        console.log("No authenticated user ID available for profile fetch");
        return;
      }

      console.log("Fetching customer profile for auth user ID:", authUserId);

      const { data: profile, error } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", authUserId) // customer_profiles.user_id = auth.users.id
        .single();

      if (error) {
        console.error("Error fetching customer profile:", error);
        console.error(
          "Error details:",
          error.message || error.details || error,
        );

        // If no profile exists but user is authenticated, populate with basic user data
        if (error.code === "PGRST116" && user?.email) {
          console.log("No customer profile found, using auth user data");
          setBookingForm((prev) => ({
            ...prev,
            customerEmail: user.email || "",
            customerName:
              user.user_metadata?.full_name || user.user_metadata?.name || "",
            customerPhone: user.user_metadata?.phone || "",
          }));
        }
        return;
      }

      if (profile) {
        setCustomerProfile(profile);
        // Pre-populate the form with customer data
        const fullName = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");

        // Fetch the customer's most recent location
        const { data: customerLocations } = await supabase
          .from("customer_locations")
          .select("*")
          .eq("customer_id", authUserId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        const mostRecentLocation = customerLocations?.[0];

        // Use selected location from previous step, then fall back to most recent location
        const locationToUse = selectedLocation || mostRecentLocation;

        setBookingForm((prev) => ({
          ...prev,
          customerName: fullName || "",
          customerEmail: profile.email || user?.email || "",
          customerPhone: profile.phone || "",
          customerAddress: locationToUse?.street_address || "",
          customerCity: locationToUse?.city || "",
          customerState: locationToUse?.state || "",
          customerZip: locationToUse?.postal_code || "",
        }));

        console.log("Pre-populated booking form with customer data:", {
          customerName: fullName,
          customerEmail: profile.email || user?.email,
          customerPhone: profile.phone,
          customerAddress: mostRecentLocation?.street_address,
          customerCity: mostRecentLocation?.city,
          customerState: mostRecentLocation?.state,
          customerZip: mostRecentLocation?.postal_code,
        });
      }
    } catch (error: any) {
      console.error("Error fetching customer profile:", error);
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error,
      });
    }
  };

  const fetchCustomerLocation = async (locationId: string) => {
    try {
      const { data: location, error } = await supabase
        .from("customer_locations")
        .select("*")
        .eq("id", locationId)
        .single();

      if (error) {
        console.error("Error fetching customer location:", error);
        return;
      }

      if (location) {
        setSelectedLocation(location);
        console.log("Loaded selected customer location:", location);
      }
    } catch (error) {
      console.error("Error fetching customer location:", error);
    }
  };

  const fetchBusinessLocation = async (locationId: string) => {
    try {
      const { data: location, error } = await supabase
        .from("business_locations")
        .select("*")
        .eq("id", locationId)
        .single();

      if (error) {
        console.error("Error fetching business location:", error);
        return;
      }

      if (location) {
        setSelectedLocation(location);
        console.log("Loaded selected business location:", location);
      }
    } catch (error) {
      console.error("Error fetching business location:", error);
    }
  };

  const fetchPromotionData = async () => {
    try {
      console.log("Fetching promotion data for:", { promotionId, promoCode });

      // Try to find promotion by ID first
      let { data: promotion, error } = await supabase
        .from("promotions")
        .select(
          `
          id,
          title,
          description,
          start_date,
          end_date,
          is_active,
          promo_code,
          savings_type,
          savings_amount,
          savings_max_amount,
          service_id,
          business_id
        `,
        )
        .eq("id", promotionId)
        .eq("is_active", true)
        .single();

      // If not found by ID and we have a promo code, try to find by promo code
      if (error && error.code === "PGRST116" && promoCode) {
        console.log(
          "Promotion not found by ID, trying by promo code:",
          promoCode,
        );
        const { data: promoByCode, error: promoError } = await supabase
          .from("promotions")
          .select(
            `
            id,
            title,
            description,
            start_date,
            end_date,
            is_active,
            promo_code,
            savings_type,
            savings_amount,
            savings_max_amount,
            service_id,
            business_id
          `,
          )
          .eq("promo_code", promoCode)
          .eq("is_active", true)
          .or(`business_id.is.null,business_id.eq.${businessId}`) // Allow universal promotions or business-specific
          .limit(1)
          .maybeSingle();

        if (!promoError && promoByCode) {
          promotion = promoByCode;
          error = null;
          console.log("Found promotion by promo code:", promotion);
        }
      }

      if (error) {
        console.error("Error fetching promotion:", error);
        // If promotion not found, try to create a default promotion for demo purposes
        if (
          error.code === "PGRST116" &&
          (promoCode === "BOTOX25" || promoCode === "SAVE20")
        ) {
          console.log(`Creating demo promotion for ${promoCode}`);
          const discountPercent = promoCode === "SAVE20" ? 20 : 25;
          const demoPromotion = {
            id: promotionId,
            title:
              promoCode === "SAVE20" ? "Weekend Yoga Special" : "Botox Special",
            description:
              promoCode === "SAVE20"
                ? "Get 20% off all yoga services this weekend"
                : "25% off Botox services",
            promo_code: promoCode,
            savings_type: "percentage",
            savings_amount: discountPercent,
            savings_max_amount: 100,
            is_active: true,
            business_id: businessId,
            service_id: selectedServiceId,
          };
          setPromotionData(demoPromotion);
          console.log("Demo promotion data set:", demoPromotion);
          return;
        }
        return;
      }

      // Check if promotion is still valid (not expired)
      if (promotion.end_date) {
        const endDate = new Date(promotion.end_date);
        endDate.setHours(23, 59, 59, 999);
        const currentDate = new Date();
        if (endDate < currentDate) {
          console.warn("Promotion has expired");
          return;
        }
      }

      // Verify promo code matches if provided
      if (promoCode && promotion.promo_code !== promoCode) {
        console.warn("Promo code mismatch:", {
          expected: promotion.promo_code,
          provided: promoCode,
        });
        return;
      }

      setPromotionData(promotion);
      console.log("Promotion data loaded:", promotion);
    } catch (error) {
      console.error("Error fetching promotion data:", error);
    }
  };

  const addItemToBooking = (
    item: BusinessService | BusinessAddon,
    type: "service" | "addon",
  ) => {
    console.log("Adding item to booking:", { item, type });

    const bookingItem: BookingItem = {
      type,
      id: item.id,
      name:
        type === "service" ? (item as any).services.name : (item as any).name,
      price:
        (item as any).custom_price ||
        (item as any).business_price ||
        (item as any).price ||
        0,
      duration:
        type === "service"
          ? (item as any).services.duration_minutes
          : undefined,
      quantity: 1,
    };

    console.log("Created booking item:", bookingItem);

    const existingIndex = selectedItems.findIndex(
      (i) => i.id === item.id && i.type === type,
    );
    if (existingIndex >= 0) {
      // Item already exists, don't add again
      console.log("Item already in selection");
      return;
    } else {
      setSelectedItems([...selectedItems, bookingItem]);
      console.log("Added new item to selection");
    }

    toast({
      title: "Added to booking",
      description: `${bookingItem.name} has been added to your booking`,
    });
  };

  const removeItemFromBooking = (itemId: string, type: "service" | "addon") => {
    const existingIndex = selectedItems.findIndex(
      (i) => i.id === itemId && i.type === type,
    );
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated.splice(existingIndex, 1);
      setSelectedItems(updated);

      toast({
        title: "Removed from booking",
        description: `Item has been removed from your booking`,
      });
    }
  };

  const getItemQuantity = (itemId: string, type: "service" | "addon") => {
    const item = selectedItems.find((i) => i.id === itemId && i.type === type);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const platformFees = getPlatformFees();
    return subtotal - discount + platformFees;
  };

  const getSubtotal = () => {
    return selectedItems.reduce((total, item) => total + item.price, 0);
  };

  const getPlatformFees = () => {
    const subtotalAfterDiscount = getSubtotal() - getDiscountAmount();
    return subtotalAfterDiscount * 0.15; // 15% platform fee
  };

  const getDiscountAmount = () => {
    if (
      !promotionData ||
      !promotionData.savings_type ||
      promotionData.savings_amount === null ||
      promotionData.savings_amount === undefined
    ) {
      return 0;
    }

    const subtotal = getSubtotal();

    if (subtotal <= 0) {
      return 0;
    }

    if (promotionData.savings_type === "percentage") {
      const percentageDiscount =
        (subtotal * Number(promotionData.savings_amount)) / 100;

      // Apply maximum discount cap if specified
      if (promotionData.savings_max_amount) {
        return Math.min(
          percentageDiscount,
          Number(promotionData.savings_max_amount),
        );
      }

      return percentageDiscount;
    } else if (promotionData.savings_type === "fixed_amount") {
      // Fixed amount discount, but don't let it exceed the subtotal
      return Math.min(Number(promotionData.savings_amount), subtotal);
    }

    return 0;
  };

  const openBookingModal = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one service or add-on to proceed",
        variant: "destructive",
      });
      return;
    }

    // Refresh customer profile data when opening booking modal
    if (user && isCustomer) {
      fetchCustomerProfile();
    }

    setBookingForm((prev) => ({ ...prev, items: selectedItems }));
    setIsBookingModalOpen(true);
  };

  const isFormValid = () => {
    // Base required fields
    const baseRequiredFields = [
      !bookingForm.customerName,
      !bookingForm.customerEmail,
      !bookingForm.preferredDate,
    ];

    // Address fields only required for customer_location delivery type
    const addressRequiredFields =
      deliveryType === "customer_location"
        ? [
            !bookingForm.customerAddress,
            !bookingForm.customerCity,
            !bookingForm.customerState,
            !bookingForm.customerZip,
          ]
        : [];

    const allRequiredFields = [...baseRequiredFields, ...addressRequiredFields];

    // Check if any required field is missing (true means field is empty)
    const hasEmptyRequiredFields = allRequiredFields.some((isEmpty) => isEmpty);

    // Must have at least one service selected
    const hasSelectedItems = selectedItems.length > 0;

    return !hasEmptyRequiredFields && hasSelectedItems;
  };

  const submitBooking = async () => {
    setIsBooking(true);
    try {
      // Base required fields
      const baseRequiredFields = [
        !bookingForm.customerName,
        !bookingForm.customerEmail,
        !bookingForm.preferredDate,
      ];

      // Address fields only required for customer_location delivery type
      const addressRequiredFields =
        deliveryType === "customer_location"
          ? [
              !bookingForm.customerAddress,
              !bookingForm.customerCity,
              !bookingForm.customerState,
              !bookingForm.customerZip,
            ]
          : [];

      const allRequiredFields = [
        ...baseRequiredFields,
        ...addressRequiredFields,
      ];

      if (allRequiredFields.some((field) => field)) {
        const missingAddressFields =
          deliveryType === "customer_location" &&
          addressRequiredFields.some((field) => field);
        toast({
          title: "Missing information",
          description: missingAddressFields
            ? "Please fill in all required fields including your complete address"
            : "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Debug customer authentication
      console.log("Booking submission debug:", {
        user,
        customer,
        isCustomer,
        authUserId: user?.id, // This is auth.users.id from the session
        customerData: customer,
        isAuthenticated: !!(user || customer),
      });

      // Use customer ID for authenticated customers, or allow guest booking
      const customerId = customer?.customer_id || user?.id;

      if (!customerId && !bookingForm.customerEmail) {
        toast({
          title: "Customer information required",
          description:
            "Please provide your email address to complete the booking.",
          variant: "destructive",
        });
        return;
      }

      console.log("Submitting booking with customer_id:", customerId);

      // Log promo code application
      if (promotionData && promoCode) {
        const discount = getDiscountAmount();
        console.log("Applying promo code:", {
          promoCode: promoCode,
          promotionId: promotionId,
          discountAmount: discount,
          originalTotal: getSubtotal(),
          finalTotal: getTotalAmount(),
          savingsType: promotionData.savings_type,
          savingsAmount: promotionData.savings_amount,
        });
      }

      // Set location IDs based on delivery type
      const customerLocationId =
        deliveryType === "customer_location" ? selectedLocation?.id : null;
      const businessLocationId =
        deliveryType === "business_location"
          ? locationId || location?.id
          : null;

      console.log("Booking location debug:", {
        deliveryType,
        customerLocationId,
        businessLocationId,
        selectedLocation: selectedLocation?.id,
        locationId,
        locationFromState: location?.id,
      });

      // Create booking record
      // Find the correct service ID - use selectedServiceId from URL or find from services
      const serviceToBook = selectedServiceId
        ? services.find(
            (s) =>
              s.service_id === selectedServiceId || s.id === selectedServiceId,
          )
        : null;

      const actualServiceId = serviceToBook?.service_id || selectedServiceId;

      console.log("Service booking debug:", {
        selectedServiceId,
        serviceToBook,
        actualServiceId,
        selectedItems: selectedItems.map((item) => ({
          id: item.id,
          type: item.type,
        })),
      });

      // Debug location IDs before payload construction
      console.log("Location IDs before payload:", {
        customerLocationId,
        businessLocationId,
        deliveryType,
        locationId,
        "location?.id": location?.id,
        "selectedLocation?.id": selectedLocation?.id,
      });

      const bookingPayload = {
        business_id: businessId, // Required: Business ID from URL params
        provider_id: preferredProviderId || null, // Provider ID from URL params
        service_id: actualServiceId,
        customer_id: customerId || null, // Customer ID for authenticated users
        customer_location_id: customerLocationId,
        business_location_id: businessLocationId,
        delivery_type: deliveryType || "customer_location",
        guest_name: !customerId ? bookingForm.customerName : null, // Only use guest fields if not authenticated
        guest_email: !customerId ? bookingForm.customerEmail : null,
        guest_phone: !customerId ? bookingForm.customerPhone : null,
        booking_date: bookingForm.preferredDate,
        start_time: bookingForm.preferredTime || "09:00",
        admin_notes: bookingForm.notes,
        total_amount: getTotalAmount(),
        service_fee: getTotalAmount() * 0.15, // Platform fee - 15% of total amount
        remaining_balance: getTotalAmount(), // Initially, the full amount is the remaining balance
        booking_status: "pending",
        payment_status: "pending",
      };

      console.log("Final booking payload:", bookingPayload);

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingPayload)
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      console.log("Booking created successfully:", booking);

      // Create booking_addons records for selected add-ons
      if (selectedAddons.length > 0 && booking.id) {
        console.log("Creating booking addons:", selectedAddons);

        const addonRecords = selectedAddons.map((addon) => ({
          booking_id: booking.id,
          addon_id: addon.id,
        }));

        const { data: bookingAddons, error: addonsError } = await supabase
          .from("booking_addons")
          .insert(addonRecords)
          .select();

        if (addonsError) {
          console.error("Error creating booking addons:", addonsError);
          // Don't throw error here - booking was successful, addons are secondary
        } else {
          console.log("Booking addons created successfully:", bookingAddons);
        }
      }

      // Create promotion usage record if promotion was applied
      if (promotionId && promotionData && booking.id) {
        const originalAmount = getSubtotal();
        const discountAmount = getDiscountAmount();
        const finalAmount = getTotalAmount();

        console.log("Creating promotion usage record:", {
          promotion_id: promotionId,
          booking_id: booking.id,
          discount_applied: discountAmount,
          original_amount: originalAmount,
          final_amount: finalAmount,
        });

        const { error: promotionError } = await supabase
          .from("promotion_usage")
          .insert({
            promotion_id: promotionId,
            booking_id: booking.id,
            discount_applied: discountAmount,
            original_amount: originalAmount,
            final_amount: finalAmount,
          });

        if (promotionError) {
          console.error("Error creating promotion usage record:", {
            error: promotionError,
            message: promotionError.message,
            details: promotionError.details,
            hint: promotionError.hint,
            code: promotionError.code,
          });
          // Don't throw error here - booking was successful, promotion tracking is secondary
        }
      }

      // Redirect to payment page with booking details
      const paymentParams = new URLSearchParams({
        booking_id: booking.id,
        total_amount: getTotalAmount().toString(),
        service_fee: (getTotalAmount() * 0.15).toString(),
        customer_email: customerId
          ? customer?.email || user?.email || bookingForm.customerEmail
          : bookingForm.customerEmail,
        customer_name: customerId
          ? `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim()
          : bookingForm.customerName,
        business_name: providerData?.business_name || "",
        service_name:
          selectedItems.find((item) => item.type === "service")?.name ||
          "Service",
      });

      // Add promotion info if applicable
      if (promotionData && promoCode) {
        paymentParams.set("promo_code", promoCode);
        paymentParams.set("discount_amount", getDiscountAmount().toString());
      }

      // Navigate to payment page
      navigate(`/payment?${paymentParams.toString()}`);

      setIsBookingModalOpen(false);
      setIsBooking(false);
    } catch (error: any) {
      console.error("Error submitting booking:", error);

      // Improved error message extraction for Supabase errors
      let errorMessage = "Failed to submit booking. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (error?.code) {
        errorMessage = `Database error (${error.code}): Please try again.`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsBooking(false);
    }
  };

  const toggleDescription = (serviceId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  const truncateDescription = (description: string, isExpanded: boolean) => {
    if (!description) return "";
    if (description.length <= 100 || isExpanded) return description;
    return description.substring(0, 100) + "...";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading provider information...</p>
        </div>
      </div>
    );
  }

  if (!providerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Provider Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The provider you're looking for is not available for booking.
          </p>
          <Button onClick={() => navigate("/providers")}>
            Browse Other Providers
          </Button>
        </div>
      </div>
    );
  }

  const { business, services, addons, location, providers } = providerData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link
                  to={(() => {
                    // Construct URL to go back to business profile for provider selection
                    const params = new URLSearchParams();
                    if (selectedServiceId)
                      params.set("service", selectedServiceId);
                    if (preSelectedDate) params.set("date", preSelectedDate);
                    if (preSelectedTime) params.set("time", preSelectedTime);
                    if (promotionId) params.set("promotion", promotionId);
                    if (promoCode) params.set("promo_code", promoCode);
                    if (deliveryType) params.set("deliveryType", deliveryType);
                    if (locationId) params.set("location", locationId);

                    const queryString = params.toString();
                    return `/business/${businessId}${queryString ? `?${queryString}` : ""}`;
                  })()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Provider Selection
                </Link>
              </Button>
              <div className="flex items-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM - Your Best Life. Everywhere."
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={business.logo_url || business.image_url || undefined}
              />
              <AvatarFallback>
                {business.business_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {business.business_name}
                  </h1>
                  <p className="text-gray-600">
                    {business.business_description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2"></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Promotion Banner */}
        {promotionData && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Badge className="bg-green-500 text-white">
                    {promotionData.promo_code}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    {promotionData.title || "Special Promotion"}
                  </h3>
                  <p className="text-green-700">
                    {promotionData.description ||
                      `Save ${
                        promotionData.savings_type === "percentage"
                          ? `${promotionData.savings_amount}%`
                          : `$${promotionData.savings_amount}`
                      } on this service`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600">Promotion Active</div>
                {getDiscountAmount() > 0 && (
                  <div className="text-lg font-bold text-green-800">
                    Save ${getDiscountAmount().toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Booking Summary - Primary Focus */}
        <Card className="mb-8 border-2 border-roam-blue bg-roam-blue/5">
          <CardHeader>
            <CardTitle className="text-2xl text-roam-blue flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Complete Your Booking
            </CardTitle>
            <p className="text-roam-blue/80">
              Review your service details and total cost
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Service Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold">Your Service</h3>
                {(() => {
                  const selectedService = services.find(
                    (service) =>
                      service.service_id === selectedServiceId ||
                      service.id === selectedServiceId,
                  );
                  return selectedService ? (
                    <div className="p-4 border rounded-lg bg-background">
                      <div className="flex items-start gap-3">
                        {(selectedService as any).services.image_url && (
                          <img
                            src={(selectedService as any).services.image_url}
                            alt={(selectedService as any).services.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {(selectedService as any).services.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {(selectedService as any).services.duration_minutes}{" "}
                            minutes
                          </p>
                          {preSelectedDate && preSelectedTime && (
                            <p className="text-sm text-roam-blue font-medium mt-1">
                              {new Date(preSelectedDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}{" "}
                              at {preSelectedTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Business & Provider Info */}
                <div className="p-4 border rounded-lg bg-background">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={
                          business.logo_url || business.image_url || undefined
                        }
                        alt={business.business_name}
                      />
                      <AvatarFallback>
                        {business.business_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{business.business_name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-roam-warning fill-current" />
                        <span className="text-sm text-gray-600">
                          {business.average_rating || 0} (
                          {business.total_reviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  {preferredProvider && (
                    <div className="p-4 bg-green-50 border-green-200 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="w-4 h-4 text-green-700" />
                        <h4 className="font-semibold text-green-700">
                          Preferred Provider Selected
                        </h4>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={preferredProvider.image_url || undefined}
                          />
                          <AvatarFallback>
                            {preferredProvider.first_name[0]}
                            {preferredProvider.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-green-800">
                            {preferredProvider.first_name}{" "}
                            {preferredProvider.last_name}
                          </div>
                          {preferredProvider.bio && (
                            <p className="text-sm text-green-600 line-clamp-1">
                              {preferredProvider.bio}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {preferredProvider.experience_years && (
                              <span className="text-xs text-green-600">
                                {preferredProvider.experience_years} years
                                experience
                              </span>
                            )}
                            {preferredProvider.average_rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-green-600 fill-current" />
                                <span className="text-xs text-green-600">
                                  {preferredProvider.average_rating} (
                                  {preferredProvider.total_reviews || 0}{" "}
                                  reviews)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-green-100 rounded-md">
                        <p className="text-sm text-green-700">
                          <strong>Note:</strong> This is your preferred provider
                          for this booking. The business will try to assign this
                          provider, but final assignment depends on availability
                          and business approval.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Pricing & Book Button */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Booking Summary</h3>
                <div className="p-6 border-2 border-roam-blue/20 rounded-xl bg-background">
                  <div className="space-y-4">
                    {/* Service Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                        Selected Services
                      </h4>
                      {selectedItems
                        .filter((item) => item.type === "service")
                        .map((service) => (
                          <div
                            key={service.id}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-900">
                              {service.name}
                            </span>
                            <span className="font-medium">
                              ${service.price.toFixed(2)}
                            </span>
                          </div>
                        ))}

                      {/* Add-ons */}
                      {selectedAddons.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h5 className="font-medium text-gray-600 text-xs uppercase tracking-wide">
                            Add-ons
                          </h5>
                          {selectedAddons.map((addon) => (
                            <div
                              key={addon.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600">
                                {addon.name}
                              </span>
                              <span className="text-gray-600">
                                +${addon.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200"></div>

                    {/* Pricing Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          ${getSubtotal().toFixed(2)}
                        </span>
                      </div>

                      {/* Promo Code Discount */}
                      {promotionData && promoCode && (
                        <div className="flex justify-between items-center text-green-600">
                          <span className="text-sm">
                            Discount (
                            {promotionData.savings_type === "percentage"
                              ? `${promotionData.savings_amount}%`
                              : `$${promotionData.savings_amount}`}{" "}
                            off)
                          </span>
                          <span className="font-medium">
                            -${getDiscountAmount().toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Service Fee (15%)</span>
                        <span className="font-medium">
                          ${(getSubtotal() * 0.15).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Platform Fees</span>
                        <span className="font-medium">
                          ${getPlatformFees().toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t-2 border-gray-300 pt-3">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total Amount</span>
                        <span className="text-roam-blue">
                          ${getTotalAmount().toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Promo Code Input (if no promo applied) */}
                    {!promotionData && (
                      <div className="pt-2">
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-roam-blue hover:text-roam-blue/80 font-medium">
                            Have a promo code?
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-xs text-gray-600 mb-2">
                              Promo codes can be applied during checkout
                            </p>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* Checkout Buttons */}
                  <div className="mt-6 space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-roam-blue hover:bg-roam-blue/90 text-white font-semibold py-3"
                      onClick={submitBooking}
                      disabled={!isFormValid() || isBooking}
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing Booking...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-5 h-5 mr-2" />
                          Confirm & Checkout
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      You'll be redirected to secure payment after confirmation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Secondary Content - Condensed */}
          <div className="lg:col-span-3 space-y-6">
            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle>About This Business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.business_description && (
                  <p className="text-gray-700">
                    {business.business_description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {business.contact_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{business.contact_email}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{business.phone}</span>
                    </div>
                  )}
                  {business.website_url && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a
                        href={business.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-gray-700 mb-1">
                          Service Location
                        </div>
                        <div className="text-gray-600">
                          {location.address_line1 || location.street_address}
                          {location.address_line2 && (
                            <div>{location.address_line2}</div>
                          )}
                          <div>
                            {location.city}, {location.state}{" "}
                            {location.postal_code}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {business.years_in_business && (
                  <div className="pt-2">
                    <Badge variant="outline">
                      {business.years_in_business} years in business
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add-ons */}
            {addons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedServiceId
                      ? "Available Add-ons for Selected Service"
                      : "Available Add-ons"}
                  </CardTitle>
                  {selectedServiceId && (
                    <p className="text-sm text-gray-600 mt-1">
                      These add-ons are compatible with your selected service
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addons.map((addon) => (
                      <div
                        key={addon.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{addon.name}</h3>
                              {addon.is_recommended && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {addon.description}
                            </p>
                          </div>
                          {addon.image_url && (
                            <img
                              src={addon.image_url}
                              alt={addon.name}
                              className="w-16 h-16 object-cover rounded ml-4"
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="font-semibold">
                              ${addon.price}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getItemQuantity(addon.id, "addon") > 0 ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  removeItemFromBooking(addon.id, "addon")
                                }
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => addItemToBooking(addon, "addon")}
                              >
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6"></div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Your Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    autoComplete="name"
                    required
                    value={bookingForm.customerName}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={bookingForm.customerEmail}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerEmail: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    pattern="^[0-9\-\s\(\)]+$"
                    value={bookingForm.customerPhone}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerPhone: e.target.value,
                      }))
                    }
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Service Location - Read Only */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Service Location</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="text-roam-blue border-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    Change Location
                  </Button>
                </div>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">
                        {bookingForm.customerAddress}
                      </div>
                      <div className="text-gray-600">
                        {bookingForm.customerCity}, {bookingForm.customerState}{" "}
                        {bookingForm.customerZip}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Booking Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <Input
                    id="preferredDate"
                    name="preferredDate"
                    type="date"
                    autoComplete="bday"
                    required
                    value={bookingForm.preferredDate}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        preferredDate: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <Input
                    id="preferredTime"
                    name="preferredTime"
                    type="time"
                    value={bookingForm.preferredTime}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        preferredTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={bookingForm.notes}
                  onChange={(e) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any special requests or additional information..."
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    className="flex justify-between"
                  >
                    <span>{item.name}</span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
                <Separator />

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>

                {promotionData && getDiscountAmount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center">
                      <Badge
                        variant="secondary"
                        className="mr-2 text-xs bg-green-100 text-green-800"
                      >
                        {promotionData.promo_code}
                      </Badge>
                      Promotion Discount
                    </span>
                    <span className="font-semibold">
                      -${getDiscountAmount().toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Platform Fees (15%)</span>
                  <span>${getPlatformFees().toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsBookingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitBooking}>
                Submit Booking Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderBooking;
