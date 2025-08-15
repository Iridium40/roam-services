import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  Calendar,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit,
  Plus,
  Settings,
  Bell,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  MessageCircle,
  Camera,
  Smartphone,
  Building,
  Video,
  Download,
  Upload,
  Shield,
  Share2,
  Copy,
  ExternalLink,
  Move,
  RotateCcw,
  Stethoscope,
  Scissors,
  Dumbbell,
  Home,
  Heart,
  Eye,
  Zap,
  Brain,
  Activity,
  Briefcase,
  Palette,
  Wrench,
  Hash,
  Search,
  ChevronDown,
  User,
  Menu,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ConversationChat from "@/components/ConversationChat";
import ConversationsList from "@/components/ConversationsList";
import useRealtimeBookings from "@/hooks/useRealtimeBookings";
import RealtimeBookingNotifications from "@/components/RealtimeBookingNotifications";
import BookingStatusIndicator, {
  RealtimeStatusUpdate,
} from "@/components/BookingStatusIndicator";
import type { Provider, Booking, BusinessProfile } from "@/lib/database.types";

// Plaid configuration
const PLAID_CLIENT_ID = "670d967ef5ca2b001925eee0";
const PLAID_ENV = "sandbox"; // Change to "production" for live environment

// Service category and subcategory types for database integration
interface ServiceCategory {
  id: string;
  service_category_type: string;
  description: string;
  is_active: boolean;
  image_url?: string;
  sort_order?: number;
}

interface ServiceSubcategory {
  id: string;
  category_id: string;
  service_subcategory_type: string;
  description: string;
  is_active: boolean;
  image_url?: string;
  category?: ServiceCategory;
}

// Service icon mapping function
const getServiceIcon = (serviceName: string, categoryType: string) => {
  const name = serviceName.toLowerCase();
  const category = categoryType?.toLowerCase() || "";

  // Healthcare services
  if (
    category.includes("healthcare") ||
    name.includes("medical") ||
    name.includes("health")
  ) {
    if (name.includes("consultation") || name.includes("visit"))
      return Stethoscope;
    if (name.includes("therapy") || name.includes("rehabilitation"))
      return Activity;
    if (name.includes("mental") || name.includes("counseling")) return Brain;
    if (name.includes("cardiac") || name.includes("heart")) return Heart;
    if (name.includes("eye") || name.includes("vision")) return Eye;
    return Stethoscope;
  }

  // Beauty & Wellness services
  if (category.includes("beauty") || category.includes("wellness")) {
    if (
      name.includes("haircut") ||
      name.includes("hair") ||
      name.includes("barber")
    )
      return Scissors;
    if (name.includes("massage") || name.includes("spa")) return Heart;
    if (name.includes("makeup") || name.includes("beauty")) return Palette;
    return Scissors;
  }

  // Fitness services
  if (
    category.includes("fitness") ||
    name.includes("workout") ||
    name.includes("training")
  ) {
    return Dumbbell;
  }

  // Home services
  if (
    category.includes("home") ||
    name.includes("cleaning") ||
    name.includes("repair")
  ) {
    if (name.includes("repair") || name.includes("maintenance")) return Wrench;
    return Home;
  }

  // Business services
  if (category.includes("business") || category.includes("professional")) {
    return Briefcase;
  }

  // Technology services
  if (
    category.includes("technology") ||
    name.includes("tech") ||
    name.includes("digital")
  ) {
    return Smartphone;
  }

  // Virtual services
  if (name.includes("virtual") || name.includes("online")) {
    return Video;
  }

  // Default icon
  return Star;
};

// Calendar Grid Component
const CalendarGrid = ({
  bookings,
  viewType,
  currentDate,
  onDateChange,
  selectedDate,
  onDateSelect,
}: {
  bookings: any[];
  viewType: "week" | "month";
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}) => {
  const today = new Date();

  // Generate calendar days
  const generateCalendarDays = () => {
    if (viewType === "week") {
      // Generate current week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday

      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date;
      });
    } else {
      // Generate current month
      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday of first week

      const days = [];
      const current = new Date(startDate);

      // Generate 6 weeks (42 days) to cover the month
      for (let i = 0; i < 42; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);

        // Stop if we've gone past the month and completed a week
        if (current > lastDay && current.getDay() === 0) break;
      }

      return days;
    }
  };

  const calendarDays = generateCalendarDays();

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date)
        .toISOString()
        .split("T")[0];
      return bookingDate === dateStr;
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isSelectedDate = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "declined":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "no_show":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getDayBackgroundColor = (dayBookings: any[]) => {
    if (dayBookings.length === 0) return "";

    // Priority order for determining day color
    const statusPriority = [
      "pending",
      "in_progress",
      "confirmed",
      "declined",
      "cancelled",
      "completed",
      "no_show",
    ];

    for (const status of statusPriority) {
      if (dayBookings.some((booking) => booking.booking_status === status)) {
        switch (status) {
          case "pending":
            return "bg-yellow-50 border-yellow-200";
          case "in_progress":
            return "bg-blue-50 border-blue-200";
          case "confirmed":
            return "bg-green-50 border-green-200";
          case "declined":
            return "bg-orange-50 border-orange-200";
          case "cancelled":
            return "bg-red-50 border-red-200";
          case "completed":
            return "bg-emerald-50 border-emerald-200";
          default:
            return "bg-gray-50 border-gray-200";
        }
      }
    }

    return "bg-slate-50 border-slate-200";
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    onDateChange(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={navigatePrevious}
          className="px-4 py-2 min-w-[100px]"
        >
          ← Previous
        </Button>

        <div className="text-center flex-1 mx-6">
          <h4 className="text-xl font-semibold mb-2">
            {viewType === "week"
              ? `Week of ${calendarDays[0].toLocaleDateString()} - ${calendarDays[6].toLocaleDateString()}`
              : `${currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="px-4 py-1 text-roam-blue hover:bg-roam-blue/10"
          >
            Today
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={navigateNext}
          className="px-4 py-2 min-w-[100px]"
        >
          Next →
        </Button>
      </div>

      {/* Calendar Grid */}
      <div
        className={`grid gap-2 ${viewType === "week" ? "grid-cols-7" : "grid-cols-7"}`}
      >
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center font-semibold p-2 bg-muted rounded text-sm"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dayBookings = getBookingsForDate(date);
          const isCurrentDay = isToday(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isSelected = isSelectedDate(date);
          const dayBgColor = getDayBackgroundColor(dayBookings);

          return (
            <div
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                min-h-24 p-2 border rounded-lg relative cursor-pointer transition-all hover:shadow-md
                ${isCurrentDay ? "ring-2 ring-roam-blue ring-offset-1" : ""}
                ${isSelected ? "bg-roam-blue/20 border-roam-blue shadow-md" : "bg-background"}
                ${!isCurrentMonthDay && viewType === "month" ? "opacity-30" : ""}
                ${dayBookings.length > 0 && !isSelected ? dayBgColor : ""}
              `}
            >
              <div className="font-medium text-sm mb-1 flex items-center justify-between">
                <span>{date.getDate()}</span>
                {dayBookings.length > 0 && (
                  <span className="text-xs bg-roam-blue text-white rounded-full w-5 h-5 flex items-center justify-center">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* Booking indicators */}
              <div className="space-y-1">
                {dayBookings.slice(0, 2).map((booking, bookingIndex) => (
                  <div
                    key={bookingIndex}
                    className={`text-xs p-1 rounded truncate ${getBookingStatusColor(booking.booking_status)}`}
                    title={`${booking.services?.name || "Service"} - ${booking.start_time} (${booking.booking_status})`}
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                      <span>{booking.start_time}</span>
                    </div>
                  </div>
                ))}

                {dayBookings.length > 2 && (
                  <div className="text-xs text-foreground/60 font-medium">
                    +{dayBookings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
          <span>Declined</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
          <span>No Show</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 ring-2 ring-roam-blue ring-offset-1 bg-white rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default function ProviderDashboard() {
  const { user, signOut, isOwner, isDispatcher, isProvider } = useAuth();
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState({
    activeLocations: 0,
    teamMembers: 0,
    servicesOffered: 0,
  });

  // Real-time booking updates for providers
  const { isConnected, refreshBookings } = useRealtimeBookings({
    userId: user?.id,
    userType: "provider",
    onStatusChange: (bookingUpdate) => {
      // Update the specific booking in our local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingUpdate.id
            ? {
                ...booking,
                status: bookingUpdate.status,
                updated_at: bookingUpdate.updated_at,
              }
            : booking,
        ),
      );
    },
  });
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [businessCoverUploading, setBusinessCoverUploading] = useState(false);
  const [businessCoverError, setBusinessCoverError] = useState("");
  const [businessCoverPosition, setBusinessCoverPosition] = useState("50% 50%");
  const [showPositionControls, setShowPositionControls] = useState(false);
  const [providerCoverPosition, setProviderCoverPosition] = useState("50% 50%");
  const [showProviderPositionControls, setShowProviderPositionControls] =
    useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [businessHoursSaving, setBusinessHoursSaving] = useState(false);
  const [businessHoursError, setBusinessHoursError] = useState("");
  const [businessHoursSuccess, setBusinessHoursSuccess] = useState("");
  const [editingBusinessHours, setEditingBusinessHours] = useState(false);
  const [managingLocations, setManagingLocations] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsSaving, setLocationsSaving] = useState(false);
  const [locationsError, setLocationsError] = useState("");
  const [locationsSuccess, setLocationsSuccess] = useState("");
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [addingLocation, setAddingLocation] = useState(false);
  const [managingBusinessDetails, setManagingBusinessDetails] = useState(false);
  const [businessDetailsSaving, setBusinessDetailsSaving] = useState(false);
  const [businessDetailsError, setBusinessDetailsError] = useState("");
  const [businessDetailsSuccess, setBusinessDetailsSuccess] = useState("");
  const [businessServices, setBusinessServices] = useState<any[]>([]);
  const [businessAddons, setBusinessAddons] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    [],
  );
  const [serviceSubcategories, setServiceSubcategories] = useState<
    ServiceSubcategory[]
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [activeBookingTab, setActiveBookingTab] = useState("all");
  const [calendarViewType, setCalendarViewType] = useState<
    "week" | "month" | "hidden"
  >("month");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLocationFilter, setSelectedLocationFilter] =
    useState<string>("all");
  const [selectedProviderFilter, setSelectedProviderFilter] =
    useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Helper function to get current tab display name
  const getCurrentTabName = () => {
    switch (activeTab) {
      case "bookings":
        return "Bookings";
      case "conversations":
        return "Messages";
      case "services-addons":
        return "Services";
      case "business":
        return "Business";
      case "providers":
        return "Staff";
      case "locations":
        return "Locations";
      case "provider-services":
        return "Services";
      case "profile":
        return "Profile";
      case "analytics":
        return "Analytics";
      case "financial":
        return "Financial";
      case "subscription":
        return "Subscription";
      default:
        return "Menu";
    }
  };
  const [selectedProviderRoleFilter, setSelectedProviderRoleFilter] =
    useState<string>("all");
  const [
    selectedVerificationStatusFilter,
    setSelectedVerificationStatusFilter,
  ] = useState<string>("all");
  const [selectedActiveStatusFilter, setSelectedActiveStatusFilter] =
    useState<string>("all");

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<any>(null);

  // Edit provider modal state
  const [editProviderModal, setEditProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [providerActionLoading, setProviderActionLoading] = useState(false);
  const [editProviderForm, setEditProviderForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    provider_role: "",
    business_managed: false,
    is_active: true,
    verification_status: "",
    background_check_status: "",
    location_id: "",
    experience_years: "",
  });
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<any[]>([]);

  // Provider assignment states for Edit Provider modal
  const [editProviderServices, setEditProviderServices] = useState([]);
  const [editProviderAddons, setEditProviderAddons] = useState([]);
  const [editAssignmentsLoading, setEditAssignmentsLoading] = useState(false);

  // Conversations states (Twilio Conversations API)
  const [messagingModal, setMessagingModal] = useState(false);
  const [conversationsListModal, setConversationsListModal] = useState(false);
  const [selectedBookingForMessaging, setSelectedBookingForMessaging] =
    useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedBookingForDecline, setSelectedBookingForDecline] =
    useState<any>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Subscription states
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    delivery_type: "business_location",
    custom_price: "",
    is_active: true,
  });
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviceSuccess, setServiceSuccess] = useState("");
  const [addingService, setAddingService] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [availableServicesLoading, setAvailableServicesLoading] =
    useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [addServiceForm, setAddServiceForm] = useState({
    delivery_type: "business_location",
    custom_price: "",
    is_active: true,
  });

  // Add-ons state (provider level)
  const [providerAddons, setProviderAddons] = useState<any[]>([]);
  const [availableAddons, setAvailableAddons] = useState<any[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonsError, setAddonsError] = useState("");
  const [addonsSuccess, setAddonsSuccess] = useState("");
  const [addonsSaving, setAddonsSaving] = useState(false);

  // Business Services state (business level)
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allServiceAddons, setAllServiceAddons] = useState<any[]>([]);
  const [businessServicesData, setBusinessServicesData] = useState<any[]>([]);
  const [businessAddonsData, setBusinessAddonsData] = useState<any[]>([]);
  const [serviceAddonEligibility, setServiceAddonEligibility] = useState<any[]>(
    [],
  );
  const [businessServicesLoading, setBusinessServicesLoading] = useState(false);
  const [businessServicesError, setBusinessServicesError] = useState("");
  const [businessServicesSuccess, setBusinessServicesSuccess] = useState("");
  const [businessServicesSaving, setBusinessServicesSaving] = useState(false);

  // Business service/addon editing state
  const [editServiceModal, setEditServiceModal] = useState(false);
  const [editAddonModal, setEditAddonModal] = useState(false);
  const [editingBusinessService, setEditingBusinessService] =
    useState<any>(null);
  const [editingBusinessAddon, setEditingBusinessAddon] = useState<any>(null);
  const [editServiceForm, setEditServiceForm] = useState({
    business_price: "",
    delivery_type: "business_location",
  });
  const [editAddonForm, setEditAddonForm] = useState({
    custom_price: "",
  });

  // Tax Info state
  const [taxInfo, setTaxInfo] = useState({
    legal_business_name: "",
    tax_id: "",
    tax_id_type: "",
    tax_address_line1: "",
    tax_address_line2: "",
    tax_city: "",
    tax_state: "",
    tax_postal_code: "",
    tax_country: "US",
    business_entity_type: "",
    tax_contact_name: "",
    tax_contact_email: "",
    tax_contact_phone: "",
  });
  const [taxInfoLoading, setTaxInfoLoading] = useState(false);
  const [taxInfoError, setTaxInfoError] = useState("");
  const [taxInfoSuccess, setTaxInfoSuccess] = useState("");
  const [taxInfoSaving, setTaxInfoSaving] = useState(false);

  // Payout Info state
  const [payoutInfo, setPayoutInfo] = useState(null);
  const [payoutInfoLoading, setPayoutInfoLoading] = useState(false);
  const [payoutInfoError, setPayoutInfoError] = useState("");
  const [payoutInfoSuccess, setPayoutInfoSuccess] = useState("");

  // Plaid/Stripe Payout state
  const [plaidLinkToken, setPlaidLinkToken] = useState(null);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidError, setPlaidError] = useState("");
  const [plaidSuccess, setPlaidSuccess] = useState("");
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);
  const [payoutManagementModal, setPayoutManagementModal] = useState(false);

  // Business Documents state
  const [businessDocuments, setBusinessDocuments] = useState([]);
  const [businessDocumentsLoading, setBusinessDocumentsLoading] =
    useState(false);
  const [businessDocumentsError, setBusinessDocumentsError] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState("");
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");

  // Provider Services state (for regular providers)
  const [providerServices, setProviderServices] = useState([]);
  const [availableProviderServices, setAvailableProviderServices] = useState(
    [],
  );
  const [assignedProviderAddons, setAssignedProviderAddons] = useState([]);
  const [availableProviderAddons, setAvailableProviderAddons] = useState([]);
  const [providerServicesLoading, setProviderServicesLoading] = useState(false);
  const [providerServicesError, setProviderServicesError] = useState("");

  // Providers state
  const [teamProviders, setTeamProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");

  // Calendar Modal state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Add Provider Modal state
  const [addProviderModal, setAddProviderModal] = useState(false);
  const [addProviderStep, setAddProviderStep] = useState(1);
  const [addProviderLoading, setAddProviderLoading] = useState(false);
  const [addProviderError, setAddProviderError] = useState("");
  const [addProviderSuccess, setAddProviderSuccess] = useState("");

  // Step 1: User creation and email verification
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    confirmEmail: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newUserId, setNewUserId] = useState("");

  // Step 2: Provider profile information
  const [providerForm, setProviderForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    bio: "",
    date_of_birth: "",
    experience_years: "",
    location_id: "",
    provider_role: "provider",
  });

  // Step 3: Business management settings
  const [managementSettings, setManagementSettings] = useState({
    business_managed: true,
    inherit_business_services: true,
    inherit_business_addons: true,
  });

  // Manage Provider Modal state
  const [manageProviderModal, setManageProviderModal] = useState(false);
  const [managingProvider, setManagingProvider] = useState(null);
  const [manageProviderLoading, setManageProviderLoading] = useState(false);
  const [manageProviderError, setManageProviderError] = useState("");
  const [manageProviderSuccess, setManageProviderSuccess] = useState("");
  const [providerManagementForm, setProviderManagementForm] = useState({
    is_active: true,
    provider_role: "provider",
    business_managed: true,
    location_id: "",
    verification_status: "pending",
  });

  // Form state for contact information
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    dateOfBirth: "",
    experienceYears: "",
  });

  // Notification preferences state
  const [notificationSettings, setNotificationSettings] = useState({
    notification_email: "",
    notification_phone: "",
  });
  const [notificationSettingsSaving, setNotificationSettingsSaving] =
    useState(false);
  const [notificationSettingsError, setNotificationSettingsError] =
    useState("");
  const [notificationSettingsSuccess, setNotificationSettingsSuccess] =
    useState("");

  // Business hours editing state
  const [businessHoursForm, setBusinessHoursForm] = useState({
    Monday: { isOpen: false, open: "09:00", close: "17:00" },
    Tuesday: { isOpen: false, open: "09:00", close: "17:00" },
    Wednesday: { isOpen: false, open: "09:00", close: "17:00" },
    Thursday: { isOpen: false, open: "09:00", close: "17:00" },
    Friday: { isOpen: false, open: "09:00", close: "17:00" },
    Saturday: { isOpen: false, open: "09:00", close: "17:00" },
    Sunday: { isOpen: false, open: "09:00", close: "17:00" },
  });

  // Location form state
  const [locationForm, setLocationForm] = useState({
    location_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "FL",
    postal_code: "",
    country: "US",
    is_primary: false,
    offers_mobile_services: false,
    mobile_service_radius: 10,
    is_active: true,
  });

  // Business details form state - matches database schema
  const [businessDetailsForm, setBusinessDetailsForm] = useState({
    business_name: "",
    business_type: "",
    contact_email: "",
    phone: "",
    website_url: "",
    logo_url: "",
    verification_status: "",
    verification_notes: "",
    is_active: true,
    is_featured: false,
    setup_completed: false,
    service_categories: [],
    service_subcategories: [],
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const navigate = useNavigate();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return "";

    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight

    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatBusinessType = (businessType: string) => {
    if (!businessType) return "";

    // Convert underscore to space and capitalize each word
    return businessType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatVerificationStatus = (status: string) => {
    const statusMap = {
      pending: "Pending",
      verified: "Verified",
      rejected: "Rejected",
      suspended: "Suspended",
    };
    return statusMap[status] || status;
  };

  const toCamelCase = (text: string) => {
    if (!text) return "";

    // Convert underscore/space to camel case
    return text
      .split(/[_\s]+/)
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !business) return;

    setLogoUploading(true);
    setLogoError("");

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `business-logo-${business.id}-${Date.now()}.${fileExt}`;
      const filePath = `business-logos/${fileName}`;

      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Remove old logo if exists
      if (business.logo_url) {
        try {
          const urlParts = business.logo_url.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          const oldFilePath = `business-logos/${oldFileName}`;
          await directSupabaseAPI.deleteFile("roam-file-storage", oldFilePath);
        } catch (deleteError) {
          console.warn("Failed to delete old logo:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new logo using direct API
      const { publicUrl } = await directSupabaseAPI.uploadFile(
        "roam-file-storage",
        filePath,
        file,
      );

      // Update business form state
      setBusinessDetailsForm((prev) => ({ ...prev, logo_url: publicUrl }));

      // Also update the business state for immediate UI reflection
      setBusiness((prev) => (prev ? { ...prev, logo_url: publicUrl } : prev));

      toast({
        title: "Logo Uploaded",
        description: "Business logo has been uploaded successfully!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Logo upload error:", error);
      let errorMessage = "Failed to upload logo";

      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setLogoError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleLogoRemove = async () => {
    if (!business?.logo_url) return;

    setLogoUploading(true);
    setLogoError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Extract filename from URL
      const urlParts = business.logo_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `business-logos/${fileName}`;

      // Remove from storage using direct API
      await directSupabaseAPI.deleteFile("roam-file-storage", filePath);

      // Update business form state
      setBusinessDetailsForm((prev) => ({ ...prev, logo_url: "" }));

      // Also update the business state for immediate UI reflection
      setBusiness((prev) => (prev ? { ...prev, logo_url: null } : prev));

      toast({
        title: "Logo Removed",
        description: "Business logo has been removed successfully!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Logo remove error:", error);
      let errorMessage = "Failed to remove logo";

      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setLogoError(errorMessage);
      toast({
        title: "Remove Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !provider) return;

    setAvatarUploading(true);
    setAvatarError("");

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${provider.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatar-provider-user/${fileName}`;

      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Ensure we have a valid access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        directSupabaseAPI.currentAccessToken = session.access_token;
      } else {
        throw new Error("No valid authentication session");
      }

      // Remove old avatar if exists
      if (provider.image_url) {
        try {
          const urlParts = provider.image_url.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          const oldFilePath = `avatar-provider-user/${oldFileName}`;
          await directSupabaseAPI.deleteFile("roam-file-storage", oldFilePath);
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar using direct API
      const { publicUrl } = await directSupabaseAPI.uploadFile(
        "roam-file-storage",
        filePath,
        file,
      );

      // Update provider record using direct API
      await directSupabaseAPI.updateProviderImage(provider.id, publicUrl);

      // Update local state
      setProvider({ ...provider, image_url: publicUrl });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      console.error("Error details:", {
        type: typeof error,
        message: error?.message,
        keys: Object.keys(error || {}),
        stack: error?.stack,
      });

      let errorMessage = "Failed to upload avatar";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.statusCode && error?.error) {
        errorMessage = `Error ${error.statusCode}: ${error.error}`;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setAvatarError(errorMessage);
    } finally {
      setAvatarUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!provider?.image_url) return;

    setAvatarUploading(true);
    setAvatarError("");

    try {
      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Extract filename from URL
      const urlParts = provider.image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatar-provider-user/${fileName}`;

      // Remove from storage using direct API
      await directSupabaseAPI.deleteFile("roam-file-storage", filePath);

      // Update provider record using direct API
      await directSupabaseAPI.updateProviderImage(provider.id, null);

      // Update local state
      setProvider({ ...provider, image_url: null });
    } catch (error: any) {
      console.error("Avatar remove error:", error);
      let errorMessage = "Failed to remove avatar";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.statusCode && error?.error) {
        errorMessage = `Error ${error.statusCode}: ${error.error}`;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setAvatarError(errorMessage);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !provider) return;

    setBannerUploading(true);
    setBannerError("");

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 10MB for banner images)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${provider.id}-${Date.now()}.${fileExt}`;
      const filePath = `banner-provider-user/${fileName}`;

      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Ensure we have a valid access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        directSupabaseAPI.currentAccessToken = session.access_token;
      } else {
        throw new Error("No valid authentication session");
      }

      // Remove old banner if exists
      if (provider.cover_image_url) {
        try {
          const urlParts = provider.cover_image_url.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          const oldFilePath = `banner-provider-user/${oldFileName}`;
          await directSupabaseAPI.deleteFile("roam-file-storage", oldFilePath);
        } catch (deleteError) {
          console.warn("Failed to delete old banner:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new banner using direct API
      const { publicUrl } = await directSupabaseAPI.uploadFile(
        "roam-file-storage",
        filePath,
        file,
      );

      // Update provider record using direct API
      await directSupabaseAPI.updateProviderBannerImage(provider.id, publicUrl);

      // Update local state
      setProvider({ ...provider, cover_image_url: publicUrl });
    } catch (error: any) {
      console.error("Banner upload error:", error);
      console.error("Error details:", {
        type: typeof error,
        message: error?.message,
        keys: Object.keys(error || {}),
        stack: error?.stack,
      });

      let errorMessage = "Failed to upload banner image";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.statusCode && error?.error) {
        errorMessage = `Error ${error.statusCode}: ${error.error}`;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setBannerError(errorMessage);
    } finally {
      setBannerUploading(false);
      // Reset file input
      const input = document.getElementById(
        "banner-upload",
      ) as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  const handleBannerRemove = async () => {
    if (!provider?.cover_image_url) return;

    setBannerUploading(true);
    setBannerError("");

    try {
      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Extract filename from URL
      const urlParts = provider.cover_image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `banner-provider-user/${fileName}`;

      // Remove from storage using direct API
      await directSupabaseAPI.deleteFile("roam-file-storage", filePath);

      // Update provider record using direct API
      await directSupabaseAPI.updateProviderBannerImage(provider.id, null);

      // Update local state
      setProvider({ ...provider, cover_image_url: null });
      setProviderCoverPosition("50% 50%");
      setShowProviderPositionControls(false);
    } catch (error: any) {
      console.error("Banner remove error:", error);
      let errorMessage = "Failed to remove banner image";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.statusCode && error?.error) {
        errorMessage = `Error ${error.statusCode}: ${error.error}`;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setBannerError(errorMessage);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleBusinessCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !business) return;

    setBusinessCoverUploading(true);
    setBusinessCoverError("");

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 10MB for cover images)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${business.id}-${Date.now()}.${fileExt}`;
      const filePath = `business-cover-image/${fileName}`;

      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Ensure we have a valid access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        directSupabaseAPI.currentAccessToken = session.access_token;
      } else {
        throw new Error("No valid authentication session");
      }

      // Remove old cover image if exists
      if (business.cover_image_url) {
        try {
          const urlParts = business.cover_image_url.split("/");
          const oldFileName = urlParts[urlParts.length - 1];
          const oldFilePath = `business-cover-image/${oldFileName}`;
          await directSupabaseAPI.deleteFile("roam-file-storage", oldFilePath);
        } catch (deleteError) {
          console.warn("Failed to delete old business cover:", deleteError);
          // Continue with upload even if delete fails
        }
      }

      // Upload new cover image using direct API
      const { publicUrl } = await directSupabaseAPI.uploadFile(
        "roam-file-storage",
        filePath,
        file,
      );

      // Update business record using direct API
      await directSupabaseAPI.updateBusinessCoverImage(business.id, publicUrl);

      // Update local state
      setBusiness({ ...business, cover_image_url: publicUrl });
    } catch (error: any) {
      console.error("Business cover upload error:", error);
      console.error("Error details:", {
        type: typeof error,
        message: error?.message,
        keys: Object.keys(error || {}),
        stack: error?.stack,
      });

      let errorMessage = "Failed to upload business cover image";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.statusCode && error?.error) {
        errorMessage = `Error ${error.statusCode}: ${error.error}`;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setBusinessCoverError(errorMessage);
    } finally {
      setBusinessCoverUploading(false);
      // Reset file input
      const input = document.getElementById(
        "business-cover-upload",
      ) as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  const handleBusinessCoverRemove = async () => {
    if (!business?.cover_image_url) return;

    setBusinessCoverUploading(true);
    setBusinessCoverError("");

    try {
      // Use direct API for authenticated operations
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Extract filename from URL
      const urlParts = business.cover_image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `business-cover-image/${fileName}`;

      // Remove from storage using direct API
      await directSupabaseAPI.deleteFile("roam-file-storage", filePath);

      // Update business record using direct API
      await directSupabaseAPI.updateBusinessCoverImage(business.id, null);

      // Update local state
      setBusiness({ ...business, cover_image_url: null });
      setBusinessCoverPosition("50% 50%");
      setShowPositionControls(false);
    } catch (error: any) {
      console.error("Business cover remove error:", error);
      let errorMessage = "Failed to remove business cover image";

      // Handle Supabase storage error structure
      if (error?.error && typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      setBusinessCoverError(errorMessage);
    } finally {
      setBusinessCoverUploading(false);
    }
  };

  const handleImagePositionClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!business?.cover_image_url) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const position = `${Math.round(x)}% ${Math.round(y)}%`;
    setBusinessCoverPosition(position);
  };

  const handlePresetPosition = (position: string) => {
    setBusinessCoverPosition(position);
  };

  const handleProviderImagePositionClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!provider?.cover_image_url) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const position = `${Math.round(x)}% ${Math.round(y)}%`;
    setProviderCoverPosition(position);
  };

  const handleProviderPresetPosition = (position: string) => {
    setProviderCoverPosition(position);
  };

  const handleDocumentUploadWithFile = async (file: File) => {
    if (!file || !business?.id) return;

    try {
      // Verify user is authenticated before upload
      console.log("Checking authentication status...");
      console.log("Auth context state:", {
        hasUser: !!user,
        userId: user?.id,
        userType: user?.userType,
        isOwner,
        isDispatcher,
        isProvider,
      });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("Session debug:", {
        hasSession: !!session,
        sessionError: sessionError,
        user: session?.user || null,
        accessToken: session?.access_token
          ? `${session.access_token.substring(0, 20)}...`
          : null,
      });

      if (sessionError) {
        console.error("Session error:", sessionError);
        setDocumentUploadError(
          "Authentication error. Please try logging in again.",
        );
        return;
      }

      if (!session) {
        // Fallback: check if we have a user in auth context
        if (user && user.id) {
          console.log(
            "No session but auth context has user - proceeding with upload",
          );
        } else {
          console.error(
            "No session and no user in context - user not authenticated",
          );
          setDocumentUploadError("Please log in to upload documents");
          return;
        }
      }

      console.log("Authentication verified - proceeding with upload");

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `business-documents/${fileName}`;

      // Use standard Supabase client (same as authentication)
      console.log("Attempting upload using standard Supabase client");
      console.log("Uploading to path:", filePath);
      console.log("File details:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Upload file using standard Supabase client
      const { data, error } = await supabase.storage
        .from("roam-file-storage")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log("Upload successful:", data);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("roam-file-storage").getPublicUrl(filePath);

      console.log("Public URL:", publicUrl);

      // Save document metadata to database
      await saveDocumentToDatabase({
        businessId: business.id,
        documentName: documentName.trim(),
        fileUrl: publicUrl,
        fileSize: file.size,
        documentType: selectedDocumentType,
      });

      // Reload business documents
      await loadBusinessDocuments();

      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully!",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Document upload error:", error);
      let errorMessage = "Failed to upload document";

      if (error.message.includes("413")) {
        errorMessage = "File is too large. Maximum size is 50MB.";
      } else if (error.message.includes("401")) {
        errorMessage = "Authentication failed. Please refresh and try again.";
      } else if (error.message.includes("403")) {
        errorMessage = "Permission denied. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setDocumentUploadError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDocumentUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  // Document type options
  const documentTypeOptions = [
    { value: "drivers_license", label: "Drivers License" },
    { value: "proof_of_address", label: "Proof Of Address" },
    { value: "liability_insurance", label: "Liability Insurance" },
    { value: "professional_license", label: "Professional License" },
    { value: "professional_certificate", label: "Professional Certificate" },
    { value: "other", label: "Other" },
  ];

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setDocumentUploadError("File is too large. Maximum size is 50MB.");
      return;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      setDocumentUploadError(
        "Invalid file type. Please upload PDF, DOC, DOCX, JPG, JPEG, or PNG files.",
      );
      return;
    }

    setSelectedFile(file);
    setDocumentUploadError("");

    // Auto-populate document name with filename (without extension)
    const nameWithoutExt =
      file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    setDocumentName(nameWithoutExt);

    // Reset file input
    event.target.value = "";
  };

  const handleDocumentSubmit = async () => {
    if (!selectedFile || !selectedDocumentType || !documentName.trim()) {
      setDocumentUploadError("Please fill in all required fields.");
      return;
    }

    setDocumentUploading(true);
    setDocumentUploadError("");

    try {
      await handleDocumentUploadWithFile(selectedFile);
      setShowDocumentModal(false);
      setSelectedFile(null);
      setSelectedDocumentType("");
      setDocumentName("");
      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully!",
        variant: "default",
      });
    } catch (error: any) {
      setDocumentUploadError(error.message);
    } finally {
      setDocumentUploading(false);
    }
  };

  const getDocumentTypeFromName = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes("license") || lowerName.includes("permit")) {
      return "business_license";
    } else if (lowerName.includes("insurance")) {
      return "insurance_certificate";
    } else if (
      lowerName.includes("tax") ||
      lowerName.includes("ein") ||
      lowerName.includes("w9")
    ) {
      return "tax_document";
    } else if (
      lowerName.includes("contract") ||
      lowerName.includes("agreement")
    ) {
      return "contract";
    } else if (
      lowerName.includes("certification") ||
      lowerName.includes("certificate")
    ) {
      return "certification";
    } else {
      return "other";
    }
  };

  const saveDocumentToDatabase = async ({
    businessId,
    documentName,
    fileUrl,
    fileSize,
    documentType,
  }: {
    businessId: string;
    documentName: string;
    fileUrl: string;
    fileSize: number;
    documentType: string;
  }) => {
    const { data, error } = await supabase
      .from("business_documents")
      .insert({
        business_id: businessId,
        document_name: documentName,
        file_url: fileUrl,
        file_size_bytes: fileSize,
        document_type: documentType,
        verification_status: "pending",
      })
      .select();

    if (error) {
      throw new Error(`Failed to save document to database: ${error.message}`);
    }

    return data;
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear success/error messages when user starts typing
    if (profileSuccess) setProfileSuccess("");
    if (profileError) setProfileError("");
  };

  const handleNotificationSettingsChange = (field: string, value: string) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }));
    // Clear success/error messages when user starts typing
    if (notificationSettingsSuccess) setNotificationSettingsSuccess("");
    if (notificationSettingsError) setNotificationSettingsError("");
  };

  const handleSaveNotificationSettings = async () => {
    if (!provider) return;

    setNotificationSettingsSaving(true);
    setNotificationSettingsError("");
    setNotificationSettingsSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Prepare update data
      const updateData = {
        notification_email:
          notificationSettings.notification_email?.trim() || null,
        notification_phone:
          notificationSettings.notification_phone?.trim() || null,
      };

      // Email validation - only validate if email is provided and not empty
      if (
        updateData.notification_email &&
        updateData.notification_email.length > 0
      ) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.notification_email)) {
          throw new Error("Please enter a valid notification email address");
        }
      }

      // Update provider using direct API
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/providers?id=eq.${provider.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update notification settings: ${errorText}`);
      }

      // Update local provider state
      setProvider({
        ...provider,
        ...updateData,
      });

      setNotificationSettingsSuccess(
        "Notification settings updated successfully!",
      );

      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Notification settings save error:", error);
      let errorMessage = "Failed to update notification settings";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setNotificationSettingsError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setNotificationSettingsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!provider) return;

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Prepare update data
      const updateData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        bio: formData.bio.trim(),
        date_of_birth: formData.dateOfBirth || null,
        experience_years: formData.experienceYears
          ? parseInt(formData.experienceYears)
          : null,
      };

      // Validate required fields
      if (
        !updateData.first_name ||
        !updateData.last_name ||
        !updateData.email
      ) {
        throw new Error("First name, last name, and email are required");
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Update provider using direct API
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/providers?id=eq.${provider.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${errorText}`);
      }

      // Update local provider state
      setProvider({
        ...provider,
        ...updateData,
      });

      setProfileSuccess("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile save error:", error);
      let errorMessage = "Failed to update profile";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setProfileError(errorMessage);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleBusinessHoursChange = (
    day: string,
    field: string,
    value: string | boolean,
  ) => {
    setBusinessHoursForm((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));

    // Clear messages when user makes changes
    if (businessHoursSuccess) setBusinessHoursSuccess("");
    if (businessHoursError) setBusinessHoursError("");
  };

  const handleSaveBusinessHours = async () => {
    if (!business) return;

    setBusinessHoursSaving(true);
    setBusinessHoursError("");
    setBusinessHoursSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Convert form data to the required JSON format
      const businessHoursJson = {};
      Object.keys(businessHoursForm).forEach((day) => {
        if (businessHoursForm[day].isOpen) {
          businessHoursJson[day] = {
            open: businessHoursForm[day].open,
            close: businessHoursForm[day].close,
          };
        }
      });

      // Update business_profiles using direct API
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_profiles?id=eq.${business.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ business_hours: businessHoursJson }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update business hours: ${errorText}`);
      }

      // Update local state
      setBusinessHours(businessHoursJson);
      setBusiness({
        ...business,
        business_hours: businessHoursJson,
      });

      setBusinessHoursSuccess("Business hours updated successfully!");
      setEditingBusinessHours(false);
    } catch (error: any) {
      console.error("Business hours save error:", error);
      let errorMessage = "Failed to update business hours";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setBusinessHoursError(errorMessage);
    } finally {
      setBusinessHoursSaving(false);
    }
  };

  const handleCancelBusinessHours = () => {
    // Reset form to current data
    if (businessHours) {
      const resetForm = {
        Monday: { isOpen: false, open: "09:00", close: "17:00" },
        Tuesday: { isOpen: false, open: "09:00", close: "17:00" },
        Wednesday: { isOpen: false, open: "09:00", close: "17:00" },
        Thursday: { isOpen: false, open: "09:00", close: "17:00" },
        Friday: { isOpen: false, open: "09:00", close: "17:00" },
        Saturday: { isOpen: false, open: "09:00", close: "17:00" },
        Sunday: { isOpen: false, open: "09:00", close: "17:00" },
      };

      Object.keys(resetForm).forEach((day) => {
        if (businessHours[day]) {
          resetForm[day] = {
            isOpen: true,
            open: businessHours[day].open || "09:00",
            close: businessHours[day].close || "17:00",
          };
        }
      });

      setBusinessHoursForm(resetForm);
    }

    setEditingBusinessHours(false);
    setBusinessHoursError("");
    setBusinessHoursSuccess("");
  };

  const fetchLocations = async () => {
    if (!provider?.business_id) {
      console.log("fetchLocations: No provider or business_id available");
      return;
    }

    console.log(
      "fetchLocations: Starting fetch for business_id:",
      provider.business_id,
    );
    setLocationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_locations")
        .select("*")
        .eq("business_id", provider.business_id)
        .order("created_at", { ascending: false });

      console.log("fetchLocations: Query result:", { data, error });

      if (error) throw error;
      setLocations(data || []);
      console.log("fetchLocations: Set locations to:", data || []);
    } catch (error: any) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive",
      });
      setLocationsError("Failed to load locations");
    } finally {
      setLocationsLoading(false);
    }
  };

  const fetchTeamProviders = async () => {
    if (!provider?.business_id) {
      console.log("fetchTeamProviders: No provider or business_id available");
      return;
    }

    console.log(
      "fetchTeamProviders: Starting fetch for business_id:",
      provider.business_id,
    );
    setProvidersLoading(true);
    setProvidersError("");

    try {
      const { data, error } = await supabase
        .from("providers")
        .select(
          `
          *,
          business_locations!providers_location_id_fkey (
            id,
            location_name,
            address_line1,
            city,
            state,
            is_primary
          )
        `,
        )
        .eq("business_id", provider.business_id)
        .order("created_at", { ascending: false });

      console.log("fetchTeamProviders: Query result:", { data, error });

      if (error) throw error;
      setTeamProviders(data || []);
      console.log("fetchTeamProviders: Set team providers to:", data || []);
    } catch (error: any) {
      console.error("Error fetching team providers:", error);
      setProvidersError("Failed to load team providers");
      toast({
        title: "Error",
        description: "Failed to load team providers",
        variant: "destructive",
      });
    } finally {
      setProvidersLoading(false);
    }
  };

  // Add Provider workflow handlers
  const resetAddProviderModal = () => {
    setAddProviderModal(false);
    setAddProviderStep(1);
    setAddProviderError("");
    setAddProviderSuccess("");
    setOtpSent(false);
    setOtpCode("");
    setNewUserId("");
    setNewUserForm({ email: "", confirmEmail: "" });
    setProviderForm({
      first_name: "",
      last_name: "",
      phone: "",
      bio: "",
      date_of_birth: "",
      experience_years: "",
      location_id: "",
      provider_role: "provider",
    });
    setManagementSettings({
      business_managed: true,
      inherit_business_services: true,
      inherit_business_addons: true,
    });
  };

  const handleStartAddProvider = () => {
    resetAddProviderModal();
    setAddProviderModal(true);
  };

  // Step 1: Create user and send OTP
  const handleCreateUserAndSendOTP = async () => {
    if (!newUserForm.email || newUserForm.email !== newUserForm.confirmEmail) {
      setAddProviderError("Please enter a valid email and confirm it matches");
      return;
    }

    setAddProviderLoading(true);
    setAddProviderError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: Math.random().toString(36).slice(-12), // Temporary password
        options: {
          emailRedirectTo: `${window.location.origin}/provider-portal`,
        },
      });

      if (error) throw error;

      if (data.user) {
        setNewUserId(data.user.id);
        setOtpSent(true);
        setAddProviderSuccess(
          "Verification email sent! Please ask the provider to check their email and enter the OTP code.",
        );
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      setAddProviderError(error.message || "Failed to create user account");
    } finally {
      setAddProviderLoading(false);
    }
  };

  // Step 1: Verify OTP and proceed to step 2
  const handleVerifyOTPAndProceed = async () => {
    if (!otpCode) {
      setAddProviderError("Please enter the OTP code");
      return;
    }

    setAddProviderLoading(true);
    setAddProviderError("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: newUserForm.email,
        token: otpCode,
        type: "signup",
      });

      if (error) throw error;

      setAddProviderStep(2);
      setAddProviderSuccess(
        "Email verified! Now complete the provider profile.",
      );
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setAddProviderError(error.message || "Invalid OTP code");
    } finally {
      setAddProviderLoading(false);
    }
  };

  // Step 2: Save provider profile and proceed to step 3
  const handleSaveProviderProfile = async () => {
    if (
      !providerForm.first_name ||
      !providerForm.last_name ||
      !providerForm.email
    ) {
      setAddProviderError("Please fill in all required fields");
      return;
    }

    setAddProviderStep(3);
    setAddProviderSuccess(
      "Profile information saved! Now configure management settings.",
    );
  };

  // Step 3: Complete provider creation
  const handleCompleteProviderCreation = async () => {
    if (!provider || !newUserId) {
      setAddProviderError("Missing required information");
      return;
    }

    setAddProviderLoading(true);
    setAddProviderError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Create provider record
      const providerData = {
        user_id: newUserId,
        business_id: provider.business_id,
        first_name: providerForm.first_name.trim(),
        last_name: providerForm.last_name.trim(),
        email: newUserForm.email,
        phone: providerForm.phone.trim() || null,
        bio: providerForm.bio.trim() || null,
        date_of_birth: providerForm.date_of_birth || null,
        experience_years: providerForm.experience_years
          ? parseInt(providerForm.experience_years)
          : null,
        location_id:
          providerForm.location_id && providerForm.location_id !== "none"
            ? providerForm.location_id
            : null,
        provider_role: providerForm.provider_role,
        business_managed: managementSettings.business_managed,
        is_active: true,
        verification_status: "pending",
      };

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/providers`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(providerData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create provider: ${errorText}`);
      }

      // Assign business services and addons to the new provider
      if (managementSettings.inherit_business_services) {
        try {
          // Get all business services
          const { data: businessServices, error: servicesError } =
            await supabase
              .from("business_services")
              .select("*")
              .eq("business_id", provider.business_id)
              .eq("is_active", true);

          if (servicesError) {
            console.error("Error fetching business services:", servicesError);
          } else if (businessServices && businessServices.length > 0) {
            // Create provider_services records for each business service
            const providerServicesData = businessServices.map(
              (businessService) => ({
                provider_id: response.data?.[0]?.id, // Will need to get the created provider ID
                service_id: businessService.service_id,
                delivery_type: businessService.delivery_type,
                custom_price: businessService.custom_price,
                is_active: true, // Assigned by default
                managed_by_business: managementSettings.business_managed,
              }),
            );

            // Note: This would require the provider ID from the response
            console.log(
              "Would create provider services:",
              providerServicesData,
            );
          }

          // Get all business addons if inheriting addons
          if (managementSettings.inherit_business_addons) {
            const { data: businessAddons, error: addonsError } = await supabase
              .from("business_addons")
              .select("*")
              .eq("business_id", provider.business_id)
              .eq("is_available", true);

            if (addonsError) {
              console.error("Error fetching business addons:", addonsError);
            } else if (businessAddons && businessAddons.length > 0) {
              console.log(
                "Would create provider addons for:",
                businessAddons.length,
                "addons",
              );
            }
          }
        } catch (error) {
          console.error("Error inheriting services/addons:", error);
        }
      }

      toast({
        title: "Provider Added Successfully",
        description: `${providerForm.first_name} ${providerForm.last_name} has been added to your team!`,
        variant: "default",
      });

      resetAddProviderModal();
      await fetchTeamProviders(); // Refresh the provider list
    } catch (error: any) {
      console.error("Error creating provider:", error);
      setAddProviderError(error.message || "Failed to create provider");
    } finally {
      setAddProviderLoading(false);
    }
  };

  // Manage Provider functionality
  const handleManageProvider = (teamProvider) => {
    setManagingProvider(teamProvider);
    setProviderManagementForm({
      is_active: teamProvider.is_active !== false,
      provider_role: teamProvider.provider_role || "provider",
      business_managed: teamProvider.business_managed !== false,
      location_id: teamProvider.location_id || "none",
      verification_status: teamProvider.verification_status || "pending",
    });
    setManageProviderModal(true);
    setManageProviderError("");
    setManageProviderSuccess("");
  };

  const handleProviderManagementFormChange = (field, value) => {
    setProviderManagementForm((prev) => ({ ...prev, [field]: value }));
    if (manageProviderSuccess) setManageProviderSuccess("");
    if (manageProviderError) setManageProviderError("");
  };

  const handleSaveProviderManagement = async () => {
    if (!managingProvider) return;

    setManageProviderLoading(true);
    setManageProviderError("");
    setManageProviderSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Check if we have a valid access token
      if (!directSupabaseAPI.currentAccessToken) {
        console.warn(
          "No access token available for provider update, using anon key",
        );
      } else {
        console.log("Using access token for provider update");
      }

      // Enhanced validation and debugging
      console.log("=== PROVIDER UPDATE DEBUG START ===");
      console.log("Provider being updated:", {
        id: managingProvider.id,
        current_role: managingProvider.provider_role,
        current_business_managed: managingProvider.business_managed,
        current_is_active: managingProvider.is_active,
        current_verification_status: managingProvider.verification_status,
        current_location_id: managingProvider.location_id,
      });

      console.log("Form data received:", {
        is_active: providerManagementForm.is_active,
        provider_role: providerManagementForm.provider_role,
        business_managed: providerManagementForm.business_managed,
        location_id: providerManagementForm.location_id,
        verification_status: providerManagementForm.verification_status,
      });

      // Validate and prepare update data with strict checking
      const updateData: any = {};
      const validationErrors: string[] = [];

      // Validate is_active
      if (typeof providerManagementForm.is_active === "boolean") {
        updateData.is_active = providerManagementForm.is_active;
      } else {
        validationErrors.push(
          `Invalid is_active: ${providerManagementForm.is_active} (type: ${typeof providerManagementForm.is_active})`,
        );
      }

      // Validate provider_role
      const validRoles = ["owner", "dispatcher", "provider"];
      if (
        providerManagementForm.provider_role &&
        validRoles.includes(providerManagementForm.provider_role)
      ) {
        updateData.provider_role = providerManagementForm.provider_role;
      } else {
        validationErrors.push(
          `Invalid provider_role: ${providerManagementForm.provider_role}. Valid options: ${validRoles.join(", ")}`,
        );
      }

      // Validate business_managed
      if (typeof providerManagementForm.business_managed === "boolean") {
        updateData.business_managed = providerManagementForm.business_managed;
      } else {
        validationErrors.push(
          `Invalid business_managed: ${providerManagementForm.business_managed} (type: ${typeof providerManagementForm.business_managed})`,
        );
      }

      // Validate location_id (UUID or null)
      if (
        providerManagementForm.location_id &&
        providerManagementForm.location_id !== "none"
      ) {
        // Check if it's a valid UUID format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(providerManagementForm.location_id)) {
          updateData.location_id = providerManagementForm.location_id;
        } else {
          validationErrors.push(
            `Invalid location_id UUID format: ${providerManagementForm.location_id}`,
          );
        }
      } else {
        updateData.location_id = null;
      }

      // Validate verification_status
      const validStatuses = ["pending", "verified", "rejected"];
      if (
        providerManagementForm.verification_status &&
        validStatuses.includes(providerManagementForm.verification_status)
      ) {
        updateData.verification_status =
          providerManagementForm.verification_status;
      } else {
        validationErrors.push(
          `Invalid verification_status: ${providerManagementForm.verification_status}. Valid options: ${validStatuses.join(", ")}`,
        );
      }

      // Check for validation errors
      if (validationErrors.length > 0) {
        console.error("Validation errors:", validationErrors);
        throw new Error(`Validation failed: ${validationErrors.join("; ")}`);
      }

      console.log("Final update data:", JSON.stringify(updateData, null, 2));
      console.log("Update data keys:", Object.keys(updateData));

      // Ensure we have at least one field to update
      if (Object.keys(updateData).length === 0) {
        throw new Error("No valid fields to update after validation");
      }

      console.log("=== SENDING REQUEST ===");
      console.log(
        "URL:",
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/providers?id=eq.${managingProvider.id}`,
      );
      console.log("Method: PATCH");
      console.log("Body:", JSON.stringify(updateData, null, 2));
      console.log("Has access token:", !!directSupabaseAPI.currentAccessToken);

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/providers?id=eq.${managingProvider.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );

      // Read response body immediately, regardless of success/failure
      let responseBodyText = "";
      let responseHeaders = {};

      try {
        responseHeaders = Object.fromEntries(response.headers.entries());
        responseBodyText = await response.text();
      } catch (readError) {
        console.error("Could not read response:", readError);
        responseBodyText = `Error reading response: ${readError.message}`;
      }

      console.log("=== RESPONSE RECEIVED ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Headers:", JSON.stringify(responseHeaders, null, 2));
      console.log("Body:", responseBodyText);

      if (!response.ok) {
        console.error("=== REQUEST FAILED ===");

        let errorDetails = "";

        if (!responseBodyText || responseBodyText.trim() === "") {
          errorDetails = `Empty response body with HTTP ${response.status}`;
        } else {
          // Try to parse error details from response
          try {
            const errorJson = JSON.parse(responseBodyText);
            console.error(
              "Parsed error JSON:",
              JSON.stringify(errorJson, null, 2),
            );

            // Extract error details with priority
            if (errorJson.message) {
              errorDetails = errorJson.message;
            } else if (errorJson.error) {
              errorDetails = errorJson.error;
            } else if (errorJson.hint) {
              errorDetails = errorJson.hint;
            } else if (errorJson.details) {
              errorDetails = errorJson.details;
            } else if (errorJson.code) {
              errorDetails = `Error code: ${errorJson.code}`;
            } else if (Array.isArray(errorJson) && errorJson.length > 0) {
              errorDetails = JSON.stringify(errorJson[0]);
            } else {
              errorDetails = JSON.stringify(errorJson);
            }
          } catch (parseError) {
            console.error("Failed to parse error JSON:", parseError);
            errorDetails = responseBodyText.substring(0, 500); // Limit length
          }
        }

        const debugInfo = {
          status: response.status,
          statusText: response.statusText,
          url: `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/providers?id=eq.${managingProvider.id}`,
          method: "PATCH",
          requestBody: updateData,
          responseText: responseBodyText,
          errorDetails: errorDetails,
          providerId: managingProvider.id,
          responseHeaders: responseHeaders,
          hasAccessToken: !!directSupabaseAPI.currentAccessToken,
        };

        console.error("=== COMPLETE DEBUG INFO ===");
        console.error(JSON.stringify(debugInfo, null, 2));

        throw new Error(
          `Failed to update provider: HTTP ${response.status} - ${errorDetails}`,
        );
      }

      setManageProviderSuccess("Provider settings updated successfully!");

      toast({
        title: "Provider Updated",
        description: `${managingProvider.first_name} ${managingProvider.last_name}'s settings have been updated.`,
        variant: "default",
      });

      // Refresh the provider list to show updated data
      await fetchTeamProviders();
    } catch (error: any) {
      console.error("Provider management save error:", error);
      let errorMessage = "Failed to update provider settings";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setManageProviderError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setManageProviderLoading(false);
    }
  };

  const handleCloseManageProvider = () => {
    setManageProviderModal(false);
    setManagingProvider(null);
    setManageProviderError("");
    setManageProviderSuccess("");
  };

  // Calendar functionality
  const fetchCalendarBookings = async () => {
    if (!provider?.business_id) {
      console.log(
        "fetchCalendarBookings: No provider or business_id available",
      );
      return;
    }

    console.log(
      "fetchCalendarBookings: Starting fetch for provider:",
      provider.id,
    );
    console.log("fetchCalendarBookings: User roles:", {
      isProvider,
      isOwner,
      isDispatcher,
    });

    setCalendarLoading(true);
    try {
      let bookingsData = [];
      let bookingsError = null;

      // For regular providers, only show their own bookings (matching main dashboard pattern)
      if (isProvider && !isOwner && !isDispatcher) {
        console.log(
          "fetchCalendarBookings: Filtering for provider only, provider_id:",
          provider.id,
        );
        const result = await supabase
          .from("bookings")
          .select(
            `
            *,
            providers!inner(first_name, last_name),
            services(name, description),
            customer_profiles!inner(
              id,
              first_name,
              last_name,
              phone,
              email,
              image_url
            ),
            customer_locations(
              id,
              location_name,
              street_address,
              unit_number,
              city,
              state,
              zip_code,
              access_instructions
            ),
            business_locations(
              id,
              location_name,
              address_line1,
              address_line2,
              city,
              state,
              postal_code
            )
          `,
          )
          .eq("provider_id", provider.id)
          .order("booking_date", { ascending: true });

        bookingsData = result.data;
        bookingsError = result.error;
      } else {
        console.log(
          "fetchCalendarBookings: Fetching business bookings for business_id:",
          provider.business_id,
        );
        // For owners/dispatchers, show all business bookings (matching main dashboard pattern)
        const { data: businessProviders, error: providersError } =
          await supabase
            .from("providers")
            .select("id")
            .eq("business_id", provider.business_id);

        console.log("fetchCalendarBookings: Business providers query result:", {
          businessProviders,
          providersError,
        });

        if (providersError) {
          throw providersError;
        }

        if (businessProviders && businessProviders.length > 0) {
          const providerIds = businessProviders.map((p) => p.id);
          console.log(
            "fetchCalendarBookings: Filtering by provider IDs:",
            providerIds,
          );

          const result = await supabase
            .from("bookings")
            .select(
              `
              *,
              providers!inner(first_name, last_name),
              services(name, description),
              customer_profiles!inner(
                id,
                first_name,
                last_name,
                phone,
                email,
                image_url
              ),
              customer_locations(
                id,
                location_name,
                street_address,
                unit_number,
                city,
                state,
                zip_code,
                access_instructions
              ),
              business_locations(
                id,
                location_name,
                address_line1,
                address_line2,
                city,
                state,
                postal_code
              )
            `,
            )
            .eq("business_id", provider.business_id)
            .or(`provider_id.in.(${providerIds.join(",")}),provider_id.is.null`)
            .order("booking_date", { ascending: true });

          bookingsData = result.data;
          bookingsError = result.error;
        } else {
          console.log("fetchCalendarBookings: No business providers found");
          bookingsData = [];
          bookingsError = null;
        }
      }

      console.log("fetchCalendarBookings: Final result:", {
        bookingsData,
        bookingsError,
      });

      if (bookingsError) throw bookingsError;

      console.log(
        "fetchCalendarBookings: Successfully fetched",
        (bookingsData || []).length,
        "bookings",
      );
      setCalendarBookings(bookingsData || []);
    } catch (error: any) {
      console.error("Error fetching calendar bookings:", error);

      let errorMessage = "Failed to load calendar bookings";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.details) {
        errorMessage = error.details;
      }

      console.error("Calendar bookings error details:", errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleViewCalendar = () => {
    setShowCalendar(true);
    fetchCalendarBookings();
  };

  const handleLocationFormChange = (field: string, value: any) => {
    // Special handling for primary location changes
    if (field === "is_primary" && value === true) {
      const currentPrimary = locations.find(
        (loc) => loc.is_primary && loc.id !== editingLocation?.id,
      );
      if (currentPrimary) {
        const confirmed = confirm(
          `Setting this location as primary will remove the primary status from "${currentPrimary.location_name}". Continue?`,
        );
        if (!confirmed) {
          return; // Don't update if user cancels
        }

        toast({
          title: "Primary Location Changed",
          description: `"${currentPrimary.location_name}" is no longer the primary location.`,
          variant: "default",
        });
      }
    }

    setLocationForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetLocationForm = () => {
    setLocationForm({
      location_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "FL",
      postal_code: "",
      country: "US",
      is_primary: false,
      offers_mobile_services: false,
      mobile_service_radius: 10,
      is_active: true,
    });
  };

  const handleSaveLocation = async () => {
    if (!provider) return;

    setLocationsSaving(true);
    setLocationsError("");
    setLocationsSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const locationData = {
        ...locationForm,
        business_id: provider.business_id,
      };

      // Validate required fields
      if (
        !locationData.location_name ||
        !locationData.address_line1 ||
        !locationData.city
      ) {
        throw new Error("Location name, address, and city are required");
      }

      // If this location is being set as primary, unset any other primary locations
      if (locationData.is_primary) {
        await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations?business_id=eq.${provider.business_id}&is_primary=eq.true`,
          {
            method: "PATCH",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ is_primary: false }),
          },
        );
      }

      let response;
      if (editingLocation) {
        // Update existing location
        response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations?id=eq.${editingLocation.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(locationData),
          },
        );
      } else {
        // Create new location
        response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations`,
          {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(locationData),
          },
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save location: ${errorText}`);
      }

      const locationName = locationData.location_name;
      toast({
        title: editingLocation ? "Location Updated" : "Location Added",
        description: editingLocation
          ? `\"${locationName}\" has been updated successfully!`
          : `\"${locationName}\" has been added to your business!`,
        variant: "default",
      });

      setEditingLocation(null);
      setAddingLocation(false);
      resetLocationForm();
      await fetchLocations();
    } catch (error: any) {
      console.error("Location save error:", error);
      let errorMessage = "Failed to save location";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLocationsError(errorMessage);
    } finally {
      setLocationsSaving(false);
    }
  };

  const handleEditLocation = (location: any) => {
    setLocationForm({
      location_name: location.location_name || "",
      address_line1: location.address_line1 || "",
      address_line2: location.address_line2 || "",
      city: location.city || "",
      state: location.state || "FL",
      postal_code: location.postal_code || "",
      country: location.country || "US",
      is_primary: location.is_primary || false,
      offers_mobile_services: location.offers_mobile_services || false,
      mobile_service_radius: location.mobile_service_radius || 10,
      is_active: location.is_active !== false,
    });
    setEditingLocation(location);
    setAddingLocation(true);
    setManagingLocations(true);

    toast({
      title: "Edit Location",
      description: `Editing \"${location.location_name}\" - make your changes and save.`,
      variant: "default",
    });
  };

  const handleDeleteLocation = (locationId: string) => {
    // Find the location being deleted and store it for the confirmation dialog
    const location = locations.find((loc) => loc.id === locationId);
    setLocationToDelete(location);
    setDeleteConfirmOpen(true);
  };

  // Assign service to provider
  const assignServiceToProvider = async (
    providerId: string,
    serviceId: string,
  ) => {
    try {
      const { error } = await supabase.from("provider_services").insert({
        provider_id: providerId,
        service_id: serviceId,
        is_active: true,
      });

      if (error) throw error;

      // Reload assignments to update UI
      loadProviderAssignments(providerId);

      console.log("Service assigned successfully");
    } catch (error) {
      console.error("Error assigning service:", error);
    }
  };

  // Remove service assignment from provider
  const removeServiceFromProvider = async (
    providerServiceId: string,
    providerId: string,
  ) => {
    try {
      const { error } = await supabase
        .from("provider_services")
        .delete()
        .eq("id", providerServiceId);

      if (error) throw error;

      // Reload assignments to update UI
      loadProviderAssignments(providerId);

      console.log("Service assignment removed successfully");
    } catch (error) {
      console.error("Error removing service assignment:", error);
    }
  };

  // Assign addon to provider
  const assignAddonToProvider = async (providerId: string, addonId: string) => {
    try {
      const { error } = await supabase.from("provider_addons").insert({
        provider_id: providerId,
        addon_id: addonId,
        is_active: true,
      });

      if (error) throw error;

      // Reload assignments to update UI
      loadProviderAssignments(providerId);

      console.log("Addon assigned successfully");
    } catch (error) {
      console.error("Error assigning addon:", error);
    }
  };

  // Remove addon assignment from provider
  const removeAddonFromProvider = async (
    providerAddonId: string,
    providerId: string,
  ) => {
    try {
      const { error } = await supabase
        .from("provider_addons")
        .delete()
        .eq("id", providerAddonId);

      if (error) throw error;

      // Reload assignments to update UI
      loadProviderAssignments(providerId);

      console.log("Addon assignment removed successfully");
    } catch (error) {
      console.error("Error removing addon assignment:", error);
    }
  };

  // Subscription plans configuration
  const subscriptionPlans = [
    {
      id: "independent",
      name: "Independent",
      price: 99,
      description: "Perfect for solo practitioners",
      staffLimit: "1 staff member",
      features: [
        "Unlimited bookings",
        "Customer messaging",
        "Basic analytics",
        "Payment processing",
        "Mobile app access",
      ],
      recommended: false,
    },
    {
      id: "small-business",
      name: "Small Business",
      price: 399,
      description: "Ideal for small teams",
      staffLimit: "2-6 staff members",
      features: [
        "Everything in Independent",
        "Staff management",
        "Advanced scheduling",
        "Team analytics",
        "Priority support",
      ],
      recommended: true,
    },
    {
      id: "medium-business",
      name: "Medium Business",
      price: 699,
      description: "Growing businesses",
      staffLimit: "7-12 staff members",
      features: [
        "Everything in Small Business",
        "Multi-location support",
        "Advanced reporting",
        "Custom integrations",
        "Dedicated support",
      ],
      recommended: false,
    },
    {
      id: "large-business",
      name: "Large Business",
      price: 999,
      description: "Enterprise solutions",
      staffLimit: "13+ staff members",
      features: [
        "Everything in Medium Business",
        "Enterprise API access",
        "Custom branding",
        "Advanced security",
        "White-label options",
      ],
      recommended: false,
    },
  ];

  // Subscription handlers
  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setSubscriptionLoading(true);

    try {
      // Create Stripe checkout session for the selected plan
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planId,
          businessId: business?.id,
          customerId: provider?.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      const errorMessage =
        error?.message ||
        error?.details ||
        (typeof error === "string"
          ? error
          : "Failed to select plan. Please try again.");
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubscriptionLoading(false);
      setSelectedPlan(null);
    }
  };

  const loadCurrentSubscription = async () => {
    if (!business?.id) return;

    try {
      const { data, error } = await supabase
        .from("business_subscriptions")
        .select(
          `
          id,
          device_type,
          start_date,
          end_date,
          is_active,
          stripe_subscription_id,
          stripe_customer_id,
          stripe_price_id,
          subscription_status
        `,
        )
        .eq("business_id", business.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        // Map the subscription data to include plan details
        const planDetails = subscriptionPlans.find(
          (plan) =>
            data.stripe_price_id?.includes(plan.id) ||
            data.device_type === plan.id,
        );

        setCurrentSubscription({
          ...data,
          plan_name: planDetails?.name || "Unknown Plan",
          price: planDetails?.price || 0,
        });
      } else {
        setCurrentSubscription(null);
      }

      console.log("Current subscription loaded:", data);
    } catch (error) {
      console.error("Error loading subscription:", error);
      setCurrentSubscription(null);
    }
  };

  // Google Maps navigation handler
  const openGoogleMaps = (address: string) => {
    if (!address) return;

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);

    // Check if user is on mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    let mapsUrl;
    if (isMobile) {
      // Use Google Maps app URL scheme for mobile
      mapsUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
    } else {
      // Use web Google Maps for desktop
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }

    // Open in new tab/window
    window.open(mapsUrl, "_blank");
  };

  // Conversations handlers (Twilio Conversations API)
  const handleOpenMessaging = async (booking: any) => {
    console.log("handleOpenMessaging called with booking:", {
      id: booking?.id,
      customer_name:
        booking?.customer_profiles?.first_name || booking?.guest_name,
      customer_email: booking?.customer_profiles?.email || booking?.guest_email,
      service_name: booking?.services?.name,
    });
    setSelectedBookingForMessaging(booking);
    setMessagingModal(true);
  };

  const handleOpenConversationsList = () => {
    setConversationsListModal(true);
  };

  const handleCloseMessaging = () => {
    setMessagingModal(false);
    setSelectedBookingForMessaging(null);
  };

  const handleCloseConversationsList = () => {
    setConversationsListModal(false);
  };

  // Load provider's current assignments for Edit Provider modal
  const loadProviderAssignments = async (providerId: string) => {
    setEditAssignmentsLoading(true);

    try {
      // Load provider's current services
      const { data: providerServices, error: servicesError } = await supabase
        .from("provider_services")
        .select(
          `
          *,
          services(
            id,
            name,
            min_price,
            description
          )
        `,
        )
        .eq("provider_id", providerId);

      if (servicesError) {
        console.error("Error loading provider services:", servicesError);
      } else {
        setEditProviderServices(providerServices || []);
      }

      // Load provider's current addons
      const { data: providerAddons, error: addonsError } = await supabase
        .from("provider_addons")
        .select(
          `
          *,
          service_addons(
            id,
            name,
            description
          )
        `,
        )
        .eq("provider_id", providerId);

      if (addonsError) {
        console.error("Error loading provider addons:", addonsError);
      } else {
        setEditProviderAddons(providerAddons || []);
      }
    } catch (error) {
      console.error("Error loading provider assignments:", error);
    } finally {
      setEditAssignmentsLoading(false);
    }
  };

  // Provider action handlers
  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider);
    setEditProviderForm({
      first_name: provider.first_name || "",
      last_name: provider.last_name || "",
      email: provider.email || "",
      phone: provider.phone || "",
      provider_role: provider.provider_role || "",
      business_managed: provider.business_managed || false,
      is_active: provider.is_active || false,
      verification_status: provider.verification_status || "",
      background_check_status: provider.background_check_status || "",
      location_id: provider.location_id || "",
      experience_years: provider.experience_years
        ? provider.experience_years.toString()
        : "",
    });

    // Load business services and addons for assignment
    fetchBusinessServicesAndAddons();

    // Load provider's current assignments if they are a provider role
    if (provider.provider_role === "provider") {
      loadProviderAssignments(provider.id);
    }

    setEditProviderModal(true);
  };

  const handleToggleProviderActive = async (provider: any) => {
    const newStatus = !provider.is_active;
    await updateProviderStatus(provider.id, { is_active: newStatus });
  };

  const handleToggleBackgroundApproval = async (provider: any) => {
    const newStatus =
      provider.background_check_status === "approved"
        ? "under_review"
        : "approved";
    await updateProviderStatus(provider.id, {
      background_check_status: newStatus,
    });
  };

  const handleToggleVerificationApproval = async (provider: any) => {
    const newStatus =
      provider.verification_status === "approved" ? "pending" : "approved";
    await updateProviderStatus(provider.id, { verification_status: newStatus });
  };

  const updateProviderStatus = async (providerId: string, updates: any) => {
    setProviderActionLoading(true);

    try {
      const { error } = await supabase
        .from("providers")
        .update(updates)
        .eq("id", providerId);

      if (error) {
        console.error("Provider update error:", error);
        throw new Error(`Failed to update provider: ${error.message}`);
      }

      toast({
        title: "Provider Updated",
        description: "Provider status updated successfully",
        variant: "default",
      });

      // Refresh the team providers list
      await fetchTeamProviders();
    } catch (error: any) {
      console.error("Provider update error:", error);
      toast({
        title: "Update Failed",
        description: `Failed to update provider: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProviderActionLoading(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!editingProvider) return;

    // Validate required fields
    if (
      !editProviderForm.first_name ||
      !editProviderForm.last_name ||
      !editProviderForm.email ||
      !editProviderForm.phone
    ) {
      toast({
        title: "Validation Error",
        description:
          "First name, last name, email, and phone are required fields",
        variant: "destructive",
      });
      return;
    }

    setProviderActionLoading(true);

    try {
      const updateData = {
        first_name: editProviderForm.first_name.trim(),
        last_name: editProviderForm.last_name.trim(),
        email: editProviderForm.email.trim(),
        phone: editProviderForm.phone.trim(),
        provider_role: editProviderForm.provider_role,
        business_managed: editProviderForm.business_managed,
        is_active: editProviderForm.is_active,
        verification_status: editProviderForm.verification_status,
        background_check_status: editProviderForm.background_check_status,
        location_id: editProviderForm.location_id || null,
        experience_years: editProviderForm.experience_years
          ? parseInt(editProviderForm.experience_years)
          : null,
      };

      const { error } = await supabase
        .from("providers")
        .update(updateData)
        .eq("id", editingProvider.id);

      if (error) {
        console.error("Provider save error:", error);
        throw new Error(`Failed to save provider: ${error.message}`);
      }

      toast({
        title: "Provider Updated",
        description: "Provider information updated successfully",
        variant: "default",
      });

      setEditProviderModal(false);
      setEditingProvider(null);

      // Refresh the team providers list
      await fetchTeamProviders();
    } catch (error: any) {
      console.error("Provider save error:", error);
      toast({
        title: "Save Failed",
        description: `Failed to save provider: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProviderActionLoading(false);
    }
  };

  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return;

    const locationName = locationToDelete.location_name || "this location";

    setDeleteConfirmOpen(false);
    setLocationsSaving(true);

    // Show deleting toast
    toast({
      title: "Deleting Location",
      description: `Removing \"${locationName}\" from your business...`,
      variant: "default",
    });

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_locations?id=eq.${locationToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete location: ${errorText}`);
      }

      toast({
        title: "Location Deleted",
        description: `\"${locationName}\" has been successfully removed from your business.`,
        variant: "default",
      });
      await fetchLocations();
    } catch (error: any) {
      console.error("Location delete error:", error);
      const errorMessage = error.message || "Failed to delete location";
      toast({
        title: "Delete Failed",
        description: `Failed to delete \"${locationName}\": ${errorMessage}`,
        variant: "destructive",
      });
      setLocationsError(errorMessage);
    } finally {
      setLocationsSaving(false);
      setLocationToDelete(null);
    }
  };

  const handleCancelLocationEdit = () => {
    setEditingLocation(null);
    setAddingLocation(false);
    resetLocationForm();
  };

  const handleBusinessDetailsFormChange = (field: string, value: any) => {
    setBusinessDetailsForm((prev) => ({ ...prev, [field]: value }));
    if (businessDetailsSuccess) setBusinessDetailsSuccess("");
    if (businessDetailsError) setBusinessDetailsError("");
  };

  const handleServiceFormChange = (field: string, value: any) => {
    setServiceForm((prev) => ({ ...prev, [field]: value }));
    if (serviceSuccess) setServiceSuccess("");
    if (serviceError) setServiceError("");
  };

  const handleEditService = (businessService: any) => {
    setServiceForm({
      delivery_type: businessService.delivery_type || "business_location",
      custom_price: businessService.custom_price?.toString() || "",
      is_active: businessService.is_active !== false,
    });
    setEditingService(businessService);
    setServiceError("");
    setServiceSuccess("");
  };

  const handleSaveService = async () => {
    if (!editingService || !provider) return;

    setServiceSaving(true);
    setServiceError("");
    setServiceSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Validate delivery_type
      const validDeliveryTypes = [
        "business_location",
        "service_location",
        "both_locations",
      ];
      if (!validDeliveryTypes.includes(serviceForm.delivery_type)) {
        throw new Error("Invalid delivery type selected");
      }

      // Validate and process custom_price
      let customPrice = null;
      if (serviceForm.custom_price && serviceForm.custom_price.trim() !== "") {
        const parsedPrice = parseFloat(serviceForm.custom_price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          throw new Error("Please enter a valid price (0 or greater)");
        }
        customPrice = parsedPrice;
      }

      // Validate is_active
      if (typeof serviceForm.is_active !== "boolean") {
        throw new Error("Invalid active status");
      }

      const updateData = {
        delivery_type: serviceForm.delivery_type,
        custom_price: customPrice,
        is_active: serviceForm.is_active,
      };

      console.log("Service update - Debug info:", {
        editingService: editingService,
        serviceForm: serviceForm,
        updateData: updateData,
        serviceId: editingService.id,
        url: `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${editingService.id}`,
        hasAccessToken: !!directSupabaseAPI.currentAccessToken,
      });

      // Let's check the current service data structure first
      console.log("Current business services structure:", {
        allServices: businessServices.map((s) => ({
          id: s.id,
          keys: Object.keys(s),
          delivery_type: s.delivery_type,
          custom_price: s.custom_price,
          is_active: s.is_active,
        })),
      });

      // Validate that we have a valid service ID
      if (!editingService.id || typeof editingService.id !== "string") {
        throw new Error("Invalid service ID - cannot update service");
      }

      // Check if the service exists and get its current structure
      const checkResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${editingService.id}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const checkResult = await checkResponse.json();
      console.log("Service existence and structure check:", {
        status: checkResponse.status,
        result: checkResult,
        serviceStructure: checkResult?.[0]
          ? Object.keys(checkResult[0])
          : "No service found",
      });

      if (!checkResponse.ok || !checkResult || checkResult.length === 0) {
        throw new Error(
          `Service with ID ${editingService.id} not found or inaccessible`,
        );
      }

      const currentService = checkResult[0];
      console.log("Current service data from database:", currentService);

      // Try different field name variations that might be in the actual schema
      const possibleUpdateVariations = [
        // Original data
        updateData,
        // Alternative field names that might be in the schema
        {
          delivery_type: updateData.delivery_type,
          price: updateData.custom_price,
          active: updateData.is_active,
        },
        {
          delivery_method: updateData.delivery_type,
          custom_price: updateData.custom_price,
          is_active: updateData.is_active,
        },
        {
          delivery_type: updateData.delivery_type,
          override_price: updateData.custom_price,
          is_active: updateData.is_active,
        },
      ];

      let updateSuccess = false;
      let lastError = null;

      // Try each variation until one works
      let response;
      for (let i = 0; i < possibleUpdateVariations.length; i++) {
        const testData = possibleUpdateVariations[i];
        console.log(`Attempt ${i + 1}: Trying update with data:`, testData);

        try {
          response = await fetch(
            `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${editingService.id}`,
            {
              method: "PATCH",
              headers: {
                apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
                Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify(testData),
            },
          );

          if (response.ok) {
            console.log(
              `Success with attempt ${i + 1}! Correct schema:`,
              testData,
            );
            updateSuccess = true;
            break;
          } else {
            const errorText = await response.text();
            console.log(`Attempt ${i + 1} failed:`, {
              status: response.status,
              error: errorText,
            });
            lastError = errorText;
          }
        } catch (error) {
          console.log(`Attempt ${i + 1} threw error:`, error);
          lastError = error;
        }
      }

      // If all attempts failed, proceed with original error handling
      if (!updateSuccess) {
        console.log(
          "All schema variations failed. Using last response for error handling.",
        );
      }

      if (!updateSuccess && (!response || !response.ok)) {
        let errorText = "Unknown error";
        let errorDetails = "";
        try {
          // Only read response if it hasn't been read already
          if (lastError && typeof lastError === "string") {
            errorText = lastError;
          } else {
            errorText = await response.text();
          }
          // Try to parse error details from response
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorDetails = errorJson.message;
            } else if (errorJson.error) {
              errorDetails = errorJson.error;
            } else if (errorJson.hint) {
              errorDetails = errorJson.hint;
            } else if (errorJson.details) {
              errorDetails = errorJson.details;
            }
          } catch (parseError) {
            // errorText is not JSON, use as-is
            errorDetails = errorText;
          }
        } catch (readError) {
          console.warn("Could not read response text:", readError);
          errorText = `HTTP ${response.status} - ${response.statusText}`;
          errorDetails = errorText;
        }

        // Capture response headers for debugging
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const debugInfo = {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
          responseHeaders: responseHeaders,
          errorDetails: errorDetails,
          updateData: updateData,
          serviceId: editingService.id,
          url: `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${editingService.id}`,
          headers: {
            apikey: "***",
            Authorization: directSupabaseAPI.currentAccessToken
              ? "Bearer [USER_TOKEN]"
              : "Bearer [ANON_KEY]",
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          errorTextLength: errorText?.length || 0,
          isEmpty: !errorText || errorText.trim() === "",
        };

        console.error(
          "Service update failed - Debug Info:",
          JSON.stringify(debugInfo, null, 2),
        );

        // If error details are empty, provide more context
        if (!errorDetails || errorDetails.trim() === "") {
          errorDetails = `HTTP ${response.status} - No error details provided by server`;
        }

        // If HTTP 400 with empty error details, try a simpler update approach
        if (
          response.status === 400 &&
          (!errorDetails || errorDetails.trim() === "")
        ) {
          console.log(
            "Attempting simplified update due to HTTP 400 with no details...",
          );

          try {
            // Try updating only the is_active field first
            const simpleData = { is_active: serviceForm.is_active };
            const simpleResponse = await fetch(
              `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${editingService.id}`,
              {
                method: "PATCH",
                headers: {
                  apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
                body: JSON.stringify(simpleData),
              },
            );

            if (simpleResponse.ok) {
              console.log(
                "Simple update succeeded - the issue may be with delivery_type or custom_price fields",
              );

              // Update local state with simple data
              setBusinessServices((prev) =>
                prev.map((service) =>
                  service.id === editingService.id
                    ? { ...service, is_active: serviceForm.is_active }
                    : service,
                ),
              );

              setServiceSuccess(
                "Service status updated successfully! (Note: Some fields may not have been updated due to data format issues)",
              );
              setEditingService(null);
              setServiceSaving(false);
              return; // Exit early on success
            } else {
              const fallbackError = await simpleResponse.text();
              console.log("Simple update also failed:", fallbackError);
            }
          } catch (fallbackError) {
            console.log("Fallback update failed:", fallbackError);
          }
        }

        // Provide specific error message based on status code
        let userFriendlyError = errorDetails || errorText;
        if (response.status === 400) {
          userFriendlyError = `Invalid request: ${errorDetails || "The data format may be incorrect. Please check your input values."}`;
        } else if (response.status === 401) {
          userFriendlyError =
            "Authentication failed. Please refresh the page and try again.";
        } else if (response.status === 403) {
          userFriendlyError =
            "Permission denied. You may not have access to update this service.";
        } else if (response.status === 404) {
          userFriendlyError = "Service not found. It may have been deleted.";
        }

        throw new Error(userFriendlyError);
      }

      // If we reach here, the update was successful (either immediately or after trying variations)
      // Update local state - use the original updateData since that's what we want to reflect in the UI
      setBusinessServices((prev) =>
        prev.map((service) =>
          service.id === editingService.id
            ? { ...service, ...updateData }
            : service,
        ),
      );

      setServiceSuccess("Service updated successfully!");
      setEditingService(null);
    } catch (error: any) {
      console.error("Service save error details:", {
        error: error,
        errorType: typeof error,
        errorMessage: error?.message,
        errorString: String(error),
        errorJSON: JSON.stringify(error, null, 2),
      });

      // Also log a simple string version to avoid [object Object]
      console.error("Service save error (simple):", String(error));

      let errorMessage = "Failed to update service";

      // Comprehensive error message extraction
      if (error?.message && typeof error.message === "string") {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        // Try multiple ways to extract meaningful error information
        if (error.toString && typeof error.toString === "function") {
          const stringified = error.toString();
          if (stringified !== "[object Object]") {
            errorMessage = stringified;
          } else if (error.message) {
            errorMessage = String(error.message);
          } else if (error.error) {
            errorMessage = String(error.error);
          } else if (error.details) {
            errorMessage = String(error.details);
          } else {
            // Last resort - extract any useful properties
            const errorProps = Object.keys(error).filter(
              (key) => typeof error[key] === "string" && error[key].length > 0,
            );
            if (errorProps.length > 0) {
              errorMessage = `Failed to update service: ${error[errorProps[0]]}`;
            } else {
              errorMessage = "Failed to update service: Unknown error occurred";
            }
          }
        } else {
          errorMessage = "Failed to update service: Invalid error object";
        }
      } else {
        errorMessage = `Failed to update service: ${String(error)}`;
      }

      // Final safety check to ensure errorMessage is always a string
      if (typeof errorMessage !== "string") {
        errorMessage =
          "Failed to update service: Error details could not be extracted";
      }

      console.log("Final error message to display:", errorMessage);
      setServiceError(errorMessage);
    } finally {
      setServiceSaving(false);
    }
  };

  const handleCancelServiceEdit = () => {
    setEditingService(null);
    setServiceForm({
      delivery_type: "business_location",
      custom_price: "",
      is_active: true,
    });
    setServiceError("");
    setServiceSuccess("");
  };

  const handleQuickToggleService = async (
    serviceId: string,
    isActive: boolean,
  ) => {
    if (!provider) return;

    // Check if provider can edit service assignments
    const canEditServices =
      isOwner || isDispatcher || (isProvider && !provider.business_managed);

    if (!canEditServices) {
      toast({
        title: "Action Not Allowed",
        description:
          "Service assignments are managed by the business and cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // For regular providers who can edit (business_managed = false),
      // update provider_services instead of business_services
      const endpoint =
        isProvider && !isOwner && !isDispatcher
          ? "provider_services"
          : "business_services";

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/${endpoint}?id=eq.${serviceId}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ is_active: isActive }),
        },
      );

      if (!response.ok) {
        let errorText = "Unknown error";
        let errorDetails = "";
        try {
          errorText = await response.text();
          // Try to parse error details from response
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorDetails = errorJson.message;
            } else if (errorJson.error) {
              errorDetails = errorJson.error;
            } else if (errorJson.hint) {
              errorDetails = errorJson.hint;
            } else if (errorJson.details) {
              errorDetails = errorJson.details;
            }
          } catch (parseError) {
            // errorText is not JSON, use as-is
            errorDetails = errorText;
          }
        } catch (readError) {
          console.warn("Could not read response text:", readError);
          errorText = `HTTP ${response.status} - ${response.statusText}`;
          errorDetails = errorText;
        }

        console.error("Service toggle failed:", {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText,
          errorDetails: errorDetails,
          serviceId: serviceId,
          isActive: isActive,
        });

        throw new Error(
          `Failed to update service: HTTP ${response.status} - ${errorDetails}`,
        );
      }

      // Update local state
      setBusinessServices((prev) =>
        prev.map((service) =>
          service.id === serviceId
            ? { ...service, is_active: isActive }
            : service,
        ),
      );

      toast({
        title: isActive ? "Service Activated" : "Service Deactivated",
        description: `Service has been ${isActive ? "activated" : "deactivated"} successfully.`,
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error toggling service:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update service status",
        variant: "destructive",
      });

      // Refresh services to restore correct state
      fetchBusinessServices();
    }
  };

  const getDeliveryTypeLabel = (type: string) => {
    const labels = {
      business_location: "Business",
      customer_location: "Mobile",
      virtual: "Virtual",
      both_locations: "Both",
    };
    return labels[type] || type;
  };

  const formatBookingLocation = (booking: any) => {
    if (booking.delivery_type === "virtual") {
      return "Virtual Session";
    } else if (
      booking.delivery_type === "customer_location" &&
      booking.customer_locations
    ) {
      const loc = booking.customer_locations;
      const address = `${loc.street_address}${loc.unit_number ? ` ${loc.unit_number}` : ""}, ${loc.city}, ${loc.state} ${loc.zip_code}`;
      return {
        name: loc.location_name || "Customer Location",
        address: address,
        instructions: loc.access_instructions,
      };
    } else if (
      booking.delivery_type === "business_location" &&
      booking.business_locations
    ) {
      const loc = booking.business_locations;
      const address = `${loc.address_line1}${loc.address_line2 ? ` ${loc.address_line2}` : ""}, ${loc.city}, ${loc.state} ${loc.postal_code}`;
      return {
        name: loc.location_name || "Business Location",
        address: address,
        instructions: null,
      };
    } else {
      // Fallback for when location data is not available
      return booking.delivery_type === "customer_location"
        ? "Customer Location"
        : booking.delivery_type === "business_location"
          ? "Business Location"
          : "Location TBD";
    }
  };

  const fetchAvailableServices = async () => {
    if (!provider) return;

    setAvailableServicesLoading(true);
    try {
      // Get all services
      const { data: allServices, error: servicesError } = await supabase
        .from("services")
        .select(
          `
          id,
          name,
          description,
          base_price,
          duration_minutes,
          is_active,
          subcategory_id,
          service_subcategories!subcategory_id (
            id,
            name,
            category_id,
            service_categories!category_id (
              id,
              name
            )
          )
        `,
        )
        .order("name");

      if (servicesError) throw servicesError;

      // Get currently added business services
      const { data: businessServices, error: businessError } = await supabase
        .from("business_services")
        .select("service_id")
        .eq("business_id", provider.business_id);

      if (businessError) throw businessError;

      // Filter out already added services
      const addedServiceIds = new Set(
        businessServices?.map((bs) => bs.service_id) || [],
      );
      const available =
        allServices?.filter((service) => !addedServiceIds.has(service.id)) ||
        [];

      setAvailableServices(available);
    } catch (error: any) {
      console.error(
        "Error fetching available services:",
        JSON.stringify(error),
      );
      setServiceError(`Failed to load available services: ${error.message}`);
    } finally {
      setAvailableServicesLoading(false);
    }
  };

  const handleAddServiceFormChange = (field: string, value: any) => {
    setAddServiceForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartAddService = () => {
    setAddingService(true);
    setSelectedServiceId("");
    setAddServiceForm({
      delivery_type: "business_location",
      custom_price: "",
      is_active: true,
    });
    setServiceError("");
    setServiceSuccess("");
    fetchAvailableServices();
  };

  const handleAddService = async () => {
    if (!selectedServiceId || !provider) {
      setServiceError("Please select a service to add");
      return;
    }

    setServiceSaving(true);
    setServiceError("");
    setServiceSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const addData = {
        business_id: provider.business_id,
        service_id: selectedServiceId,
        delivery_type: addServiceForm.delivery_type,
        custom_price: addServiceForm.custom_price
          ? parseFloat(addServiceForm.custom_price)
          : null,
        is_active: addServiceForm.is_active,
      };

      // Validate price if provided
      if (
        addServiceForm.custom_price &&
        (isNaN(parseFloat(addServiceForm.custom_price)) ||
          parseFloat(addServiceForm.custom_price) < 0)
      ) {
        throw new Error("Please enter a valid price (0 or greater)");
      }

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(addData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add service: ${errorText}`);
      }

      setServiceSuccess("Service added successfully!");
      setAddingService(false);

      // Refresh business services
      await fetchBusinessServices();
    } catch (error: any) {
      console.error("Service add error:", error);
      let errorMessage = "Failed to add service";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setServiceError(errorMessage);
    } finally {
      setServiceSaving(false);
    }
  };

  const handleCancelAddService = () => {
    setAddingService(false);
    setSelectedServiceId("");
    setAddServiceForm({
      delivery_type: "business_location",
      custom_price: "",
      is_active: true,
    });
    setServiceError("");
    setServiceSuccess("");
  };

  const clearAddonsMessages = () => {
    setAddonsError("");
    setAddonsSuccess("");
  };

  const handleTabChange = (newTab: string) => {
    // Clear messages when switching tabs
    if (newTab !== "addons") {
      clearAddonsMessages();
    }
    if (newTab !== "services-addons") {
      clearBusinessServicesMessages();
    }
    setActiveTab(newTab);
  };

  const fetchBusinessServices = async () => {
    if (!provider) {
      console.log("fetchBusinessServices: No provider available");
      return;
    }

    console.log("fetchBusinessServices: Provider data:", provider);
    console.log("fetchBusinessServices: User data:", user);
    console.log(
      "fetchBusinessServices: Starting fetch for business_id:",
      provider.business_id,
    );

    if (!provider.business_id) {
      console.error(
        "fetchBusinessServices: No business_id found in provider data",
      );
      setServicesError("No business ID found for this provider");
      return;
    }

    setServicesLoading(true);
    setServicesError("");

    try {
      // Fetch business services with service details and booking counts
      const { data: servicesData, error: servicesError } = await supabase
        .from("business_services")
        .select(
          `
          *,
          services (
            id,
            name,
            description,
            min_price,
            duration_minutes,
            subcategory_id,
            service_subcategories!subcategory_id (
              id,
              name,
              category_id,
              service_categories!category_id (
                id,
                name
              )
            )
          )
        `,
        )
        .eq("business_id", provider.business_id)
        .order("created_at", { ascending: false });

      console.log("fetchBusinessServices: business_services query result:", {
        servicesData,
        servicesError,
      });

      if (servicesError) {
        console.error(
          "fetchBusinessServices: Error fetching business services:",
          JSON.stringify(servicesError),
        );
        throw servicesError;
      }

      // Get service IDs for addon eligibility check
      const serviceIds = servicesData?.map((bs) => bs.service_id) || [];
      console.log("fetchBusinessServices: Found service IDs:", serviceIds);

      // Fetch business addons with addon details, filtered by service eligibility
      // For now, let's simplify this query to avoid complex subqueries
      const { data: addonsData, error: addonsError } = await supabase
        .from("business_addons")
        .select(
          `
          *,
          service_addons (
            id,
            name,
            description,
            addon_type,
            default_price
          )
        `,
        )
        .eq("business_id", provider.business_id)
        .eq("is_available", true);

      console.log("fetchBusinessServices: business_addons query result:", {
        addonsData,
        addonsError,
      });

      if (addonsError) {
        console.error(
          "fetchBusinessServices: Error fetching business addons:",
          JSON.stringify(addonsError),
        );
        // Don't throw error for addons, just log it
      }

      // For now, simplify by setting booking count to 0 to avoid complex async operations
      // We can enhance this later once basic services are loading
      const servicesWithBookings = (servicesData || []).map(
        (businessService) => ({
          ...businessService,
          booking_count: 0, // Placeholder for now
        }),
      );

      console.log(
        "fetchBusinessServices: Final services with bookings:",
        servicesWithBookings,
      );
      setBusinessServices(servicesWithBookings);
      setBusinessAddons(addonsData || []);
    } catch (error: any) {
      console.error(
        "fetchBusinessServices: Caught error:",
        JSON.stringify(error),
      );
      setServicesError(`Failed to load services: ${error.message}`);
      // Set empty arrays so we show the empty state instead of loading forever
      setBusinessServices([]);
      setBusinessAddons([]);
    } finally {
      setServicesLoading(false);
    }
  };

  // Provider Add-ons Functions
  const fetchProviderAddons = async () => {
    if (!provider) {
      console.log("fetchProviderAddons: No provider available");
      return;
    }

    setAddonsLoading(true);
    setAddonsError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Fetch all available service add-ons
      const availableResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/service_addons?select=*`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      let availableAddonsData = [];
      if (availableResponse.ok) {
        availableAddonsData = await availableResponse.json();
      }

      // Fetch provider's current add-ons
      const providerResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/provider_addons?provider_id=eq.${provider.id}&select=*,service_addons(*)`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      let providerAddonsData = [];
      if (providerResponse.ok) {
        providerAddonsData = await providerResponse.json();
      }

      setAvailableAddons(availableAddonsData);
      setProviderAddons(providerAddonsData);
    } catch (error: any) {
      console.error("fetchProviderAddons: Error:", error);
      setAddonsError(`Failed to load add-ons: ${error.message}`);
    } finally {
      setAddonsLoading(false);
    }
  };

  const handleToggleAddon = async (addonId: string, isActive: boolean) => {
    if (!provider) return;

    setAddonsSaving(true);
    setAddonsError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      // Check if provider already has this add-on
      const existingAddon = providerAddons.find(
        (pa) => pa.addon_id === addonId,
      );

      if (existingAddon) {
        // Update existing provider_addon
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/provider_addons?id=eq.${existingAddon.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ is_active: isActive }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update add-on: ${errorText}`);
        }

        // Update local state
        setProviderAddons((prev) =>
          prev.map((pa) =>
            pa.id === existingAddon.id ? { ...pa, is_active: isActive } : pa,
          ),
        );
      } else if (isActive) {
        // Create new provider_addon
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/provider_addons`,
          {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              provider_id: provider.id,
              addon_id: addonId,
              is_active: true,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to add add-on: ${errorText}`);
        }

        const newAddon = await response.json();

        // Add the service_addon details
        const addonDetails = availableAddons.find((a) => a.id === addonId);
        const newAddonWithDetails = {
          ...newAddon[0],
          service_addons: addonDetails,
        };

        setProviderAddons((prev) => [...prev, newAddonWithDetails]);
      }

      setAddonsSuccess(
        isActive
          ? "Add-on enabled successfully!"
          : "Add-on disabled successfully!",
      );
    } catch (error: any) {
      console.error("handleToggleAddon: Error:", error);
      setAddonsError(
        `Failed to ${isActive ? "enable" : "disable"} add-on: ${error.message}`,
      );
    } finally {
      setAddonsSaving(false);
    }
  };

  // Business Service Editing Functions
  const handleEditBusinessService = (businessService: any) => {
    setEditServiceForm({
      business_price:
        businessService.business_price?.toString() ||
        businessService.services?.min_price?.toString() ||
        "",
      delivery_type: businessService.delivery_type || "business_location",
    });
    setEditingBusinessService(businessService);
    setEditServiceModal(true);
  };

  const handleSaveBusinessService = async () => {
    if (
      !editingBusinessService ||
      !provider?.business_id ||
      (!isOwner && !isDispatcher)
    )
      return;

    setBusinessServicesSaving(true);
    setBusinessServicesError("");

    try {
      const businessPrice = parseFloat(editServiceForm.business_price);
      const minPrice = editingBusinessService?.services?.min_price || 0;

      // Client-side validation for minimum price
      if (businessPrice < minPrice) {
        throw new Error(
          `Business price ($${businessPrice}) cannot be lower than the service's minimum price ($${minPrice})`,
        );
      }

      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const updateData = {
        business_price: businessPrice,
        delivery_type: editServiceForm.delivery_type,
      };

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${editingBusinessService.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        let errorText = "Unknown error";
        try {
          errorText = await response.text();
        } catch (readError) {
          console.error("Error reading response text:", readError);
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }

        // Check for specific constraint violations
        if (
          errorText.includes("check constraint") ||
          errorText.includes("violates check constraint") ||
          errorText.includes("business_price") ||
          errorText.includes("minimum price")
        ) {
          throw new Error(
            "The business price cannot be lower than the service's minimum price. Please enter a higher amount.",
          );
        } else if (
          errorText.includes("constraint") &&
          errorText.includes("price")
        ) {
          throw new Error(
            "Invalid price value. Please check the pricing constraints and try again.",
          );
        }

        throw new Error(`Failed to update service: ${errorText}`);
      }

      // Update local state
      setBusinessServices((prev) =>
        prev.map((bs) =>
          bs.id === editingBusinessService.id
            ? {
                ...bs,
                business_price: updateData.business_price,
                delivery_type: updateData.delivery_type,
              }
            : bs,
        ),
      );

      setBusinessServicesSuccess("Service updated successfully!");
      setEditServiceModal(false);
      setTimeout(() => setBusinessServicesSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error updating business service:", error);
      setBusinessServicesError(`Failed to update service: ${error.message}`);
    } finally {
      setBusinessServicesSaving(false);
    }
  };

  const handleEditAddon = (businessAddon: any) => {
    setEditAddonForm({
      custom_price:
        businessAddon.custom_price?.toString() ||
        businessAddon.service_addons?.default_price?.toString() ||
        "",
    });
    setEditingBusinessAddon(businessAddon);
    setEditAddonModal(true);
  };

  const handleSaveBusinessAddon = async () => {
    if (
      !editingBusinessAddon ||
      !provider?.business_id ||
      (!isOwner && !isDispatcher)
    )
      return;

    setBusinessServicesSaving(true);
    setBusinessServicesError("");

    try {
      // Validate that a price is set
      if (
        !editAddonForm.custom_price ||
        editAddonForm.custom_price.trim() === ""
      ) {
        throw new Error("A price must be set for the addon before saving.");
      }

      const customPrice = parseFloat(editAddonForm.custom_price);

      // Validate that the price is a positive number
      if (isNaN(customPrice) || customPrice <= 0) {
        throw new Error("Please enter a valid price greater than $0.");
      }

      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const updateData = {
        custom_price: customPrice,
      };

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_addons?id=eq.${editingBusinessAddon.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update add-on: ${errorText}`);
      }

      // Update local state
      setBusinessAddons((prev) =>
        prev.map((ba) =>
          ba.id === editingBusinessAddon.id
            ? { ...ba, custom_price: updateData.custom_price }
            : ba,
        ),
      );

      setBusinessServicesSuccess("Add-on updated successfully!");
      setEditAddonModal(false);
      setTimeout(() => setBusinessServicesSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error updating business add-on:", error);
      setBusinessServicesError(`Failed to update add-on: ${error.message}`);
    } finally {
      setBusinessServicesSaving(false);
    }
  };

  // Business Services Functions (Owner Only)
  const fetchBusinessServicesAndAddons = async () => {
    if (!provider?.business_id || (!isOwner && !isDispatcher)) {
      console.log(
        "fetchBusinessServicesAndAddons: No business_id available or not owner",
      );
      return;
    }

    setBusinessServicesLoading(true);
    setBusinessServicesError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      console.log(
        "Fetching business services and add-ons for business:",
        provider.business_id,
      );

      // Fetch all available services that can be added
      const servicesResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/services?select=id,name,description,min_price,duration_minutes,is_active,service_subcategories(id,service_subcategory_type,service_categories(id,service_category_type,description))&is_active=eq.true&order=name`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Fetch all available service add-ons
      const addonsResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/service_addons?select=*&is_active=eq.true&order=name`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Fetch business's current services with joined service details
      const businessServicesResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?business_id=eq.${provider.business_id}&select=id,business_id,service_id,business_price,is_active,delivery_type,created_at,services(id,name,description,min_price,duration_minutes,service_subcategories(id,service_subcategory_type,service_categories(id,service_category_type,description)))`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Fetch business's current add-ons with joined addon details
      const businessAddonsResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_addons?business_id=eq.${provider.business_id}&select=id,business_id,addon_id,custom_price,is_available,created_at,service_addons(id,name,description,image_url)`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Fetch service-addon eligibility mapping
      const eligibilityResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/service_addon_eligibility?select=*`,
        {
          headers: {
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Check for authentication errors before processing
      const authErrors = [
        servicesResponse,
        addonsResponse,
        businessServicesResponse,
        businessAddonsResponse,
        eligibilityResponse,
      ].filter((response) => response.status === 401);

      if (authErrors.length > 0) {
        console.log("Authentication errors detected, throwing JWT error");
        throw new Error("JWT expired - authentication required");
      }

      // Process all responses
      const servicesData = servicesResponse.ok
        ? await servicesResponse.json()
        : [];
      const addonsData = addonsResponse.ok ? await addonsResponse.json() : [];
      const businessServicesData = businessServicesResponse.ok
        ? await businessServicesResponse.json()
        : [];
      const businessAddonsData = businessAddonsResponse.ok
        ? await businessAddonsResponse.json()
        : [];
      const eligibilityData = eligibilityResponse.ok
        ? await eligibilityResponse.json()
        : [];

      // Log responses for debugging
      console.log("API Responses:", {
        servicesResponse: {
          ok: servicesResponse.ok,
          status: servicesResponse.status,
        },
        addonsResponse: {
          ok: addonsResponse.ok,
          status: addonsResponse.status,
        },
        businessServicesResponse: {
          ok: businessServicesResponse.ok,
          status: businessServicesResponse.status,
        },
        businessAddonsResponse: {
          ok: businessAddonsResponse.ok,
          status: businessAddonsResponse.status,
        },
        eligibilityResponse: {
          ok: eligibilityResponse.ok,
          status: eligibilityResponse.status,
        },
      });

      setAllServices(servicesData || []);
      setAllServiceAddons(addonsData || []);
      setBusinessServicesData(businessServicesData || []);
      setBusinessServices(businessServicesData || []); // Set both for compatibility
      setBusinessAddonsData(businessAddonsData || []);
      setBusinessAddons(businessAddonsData || []); // Set both for compatibility
      setServiceAddonEligibility(eligibilityData || []);

      console.log("Business services and add-ons loaded:", {
        services: servicesData?.length || 0,
        addons: addonsData?.length || 0,
        businessServices: businessServicesData?.length || 0,
        businessAddons: businessAddonsData?.length || 0,
        eligibility: eligibilityData?.length || 0,
      });

      setBusinessServicesSuccess("Services and add-ons loaded successfully!");
      setTimeout(() => setBusinessServicesSuccess(""), 3000);
    } catch (error: any) {
      console.error("fetchBusinessServicesAndAddons: Error:", error);

      // Check if it's an authentication error
      if (
        error.message?.includes("JWT") ||
        error.message?.includes("401") ||
        error.status === 401
      ) {
        console.log("JWT expired, attempting to refresh token...");

        try {
          // Try to refresh the session
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession();

          if (!refreshError && refreshData.session) {
            console.log("Session refreshed successfully, retrying request...");
            // Retry the request with the new token
            setTimeout(() => {
              fetchBusinessServicesAndAddons();
            }, 1000);
            return;
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }

        setBusinessServicesError(
          "Your session has expired. Please refresh the page and sign in again.",
        );
      } else {
        setBusinessServicesError(
          `Failed to load services and add-ons: ${error.message}`,
        );
      }
    } finally {
      setBusinessServicesLoading(false);
    }
  };

  const handleToggleBusinessService = async (
    serviceId: string,
    isActive: boolean,
    businessPrice?: number,
    deliveryType?: string,
  ) => {
    console.log("handleToggleBusinessService called:", {
      serviceId,
      isActive,
      businessId: provider?.business_id,
      isOwner,
      isDispatcher,
      willReturn: !provider?.business_id || (!isOwner && !isDispatcher),
    });

    if (!provider?.business_id || (!isOwner && !isDispatcher)) {
      console.log("Exiting early - no business_id or not owner/dispatcher");
      return;
    }

    setBusinessServicesSaving(true);
    setBusinessServicesError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      console.log("Toggle business service:", {
        serviceId,
        isActive,
        businessPrice,
        deliveryType,
      });

      // Check if business already has this service
      const existingService = businessServicesData.find(
        (bs) => bs.service_id === serviceId,
      );

      if (existingService && !isActive) {
        // Remove service
        console.log("Removing service:", existingService.id);
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${existingService.id}`,
          {
            method: "DELETE",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Delete service failed:", errorText);
          throw new Error(`Failed to remove service: ${errorText}`);
        }

        // Update local state
        setBusinessServicesData((prev) =>
          prev.filter((bs) => bs.id !== existingService.id),
        );

        // Remove dependent add-ons
        await updateEligibleAddons();
      } else if (existingService && isActive) {
        // Update existing service
        const updateData: any = { is_active: isActive };
        if (businessPrice !== undefined)
          updateData.business_price = businessPrice;
        if (deliveryType) updateData.delivery_type = deliveryType;

        console.log("Updating service:", existingService.id, updateData);
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services?id=eq.${existingService.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(updateData),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Update service failed:", errorText);
          throw new Error(`Failed to update service: ${errorText}`);
        }

        // Update local state
        setBusinessServicesData((prev) =>
          prev.map((bs) =>
            bs.id === existingService.id ? { ...bs, ...updateData } : bs,
          ),
        );
      } else if (isActive && businessPrice) {
        // Add new service
        const service = allServices.find((s) => s.id === serviceId);
        if (!service) throw new Error("Service not found");

        // Check if service is Telemed and set delivery type to virtual by default
        const defaultDeliveryType = service.name
          .toLowerCase()
          .includes("telemed")
          ? "virtual"
          : "business_location";

        const newServiceData = {
          business_id: provider.business_id,
          service_id: serviceId,
          business_price: businessPrice,
          delivery_type: deliveryType || defaultDeliveryType,
          is_active: true,
        };

        console.log("Adding new service:", newServiceData);
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_services`,
          {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify(newServiceData),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Add service failed:", errorText);
          throw new Error(`Failed to add service: ${errorText}`);
        }

        const newService = await response.json();
        const newServiceWithDetails = {
          ...newService[0],
          services: service,
        };

        setBusinessServicesData((prev) => [...prev, newServiceWithDetails]);
      }

      setBusinessServicesSuccess(
        isActive
          ? "Service added successfully!"
          : "Service removed successfully!",
      );
    } catch (error: any) {
      console.error("handleToggleBusinessService: Error:", error);
      setBusinessServicesError(
        `Failed to ${isActive ? "add" : "remove"} service: ${error.message}`,
      );
    } finally {
      setBusinessServicesSaving(false);
    }
  };

  const handleToggleBusinessAddon = async (
    addonId: string,
    isActive: boolean,
    customPrice?: number,
  ) => {
    if (!provider?.business_id || (!isOwner && !isDispatcher)) return;

    setBusinessServicesSaving(true);
    setBusinessServicesError("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      console.log("Toggle business addon:", { addonId, isActive, customPrice });

      // Check if business already has this add-on
      const existingAddon = businessAddonsData.find(
        (ba) => ba.addon_id === addonId,
      );

      if (existingAddon && !isActive) {
        // Remove add-on
        console.log("Removing addon:", existingAddon.id);
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_addons?id=eq.${existingAddon.id}`,
          {
            method: "DELETE",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Delete addon failed:", errorText);
          throw new Error(`Failed to remove add-on: ${errorText}`);
        }

        // Update local state
        setBusinessAddonsData((prev) =>
          prev.filter((ba) => ba.id !== existingAddon.id),
        );
      } else if (existingAddon && isActive) {
        // Update existing add-on
        const updateData: any = { is_available: isActive };
        if (customPrice !== undefined) updateData.custom_price = customPrice;

        console.log("Updating addon:", existingAddon.id, updateData);
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_addons?id=eq.${existingAddon.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(updateData),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Update addon failed:", errorText);
          throw new Error(`Failed to update add-on: ${errorText}`);
        }

        // Update local state
        setBusinessAddonsData((prev) =>
          prev.map((ba) =>
            ba.id === existingAddon.id ? { ...ba, ...updateData } : ba,
          ),
        );
      } else if (isActive) {
        // Add new add-on
        const addon = allServiceAddons.find((a) => a.id === addonId);
        if (!addon) throw new Error("Add-on not found");

        const newAddonData = {
          business_id: provider.business_id,
          addon_id: addonId,
          custom_price: customPrice || null, // Allow null price initially
          is_available: true,
        };

        console.log("Adding new addon:", newAddonData);
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/business_addons`,
          {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${directSupabaseAPI.currentAccessToken || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify(newAddonData),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Add addon failed:", errorText);
          throw new Error(`Failed to add add-on: ${errorText}`);
        }

        const newAddon = await response.json();
        const newAddonWithDetails = {
          ...newAddon[0],
          service_addons: addon,
        };

        setBusinessAddonsData((prev) => [...prev, newAddonWithDetails]);
      }

      setBusinessServicesSuccess(
        isActive
          ? "Add-on added successfully!"
          : "Add-on removed successfully!",
      );
    } catch (error: any) {
      console.error("handleToggleBusinessAddon: Error:", error);
      setBusinessServicesError(
        `Failed to ${isActive ? "add" : "remove"} add-on: ${error.message}`,
      );
    } finally {
      setBusinessServicesSaving(false);
    }
  };

  const updateEligibleAddons = async () => {
    // Remove any business add-ons that are no longer eligible
    const assignedServiceIds = businessServicesData.map((bs) => bs.service_id);
    const ineligibleAddons = businessAddonsData.filter((ba) => {
      const eligibility = serviceAddonEligibility.find(
        (e) => e.addon_id === ba.addon_id,
      );
      return (
        eligibility && !assignedServiceIds.includes(eligibility.service_id)
      );
    });

    for (const addon of ineligibleAddons) {
      await handleToggleBusinessAddon(addon.addon_id, false);
    }
  };

  const getEligibleAddonsForService = (serviceId: string) => {
    const eligibleAddonIds = serviceAddonEligibility
      .filter((e) => e.service_id === serviceId)
      .map((e) => e.addon_id);

    return allServiceAddons.filter((addon) =>
      eligibleAddonIds.includes(addon.id),
    );
  };

  const isAddonEligible = (addonId: string) => {
    const assignedServiceIds = businessServicesData.map((bs) => bs.service_id);
    const eligibility = serviceAddonEligibility.find(
      (e) => e.addon_id === addonId,
    );
    return eligibility && assignedServiceIds.includes(eligibility.service_id);
  };

  const clearBusinessServicesMessages = () => {
    setBusinessServicesError("");
    setBusinessServicesSuccess("");
  };

  const handleSaveBusinessDetails = async () => {
    if (!business) return;

    setBusinessDetailsSaving(true);
    setBusinessDetailsError("");
    setBusinessDetailsSuccess("");

    try {
      const { directSupabaseAPI } = await import("@/lib/directSupabase");

      const updateData = {
        business_name: businessDetailsForm.business_name?.trim() || "",
        contact_email: businessDetailsForm.contact_email?.trim() || "",
        phone: businessDetailsForm.phone?.trim() || "",
        website_url: businessDetailsForm.website_url?.trim() || "",
        logo_url: businessDetailsForm.logo_url?.trim() || null,
        is_active: businessDetailsForm.is_active,
        is_featured: businessDetailsForm.is_featured,
        service_categories:
          Array.isArray(businessDetailsForm.service_categories) &&
          businessDetailsForm.service_categories.length > 0
            ? businessDetailsForm.service_categories.filter(
                (cat) => typeof cat === "string" && cat.trim().length > 0,
              )
            : [],
        service_subcategories:
          Array.isArray(businessDetailsForm.service_subcategories) &&
          businessDetailsForm.service_subcategories.length > 0
            ? businessDetailsForm.service_subcategories.filter(
                (sub) => typeof sub === "string" && sub.trim().length > 0,
              )
            : [],
      };

      // Validate enum values against expected database enums
      const validCategories = ["beauty", "fitness", "therapy", "healthcare"];
      const validSubcategories = [
        "hair_and_makeup",
        "spray_tan",
        "esthetician",
        "massage_therapy",
        "iv_therapy",
        "physical_therapy",
        "nurse_practitioner",
        "phycisian",
        "chiropractor",
        "yoga_instructor",
        "pilates_instructor",
        "personal_trainer",
      ];

      if (updateData.service_categories) {
        const invalidCategories = updateData.service_categories.filter(
          (cat) => !validCategories.includes(cat),
        );
        if (invalidCategories.length > 0) {
          throw new Error(
            `Invalid service categories: ${invalidCategories.join(", ")}`,
          );
        }
      }

      if (updateData.service_subcategories) {
        console.log(
          "Validating subcategories:",
          updateData.service_subcategories,
        );
        console.log("Valid subcategories:", validSubcategories);
        const invalidSubcategories = updateData.service_subcategories.filter(
          (sub) => !validSubcategories.includes(sub),
        );
        if (invalidSubcategories.length > 0) {
          console.warn(
            `Some subcategories may not be in the database: ${invalidSubcategories.join(", ")}`,
          );
          // Don't throw error, just warn - proceed with the update
        }
      }

      // Debug logging
      console.log(
        "Saving business details with data:",
        JSON.stringify(updateData, null, 2),
      );
      console.log("Business ID:", business.id);
      console.log("Service categories:", updateData.service_categories);
      console.log("Service subcategories:", updateData.service_subcategories);

      // Validate required fields
      if (!updateData.business_name) {
        throw new Error("Business name is required");
      }

      // Email validation - only validate if email is provided and not empty
      if (updateData.contact_email && updateData.contact_email.length > 0) {
        // Clean the email value of any potential hidden characters
        const cleanEmail = updateData.contact_email
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .trim();
        updateData.contact_email = cleanEmail;

        // More comprehensive email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailRegex.test(cleanEmail)) {
          console.error("Email validation failed for:", cleanEmail);
          throw new Error(
            `Please enter a valid contact email address: "${cleanEmail}"`,
          );
        }
      } else {
        // If email is empty, set it to null to avoid database issues
        updateData.contact_email = null;
      }

      // Update business using direct API
      if (!business?.id) {
        throw new Error("Business ID is missing");
      }

      await directSupabaseAPI.updateBusinessProfile(business.id, updateData);

      // Update local business state
      setBusiness({
        ...business,
        ...updateData,
      });

      setBusinessDetailsSuccess("Business details updated successfully!");
    } catch (error: any) {
      console.error("Business details save error:", error);
      let errorMessage = "Failed to update business details";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setBusinessDetailsError(errorMessage);
    } finally {
      setBusinessDetailsSaving(false);
    }
  };

  // Load tax information from database
  const loadTaxInfo = async () => {
    if (!business?.id) return;

    setTaxInfoLoading(true);
    setTaxInfoError("");

    try {
      const { data, error } = await supabase
        .from("business_stripe_tax_info")
        .select("*")
        .eq("business_id", business.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found, which is OK
        throw error;
      }

      if (data) {
        setTaxInfo({
          legal_business_name: data.legal_business_name || "",
          tax_id: data.tax_id || "",
          tax_id_type: data.tax_id_type || "",
          tax_address_line1: data.tax_address_line1 || "",
          tax_address_line2: data.tax_address_line2 || "",
          tax_city: data.tax_city || "",
          tax_state: data.tax_state || "",
          tax_postal_code: data.tax_postal_code || "",
          tax_country: data.tax_country || "US",
          business_entity_type: data.business_entity_type || "",
          tax_contact_name: data.tax_contact_name || "",
          tax_contact_email: data.tax_contact_email || "",
          tax_contact_phone: data.tax_contact_phone || "",
        });
      }
    } catch (error: any) {
      console.error("Error loading tax info:", error);
      setTaxInfoError("Failed to load tax information");
    } finally {
      setTaxInfoLoading(false);
    }
  };

  // Save tax information to database
  const handleSaveTaxInfo = async () => {
    if (!business?.id) return;

    // Validate required fields
    if (!taxInfo.legal_business_name?.trim()) {
      setTaxInfoError("Legal business name is required");
      return;
    }
    if (!taxInfo.tax_id?.trim()) {
      setTaxInfoError("Tax ID is required");
      return;
    }
    if (!taxInfo.tax_id_type) {
      setTaxInfoError("Tax ID type is required");
      return;
    }
    if (!taxInfo.business_entity_type) {
      setTaxInfoError("Business entity type is required");
      return;
    }
    if (!taxInfo.tax_contact_name?.trim()) {
      setTaxInfoError("Tax contact name is required");
      return;
    }
    if (!taxInfo.tax_contact_email?.trim()) {
      setTaxInfoError("Tax contact email is required");
      return;
    }
    if (!taxInfo.tax_address_line1?.trim()) {
      setTaxInfoError("Tax address is required");
      return;
    }
    if (!taxInfo.tax_city?.trim()) {
      setTaxInfoError("Tax city is required");
      return;
    }
    if (!taxInfo.tax_state) {
      setTaxInfoError("Tax state is required");
      return;
    }
    if (!taxInfo.tax_postal_code?.trim()) {
      setTaxInfoError("Tax ZIP code is required");
      return;
    }

    setTaxInfoSaving(true);
    setTaxInfoError("");
    setTaxInfoSuccess("");

    try {
      const taxData = {
        business_id: business.id,
        legal_business_name: taxInfo.legal_business_name.trim(),
        tax_id: taxInfo.tax_id.trim(),
        tax_id_type: taxInfo.tax_id_type,
        tax_address_line1: taxInfo.tax_address_line1.trim(),
        tax_address_line2: taxInfo.tax_address_line2?.trim() || null,
        tax_city: taxInfo.tax_city.trim(),
        tax_state: taxInfo.tax_state,
        tax_postal_code: taxInfo.tax_postal_code.trim(),
        tax_country: taxInfo.tax_country || "US",
        business_entity_type: taxInfo.business_entity_type,
        tax_contact_name: taxInfo.tax_contact_name.trim(),
        tax_contact_email: taxInfo.tax_contact_email.trim(),
        tax_contact_phone: taxInfo.tax_contact_phone?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Try to update first, if no rows affected, then insert
      const { data: existingData } = await supabase
        .from("business_stripe_tax_info")
        .select("id")
        .eq("business_id", business.id)
        .single();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from("business_stripe_tax_info")
          .update(taxData)
          .eq("business_id", business.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("business_stripe_tax_info")
          .insert(taxData);

        if (error) throw error;
      }

      setTaxInfoSuccess("Tax information saved successfully!");
    } catch (error: any) {
      console.error("Error saving tax info:", error);
      setTaxInfoError(error.message || "Failed to save tax information");
    } finally {
      setTaxInfoSaving(false);
    }
  };

  // Handle tax info form changes
  const handleTaxInfoChange = (field: string, value: string) => {
    setTaxInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Load business documents
  const loadBusinessDocuments = async () => {
    if (!business?.id) return;

    setBusinessDocumentsLoading(true);
    setBusinessDocumentsError("");

    try {
      const { data, error } = await supabase
        .from("business_documents")
        .select(
          `
          id,
          document_type,
          document_name,
          file_url,
          file_size_bytes,
          verification_status,
          verified_at,
          rejection_reason,
          expiry_date,
          created_at
        `,
        )
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setBusinessDocuments(data || []);
    } catch (error: any) {
      console.error("Error loading business documents:", error);
      setBusinessDocumentsError("Failed to load business documents");
    } finally {
      setBusinessDocumentsLoading(false);
    }
  };

  // Load provider services and addons (for regular providers)
  const loadProviderServices = async () => {
    if (!provider?.id || !business?.id) return;

    setProviderServicesLoading(true);
    setProviderServicesError("");

    try {
      console.log("Loading provider services for provider:", provider.id);

      // Load assigned provider services
      const { data: assignedServices, error: servicesError } = await supabase
        .from("provider_services")
        .select(
          `
          *,
          services!inner(
            id,
            name,
            min_price,
            description,
            is_active,
            service_subcategories(
              service_subcategory_type,
              service_categories(service_category_type)
            )
          )
        `,
        )
        .eq("provider_id", provider.id);

      if (servicesError) {
        console.error("Error loading assigned services:", {
          error: servicesError,
          message: servicesError.message,
          details: servicesError.details,
          hint: servicesError.hint,
          code: servicesError.code,
        });
        throw new Error(
          `Failed to load assigned services: ${servicesError.message || JSON.stringify(servicesError)}`,
        );
      }
      console.log("Assigned services loaded:", assignedServices);

      // Load available services that could be assigned (from the services table)
      console.log("Attempting to load available services...");
      const { data: availableServicesData, error: servicesListError } =
        await supabase
          .from("services")
          .select(
            `
          id,
          name,
          min_price,
          description,
          is_active,
          service_subcategories(
            service_subcategory_type,
            service_categories(service_category_type)
          )
        `,
          )
          .eq("is_active", true);

      if (servicesListError) {
        console.error("Error loading available services:", {
          error: servicesListError,
          message: servicesListError.message,
          details: servicesListError.details,
          hint: servicesListError.hint,
          code: servicesListError.code,
        });
        throw new Error(
          `Failed to load available services: ${servicesListError.message || JSON.stringify(servicesListError)}`,
        );
      }
      console.log("Available services loaded:", availableServicesData);

      // Load assigned provider addons (with fallback if table doesn't exist)
      let assignedAddons = [];
      try {
        console.log(
          "Attempting to load assigned addons for provider:",
          provider.id,
        );
        const { data: addonData, error: addonsError } = await supabase
          .from("provider_addons")
          .select(
            `
            id,
            provider_id,
            addon_id,
            is_active,
            created_at,
            service_addons(
              id,
              name,
              description,
              is_active
            )
          `,
          )
          .eq("provider_id", provider.id);

        // If we have addon data, get the business custom prices separately
        if (addonData && addonData.length > 0 && business?.id) {
          const addonIds = addonData.map((addon) => addon.addon_id);
          const { data: businessAddonsData } = await supabase
            .from("business_addons")
            .select("addon_id, custom_price")
            .eq("business_id", business.id)
            .in("addon_id", addonIds);

          // Merge the custom prices into the addon data
          if (businessAddonsData) {
            addonData.forEach((addon) => {
              const businessAddon = businessAddonsData.find(
                (ba) => ba.addon_id === addon.addon_id,
              );
              addon.custom_price = businessAddon?.custom_price || null;
            });
          }
        }

        if (addonsError) {
          console.warn(
            "Could not load assigned addons (table may not exist):",
            addonsError,
          );
        } else {
          assignedAddons = addonData || [];
          console.log("Assigned addons loaded:", assignedAddons);
        }
      } catch (error) {
        console.warn("Provider addons table not available:", error);
      }

      // Load available business addons that could be assigned (with fallback)
      let businessAddons = [];
      try {
        console.log(
          "Attempting to load business addons for business:",
          business.id,
        );
        const { data: bizAddonData, error: businessAddonsError } =
          await supabase
            .from("business_addons")
            .select(
              `
            id,
            addon_id,
            custom_price,
            is_available,
            service_addons(
              id,
              name,
              description,
              is_active
            )
          `,
            )
            .eq("business_id", business.id)
            .eq("is_available", true);

        if (businessAddonsError) {
          console.warn(
            "Could not load business addons (table may not exist):",
            businessAddonsError,
          );
        } else {
          businessAddons = bizAddonData || [];
          console.log("Available business addons loaded:", businessAddons);
        }
      } catch (error) {
        console.warn("Business addons table not available:", error);
      }

      setProviderServices(assignedServices || []);
      setAvailableProviderServices(availableServicesData || []);
      setAssignedProviderAddons(assignedAddons || []);
      setAvailableProviderAddons(businessAddons || []);
    } catch (error: any) {
      console.error("Error loading provider services:", error);
      const errorMessage =
        error?.message ||
        error?.error?.message ||
        JSON.stringify(error) ||
        "Failed to load provider services";
      setProviderServicesError(
        `Failed to load provider services: ${errorMessage}`,
      );
    } finally {
      setProviderServicesLoading(false);
    }
  };

  // Get document status badge color
  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Create Plaid Link Token using actual Plaid API
  const createPlaidLinkToken = async () => {
    if (!business?.id) return;

    setPlaidLoading(true);
    setPlaidError("");

    try {
      // Create link token by calling Plaid's API through our backend
      // The backend will use the secret: b5caf79d242c0fd40a939924c8ef96
      const requestBody = {
        business_id: business.id,
        user_id: user?.id,
        business_name: business.business_name || "Your Business",
      };

      console.log("Sending Plaid request:", requestBody);

      const response = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(
          "Plaid API request failed:",
          response.status,
          response.statusText,
        );

        // Handle 404 specifically - Vercel function not found
        if (response.status === 404) {
          setPlaidError(
            "Plaid integration service is not available. The Vercel function needs to be deployed.",
          );
          return;
        }

        // For other errors, try to read response body once
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            console.error("Plaid API Error Response:", errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (readError) {
          console.error("Could not read error response:", readError);
          // Use the default error message
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.link_token) {
        setPlaidLinkToken(data.link_token);
        setPlaidSuccess(
          "Plaid Link token created successfully! Opening Plaid Link...",
        );

        // Automatically open Plaid Link after a short delay
        setTimeout(async () => {
          try {
            const handler = await createPlaidLinkHandler(data.link_token);
            handler.open();
          } catch (error) {
            console.error("Error auto-opening Plaid Link:", error);
            setPlaidError(
              'Link token created but failed to open Plaid Link. Please try the "Open Plaid Link" button.',
            );
          }
        }, 1000);
      } else {
        throw new Error("No link token received from server");
      }
    } catch (error: any) {
      console.error("Error creating Plaid link token:", error);

      // Handle different error scenarios
      if (
        error.message?.includes("404") ||
        error.message?.includes("not found")
      ) {
        setPlaidError(
          "Plaid integration service is not available yet. The Vercel function needs to be deployed.",
        );
      } else if (
        error.message?.includes("not yet implemented") ||
        error.message?.includes("text/html")
      ) {
        setPlaidError(
          `Plaid credentials configured (Client ID: ${PLAID_CLIENT_ID}). Backend endpoint configuration in progress.`,
        );
      } else {
        setPlaidError(error.message || "Failed to initialize bank connection");
      }
    } finally {
      setPlaidLoading(false);
    }
  };

  // Initialize Plaid Link handler
  const createPlaidLinkHandler = async (linkToken: string) => {
    // Load Plaid Link script if not already loaded
    if (!(window as any).Plaid) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Wait a moment for Plaid to be fully available
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create Plaid Link handler with proper configuration
    const handler = (window as any).Plaid.create({
      token: linkToken,
      receivedRedirectUri: null,
      onLoad: () => {
        console.log("Plaid Link loaded successfully");
        // Ensure the modal has proper focus
        setTimeout(() => {
          const plaidModal = document.querySelector("[data-plaid-link-modal]");
          if (plaidModal) {
            (plaidModal as HTMLElement).focus();
          }
        }, 500);
      },
      onSuccess: (public_token: string, metadata: any) => {
        console.log("Plaid Success:", { public_token, metadata });
        handlePlaidSuccess(public_token, metadata);
      },
      onExit: (err: any, metadata: any) => {
        if (err != null) {
          console.error("Plaid Exit Error:", err);
          setPlaidError(err.display_message || "Connection cancelled");
        } else {
          console.log("User exited Plaid Link");
        }
        setPlaidLoading(false);
      },
      onEvent: (eventName: string, metadata: any) => {
        console.log("Plaid Event:", eventName, metadata);

        // Handle specific events that might indicate interaction issues
        if (eventName === "OPEN") {
          console.log("Plaid Link opened - ensuring proper focus");
          setTimeout(() => {
            // Try to focus the first input field
            const firstInput = document.querySelector(
              'input[type="text"], input[type="search"]',
            );
            if (firstInput) {
              (firstInput as HTMLElement).focus();
            }
          }, 1000);
        }
      },
    });

    return handler;
  };

  // Open Plaid Link to connect bank account
  const openPlaidLink = async () => {
    if (!plaidLinkToken) {
      setPlaidError(
        "No link token available. Please try creating a new connection.",
      );
      return;
    }

    setPlaidLoading(true);
    setPlaidError("");

    try {
      const handler = await createPlaidLinkHandler(plaidLinkToken);

      // Ensure the document has focus before opening
      if (document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }

      // Wait a moment then open
      setTimeout(() => {
        handler.open();
        setPlaidLoading(false);
      }, 200);
    } catch (error) {
      console.error("Error opening Plaid Link:", error);
      setPlaidError("Failed to load Plaid Link. Please try again.");
      setPlaidLoading(false);
    }
  };

  // Handle Plaid Link Success
  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    setPlaidLoading(true);
    setPlaidError("");

    try {
      // Exchange public token for access token and get account details
      const response = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          public_token: publicToken,
          business_id: business.id,
          account_id: metadata.account_id,
          institution: metadata.institution,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect bank account");
      }

      const data = await response.json();

      if (data.success) {
        // Update payout info with connected bank account
        const connectedAccount = data.accounts?.find(
          (acc: any) => acc.account_id === metadata.account_id,
        );

        setPayoutInfo({
          bank_connected: true,
          bank_name: metadata.institution?.name || "Connected Bank",
          account_last4: connectedAccount?.mask || "****",
          payout_schedule: "Daily",
          transfer_speed: "Standard (2-3 days)",
          stripe_account_id: null, // Would be set by Stripe integration
          payout_enabled: true,
        });

        setPlaidSuccess("Bank account connected successfully!");

        // Close the modal after a short delay
        setTimeout(() => {
          setPayoutManagementModal(false);
        }, 2000);
      } else {
        throw new Error("Failed to process bank account connection");
      }
    } catch (error: any) {
      console.error("Error connecting bank account:", error);
      setPlaidError(error.message || "Failed to connect bank account");
    } finally {
      setPlaidLoading(false);
    }
  };

  // Load current payout info
  const loadPayoutInfo = async () => {
    if (!business?.id) return;

    setPayoutInfoLoading(true);
    setPayoutInfoError("");

    try {
      // For now, we'll mock the payout info since the backend API endpoints don't exist yet
      // In production, this would call your actual API endpoint

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock payout info data - replace with actual API call when backend is ready
      const mockPayoutInfo = {
        bank_connected: false, // Set to true to test connected state
        bank_name: null,
        account_last4: null,
        payout_schedule: "Daily",
        transfer_speed: "Standard (2-3 days)",
        stripe_account_id: null,
        payout_enabled: false,
      };

      setPayoutInfo(mockPayoutInfo);

      // TODO: Uncomment and modify when backend API is ready
      /*
      const response = await fetch(`/api/stripe/payout-info/${business.id}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Payout API endpoint not yet implemented');
        }
        throw new Error('Failed to load payout information');
      }

      const data = await response.json();
      setPayoutInfo(data);
      */
    } catch (error: any) {
      console.error("Error loading payout info:", error);
      // Don't show error for missing API endpoints during development
      if (
        error.message?.includes("not yet implemented") ||
        error.message?.includes("Unexpected token")
      ) {
        console.log(
          "Payout API endpoints not yet implemented - using mock data",
        );
        setPayoutInfo({
          bank_connected: false,
          bank_name: null,
          account_last4: null,
          payout_schedule: "Daily",
          transfer_speed: "Standard (2-3 days)",
          stripe_account_id: null,
          payout_enabled: false,
        });
      } else {
        setPayoutInfoError(
          error.message || "Failed to load payout information",
        );
      }
    } finally {
      setPayoutInfoLoading(false);
    }
  };

  // Handle manage payout button click
  const handleManagePayout = () => {
    setPayoutManagementModal(true);
    setPlaidError("");
    setPlaidSuccess("");
  };

  // Disconnect bank account
  const handleDisconnectBankAccount = async () => {
    if (!business?.id) return;

    setStripeConnectLoading(true);
    setPlaidError("");

    try {
      // For development, simulate disconnection since backend API doesn't exist yet
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update mock data to show disconnected state
      setPayoutInfo({
        bank_connected: false,
        bank_name: null,
        account_last4: null,
        payout_schedule: "Daily",
        transfer_speed: "Standard (2-3 days)",
        stripe_account_id: null,
        payout_enabled: false,
      });

      setPlaidSuccess(
        "Bank account disconnected successfully! (Development mode)",
      );

      // TODO: Uncomment when backend API is ready
      /*
      const response = await fetch('/api/stripe/disconnect-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          business_id: business.id
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Stripe disconnect API endpoint not yet implemented');
        }
        throw new Error('Failed to disconnect bank account');
      }

      setPlaidSuccess('Bank account disconnected successfully!');
      loadPayoutInfo();
      */
    } catch (error: any) {
      console.error("Error disconnecting bank account:", error);
      setPlaidError(error.message || "Failed to disconnect bank account");
    } finally {
      setStripeConnectLoading(false);
    }
  };

  // Helper functions to filter bookings by date and status
  const filterBookingsByDate = (
    bookings: any[],
    filterType: "all" | "present" | "future" | "past",
  ) => {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date);
      const status = booking.booking_status?.toLowerCase();

      switch (filterType) {
        case "all":
          // All = show all bookings regardless of date or status
          return true;
        case "present":
          // Present = all bookings with date of today OR in the past with status NOT cancelled or completed
          if (bookingDate >= startOfToday && bookingDate <= endOfToday) {
            // Today's bookings regardless of status
            return true;
          } else if (bookingDate < startOfToday) {
            // Past bookings that are NOT cancelled or completed
            return status !== "cancelled" && status !== "completed";
          }
          return false;
        case "future":
          // Future = all bookings with date of tomorrow and beyond (today's date +1)
          return bookingDate > endOfToday;
        case "past":
          // Past = bookings before today that are completed or cancelled
          return (
            bookingDate < startOfToday &&
            (status === "completed" || status === "cancelled")
          );
        default:
          return true;
      }
    });
  };

  const getFilteredBookings = (applyDateFilter = true) => {
    let filtered = bookings;

    // Apply date filtering only if requested (for tab view, we'll apply it separately)
    if (applyDateFilter) {
      filtered = filterBookingsByDate(
        bookings,
        activeBookingTab as "all" | "present" | "future" | "past",
      );
    }

    // For owners/dispatchers, filter by location and provider
    if ((isOwner || isDispatcher) && selectedProviderFilter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.provider_id === selectedProviderFilter,
      );
    }

    // Filter by booking status
    if (selectedStatusFilter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.booking_status === selectedStatusFilter,
      );
    }

    // Debug logs removed to prevent render loop spam

    // Filter by search query (booking reference and customer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      // Search filter applied
      const beforeSearchCount = filtered.length;
      filtered = filtered.filter((booking) => {
        // Search in booking reference
        const bookingRef = booking.booking_reference?.toLowerCase() || "";

        // Search in customer name (handle both customer_profiles and guest_name)
        const customerName =
          booking.customer_profiles?.first_name &&
          booking.customer_profiles?.last_name
            ? `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`.toLowerCase()
            : (booking.guest_name || "").toLowerCase();

        // Search in customer email
        const customerEmail =
          booking.customer_profiles?.email?.toLowerCase() || "";

        return (
          bookingRef.includes(query) ||
          customerName.includes(query) ||
          customerEmail.includes(query)
        );
      });
      // Search filter completed
    }

    // Filtering completed
    return filtered;
  };

  // Get bookings for selected date
  const getSelectedDateBookings = () => {
    if (!selectedDate) return [];

    const selectedDateStr = selectedDate.toISOString().split("T")[0];
    let filtered = bookings.filter((booking) => {
      const bookingDate = new Date(booking.booking_date)
        .toISOString()
        .split("T")[0];
      return bookingDate === selectedDateStr;
    });

    // Apply search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((booking) => {
        // Search in booking reference
        const bookingRef = booking.booking_reference?.toLowerCase() || "";

        // Search in customer name (handle both customer_profiles and guest_name)
        const customerName =
          booking.customer_profiles?.first_name &&
          booking.customer_profiles?.last_name
            ? `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`.toLowerCase()
            : (booking.guest_name || "").toLowerCase();

        // Search in customer email
        const customerEmail =
          booking.customer_profiles?.email?.toLowerCase() || "";

        return (
          bookingRef.includes(query) ||
          customerName.includes(query) ||
          customerEmail.includes(query)
        );
      });
    }

    return filtered.sort((a, b) => {
      // Sort by start time
      return a.start_time.localeCompare(b.start_time);
    });
  };

  // Accept booking function
  const acceptBooking = async (bookingId: string) => {
    console.log("Accept booking called with ID:", bookingId);
    console.log("Current user:", user);
    console.log("User type:", { isOwner, isDispatcher, isProvider });

    // Find the booking to check if it has a provider assigned
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      toast({
        title: "Error",
        description: "Booking not found.",
        variant: "destructive",
      });
      return;
    }

    // Check if booking has a provider assigned
    if (!booking.provider_id) {
      toast({
        title: "Provider Required",
        description:
          "A provider must be assigned before confirming this booking.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Attempting to update booking status to confirmed...");
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_status: "confirmed",
        })
        .eq("id", bookingId);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, booking_status: "confirmed" }
            : booking,
        ),
      );

      toast({
        title: "Booking Accepted",
        description: "The booking has been confirmed successfully.",
      });
    } catch (error: any) {
      console.error("Error accepting booking - Full error object:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));

      let errorMessage = "Unknown error occurred";

      if (error) {
        // Handle different error object structures
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        } else if (error.code) {
          errorMessage = `Database error (${error.code})`;
        } else {
          // Try to stringify the error object
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = "Unable to parse error details";
          }
        }
      }

      console.error("Parsed error message:", errorMessage);

      toast({
        title: "Error Accepting Booking",
        description: `Failed to accept booking: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Open decline modal function
  const openDeclineModal = (booking: any) => {
    setSelectedBookingForDecline(booking);
    setDeclineReason("");
    setShowDeclineModal(true);
  };

  // Decline booking function with reason
  const declineBookingWithReason = async () => {
    if (!selectedBookingForDecline || !declineReason.trim()) {
      toast({
        title: "Decline Reason Required",
        description: "Please provide a reason for declining this booking.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_status: "declined",
          decline_reason: declineReason.trim(),
        })
        .eq("id", selectedBookingForDecline.id);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBookingForDecline.id
            ? {
                ...booking,
                booking_status: "declined",
                decline_reason: declineReason.trim(),
              }
            : booking,
        ),
      );

      // Close modal and reset state
      setShowDeclineModal(false);
      setSelectedBookingForDecline(null);
      setDeclineReason("");

      toast({
        title: "Booking Declined",
        description:
          "The booking has been declined with reason provided to customer.",
      });
    } catch (error: any) {
      console.error("Error declining booking - Full error object:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));

      let errorMessage = "Unknown error occurred";

      if (error) {
        // Handle different error object structures
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        } else if (error.code) {
          errorMessage = `Database error (${error.code})`;
        } else {
          // Try to stringify the error object
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = "Unable to parse error details";
          }
        }
      }

      console.error("Parsed error message:", errorMessage);

      toast({
        title: "Error Declining Booking",
        description: `Failed to decline booking: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Complete booking function
  const completeBooking = async (bookingId: string) => {
    console.log("Complete booking called with ID:", bookingId);

    // Find the booking to check if it has a provider assigned
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      toast({
        title: "Error",
        description: "Booking not found.",
        variant: "destructive",
      });
      return;
    }

    // Check if booking has a provider assigned
    if (!booking.provider_id) {
      toast({
        title: "Provider Required",
        description:
          "A provider must be assigned before completing this booking.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Attempting to update booking status to completed...");
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_status: "completed",
        })
        .eq("id", bookingId);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, booking_status: "completed" }
            : booking,
        ),
      );

      toast({
        title: "Booking Completed",
        description: "The booking has been marked as completed successfully.",
      });
    } catch (error: any) {
      console.error("Error completing booking:", error);

      let errorMessage = "Unknown error occurred";

      if (error) {
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        } else if (error.code) {
          errorMessage = `Database error (${error.code})`;
        } else {
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = "Unable to parse error details";
          }
        }
      }

      toast({
        title: "Error Completing Booking",
        description: `Failed to complete booking: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Assign provider to booking function
  const assignProvider = async (
    bookingId: string,
    providerId: string | null,
  ) => {
    console.log(
      "Assign provider called with booking ID:",
      bookingId,
      "provider ID:",
      providerId,
    );

    // Find the booking to check its current status
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      toast({
        title: "Error",
        description: "Booking not found.",
        variant: "destructive",
      });
      return;
    }

    // Prevent provider changes for bookings that are not pending or confirmed
    if (
      booking.booking_status !== "pending" &&
      booking.booking_status !== "confirmed"
    ) {
      toast({
        title: "Cannot Modify Provider",
        description: `Provider assignment cannot be changed for bookings with status: ${booking.booking_status}`,
        variant: "destructive",
      });
      return;
    }

    // Prevent unassigning provider from confirmed bookings
    if (!providerId && booking.booking_status === "confirmed") {
      toast({
        title: "Cannot Unassign Provider",
        description:
          "Cannot remove provider from a confirmed booking. Change status to pending first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          provider_id: providerId,
        })
        .eq("id", bookingId);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings((prev) =>
        prev.map((booking) => {
          if (booking.id === bookingId) {
            if (providerId) {
              // Find the provider data from allProviders
              const assignedProvider = allProviders.find(
                (p) => p.id === providerId,
              );
              return {
                ...booking,
                provider_id: providerId,
                providers: assignedProvider
                  ? {
                      first_name: assignedProvider.first_name,
                      last_name: assignedProvider.last_name,
                      id: assignedProvider.id,
                    }
                  : null,
              };
            } else {
              // Unassigning provider
              return {
                ...booking,
                provider_id: null,
                providers: null,
              };
            }
          }
          return booking;
        }),
      );

      toast({
        title: providerId ? "Provider Assigned" : "Provider Unassigned",
        description: providerId
          ? "The provider has been assigned to this booking successfully."
          : "The provider has been unassigned from this booking.",
      });
    } catch (error: any) {
      console.error("Error assigning provider:", error);

      let errorMessage = "Unknown error occurred";

      if (error) {
        if (typeof error === "string") {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.error_description) {
          errorMessage = error.error_description;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        } else if (error.code) {
          errorMessage = `Database error (${error.code})`;
        } else {
          try {
            errorMessage = JSON.stringify(error);
          } catch {
            errorMessage = "Unable to parse error details";
          }
        }
      }

      toast({
        title: "Error Updating Provider Assignment",
        description: `Failed to update provider assignment: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  // Load all providers for owners/dispatchers
  const loadAllProviders = async () => {
    if (!isOwner && !isDispatcher) {
      console.log("Not loading providers - user is not owner or dispatcher");
      return;
    }

    if (!provider?.business_id) {
      console.log(
        "Not loading providers - no provider or business_id available",
      );
      return;
    }

    console.log("Loading providers for owner/dispatcher...");
    console.log("Current provider business_id:", provider.business_id);

    try {
      // First, load providers without location join
      const { data: providers, error } = await supabase
        .from("providers")
        .select(
          `
          id,
          first_name,
          last_name,
          provider_role,
          location_id,
          is_active
        `,
        )
        .eq("business_id", provider.business_id)
        .eq("provider_role", "provider")
        .eq("is_active", true);

      if (error) {
        console.error(
          "Error loading providers:",
          JSON.stringify(error, null, 2),
        );
        console.error(
          "Error details:",
          error.message || error.details || error,
        );
        return;
      }

      // If providers loaded successfully, try to enrich with location data
      let enrichedProviders = providers || [];

      if (providers && providers.length > 0) {
        // Get unique location IDs
        const locationIds = [
          ...new Set(providers.map((p) => p.location_id).filter(Boolean)),
        ];

        if (locationIds.length > 0) {
          // Load location data separately
          const { data: locationData, error: locationError } = await supabase
            .from("business_locations")
            .select("id, name, address_line1")
            .in("id", locationIds);

          if (!locationError && locationData) {
            // Merge location data with providers
            enrichedProviders = providers.map((provider) => ({
              ...provider,
              business_locations:
                locationData.find((loc) => loc.id === provider.location_id) ||
                null,
            }));
          } else {
            console.warn("Could not load location data:", locationError);
            // Use providers without location data
            enrichedProviders = providers;
          }
        }
      }

      console.log("Loaded providers:", enrichedProviders?.length || 0);
      setAllProviders(enrichedProviders || []);
      filterProvidersByLocation(
        enrichedProviders || [],
        selectedLocationFilter,
      );
    } catch (error) {
      console.error(
        "Error loading providers (catch):",
        JSON.stringify(error, null, 2),
      );
      console.error(
        "Error details (catch):",
        error instanceof Error ? error.message : error,
      );
    }
  };

  // Filter providers by selected location
  const filterProvidersByLocation = (providers: any[], locationId: string) => {
    let filtered;
    if (locationId === "all") {
      filtered = providers;
    } else {
      filtered = providers.filter(
        (provider) => provider.location_id === locationId,
      );
    }

    setFilteredProviders(filtered);

    // Reset provider selection if current selection is not available in filtered list
    if (selectedProviderFilter !== "all") {
      const isProviderInFiltered = filtered.some(
        (p) => p.id === selectedProviderFilter,
      );
      if (!isProviderInFiltered) {
        setSelectedProviderFilter("all");
      }
    }
  };

  // Handle location filter change
  const handleLocationFilterChange = (locationId: string) => {
    setSelectedLocationFilter(locationId);
    filterProvidersByLocation(allProviders, locationId);
  };

  // Load bookings for all providers (for owners/dispatchers)
  const loadAllBookings = async () => {
    if (!isOwner && !isDispatcher) return;
    if (!provider?.business_id) {
      console.log("loadAllBookings: No business_id available");
      return;
    }

    console.log("Loading bookings for business_id:", provider.business_id);

    try {
      // Simple approach: just get bookings assigned to providers from this business
      const { data: businessProviders, error: providersError } = await supabase
        .from("providers")
        .select("id")
        .eq("business_id", provider.business_id);

      if (providersError) {
        console.error("Error loading business providers:", providersError);
        setBookings([]);
        return;
      }

      if (!businessProviders || businessProviders.length === 0) {
        console.log("No providers found for business");
        setBookings([]);
        return;
      }

      const providerIds = businessProviders.map((p) => p.id);

      // Get all bookings for this business (assigned and unassigned)
      const { data: allBookings, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          services (
            id,
            name,
            min_price
          ),
          customer_profiles (
            id,
            first_name,
            last_name,
            email,
            image_url
          ),
          providers (
            id,
            first_name,
            last_name,
            location_id
          ),
          customer_locations (
            id,
            location_name,
            street_address,
            unit_number,
            city,
            state,
            zip_code,
            access_instructions
          ),
          business_locations (
            id,
            location_name,
            address_line1,
            address_line2,
            city,
            state,
            postal_code
          )
        `,
        )
        .or(`provider_id.in.(${providerIds.join(",")}),provider_id.is.null`)
        .order("booking_date", { ascending: false })
        .limit(50);

      if (error) {
        console.error(
          "Error loading all bookings:",
          JSON.stringify(error, null, 2),
        );
        console.error(
          "Booking error details:",
          error.message || error.details || error,
        );
        setBookings([]);
      } else {
        console.log("Loaded all bookings:", allBookings?.length || 0);
        setBookings(allBookings || []);
      }
    } catch (error) {
      console.error(
        "Error loading all bookings (catch):",
        JSON.stringify(error, null, 2),
      );
      console.error(
        "Booking error details (catch):",
        error instanceof Error ? error.message : error,
      );
    }
  };

  const loadServiceCategoriesAndSubcategories = async () => {
    setCategoriesLoading(true);
    try {
      // Load service categories
      const { data: categories, error: categoriesError } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (categoriesError) {
        console.error("Error loading service categories:", categoriesError);
      } else {
        setServiceCategories(categories || []);
      }

      // Load service subcategories with category info
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from("service_subcategories")
        .select(
          `
          *,
          category:service_categories(*)
        `,
        )
        .eq("is_active", true);

      if (subcategoriesError) {
        console.error(
          "Error loading service subcategories:",
          subcategoriesError,
        );
      } else {
        setServiceSubcategories(subcategories || []);
      }
    } catch (error) {
      console.error("Error loading categories and subcategories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      loadServiceCategoriesAndSubcategories();
    }
  }, [user]);

  // Load providers and bookings when provider context is available
  useEffect(() => {
    if (provider && (isOwner || isDispatcher)) {
      console.log(
        "Provider context available, loading providers and bookings...",
      );
      loadAllProviders();
      loadAllBookings();
    }
  }, [provider, isOwner, isDispatcher]);

  // Update filtered providers when location selection changes
  useEffect(() => {
    if ((isOwner || isDispatcher) && allProviders.length > 0) {
      filterProvidersByLocation(allProviders, selectedLocationFilter);
    }
  }, [selectedLocationFilter, allProviders, isOwner, isDispatcher]);

  // Fetch locations when provider is available and locations tab is active
  useEffect(() => {
    if (
      provider &&
      activeTab === "locations" &&
      locations.length === 0 &&
      !locationsLoading
    ) {
      console.log("Auto-fetching locations for active tab");
      fetchLocations();
    }
  }, [provider, activeTab]);

  // Fetch team providers when user is available and providers tab is active
  useEffect(() => {
    if (
      user &&
      activeTab === "providers" &&
      teamProviders.length === 0 &&
      !providersLoading
    ) {
      console.log("Auto-fetching team providers for active tab");
      fetchTeamProviders();
    }
  }, [user, activeTab]);

  // Fetch provider add-ons when user is available and add-ons tab is active
  useEffect(() => {
    if (
      user &&
      activeTab === "addons" &&
      availableAddons.length === 0 &&
      !addonsLoading
    ) {
      console.log("Auto-fetching provider add-ons for active tab");
      fetchProviderAddons();
    }
  }, [user, activeTab]);

  // Fetch business services and add-ons when user is available and services-addons tab is active
  useEffect(() => {
    if (
      user?.business_id &&
      activeTab === "services-addons" &&
      allServices.length === 0 &&
      !businessServicesLoading &&
      !businessServicesError.includes("session has expired")
    ) {
      console.log("Auto-fetching business services and add-ons for active tab");
      fetchBusinessServicesAndAddons();
    }
  }, [user, activeTab, businessServicesError]);

  // Load tax info when financial tab is active
  useEffect(() => {
    if (
      business?.id &&
      activeTab === "financial" &&
      !taxInfoLoading &&
      (isOwner || isDispatcher)
    ) {
      loadTaxInfo();
    }
  }, [business, activeTab]);

  // Load payout info when financial tab is active
  useEffect(() => {
    if (
      business?.id &&
      activeTab === "financial" &&
      !payoutInfoLoading &&
      (isOwner || isDispatcher)
    ) {
      loadPayoutInfo();
    }
  }, [business, activeTab]);

  // Load business documents when business tab is active
  useEffect(() => {
    if (
      business?.id &&
      activeTab === "business" &&
      !businessDocumentsLoading &&
      (isOwner || isDispatcher)
    ) {
      loadBusinessDocuments();
    }
  }, [business, activeTab]);

  // Load subscription data when subscription tab is active
  useEffect(() => {
    if (
      user?.business_id &&
      isOwner &&
      (document.querySelector('[data-state="active"][value="subscription"]') ||
        window.location.hash === "#subscription")
    ) {
      loadCurrentSubscription();
    }
  }, [user?.business_id, isOwner]);

  // Load provider services when provider-services tab is active
  useEffect(() => {
    if (
      user?.id &&
      business?.id &&
      activeTab === "provider-services" &&
      !providerServicesLoading &&
      isProvider &&
      !isOwner &&
      !isDispatcher
    ) {
      loadProviderServices();
    }
  }, [user, business, activeTab]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // First fetch provider details using auth.user.id -> providers.user_id relationship
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*, business_id")
        .eq("user_id", user.id)
        .single();

      if (providerError || !providerData) {
        setError("Provider account not found. Please contact support.");
        return;
      }

      setProvider(providerData);

      // Initialize form data
      setFormData({
        firstName: providerData.first_name || "",
        lastName: providerData.last_name || "",
        email: providerData.email || "",
        phone: providerData.phone || "",
        bio: providerData.bio || "",
        dateOfBirth: providerData.date_of_birth || "",
        experienceYears: providerData.experience_years?.toString() || "",
      });

      // Initialize notification settings
      setNotificationSettings({
        notification_email: providerData.notification_email || "",
        notification_phone: providerData.notification_phone || "",
      });

      // Fetch business details using providers.business_id -> businesses.id (if business_id exists)
      let businessData = null;
      let businessError = null;

      if (providerData.business_id) {
        const result = await supabase
          .from("business_profiles")
          .select("*")
          .eq("id", providerData.business_id)
          .single();
        businessData = result.data;
        businessError = result.error;
      }

      if (businessData) {
        setBusiness(businessData);

        // Initialize business details form
        setBusinessDetailsForm({
          business_name: businessData.business_name || "",
          business_type: businessData.business_type || "",
          contact_email: businessData.contact_email || "",
          phone: businessData.phone || "",
          website_url: businessData.website_url || "",
          logo_url: businessData.logo_url || "",
          verification_status: businessData.verification_status || "",
          verification_notes: businessData.verification_notes || "",
          is_active: businessData.is_active !== false,
          is_featured: businessData.is_featured || false,
          setup_completed: businessData.setup_completed || false,
          service_categories: businessData.service_categories || [],
          service_subcategories: businessData.service_subcategories || [],
        });

        // Parse and set business hours if available
        if (businessData.business_hours) {
          setBusinessHours(businessData.business_hours);

          // Initialize business hours form
          const initialHoursForm = {
            Monday: { isOpen: false, open: "09:00", close: "17:00" },
            Tuesday: { isOpen: false, open: "09:00", close: "17:00" },
            Wednesday: { isOpen: false, open: "09:00", close: "17:00" },
            Thursday: { isOpen: false, open: "09:00", close: "17:00" },
            Friday: { isOpen: false, open: "09:00", close: "17:00" },
            Saturday: { isOpen: false, open: "09:00", close: "17:00" },
            Sunday: { isOpen: false, open: "09:00", close: "17:00" },
          };

          // Populate with existing data
          Object.keys(initialHoursForm).forEach((day) => {
            if (businessData.business_hours[day]) {
              initialHoursForm[day] = {
                isOpen: true,
                open: businessData.business_hours[day].open || "09:00",
                close: businessData.business_hours[day].close || "17:00",
              };
            }
          });

          setBusinessHoursForm(initialHoursForm);
        }

        // Fetch recent business activity (only if business_id exists)
        if (providerData.business_id) {
          try {
            const activityPromises = [
              // Recent locations
              supabase
                .from("business_locations")
                .select("location_name, created_at")
                .eq("business_id", providerData.business_id)
                .order("created_at", { ascending: false })
                .limit(2),

              // Recent team members
              supabase
                .from("providers")
                .select("first_name, last_name, created_at")
                .eq("business_id", providerData.business_id)
                .order("created_at", { ascending: false })
                .limit(2),
            ];

            const [locationsActivity, teamActivity] =
              await Promise.all(activityPromises);

            const activities = [];

            // Add location activities
            if (locationsActivity.data) {
              locationsActivity.data.forEach((location) => {
                activities.push({
                  action: "New location added",
                  details: location.location_name || "Business location",
                  time: formatTimeAgo(location.created_at),
                  icon: MapPin,
                });
              });
            }

            // Add team member activities
            if (teamActivity.data) {
              teamActivity.data.forEach((member) => {
                activities.push({
                  action: "Team member added",
                  details: `${member.first_name} ${member.last_name} joined as Provider`,
                  time: formatTimeAgo(member.created_at),
                  icon: Users,
                });
              });
            }

            // Sort by most recent and limit to 4
            setRecentActivity(activities.slice(0, 4));
          } catch (activityError) {
            console.error("Error fetching recent activity:", activityError);
          }
        }

        // Fetch business services using providerData directly (since setProvider is async)
        if (providerData && providerData.business_id) {
          console.log(
            "fetchDashboardData: Fetching business services for business_id:",
            providerData.business_id,
          );

          try {
            setServicesLoading(true);
            setServicesError("");

            const { data: servicesData, error: servicesError } = await supabase
              .from("business_services")
              .select(
                `
                *,
                services (
                  id,
                  name,
                  description,
                  min_price,
                  duration_minutes,
                  subcategory_id,
                  service_subcategories (
                    id,
                    service_subcategory_type,
                    description,
                    category_id,
                    service_categories (
                      id,
                      service_category_type,
                      description
                    )
                  )
                )
              `,
              )
              .eq("business_id", providerData.business_id)
              .order("created_at", { ascending: false });

            console.log("fetchDashboardData: business_services query result:", {
              servicesData,
              servicesError,
            });

            if (servicesError) {
              console.error(
                "fetchDashboardData: Error fetching business services:",
                JSON.stringify(servicesError, null, 2),
              );
              setServicesError(
                `Failed to load services: ${servicesError.message || servicesError.details || JSON.stringify(servicesError)}`,
              );
              setBusinessServices([]);
            } else {
              const servicesWithBookings = (servicesData || []).map(
                (businessService) => ({
                  ...businessService,
                  booking_count: 0, // Placeholder for now
                }),
              );
              console.log(
                "fetchDashboardData: Setting business services:",
                servicesWithBookings,
              );
              setBusinessServices(servicesWithBookings);
            }

            // Also fetch addons
            const { data: addonsData, error: addonsError } = await supabase
              .from("business_addons")
              .select(
                `
                *,
                service_addons (
                  id,
                  name,
                  description,
                  addon_type,
                  default_price
                )
              `,
              )
              .eq("business_id", providerData.business_id)
              .eq("is_available", true);

            console.log("fetchDashboardData: business_addons query result:", {
              addonsData,
              addonsError,
            });
            setBusinessAddons(addonsData || []);
          } catch (error: any) {
            console.error(
              "fetchDashboardData: Error in services fetch:",
              error,
            );
            setServicesError(`Failed to load services: ${error.message}`);
            setBusinessServices([]);
            setBusinessAddons([]);
          } finally {
            setServicesLoading(false);
          }
        } else {
          console.warn(
            "fetchDashboardData: No business_id found in provider data",
          );
          setServicesError("No business ID found for this provider");
        }

        // Fetch business metrics using correct business_id from provider (only if business_id exists)
        if (providerData.business_id) {
          const [locationsResult, teamResult, servicesResult] =
            await Promise.all([
              // Count active business locations
              supabase
                .from("business_locations")
                .select("id", { count: "exact" })
                .eq("business_id", providerData.business_id)
                .eq("is_active", true),

              // Count team members (providers) for this business
              supabase
                .from("providers")
                .select("id", { count: "exact" })
                .eq("business_id", providerData.business_id)
                .eq("is_active", true),

              // Count services offered by providers in this business
              supabase
                .from("provider_services")
                .select("service_id", { count: "exact" })
                .in(
                  "provider_id",
                  (
                    await supabase
                      .from("providers")
                      .select("id")
                      .eq("business_id", providerData.business_id)
                      .eq("is_active", true)
                  ).data?.map((p) => p.id) || [],
                )
                .eq("is_active", true),
            ]);

          setBusinessMetrics({
            activeLocations: locationsResult.count || 0,
            teamMembers: teamResult.count || 0,
            servicesOffered: servicesResult.count || 0,
          });
        } else {
          // Set default metrics for providers without business_id
          setBusinessMetrics({
            activeLocations: 0,
            teamMembers: 1, // At least the current provider
            servicesOffered: 0,
          });
        }
      }

      // Fetch bookings based on role
      let bookingsData = [];
      let bookingsError = null;

      if (isProvider && !isOwner && !isDispatcher) {
        // Provider can only see their own bookings
        const result = await supabase
          .from("bookings")
          .select(
            `
          *,
          providers!inner(first_name, last_name),
          services(name, description),
          customer_profiles!inner(
            id,
            first_name,
            last_name,
            phone,
            email,
            image_url
          ),
          customer_locations(
            id,
            location_name,
            street_address,
            unit_number,
            city,
            state,
            zip_code,
            access_instructions
          ),
          business_locations(
            id,
            location_name,
            address_line1,
            address_line2,
            city,
            state,
            postal_code
          )
        `,
          )
          .eq("provider_id", providerData.id)
          .order("created_at", { ascending: false })
          .limit(10);

        bookingsData = result.data;
        bookingsError = result.error;
      } else if (providerData.business_id) {
        // Owner/Dispatcher can see all business bookings (only if business_id exists)
        // First fetch all provider IDs for this business
        const { data: businessProviders, error: providersError } =
          await supabase
            .from("providers")
            .select("id")
            .eq("business_id", providerData.business_id);

        if (providersError) {
          setError("Failed to fetch business providers.");
          return;
        }

        if (businessProviders && businessProviders.length > 0) {
          const providerIds = businessProviders.map((p) => p.id);

          // Get bookings assigned to business providers
          const assignedResult = await supabase
            .from("bookings")
            .select(
              `
              *,
              providers(first_name, last_name),
              services(name, description),
              customer_profiles!inner(
                id,
                first_name,
                last_name,
                phone,
                email,
                image_url
              ),
              customer_locations(
                id,
                location_name,
                street_address,
                unit_number,
                city,
                state,
                zip_code,
                access_instructions
              ),
              business_locations(
                id,
                location_name,
                address_line1,
                address_line2,
                city,
                state,
                postal_code
              )
            `,
            )
            .in("provider_id", providerIds)
            .order("created_at", { ascending: false })
            .limit(5);

          // Get unassigned bookings for business services
          const { data: businessServices, error: businessServicesError } =
            await supabase
              .from("business_services")
              .select("service_id")
              .eq("business_id", providerData.business_id);

          let unassignedBookingsData = [];
          if (
            !businessServicesError &&
            businessServices &&
            businessServices.length > 0
          ) {
            const businessServiceIds = businessServices.map(
              (bs) => bs.service_id,
            );

            const unassignedResult = await supabase
              .from("bookings")
              .select(
                `
                *,
                providers(first_name, last_name),
                services(name, description),
                customer_profiles!inner(
                  id,
                  first_name,
                  last_name,
                  phone,
                  email,
                  image_url
                ),
                customer_locations(
                  id,
                  location_name,
                  street_address,
                  unit_number,
                  city,
                  state,
                  zip_code,
                  access_instructions
                ),
                business_locations(
                  id,
                  location_name,
                  address_line1,
                  address_line2,
                  city,
                  state,
                  postal_code
                )
              `,
              )
              .is("provider_id", null)
              .in("service_id", businessServiceIds)
              .order("created_at", { ascending: false })
              .limit(5);

            if (!unassignedResult.error && unassignedResult.data) {
              unassignedBookingsData = unassignedResult.data;
            }
          }

          // Combine and deduplicate bookings
          const combinedBookings = [
            ...(assignedResult.data || []),
            ...unassignedBookingsData,
          ];
          const bookingIds = new Set();
          const dedupedBookings = combinedBookings.filter((booking) => {
            if (bookingIds.has(booking.id)) {
              return false;
            }
            bookingIds.add(booking.id);
            return true;
          });

          // Sort combined results
          dedupedBookings.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );

          bookingsData = dedupedBookings;
          bookingsError = assignedResult.error;
        }
      } else {
        // Provider has no business_id - show empty bookings
        bookingsData = [];
        bookingsError = null;
      }

      if (bookingsData) {
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("An error occurred while loading dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/provider-portal");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-foreground/70 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/provider-portal">Back to Login</Link>
            </Button>
            <Button asChild>
              <Link to="/support">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Return null if no user or provider data
  if (!user || !provider) {
    return null;
  }

  const stats = {
    monthlyEarnings: 3250,
    completedBookings: 47,
    avgRating: 4.9,
    responseRate: 98,
  };

  const recentBookings = [
    {
      id: "B001",
      service: "Deep Tissue Massage",
      customer: "Sarah M.",
      date: "2024-01-15",
      time: "2:00 PM",
      status: "confirmed",
      price: 120,
      deliveryType: "mobile",
      location: "Miami, FL",
    },
    {
      id: "B002",
      service: "Couples Massage",
      customer: "John & Lisa D.",
      date: "2024-01-16",
      time: "6:00 PM",
      status: "pending",
      price: 240,
      deliveryType: "mobile",
      location: "Coral Gables, FL",
    },
    {
      id: "B003",
      service: "Sports Massage",
      customer: "Mike R.",
      date: "2024-01-17",
      time: "10:00 AM",
      status: "completed",
      price: 100,
      deliveryType: "business",
      location: "Your Studio",
    },
  ];

  // Remove hardcoded services - now using businessServices from state

  const getStatusBadge = (status: string) => {
    const configs = {
      confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getDeliveryIcon = (type: string) => {
    const icons = {
      mobile: Smartphone,
      business: Building,
      virtual: Video,
    };
    return icons[type as keyof typeof icons] || Smartphone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                    alt="ROAM Logo"
                    className="w-24 h-24 object-contain"
                  />
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-roam-light-blue/20 text-roam-blue"
              >
                Provider Dashboard
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <RealtimeBookingNotifications
                userType="provider"
                showConnectionStatus={true}
                maxNotifications={10}
              />
              {isConnected && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700"
                >
                  Live
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage
                        src={provider?.image_url || undefined}
                        alt={
                          provider
                            ? `${provider.first_name} ${provider.last_name}`
                            : "Provider"
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {provider?.first_name?.[0]?.toUpperCase() || "P"}
                        {provider?.last_name?.[0]?.toUpperCase() || ""}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline">
                      {provider
                        ? `${provider.first_name} ${provider.last_name}`
                        : "Provider"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={provider?.image_url || undefined}
                        alt={
                          provider
                            ? `${provider.first_name} ${provider.last_name}`
                            : "Provider"
                        }
                      />
                      <AvatarFallback>
                        {provider?.first_name?.[0]?.toUpperCase() || "P"}
                        {provider?.last_name?.[0]?.toUpperCase() || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {provider
                          ? `${provider.first_name} ${provider.last_name}`
                          : "Provider"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {provider?.email || "Provider Account"}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowShareModal(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Booking Page
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back,{" "}
                <span className="text-roam-blue">
                  {user.first_name || "Provider"}
                </span>
              </h1>
              <p className="text-foreground/70">
                Here's what's happening with your business today.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${isProvider && !isOwner && !isDispatcher ? "lg:grid-cols-3" : isDispatcher ? "md:grid-cols-3 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"} gap-4 md:gap-6`}
          >
            {isOwner && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground/60">
                        Monthly Earnings
                      </p>
                      <p className="text-2xl font-bold text-roam-blue">
                        ${stats.monthlyEarnings.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600">
                        +12% from last month
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-roam-blue" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">
                      Completed Bookings
                    </p>
                    <p className="text-2xl font-bold text-roam-blue">
                      {stats.completedBookings}
                    </p>
                    <p className="text-xs text-green-600">+8 this month</p>
                  </div>
                  <Calendar className="w-8 h-8 text-roam-blue" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">Average Rating</p>
                    <p className="text-2xl font-bold text-roam-blue">
                      {stats.avgRating}
                    </p>
                    <p className="text-xs text-gray-600">From 127 reviews</p>
                  </div>
                  <Star className="w-8 h-8 text-roam-yellow fill-current" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground/60">Response Rate</p>
                    <p className="text-2xl font-bold text-roam-blue">
                      {stats.responseRate}%
                    </p>
                    <p className="text-xs text-green-600">
                      Excellent performance
                    </p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-roam-blue" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            {/* Mobile/Tablet Dropdown Menu */}
            <div className="lg:hidden mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Menu className="w-4 h-4" />
                      {getCurrentTabName()}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setActiveTab("bookings")}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setActiveTab("conversations")}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Messages
                  </DropdownMenuItem>
                  {(isOwner || isDispatcher) && (
                    <DropdownMenuItem
                      onClick={() => setActiveTab("services-addons")}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Services
                    </DropdownMenuItem>
                  )}
                  {(isOwner || isDispatcher) && (
                    <DropdownMenuItem onClick={() => setActiveTab("business")}>
                      <Building className="w-4 h-4 mr-2" />
                      Business
                    </DropdownMenuItem>
                  )}
                  {(isOwner || isDispatcher) && (
                    <DropdownMenuItem onClick={() => setActiveTab("providers")}>
                      <Users className="w-4 h-4 mr-2" />
                      Staff
                    </DropdownMenuItem>
                  )}
                  {(isOwner || isDispatcher) && (
                    <DropdownMenuItem onClick={() => setActiveTab("locations")}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Locations
                    </DropdownMenuItem>
                  )}
                  {isProvider && !isOwner && !isDispatcher && (
                    <DropdownMenuItem
                      onClick={() => setActiveTab("provider-services")}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Services
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setActiveTab("analytics")}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                  )}
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setActiveTab("financial")}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Financial
                    </DropdownMenuItem>
                  )}
                  {isOwner && (
                    <DropdownMenuItem
                      onClick={() => setActiveTab("subscription")}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Subscription
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Tabs */}
            <TabsList
              className={`hidden lg:grid w-full ${isProvider && !isOwner && !isDispatcher ? "grid-cols-6" : isOwner ? "grid-cols-11" : "grid-cols-10"} lg:w-auto lg:inline-grid`}
            >
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Bookings
              </TabsTrigger>
              <TabsTrigger
                value="conversations"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Messages
              </TabsTrigger>
              {(isOwner || isDispatcher) && (
                <TabsTrigger
                  value="services-addons"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Services
                </TabsTrigger>
              )}
              {(isOwner || isDispatcher) && (
                <TabsTrigger
                  value="business"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Business
                </TabsTrigger>
              )}
              {(isOwner || isDispatcher) && (
                <TabsTrigger
                  value="providers"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Staff
                </TabsTrigger>
              )}
              {(isOwner || isDispatcher) && (
                <TabsTrigger
                  value="locations"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Locations
                </TabsTrigger>
              )}
              {isProvider && !isOwner && !isDispatcher && (
                <TabsTrigger
                  value="provider-services"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Services
                </TabsTrigger>
              )}
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
              >
                Profile
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Analytics
                </TabsTrigger>
              )}
              {isOwner && (
                <TabsTrigger
                  value="financial"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Financial
                </TabsTrigger>
              )}
              {isOwner && (
                <TabsTrigger
                  value="subscription"
                  className="data-[state=active]:bg-roam-blue data-[state=active]:text-white"
                >
                  Subscription
                </TabsTrigger>
              )}
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Calendar & Bookings</h2>
                <div className="flex gap-2 items-center">
                  <Select
                    value={calendarViewType}
                    onValueChange={(value: "week" | "month" | "hidden") =>
                      setCalendarViewType(value)
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month View</SelectItem>
                      <SelectItem value="week">Week View</SelectItem>
                      <SelectItem value="hidden">Hide Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedDate && (
                    <Badge
                      variant="outline"
                      className="bg-roam-blue/10 text-roam-blue border-roam-blue"
                    >
                      {selectedDate.toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Location and Provider Filters for Owners/Dispatchers */}
              {(isOwner || isDispatcher) && (
                <div className="space-y-4 md:space-y-0">
                  {/* Filters Grid - Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="location-filter"
                        className="text-sm font-medium"
                      >
                        Location:
                      </Label>
                      <Select
                        value={selectedLocationFilter}
                        onValueChange={handleLocationFilterChange}
                      >
                        <SelectTrigger className="w-full" id="location-filter">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.location_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="provider-filter"
                        className="text-sm font-medium"
                      >
                        Provider:
                      </Label>
                      <Select
                        value={selectedProviderFilter}
                        onValueChange={setSelectedProviderFilter}
                      >
                        <SelectTrigger className="w-full" id="provider-filter">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Providers</SelectItem>
                          {filteredProviders.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.first_name} {provider.last_name}
                              {provider.business_locations?.name &&
                                ` (${provider.business_locations.name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="status-filter"
                        className="text-sm font-medium"
                      >
                        Status:
                      </Label>
                      <Select
                        value={selectedStatusFilter}
                        onValueChange={setSelectedStatusFilter}
                      >
                        <SelectTrigger className="w-full" id="status-filter">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="text-sm text-foreground/60 text-center md:text-left mt-4">
                    Showing {getFilteredBookings().length} bookings
                  </div>
                </div>
              )}

              {/* Calendar View - Conditionally Visible */}
              {calendarViewType !== "hidden" && (
                <div className="mb-6 p-4 border rounded-lg bg-card">
                  <CalendarGrid
                    bookings={bookings}
                    viewType={calendarViewType as "week" | "month"}
                    currentDate={calendarDate}
                    onDateChange={setCalendarDate}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </div>
              )}

              {/* Search Bar - Between Calendar and List */}
              <div className="flex items-center gap-2 mb-6">
                <Label
                  htmlFor="search-bookings"
                  className="text-sm font-medium"
                >
                  Search:
                </Label>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search-bookings"
                    type="text"
                    placeholder="Search by booking reference, customer name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Selected Date Bookings */}
              {selectedDate && (
                <div className="mb-6 p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Bookings for{" "}
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                    >
                      Clear Selection
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {getSelectedDateBookings().length > 0 ? (
                      getSelectedDateBookings().map((booking) => {
                        const statusConfig = getStatusBadge(
                          booking.booking_status,
                        );
                        const DeliveryIcon = getDeliveryIcon(
                          booking.delivery_type || "business_location",
                        );

                        return (
                          <Card
                            key={booking.id}
                            className="hover:shadow-md transition-shadow"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-lg">
                                      {booking.services?.name || "Service"}
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="w-4 h-4 text-roam-blue" />
                                      <span className="font-medium text-roam-blue">
                                        {booking.start_time}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      {booking.customer_profiles?.image_url ? (
                                        <img
                                          src={
                                            booking.customer_profiles.image_url
                                          }
                                          alt="Customer"
                                          className="w-6 h-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                          <span className="text-xs text-gray-600">
                                            {booking.customer_profiles?.first_name?.charAt(
                                              0,
                                            ) ||
                                              booking.guest_name?.charAt(0) ||
                                              "?"}
                                          </span>
                                        </div>
                                      )}
                                      <p className="text-sm font-medium">
                                        {booking.customer_profiles
                                          ?.first_name &&
                                        booking.customer_profiles?.last_name
                                          ? `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`
                                          : booking.guest_name || "Customer"}
                                      </p>
                                    </div>
                                    <div className="flex items-start gap-1">
                                      <DeliveryIcon className="w-4 h-4 mt-0.5" />
                                      <div className="flex flex-col">
                                        {(() => {
                                          const location =
                                            formatBookingLocation(booking);
                                          if (typeof location === "string") {
                                            return (
                                              <span className="text-sm text-gray-600">
                                                {location}
                                              </span>
                                            );
                                          } else {
                                            return (
                                              <div>
                                                <span className="text-sm font-medium">
                                                  {location.name}
                                                </span>
                                                {location.address && (
                                                  <span className="text-xs text-gray-500 block">
                                                    {location.address}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <RealtimeStatusUpdate
                                    bookingId={booking.id}
                                    currentStatus={booking.booking_status}
                                    onStatusChange={(newStatus) => {
                                      console.log(
                                        `Selected date booking ${booking.id} status changed to ${newStatus}`,
                                      );
                                    }}
                                  />
                                  <p className="text-lg font-semibold text-roam-blue mt-2">
                                    ${booking.total_amount || "0"}
                                  </p>
                                  {(booking.booking_status === "confirmed" ||
                                    booking.booking_status ===
                                      "in_progress") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                      onClick={() =>
                                        handleOpenMessaging(booking)
                                      }
                                    >
                                      <MessageCircle className="w-4 h-4 mr-2" />
                                      Message
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {booking.booking_status === "pending" && (
                                <div className="mt-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-roam-blue hover:bg-roam-blue/90"
                                    onClick={() => acceptBooking(booking.id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => openDeclineModal(booking)}
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-foreground/60">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No bookings for this date</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Only show sub-tabs for providers with provider role */}
              {provider?.provider_role === "provider" ? (
                <Tabs
                  value={activeBookingTab}
                  onValueChange={setActiveBookingTab}
                  className="space-y-4"
                >
                  <TabsList className="grid grid-cols-4 w-full max-w-md">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="present">Present</TabsTrigger>
                    <TabsTrigger value="future">Future</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                  </TabsList>

                  {["all", "present", "future", "past"].map((tabValue) => (
                    <TabsContent
                      key={tabValue}
                      value={tabValue}
                      className="space-y-4"
                    >
                      <div className="space-y-4">
                        {filterBookingsByDate(
                          getFilteredBookings(false),
                          tabValue as "all" | "present" | "future" | "past",
                        ).length > 0 ? (
                          filterBookingsByDate(
                            getFilteredBookings(false),
                            tabValue as "all" | "present" | "future" | "past",
                          ).map((booking) => {
                            const statusConfig = getStatusBadge(
                              booking.booking_status,
                            );
                            const DeliveryIcon = getDeliveryIcon(
                              booking.delivery_type || "business_location",
                            );

                            return (
                              <Card
                                key={booking.id}
                                className="hover:shadow-md transition-shadow"
                              >
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                      <div className="w-12 h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-white" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold">
                                          {booking.services?.name || "Service"}
                                        </h3>
                                        {(isOwner || isDispatcher) &&
                                        (booking.booking_status === "pending" ||
                                          booking.booking_status ===
                                            "confirmed") ? (
                                          <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 flex-shrink-0" />
                                            <div className="flex-1">
                                              <Select
                                                value={
                                                  booking.provider_id ||
                                                  "unassigned"
                                                }
                                                onValueChange={(providerId) => {
                                                  if (
                                                    providerId === "unassigned"
                                                  ) {
                                                    // Unassign provider (set to null)
                                                    assignProvider(
                                                      booking.id,
                                                      null,
                                                    );
                                                  } else {
                                                    assignProvider(
                                                      booking.id,
                                                      providerId,
                                                    );
                                                  }
                                                }}
                                              >
                                                <SelectTrigger className="h-8 text-sm">
                                                  <SelectValue placeholder="Assign Provider..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="unassigned">
                                                    Unassigned
                                                  </SelectItem>
                                                  {allProviders
                                                    .filter((p) => p.is_active)
                                                    .map((provider) => (
                                                      <SelectItem
                                                        key={provider.id}
                                                        value={provider.id}
                                                      >
                                                        {provider.first_name}{" "}
                                                        {provider.last_name}
                                                      </SelectItem>
                                                    ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        ) : booking.providers ? (
                                          <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm text-foreground/60">
                                              Provider:{" "}
                                              {booking.providers.first_name}{" "}
                                              {booking.providers.last_name}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4" />
                                            <span className="text-sm text-foreground/60">
                                              Provider: Unassigned
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 mb-2">
                                          {booking.customer_profiles
                                            ?.image_url ? (
                                            <img
                                              src={
                                                booking.customer_profiles
                                                  .image_url
                                              }
                                              alt="Customer"
                                              className="w-6 h-6 rounded-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                              <span className="text-xs text-gray-600">
                                                {booking.customer_profiles?.first_name?.charAt(
                                                  0,
                                                ) ||
                                                  booking.guest_name?.charAt(
                                                    0,
                                                  ) ||
                                                  "C"}
                                              </span>
                                            </div>
                                          )}
                                          <p className="text-sm text-foreground/60">
                                            {booking.customer_profiles
                                              ?.first_name &&
                                            booking.customer_profiles?.last_name
                                              ? `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`
                                              : booking.guest_name ||
                                                "Customer"}
                                          </p>
                                          {booking.customer_profiles?.email && (
                                            <span className="text-xs text-foreground/40">
                                              •{" "}
                                              {booking.customer_profiles.email}
                                            </span>
                                          )}
                                        </div>

                                        {/* Booking Reference */}
                                        {booking.booking_reference && (
                                          <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg border-l-4 border-roam-blue">
                                            <Hash className="w-4 h-4 text-roam-blue" />
                                            <div>
                                              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                Booking Reference
                                              </span>
                                              <p className="text-sm font-mono font-semibold text-gray-900">
                                                {booking.booking_reference}
                                              </p>
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-foreground/60">
                                          <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(
                                              booking.booking_date,
                                            ).toLocaleDateString()}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {booking.start_time}
                                          </div>
                                          <div className="flex items-start gap-1">
                                            <DeliveryIcon className="w-4 h-4 mt-0.5" />
                                            <div className="flex flex-col">
                                              {(() => {
                                                const location =
                                                  formatBookingLocation(
                                                    booking,
                                                  );
                                                if (
                                                  typeof location === "string"
                                                ) {
                                                  return (
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm">
                                                        {location}
                                                      </span>
                                                      <button
                                                        onClick={() =>
                                                          openGoogleMaps(
                                                            location,
                                                          )
                                                        }
                                                        className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                        title="Open in Google Maps for directions"
                                                      >
                                                        <MapPin className="w-4 h-4" />
                                                      </button>
                                                    </div>
                                                  );
                                                } else {
                                                  return (
                                                    <div className="flex items-start gap-2">
                                                      <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium">
                                                          {location.name}
                                                        </span>
                                                        {location.address && (
                                                          <span className="text-xs text-foreground/50 block max-w-44 truncate">
                                                            {location.address}
                                                          </span>
                                                        )}
                                                      </div>
                                                      {location.address && (
                                                        <button
                                                          onClick={() =>
                                                            openGoogleMaps(
                                                              location.address,
                                                            )
                                                          }
                                                          className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                          title="Open in Google Maps for directions"
                                                        >
                                                          <MapPin className="w-4 h-4" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <RealtimeStatusUpdate
                                        bookingId={booking.id}
                                        currentStatus={booking.booking_status}
                                        onStatusChange={(newStatus) => {
                                          console.log(
                                            `Provider booking ${booking.id} status changed to ${newStatus}`,
                                          );
                                        }}
                                      />
                                      <p className="text-lg font-semibold text-roam-blue mt-2">
                                        ${booking.total_amount || "0"}
                                      </p>

                                      {/* Messaging Button - Show for confirmed and in-progress bookings */}
                                      {(booking.booking_status ===
                                        "confirmed" ||
                                        booking.booking_status ===
                                          "in_progress") && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="mt-3 w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                          onClick={() =>
                                            handleOpenMessaging(booking)
                                          }
                                        >
                                          <MessageCircle className="w-4 h-4 mr-2" />
                                          Message Customer
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {booking.booking_status === "pending" && (
                                    <div className="mt-4 flex gap-2">
                                      <Button
                                        size="sm"
                                        className="bg-roam-blue hover:bg-roam-blue/90"
                                        onClick={() =>
                                          acceptBooking(booking.id)
                                        }
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={() =>
                                          openDeclineModal(booking)
                                        }
                                      >
                                        Decline
                                      </Button>
                                    </div>
                                  )}

                                  {booking.booking_status === "confirmed" &&
                                    new Date(booking.booking_date) <=
                                      new Date(new Date().toDateString()) && (
                                      <div className="mt-4">
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700 w-full"
                                          onClick={() =>
                                            completeBooking(booking.id)
                                          }
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Complete Booking
                                        </Button>
                                      </div>
                                    )}
                                </CardContent>
                              </Card>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-foreground/60">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {tabValue === "present" && "No current bookings"}
                              {tabValue === "future" && "No upcoming bookings"}
                              {tabValue === "past" &&
                                "No completed or cancelled bookings"}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="space-y-4">
                  {getFilteredBookings().length > 0 ? (
                    getFilteredBookings().map((booking) => {
                      const statusConfig = getStatusBadge(
                        booking.booking_status,
                      );
                      const DeliveryIcon = getDeliveryIcon(
                        booking.delivery_type || "business_location",
                      );

                      return (
                        <Card
                          key={booking.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              {/* Main Content */}
                              <div className="flex items-start gap-3 md:gap-4 flex-1">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center flex-shrink-0">
                                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base md:text-lg mb-2">
                                    {booking.services?.name || "Service"}
                                  </h3>

                                  {/* Provider Info */}
                                  {(isOwner || isDispatcher) &&
                                  (booking.booking_status === "pending" ||
                                    booking.booking_status === "confirmed") ? (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Users className="w-4 h-4 flex-shrink-0" />
                                      <div className="flex-1">
                                        <Select
                                          value={
                                            booking.provider_id || "unassigned"
                                          }
                                          onValueChange={(providerId) => {
                                            if (providerId === "unassigned") {
                                              // Unassign provider (set to null)
                                              assignProvider(booking.id, null);
                                            } else {
                                              assignProvider(
                                                booking.id,
                                                providerId,
                                              );
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Assign Provider..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="unassigned">
                                              Unassigned
                                            </SelectItem>
                                            {allProviders
                                              .filter((p) => p.is_active)
                                              .map((provider) => (
                                                <SelectItem
                                                  key={provider.id}
                                                  value={provider.id}
                                                >
                                                  {provider.first_name}{" "}
                                                  {provider.last_name}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  ) : booking.providers ? (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Users className="w-4 h-4 flex-shrink-0" />
                                      <span className="text-sm text-foreground/60 truncate">
                                        Provider: {booking.providers.first_name}{" "}
                                        {booking.providers.last_name}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Users className="w-4 h-4 flex-shrink-0" />
                                      <span className="text-sm text-foreground/60 truncate">
                                        Provider: Unassigned
                                      </span>
                                    </div>
                                  )}

                                  {/* Customer Info */}
                                  <div className="flex items-center gap-2 mb-3">
                                    {booking.customer_profiles?.image_url ? (
                                      <img
                                        src={
                                          booking.customer_profiles.image_url
                                        }
                                        alt="Customer"
                                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs text-gray-600">
                                          {booking.customer_profiles?.first_name?.charAt(
                                            0,
                                          ) ||
                                            booking.guest_name?.charAt(0) ||
                                            "C"}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-foreground/60 truncate">
                                        {booking.customer_profiles
                                          ?.first_name &&
                                        booking.customer_profiles?.last_name
                                          ? `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`
                                          : booking.guest_name || "Customer"}
                                      </p>
                                      {booking.customer_profiles?.email && (
                                        <span className="text-xs text-foreground/40 block truncate">
                                          {booking.customer_profiles.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Booking Reference */}
                                  {booking.booking_reference && (
                                    <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded-lg border-l-4 border-roam-blue">
                                      <Hash className="w-4 h-4 text-roam-blue flex-shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide block">
                                          Booking Reference
                                        </span>
                                        <p className="text-sm font-mono font-semibold text-gray-900 truncate">
                                          {booking.booking_reference}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Booking Details - Responsive */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-foreground/60">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {new Date(
                                          booking.booking_date,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {booking.start_time}
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-2 sm:col-span-2 lg:col-span-1">
                                      <DeliveryIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        {(() => {
                                          const location =
                                            formatBookingLocation(booking);
                                          if (typeof location === "string") {
                                            return (
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm truncate flex-1">
                                                  {location}
                                                </span>
                                                <button
                                                  onClick={() =>
                                                    openGoogleMaps(location)
                                                  }
                                                  className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                  title="Open in Google Maps for directions"
                                                >
                                                  <MapPin className="w-4 h-4" />
                                                </button>
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="flex items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-sm font-medium block truncate">
                                                    {location.name}
                                                  </span>
                                                  {location.address && (
                                                    <span className="text-xs text-foreground/50 block truncate">
                                                      {location.address}
                                                    </span>
                                                  )}
                                                </div>
                                                {location.address && (
                                                  <button
                                                    onClick={() =>
                                                      openGoogleMaps(
                                                        location.address,
                                                      )
                                                    }
                                                    className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                    title="Open in Google Maps for directions"
                                                  >
                                                    <MapPin className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Status and Price - Responsive */}
                              <div className="flex items-center justify-between md:flex-col md:items-end md:text-right gap-4 md:gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:min-w-0">
                                <RealtimeStatusUpdate
                                  bookingId={booking.id}
                                  currentStatus={booking.booking_status}
                                  onStatusChange={(newStatus) => {
                                    console.log(
                                      `Today's booking ${booking.id} status changed to ${newStatus}`,
                                    );
                                  }}
                                />
                                <p className="text-lg md:text-xl font-semibold text-roam-blue">
                                  ${booking.total_amount || "0"}
                                </p>
                              </div>
                            </div>

                            {booking.booking_status === "pending" && (
                              <div className="mt-4 flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-roam-blue hover:bg-roam-blue/90"
                                  onClick={() => acceptBooking(booking.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => openDeclineModal(booking)}
                                >
                                  Decline
                                </Button>
                              </div>
                            )}

                            {/* Messaging Button - Show for confirmed and in-progress bookings */}
                            {(booking.booking_status === "confirmed" ||
                              booking.booking_status === "in_progress") && (
                              <div className="mt-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                  onClick={() => handleOpenMessaging(booking)}
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Message Customer
                                </Button>
                              </div>
                            )}

                            {booking.booking_status === "confirmed" &&
                              new Date(booking.booking_date) <=
                                new Date(new Date().toDateString()) && (
                                <div className="mt-4">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 w-full"
                                    onClick={() => completeBooking(booking.id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Complete Booking
                                  </Button>
                                </div>
                              )}
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-foreground/60">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No bookings to display</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Conversations</h2>
                <Button
                  onClick={handleOpenConversationsList}
                  className="bg-roam-blue hover:bg-roam-blue/90"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  View All Conversations
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      About Conversations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-foreground/70">
                      Use Twilio Conversations to communicate with customers
                      directly in the app. All messages are secure and organized
                      by booking.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Real-time messaging with customers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Organized by booking ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Available to all staff roles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Message history and attachments</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={handleOpenConversationsList}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      View All Conversations
                    </Button>
                    <div className="text-sm text-foreground/60">
                      <p className="mb-2">Start conversations from:</p>
                      <ul className="space-y-1 ml-4">
                        <li>• Booking cards (Message button)</li>
                        <li>• Customer profile pages</li>
                        <li>• Direct conversation creation</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <p className="text-sm text-foreground/60">
                    Latest conversation updates will appear here
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-foreground/50">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent conversation activity</p>
                    <p className="text-sm">
                      Start messaging with customers to see activity here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab - Owner and Dispatcher */}
            {(isOwner || isDispatcher) && (
              <TabsContent value="services-addons" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Business Services</h2>
                    <p className="text-foreground/60">
                      Manage the services and add-ons your business offers to
                      customers
                    </p>
                  </div>
                  <Button
                    onClick={() => fetchBusinessServicesAndAddons()}
                    disabled={businessServicesLoading}
                    variant="outline"
                  >
                    {businessServicesLoading ? "Loading..." : "Refresh"}
                  </Button>
                </div>

                {businessServicesError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    {typeof businessServicesError === "string"
                      ? businessServicesError
                      : "An error occurred while loading services and add-ons"}
                  </div>
                )}

                {businessServicesSuccess && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                    {businessServicesSuccess}
                  </div>
                )}

                {serviceSuccess && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                    {serviceSuccess}
                  </div>
                )}

                {servicesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading services...</p>
                  </div>
                ) : businessServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {businessServices.map((businessService) => (
                      <Card
                        key={businessService.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">
                                {businessService.services?.name}
                              </h3>
                              <p className="text-sm text-foreground/60">
                                {businessService.services?.service_subcategories
                                  ?.service_categories?.description ||
                                  businessService.services
                                    ?.service_subcategories?.service_categories
                                    ?.service_category_type}{" "}
                                ����{" "}
                                {
                                  businessService.services
                                    ?.service_subcategories
                                    ?.service_subcategory_type
                                }
                              </p>
                              {businessService.services?.description && (
                                <p className="text-xs text-foreground/50 mt-1">
                                  {businessService.services.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Switch
                                checked={businessService.is_active !== false}
                                className="data-[state=checked]:bg-roam-blue"
                                disabled={
                                  isProvider &&
                                  !isOwner &&
                                  !isDispatcher &&
                                  provider?.business_managed
                                }
                                onCheckedChange={(checked) => {
                                  console.log("Service toggle clicked:", {
                                    serviceId: businessService.service_id,
                                    checked,
                                    isProvider,
                                    isOwner,
                                    isDispatcher,
                                    businessManaged: provider?.business_managed,
                                  });
                                  // Toggle business service active status
                                  handleToggleBusinessService(
                                    businessService.service_id,
                                    checked,
                                    businessService.business_price,
                                    businessService.delivery_type,
                                  );
                                }}
                              />
                              {isProvider &&
                                !isOwner &&
                                !isDispatcher &&
                                provider?.business_managed && (
                                  <span className="text-xs text-foreground/50">
                                    Read-only
                                  </span>
                                )}
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>Duration:</span>
                              <span className="font-medium">
                                {businessService.duration ||
                                  (businessService.services?.duration_minutes
                                    ? `${businessService.services.duration_minutes} mins`
                                    : "N/A")}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Minimum Price:</span>
                              <span className="font-medium text-roam-blue">
                                $
                                {businessService.business_price ||
                                  businessService.services?.min_price ||
                                  "0"}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Delivery:</span>
                              <span className="font-medium">
                                {getDeliveryTypeLabel(
                                  businessService.delivery_type ||
                                    "business_location",
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Bookings:</span>
                              <span className="font-medium">
                                {businessService.booking_count || 0} this month
                              </span>
                            </div>
                          </div>

                          {isOwner || isDispatcher ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                              onClick={() =>
                                handleEditBusinessService(businessService)
                              }
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Service
                            </Button>
                          ) : (
                            <div className="text-center py-2">
                              <span className="text-xs text-foreground/60">
                                {provider?.business_managed
                                  ? "Service managed by business"
                                  : "Toggle above to activate/deactivate"}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground/60">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No services added yet</p>
                    <p className="text-sm">
                      Add your first service to start accepting bookings
                    </p>
                  </div>
                )}

                {/* Current Business Add-ons Section */}
                {businessAddons.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Current Add-ons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {businessAddons.map((businessAddon) => (
                        <Card key={businessAddon.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">
                                {businessAddon.service_addons?.name}
                              </h4>
                              <p className="text-sm text-foreground/60">
                                {businessAddon.service_addons?.addon_type}
                              </p>
                            </div>
                            <Switch
                              checked={businessAddon.is_available}
                              className="data-[state=checked]:bg-roam-blue"
                              onCheckedChange={(checked) => {
                                handleToggleBusinessAddon(
                                  businessAddon.addon_id,
                                  checked,
                                  businessAddon.custom_price,
                                );
                              }}
                            />
                          </div>
                          <p className="text-xs text-foreground/50 mb-2">
                            {businessAddon.service_addons?.description}
                          </p>
                          <div className="flex justify-between items-center text-sm">
                            <span>Price:</span>
                            <span className="font-medium text-roam-blue">
                              $
                              {businessAddon.custom_price ||
                                businessAddon.service_addons?.default_price ||
                                "0"}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                            onClick={() => handleEditAddon(businessAddon)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Add-on
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Services to Add Section */}
                {allServices.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">
                        Available Services
                      </h3>
                      <p className="text-sm text-foreground/60">
                        Add services to your business offering
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {allServices
                        .filter(
                          (service) =>
                            !businessServices.some(
                              (bs) => bs.service_id === service.id,
                            ) &&
                            // Only show services if business offers the related subcategory type
                            business?.service_subcategories?.includes(
                              service.service_subcategories
                                ?.service_subcategory_type,
                            ),
                        )
                        .map((service) => (
                          <Card
                            key={service.id}
                            className="p-4 border-dashed border-2 hover:border-roam-blue transition-colors"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-roam-blue/10 flex items-center justify-center flex-shrink-0">
                                  {(() => {
                                    const IconComponent = getServiceIcon(
                                      service.name,
                                      service.service_subcategories
                                        ?.service_categories
                                        ?.service_category_type || "",
                                    );
                                    return (
                                      <IconComponent className="w-5 h-5 text-roam-blue" />
                                    );
                                  })()}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {service.name}
                                  </h4>
                                  <p className="text-sm text-foreground/60">
                                    {service.service_subcategories
                                      ?.service_categories?.description ||
                                      service.service_subcategories
                                        ?.service_categories
                                        ?.service_category_type}{" "}
                                    —{" "}
                                    {
                                      service.service_subcategories
                                        ?.service_subcategory_type
                                    }
                                  </p>
                                  {service.description && (
                                    <p className="text-xs text-foreground/50 mt-1">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span>
                                  Min Price: ${service.min_price || "0"}
                                </span>
                                <span>{service.duration_minutes}min</span>
                              </div>
                              <Button
                                size="sm"
                                className="w-full bg-roam-blue hover:bg-roam-blue/90"
                                onClick={() =>
                                  handleToggleBusinessService(
                                    service.id,
                                    true,
                                    service.min_price,
                                  )
                                }
                                disabled={businessServicesSaving}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Service
                              </Button>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Available Add-ons to Add Section */}
                {allServiceAddons.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">
                        Available Add-ons
                      </h3>
                      <p className="text-sm text-foreground/60">
                        Add add-ons to your business offering
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allServiceAddons
                        .filter(
                          (addon) =>
                            !businessAddons.some(
                              (ba) => ba.addon_id === addon.id,
                            ) &&
                            // Only show add-ons if business can offer related services (based on subcategories)
                            serviceAddonEligibility.some(
                              (eligibility) =>
                                eligibility.addon_id === addon.id &&
                                allServices.some(
                                  (service) =>
                                    service.id === eligibility.service_id &&
                                    business?.service_subcategories?.includes(
                                      service.service_subcategories
                                        ?.service_subcategory_type,
                                    ),
                                ),
                            ),
                        )
                        .map((addon) => (
                          <Card
                            key={addon.id}
                            className="p-4 border-dashed border-2 hover:border-roam-blue transition-colors"
                          >
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium">{addon.name}</h4>
                                <p className="text-sm text-foreground/60">
                                  {addon.addon_type}
                                </p>
                                {addon.description && (
                                  <p className="text-xs text-foreground/50 mt-1">
                                    {addon.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span>
                                  Default Price: ${addon.default_price || "0"}
                                </span>
                                {addon.is_percentage && <span>% based</span>}
                              </div>
                              <Button
                                size="sm"
                                className="w-full bg-roam-blue hover:bg-roam-blue/90"
                                onClick={() =>
                                  handleToggleBusinessAddon(
                                    addon.id,
                                    true,
                                    addon.default_price,
                                  )
                                }
                                disabled={businessServicesSaving}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Add-on
                              </Button>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Add-ons Tab */}
            <TabsContent value="addons" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Service Add-ons</h2>
                  <p className="text-foreground/60">
                    Manage additional services and extras you offer to clients
                  </p>
                </div>
                <Button
                  onClick={() => fetchProviderAddons()}
                  disabled={addonsLoading}
                  variant="outline"
                >
                  {addonsLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>

              {addonsError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {typeof addonsError === "string"
                    ? addonsError
                    : "An error occurred while loading add-ons"}
                </div>
              )}

              {addonsSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {addonsSuccess}
                </div>
              )}

              {addonsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-roam-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableAddons.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-foreground/60 mb-4">
                      <svg
                        className="w-12 h-12 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      No Add-ons Available
                    </h3>
                    <p className="text-foreground/60">
                      There are currently no service add-ons available to
                      enable.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {availableAddons.map((addon) => {
                    const providerAddon = providerAddons.find(
                      (pa) => pa.addon_id === addon.id,
                    );
                    const isActive = providerAddon?.is_active || false;
                    const isEnabled = !!providerAddon;

                    return (
                      <Card key={addon.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">
                                  {addon.name}
                                </h3>
                                <div className="flex gap-2">
                                  {isEnabled && (
                                    <Badge
                                      variant={
                                        isActive ? "default" : "secondary"
                                      }
                                      className={
                                        isActive
                                          ? "bg-green-500 hover:bg-green-600"
                                          : ""
                                      }
                                    >
                                      {isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  )}
                                  {addon.is_premium && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-purple-100 text-purple-700"
                                    >
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {addon.description && (
                                <p className="text-foreground/70 mb-3">
                                  {addon.description}
                                </p>
                              )}

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {addon.base_price && (
                                  <div>
                                    <span className="text-foreground/60">
                                      Base Price:
                                    </span>
                                    <p className="font-medium">
                                      ${addon.base_price}
                                    </p>
                                  </div>
                                )}
                                {addon.duration_minutes && (
                                  <div>
                                    <span className="text-foreground/60">
                                      Duration:
                                    </span>
                                    <p className="font-medium">
                                      {addon.duration_minutes} min
                                    </p>
                                  </div>
                                )}
                                {addon.category && (
                                  <div>
                                    <span className="text-foreground/60">
                                      Category:
                                    </span>
                                    <p className="font-medium capitalize">
                                      {addon.category.replace("_", " ")}
                                    </p>
                                  </div>
                                )}
                                {addon.addon_type && (
                                  <div>
                                    <span className="text-foreground/60">
                                      Type:
                                    </span>
                                    <p className="font-medium capitalize">
                                      {addon.addon_type.replace("_", " ")}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) =>
                                  handleToggleAddon(addon.id, checked)
                                }
                                disabled={addonsSaving}
                                className="data-[state=checked]:bg-roam-blue"
                              />
                              <span className="text-xs text-foreground/60 text-center">
                                {isActive ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Business Tab */}
            {(isOwner || isDispatcher) && (
              <TabsContent value="business" className="space-y-6">
                <h2 className="text-2xl font-bold">Business Management</h2>

                {/* Business Cover Image Upload */}
                {!isDispatcher && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-lg mb-4">
                        Business Cover Image
                      </h3>
                      <div className="relative">
                        <div
                          className="w-full h-48 bg-gradient-to-r from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={
                            business?.cover_image_url
                              ? handleImagePositionClick
                              : undefined
                          }
                        >
                          {business?.cover_image_url ? (
                            <img
                              src={business.cover_image_url}
                              alt="Business Cover"
                              className="w-full h-full object-cover transition-all duration-300"
                              style={{ objectPosition: businessCoverPosition }}
                            />
                          ) : (
                            <div className="text-center text-white">
                              <Building className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-sm">No cover image</p>
                            </div>
                          )}
                        </div>
                        {businessCoverUploading && (
                          <div className="absolute inset-0 w-full h-48 bg-black/50 rounded-lg flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {business?.cover_image_url && (
                          <div className="absolute top-2 right-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowPositionControls(!showPositionControls)
                              }
                              className="bg-white/90 hover:bg-white"
                            >
                              <Move className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {businessCoverError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                          {businessCoverError}
                        </div>
                      )}

                      {/* Position Controls */}
                      {business?.cover_image_url && showPositionControls && (
                        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Move className="w-4 h-4" />
                            Image Position Controls
                          </h4>
                          <div className="space-y-3">
                            <p className="text-xs text-gray-600">
                              Click on the image above to set focal point, or
                              use preset positions:
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("0% 0%")}
                                className="text-xs"
                              >
                                Top Left
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("50% 0%")}
                                className="text-xs"
                              >
                                Top Center
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("100% 0%")}
                                className="text-xs"
                              >
                                Top Right
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("0% 50%")}
                                className="text-xs"
                              >
                                Center Left
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("50% 50%")}
                                className="text-xs bg-roam-blue text-white border-roam-blue"
                              >
                                Center
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("100% 50%")}
                                className="text-xs"
                              >
                                Center Right
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("0% 100%")}
                                className="text-xs"
                              >
                                Bottom Left
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("50% 100%")}
                                className="text-xs"
                              >
                                Bottom Center
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePresetPosition("100% 100%")
                                }
                                className="text-xs"
                              >
                                Bottom Right
                              </Button>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-xs text-gray-600">
                                Current position: {businessCoverPosition}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePresetPosition("50% 50%")}
                                className="text-xs"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Reset
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-center mt-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBusinessCoverUpload}
                          className="hidden"
                          id="business-cover-upload"
                          disabled={
                            businessCoverUploading || businessDetailsSaving
                          }
                        />
                        <Button
                          variant="outline"
                          className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                          onClick={() =>
                            document
                              .getElementById("business-cover-upload")
                              ?.click()
                          }
                          disabled={
                            businessCoverUploading || businessDetailsSaving
                          }
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {business?.cover_image_url
                            ? "Change Cover"
                            : "Upload Cover"}
                        </Button>

                        {business?.cover_image_url && (
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={handleBusinessCoverRemove}
                            disabled={
                              businessCoverUploading || businessDetailsSaving
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-foreground/60 text-center mt-2">
                        Upload a cover image for your business profile (max
                        10MB). Recommended size: 1200x400px
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Business Details Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-roam-blue" />
                      Business Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isDispatcher && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded mb-4">
                        <strong>View Only:</strong> As a dispatcher, you can
                        view business details but cannot make changes.
                      </div>
                    )}

                    {(businessDetailsError || businessCoverError) && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                        {businessDetailsError || businessCoverError}
                      </div>
                    )}

                    {businessDetailsSuccess && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded mb-4">
                        {businessDetailsSuccess}
                      </div>
                    )}

                    <div className="space-y-8">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="business_name">
                              Business Name *
                            </Label>
                            <Input
                              id="business_name"
                              value={businessDetailsForm.business_name}
                              onChange={(e) =>
                                handleBusinessDetailsFormChange(
                                  "business_name",
                                  e.target.value,
                                )
                              }
                              disabled={
                                businessDetailsSaving ||
                                businessCoverUploading ||
                                isDispatcher
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="business_type">Business Type</Label>
                            <Input
                              id="business_type"
                              value={formatBusinessType(
                                businessDetailsForm.business_type,
                              )}
                              readOnly
                              className="bg-muted cursor-not-allowed"
                              title="Business type cannot be changed"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="verification_status">
                              Verification Status
                            </Label>
                            <Input
                              id="verification_status"
                              value={formatVerificationStatus(
                                businessDetailsForm.verification_status,
                              )}
                              readOnly
                              className="bg-muted cursor-not-allowed"
                              title="Verification status is managed by system"
                            />
                          </div>

                          {/* Verification Notes */}
                          {businessDetailsForm.verification_notes && (
                            <div className="space-y-2">
                              <Label htmlFor="verification_notes">
                                ROAM Admin Feedback
                              </Label>
                              <Textarea
                                id="verification_notes"
                                value={businessDetailsForm.verification_notes}
                                readOnly
                                className="bg-muted cursor-not-allowed min-h-[80px] resize-none"
                                title="Feedback from ROAM administration team"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium">
                                Featured Business Status:
                              </span>
                              {businessDetailsForm.is_featured ? (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1 text-xs font-bold shadow-lg">
                                  �� FEATURED BUSINESS
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-gray-500 border-gray-300 px-3 py-1 text-xs"
                                >
                                  Not Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-foreground/60">
                              Featured businesses appear prominently on the
                              homepage and get increased visibility to
                              customers. (Status controlled by ROAM)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Service Categories */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Service Categories
                        </h3>
                        <div className="space-y-6">
                          {/* Service Categories */}
                          <div className="space-y-3">
                            <Label className="text-base font-medium">
                              Business Service Categories
                            </Label>
                            <p className="text-sm text-foreground/60">
                              Main categories of services your business offers
                              (read-only)
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Service categories are
                                controlled by ROAM. If you need approval for
                                additional service categories, please contact
                                ROAM at{" "}
                                <a
                                  href="mailto:providersupport@roamyourbestlife.com"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  providersupport@roamyourbestlife.com
                                </a>
                              </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {serviceCategories.map((category) => (
                                <div
                                  key={category.id}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="checkbox"
                                    id={`category-${category.service_category_type}`}
                                    checked={businessDetailsForm.service_categories.includes(
                                      category.service_category_type,
                                    )}
                                    disabled={true}
                                    readOnly
                                    className={`rounded cursor-not-allowed ${
                                      businessDetailsForm.service_categories.includes(
                                        category.service_category_type,
                                      )
                                        ? "border-orange-400 bg-orange-100 text-orange-600 accent-orange-500"
                                        : "border-gray-300 text-gray-400 opacity-60"
                                    }`}
                                  />
                                  <Label
                                    htmlFor={`category-${category.service_category_type}`}
                                    className={`text-sm font-normal cursor-default ${
                                      businessDetailsForm.service_categories.includes(
                                        category.service_category_type,
                                      )
                                        ? "text-orange-700 font-medium"
                                        : "opacity-60"
                                    }`}
                                  >
                                    {toCamelCase(
                                      category.description ||
                                        category.service_category_type,
                                    )}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Service Subcategories */}
                          {businessDetailsForm.service_categories.length >
                            0 && (
                            <div className="space-y-3">
                              <Label className="text-base font-medium">
                                Service Specializations
                              </Label>
                              <p className="text-sm text-foreground/60">
                                Specific services and specializations your
                                business provides (read-only)
                              </p>
                              {businessDetailsForm.service_categories.length ===
                              0 ? (
                                <p className="text-sm text-gray-500 italic">
                                  Please select service categories first to see
                                  available specializations
                                </p>
                              ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {serviceSubcategories
                                    .filter((subcategory) => {
                                      // Find the selected categories and check if this subcategory belongs to any of them
                                      const selectedCategoryIds =
                                        serviceCategories
                                          .filter((cat) =>
                                            businessDetailsForm.service_categories.includes(
                                              cat.service_category_type,
                                            ),
                                          )
                                          .map((cat) => cat.id);
                                      return selectedCategoryIds.includes(
                                        subcategory.category_id,
                                      );
                                    })
                                    .map((subcategory) => (
                                      <div
                                        key={subcategory.id}
                                        className="flex items-center space-x-2"
                                      >
                                        <input
                                          type="checkbox"
                                          id={`subcategory-${subcategory.service_subcategory_type}`}
                                          checked={businessDetailsForm.service_subcategories.includes(
                                            subcategory.service_subcategory_type,
                                          )}
                                          disabled={true}
                                          readOnly
                                          className={`rounded cursor-not-allowed ${
                                            businessDetailsForm.service_subcategories.includes(
                                              subcategory.service_subcategory_type,
                                            )
                                              ? "border-orange-400 bg-orange-100 text-orange-600 accent-orange-500"
                                              : "border-gray-300 text-gray-400 opacity-60"
                                          }`}
                                        />
                                        <Label
                                          htmlFor={`subcategory-${subcategory.service_subcategory_type}`}
                                          className={`text-sm font-normal cursor-default ${
                                            businessDetailsForm.service_subcategories.includes(
                                              subcategory.service_subcategory_type,
                                            )
                                              ? "text-orange-700 font-medium"
                                              : "opacity-60"
                                          }`}
                                        >
                                          {toCamelCase(
                                            subcategory.description ||
                                              subcategory.service_subcategory_type,
                                          )}
                                        </Label>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact_email">Contact Email</Label>
                            <Input
                              id="contact_email"
                              type="email"
                              value={businessDetailsForm.contact_email}
                              onChange={(e) =>
                                handleBusinessDetailsFormChange(
                                  "contact_email",
                                  e.target.value,
                                )
                              }
                              disabled={
                                businessDetailsSaving ||
                                businessCoverUploading ||
                                isDispatcher
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Business Phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={businessDetailsForm.phone}
                              onChange={(e) =>
                                handleBusinessDetailsFormChange(
                                  "phone",
                                  e.target.value,
                                )
                              }
                              disabled={
                                businessDetailsSaving ||
                                businessCoverUploading ||
                                isDispatcher
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="website_url">Website URL</Label>
                            <Input
                              id="website_url"
                              type="url"
                              value={businessDetailsForm.website_url}
                              onChange={(e) =>
                                handleBusinessDetailsFormChange(
                                  "website_url",
                                  e.target.value,
                                )
                              }
                              placeholder="https://"
                              disabled={
                                businessDetailsSaving ||
                                businessCoverUploading ||
                                isDispatcher
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Logo */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Business Logo
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Logo Preview */}
                          <div className="space-y-4">
                            <Label>Current Logo</Label>
                            <div className="relative">
                              <div className="w-32 h-32 bg-accent/20 border-2 border-dashed border-accent rounded-lg flex items-center justify-center overflow-hidden">
                                {business?.logo_url ? (
                                  <img
                                    src={business.logo_url}
                                    alt="Business Logo"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="text-center text-foreground/60">
                                    <Building className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">No logo uploaded</p>
                                  </div>
                                )}
                              </div>
                              {logoUploading && (
                                <div className="absolute inset-0 w-32 h-32 bg-black/50 rounded-lg flex items-center justify-center">
                                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Logo Upload Controls */}
                          <div className="space-y-4">
                            <Label>Logo Management</Label>

                            {logoError && (
                              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {logoError}
                              </div>
                            )}

                            <div className="space-y-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                id="logo-upload"
                                disabled={logoUploading}
                              />
                              <Button
                                variant="outline"
                                className="w-full border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                                onClick={() =>
                                  document
                                    .getElementById("logo-upload")
                                    ?.click()
                                }
                                disabled={logoUploading}
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                {business?.logo_url
                                  ? "Change Logo"
                                  : "Upload Logo"}
                              </Button>

                              {business?.logo_url && (
                                <Button
                                  variant="outline"
                                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={handleLogoRemove}
                                  disabled={logoUploading}
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Remove Logo
                                </Button>
                              )}
                            </div>

                            <p className="text-xs text-foreground/60">
                              Upload a business logo (max 5MB). Recommended
                              size: 200x200px or larger.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Business Status */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">
                          Business Status
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Business Active</Label>
                              <p className="text-sm text-foreground/60">
                                Enable or disable your business listing
                              </p>
                            </div>
                            <Switch
                              checked={businessDetailsForm.is_active}
                              onCheckedChange={(checked) =>
                                handleBusinessDetailsFormChange(
                                  "is_active",
                                  checked,
                                )
                              }
                              disabled={
                                businessDetailsSaving ||
                                businessCoverUploading ||
                                isDispatcher
                              }
                              className="data-[state=checked]:bg-roam-blue"
                            />
                          </div>

                          {/* Stripe Status Display */}
                          <div className="p-4 bg-accent/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <Label>Stripe Payouts</Label>
                              <span
                                className={`font-medium ${
                                  business?.stripe_connect_account_id
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {business?.stripe_connect_account_id
                                  ? "Enabled"
                                  : "Disabled"}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/60 mt-1">
                              {business?.stripe_connect_account_id
                                ? "Your Stripe account is connected and ready to receive payments"
                                : "Connect your Stripe account to enable automatic payouts"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      {!isDispatcher && (
                        <div className="pt-4 border-t">
                          <Button
                            onClick={handleSaveBusinessDetails}
                            disabled={
                              businessDetailsSaving || businessCoverUploading
                            }
                            className="bg-roam-blue hover:bg-roam-blue/90"
                          >
                            {businessDetailsSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Building className="w-4 h-4 mr-2" />
                                Save Business Details
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {businessHoursError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                        {businessHoursError}
                      </div>
                    )}

                    {businessHoursSuccess && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded mb-4">
                        {businessHoursSuccess}
                      </div>
                    )}

                    <div className="space-y-3">
                      {editingBusinessHours
                        ? // Editing mode
                          [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ].map((day) => (
                            <div
                              key={day}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <Switch
                                  checked={businessHoursForm[day].isOpen}
                                  onCheckedChange={(checked) =>
                                    handleBusinessHoursChange(
                                      day,
                                      "isOpen",
                                      checked,
                                    )
                                  }
                                  disabled={businessHoursSaving}
                                  className="data-[state=checked]:bg-roam-blue"
                                />
                                <span className="text-sm font-medium w-20">
                                  {day}
                                </span>
                              </div>

                              {businessHoursForm[day].isOpen ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="time"
                                    value={businessHoursForm[day].open}
                                    onChange={(e) =>
                                      handleBusinessHoursChange(
                                        day,
                                        "open",
                                        e.target.value,
                                      )
                                    }
                                    disabled={businessHoursSaving}
                                    className="w-24"
                                  />
                                  <span className="text-sm text-foreground/60">
                                    to
                                  </span>
                                  <Input
                                    type="time"
                                    value={businessHoursForm[day].close}
                                    onChange={(e) =>
                                      handleBusinessHoursChange(
                                        day,
                                        "close",
                                        e.target.value,
                                      )
                                    }
                                    disabled={businessHoursSaving}
                                    className="w-24"
                                  />
                                </div>
                              ) : (
                                <span className="text-sm text-foreground/60">
                                  Closed
                                </span>
                              )}
                            </div>
                          ))
                        : // Display mode
                          businessHours
                          ? [
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day) => {
                              const dayHours = businessHours[day];
                              const isOpen =
                                dayHours &&
                                typeof dayHours === "object" &&
                                dayHours.open &&
                                dayHours.close;

                              return (
                                <div
                                  key={day}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-sm font-medium">
                                    {day}
                                  </span>
                                  <span className="text-sm text-foreground/60">
                                    {isOpen
                                      ? `${formatTimeTo12Hour(dayHours.open)} - ${formatTimeTo12Hour(dayHours.close)}`
                                      : "Closed"}
                                  </span>
                                </div>
                              );
                            })
                          : [
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day) => (
                              <div
                                key={day}
                                className="flex justify-between items-center"
                              >
                                <span className="text-sm font-medium">
                                  {day}
                                </span>
                                <span className="text-sm text-foreground/60">
                                  Loading...
                                </span>
                              </div>
                            ))}
                    </div>

                    {editingBusinessHours ? (
                      <div className="flex gap-2 mt-4">
                        <Button
                          className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                          onClick={handleSaveBusinessHours}
                          disabled={businessHoursSaving}
                        >
                          {businessHoursSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 mr-2" />
                              Save Hours
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleCancelBusinessHours}
                          disabled={businessHoursSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full mt-4 border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        onClick={() => setEditingBusinessHours(true)}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Edit Hours
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Business Documents */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-roam-blue" />
                        Business Documents
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDocumentModal(true)}
                          disabled={documentUploading}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {documentUploading ? "Uploading..." : "Add Document"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {businessDocumentsError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                        {businessDocumentsError}
                      </div>
                    )}

                    {documentUploadError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                        {documentUploadError}
                      </div>
                    )}

                    {businessDocumentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mr-2"></div>
                        Loading documents...
                      </div>
                    ) : businessDocuments.length === 0 ? (
                      <div className="text-center py-8 text-foreground/60">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-foreground/30" />
                        <p>No documents have been uploaded yet.</p>
                        <p className="text-sm mt-2">
                          Use the "Add Document" button above to upload business
                          documents.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-foreground/60 mb-4">
                          View and download documents you submitted during the
                          business verification process.
                        </p>

                        <div className="grid gap-4">
                          {businessDocuments.map((document: any) => (
                            <div
                              key={document.id}
                              className="border rounded-lg p-4 hover:bg-accent/20 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                      <Download className="w-4 h-4 text-roam-blue" />
                                      <h4 className="font-semibold text-lg text-foreground">
                                        {document.document_type
                                          ?.replace(/_/g, " ")
                                          .replace(/\b\w/g, (l) =>
                                            l.toUpperCase(),
                                          )}
                                      </h4>
                                    </div>
                                    <Badge
                                      className={getDocumentStatusBadge(
                                        document.verification_status,
                                      )}
                                    >
                                      {document.verification_status ===
                                        "approved" && "Approved"}
                                      {document.verification_status ===
                                        "pending" && "Pending Review"}
                                      {document.verification_status ===
                                        "rejected" && "Rejected"}
                                      {document.verification_status ===
                                        "expired" && "Expired"}
                                      {!document.verification_status &&
                                        "Submitted"}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-foreground/60">
                                    <div>
                                      <span className="font-medium">
                                        File Name:
                                      </span>
                                      <br />
                                      <span className="text-xs text-foreground/50">
                                        {document.document_name}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Size:</span>
                                      <br />
                                      {formatFileSize(document.file_size_bytes)}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Submitted:
                                      </span>
                                      <br />
                                      {new Date(
                                        document.created_at,
                                      ).toLocaleDateString()}
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Status Updated:
                                      </span>
                                      <br />
                                      {document.verified_at
                                        ? new Date(
                                            document.verified_at,
                                          ).toLocaleDateString()
                                        : "Not reviewed"}
                                    </div>
                                  </div>

                                  {document.expiry_date && (
                                    <div className="mt-2 text-sm">
                                      <span className="font-medium text-foreground/60">
                                        Expires:
                                      </span>{" "}
                                      <span
                                        className={
                                          new Date(document.expiry_date) <
                                          new Date()
                                            ? "text-red-600 font-medium"
                                            : "text-foreground/60"
                                        }
                                      >
                                        {new Date(
                                          document.expiry_date,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}

                                  {document.rejection_reason && (
                                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                                      <span className="font-medium text-red-800">
                                        Rejection Reason:
                                      </span>
                                      <p className="text-red-700 mt-1">
                                        {document.rejection_reason}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="ml-4">
                                  <Button
                                    onClick={() =>
                                      window.open(document.file_url, "_blank")
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Document Upload Modal */}
                <Dialog
                  open={showDocumentModal}
                  onOpenChange={setShowDocumentModal}
                >
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* File Upload Section */}
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Select File *</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          {selectedFile ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center">
                                <Upload className="w-8 h-8 text-green-500" />
                              </div>
                              <p className="text-sm font-medium">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedFile(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 text-foreground/50 mx-auto" />
                              <p className="text-sm text-foreground/70">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-foreground/50">
                                PDF, DOC, DOCX, JPG, JPEG, PNG (max 50MB)
                              </p>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleFileSelection}
                                className="hidden"
                                id="modal-file-upload"
                              />
                              <Button
                                variant="outline"
                                onClick={() =>
                                  document
                                    .getElementById("modal-file-upload")
                                    ?.click()
                                }
                              >
                                Choose File
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Document Name Field */}
                      <div className="space-y-2">
                        <Label htmlFor="document-name">Document Name *</Label>
                        <Input
                          id="document-name"
                          value={documentName}
                          onChange={(e) => setDocumentName(e.target.value)}
                          placeholder="Enter document name"
                        />
                      </div>

                      {/* Document Type Field */}
                      <div className="space-y-2">
                        <Label htmlFor="document-type">Document Type *</Label>
                        <Select
                          value={selectedDocumentType}
                          onValueChange={setSelectedDocumentType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {documentUploadError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                          {documentUploadError}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDocumentModal(false);
                          setSelectedFile(null);
                          setSelectedDocumentType("");
                          setDocumentName("");
                          setDocumentUploadError("");
                        }}
                        disabled={documentUploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDocumentSubmit}
                        disabled={
                          !selectedFile ||
                          !selectedDocumentType ||
                          !documentName ||
                          documentUploading
                        }
                      >
                        {documentUploading ? "Uploading..." : "Upload Document"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>
            )}

            {/* Providers Tab */}
            {(isOwner || isDispatcher) && (
              <TabsContent value="providers" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Staff Management</h2>
                  <Button
                    className="bg-roam-blue hover:bg-roam-blue/90"
                    onClick={handleStartAddProvider}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                </div>

                {/* Full-width Team Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-roam-blue" />
                      Staff Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Number of Staff */}
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue mb-1">
                          {
                            teamProviders.filter(
                              (p) => p.provider_role !== "owner",
                            ).length
                          }
                        </div>
                        <div className="text-sm text-foreground/60">
                          Number of Staff
                        </div>
                      </div>

                      {/* Number Unverified */}
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600 mb-1">
                          {
                            teamProviders.filter(
                              (p) =>
                                p.provider_role !== "owner" &&
                                p.verification_status !== "approved",
                            ).length
                          }
                        </div>
                        <div className="text-sm text-foreground/60">
                          Number Unverified
                        </div>
                      </div>

                      {/* Number Self Managed */}
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {
                            teamProviders.filter(
                              (p) =>
                                p.provider_role !== "owner" &&
                                !p.business_managed,
                            ).length
                          }
                        </div>
                        <div className="text-sm text-foreground/60">
                          Number Self Managed
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Provider List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Manage Staff Members</span>
                      <Button
                        variant="outline"
                        onClick={fetchTeamProviders}
                        disabled={providersLoading}
                        size="sm"
                      >
                        ����� Refresh
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Filters */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Provider Role Filter */}
                      <div>
                        <Label
                          htmlFor="role-filter"
                          className="text-sm font-medium"
                        >
                          Filter by Role
                        </Label>
                        <Select
                          value={selectedProviderRoleFilter}
                          onValueChange={setSelectedProviderRoleFilter}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="All Roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="dispatcher">
                              Dispatcher
                            </SelectItem>
                            <SelectItem value="provider">Provider</SelectItem>
                            {businessDetailsForm.business_type ===
                              "independent" && (
                              <SelectItem value="owner">Owner</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Verification Status Filter */}
                      <div>
                        <Label
                          htmlFor="verification-filter"
                          className="text-sm font-medium"
                        >
                          Filter by Verification Status
                        </Label>
                        <Select
                          value={selectedVerificationStatusFilter}
                          onValueChange={setSelectedVerificationStatusFilter}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="All Statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="documents_submitted">
                              Documents Submitted
                            </SelectItem>
                            <SelectItem value="under_review">
                              Under Review
                            </SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Active Status Filter */}
                      <div>
                        <Label
                          htmlFor="active-filter"
                          className="text-sm font-medium"
                        >
                          Filter by Active Status
                        </Label>
                        <Select
                          value={selectedActiveStatusFilter}
                          onValueChange={setSelectedActiveStatusFilter}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {providersError && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                        {providersError}
                      </div>
                    )}

                    {providersLoading ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p>Loading team members...</p>
                      </div>
                    ) : teamProviders.filter((tp) =>
                        businessDetailsForm.business_type === "independent"
                          ? true
                          : tp.provider_role !== "owner",
                      ).length > 0 ? (
                      <div className="space-y-4">
                        {/* Show filtered count */}
                        {(selectedProviderRoleFilter !== "all" ||
                          selectedVerificationStatusFilter !== "all" ||
                          selectedActiveStatusFilter !== "all" ||
                          teamProviders.some(
                            (tp) => tp.provider_role === "owner",
                          )) && (
                          <div className="text-sm text-foreground/60 pb-2 border-b">
                            Showing{" "}
                            {
                              teamProviders.filter(
                                (tp) =>
                                  (businessDetailsForm.business_type ===
                                  "independent"
                                    ? true
                                    : tp.provider_role !== "owner") &&
                                  (selectedProviderRoleFilter === "all" ||
                                    tp.provider_role ===
                                      selectedProviderRoleFilter) &&
                                  (selectedVerificationStatusFilter === "all" ||
                                    tp.verification_status ===
                                      selectedVerificationStatusFilter) &&
                                  (selectedActiveStatusFilter === "all" ||
                                    tp.is_active.toString() ===
                                      selectedActiveStatusFilter),
                              ).length
                            }{" "}
                            of{" "}
                            {
                              teamProviders.filter((tp) =>
                                businessDetailsForm.business_type ===
                                "independent"
                                  ? true
                                  : tp.provider_role !== "owner",
                              ).length
                            }{" "}
                            staff members
                          </div>
                        )}
                        {teamProviders
                          .filter(
                            (teamProvider) =>
                              (businessDetailsForm.business_type ===
                              "independent"
                                ? true
                                : teamProvider.provider_role !== "owner") &&
                              (selectedProviderRoleFilter === "all" ||
                                teamProvider.provider_role ===
                                  selectedProviderRoleFilter) &&
                              (selectedVerificationStatusFilter === "all" ||
                                teamProvider.verification_status ===
                                  selectedVerificationStatusFilter) &&
                              (selectedActiveStatusFilter === "all" ||
                                teamProvider.is_active.toString() ===
                                  selectedActiveStatusFilter),
                          )
                          .map((teamProvider) => (
                            <div
                              key={teamProvider.id}
                              className="flex items-center justify-between p-4 bg-accent/20 rounded-lg border hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center">
                                  {teamProvider.image_url ? (
                                    <img
                                      src={teamProvider.image_url}
                                      alt={`${teamProvider.first_name} ${teamProvider.last_name}`}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-semibold">
                                      {teamProvider.first_name?.charAt(0)}
                                      {teamProvider.last_name?.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold">
                                    {teamProvider.first_name}{" "}
                                    {teamProvider.last_name}
                                  </h3>
                                  <p className="text-sm text-foreground/60">
                                    {teamProvider.email}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-foreground/60 mt-1">
                                    <span className="capitalize">
                                      {teamProvider.provider_role || "Provider"}
                                    </span>
                                    {teamProvider.business_locations &&
                                    teamProvider.location_id ? (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>
                                          {
                                            teamProvider.business_locations
                                              .location_name
                                          }
                                          {teamProvider.business_locations
                                            .is_primary && (
                                            <Badge
                                              variant="secondary"
                                              className="ml-1 text-xs"
                                            >
                                              Primary
                                            </Badge>
                                          )}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-foreground/40">
                                          No location assigned
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                  {/* Background Approval Toggle */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleBackgroundApproval(
                                        teamProvider,
                                      )
                                    }
                                    disabled={
                                      providerActionLoading ||
                                      teamProvider.provider_role === "owner"
                                    }
                                    className={
                                      teamProvider.background_check_status ===
                                        "approved" ||
                                      teamProvider.provider_role === "owner"
                                        ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                        : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {teamProvider.background_check_status ===
                                      "approved" ||
                                    teamProvider.provider_role === "owner"
                                      ? "Background ��"
                                      : "Approve BG"}
                                  </Button>

                                  {/* Verification Approval Toggle */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleVerificationApproval(
                                        teamProvider,
                                      )
                                    }
                                    disabled={
                                      providerActionLoading ||
                                      teamProvider.provider_role === "owner"
                                    }
                                    className={
                                      teamProvider.verification_status ===
                                        "approved" ||
                                      teamProvider.provider_role === "owner"
                                        ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                        : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {teamProvider.verification_status ===
                                      "approved" ||
                                    teamProvider.provider_role === "owner"
                                      ? "Verified ✓"
                                      : "Verify"}
                                  </Button>

                                  {/* Active/Deactivate Toggle */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleToggleProviderActive(teamProvider)
                                    }
                                    disabled={
                                      providerActionLoading ||
                                      teamProvider.provider_role === "owner"
                                    }
                                    className={
                                      teamProvider.is_active ||
                                      teamProvider.provider_role === "owner"
                                        ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                        : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                                    }
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {teamProvider.is_active ||
                                    teamProvider.provider_role === "owner"
                                      ? "Active"
                                      : "Activate"}
                                  </Button>

                                  {/* Edit Provider */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleEditProvider(teamProvider)
                                    }
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-foreground/60">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No staff members found</p>
                        <p className="text-sm mb-4">
                          Start building your team by inviting staff to join
                          your business
                        </p>
                        <Button
                          className="bg-roam-blue hover:bg-roam-blue/90"
                          onClick={handleStartAddProvider}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Invite Your First Staff
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Locations Tab */}
            {(isOwner || isDispatcher) && (
              <TabsContent value="locations" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Business Locations</h2>
                  <Button
                    onClick={() => {
                      setAddingLocation(true);
                      setManagingLocations(true);
                      if (!locations.length && !locationsLoading) {
                        fetchLocations();
                      }
                    }}
                    className="bg-roam-blue hover:bg-roam-blue/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </div>

                {/* Full-width Locations Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-roam-blue" />
                      Locations Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Total Locations */}
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue mb-1">
                          {locations.length}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Total Locations
                        </div>
                      </div>

                      {/* Active Locations */}
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue mb-1">
                          {locations.filter((loc) => loc.is_active).length}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Active Locations
                        </div>
                      </div>

                      {/* Mobile Service Areas */}
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue mb-1">
                          {
                            locations.filter(
                              (loc) => loc.offers_mobile_services,
                            ).length
                          }
                        </div>
                        <div className="text-sm text-foreground/60">
                          Mobile Service Areas
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Locations List */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {locationsLoading ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p>Loading locations...</p>
                      </div>
                    ) : locations.length > 0 ? (
                      <div className="space-y-4">
                        {locations.map((location) => (
                          <Card key={location.id} className="border">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold">
                                      {location.location_name}
                                    </h4>
                                    {location.is_primary && (
                                      <Badge className="bg-roam-blue/20 text-roam-blue">
                                        Primary
                                      </Badge>
                                    )}
                                    {!location.is_active && (
                                      <Badge
                                        variant="outline"
                                        className="text-red-600 border-red-300"
                                      >
                                        Inactive
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-foreground/70 space-y-1">
                                    <p>{location.address_line1}</p>
                                    {location.address_line2 && (
                                      <p>{location.address_line2}</p>
                                    )}
                                    <p>
                                      {location.city}, {location.state}{" "}
                                      {location.postal_code}
                                    </p>
                                    <p>{location.country}</p>
                                    {location.offers_mobile_services && (
                                      <p className="text-roam-blue">
                                        <Smartphone className="w-4 h-4 inline mr-1" />
                                        Mobile services within{" "}
                                        {location.mobile_service_radius} miles
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditLocation(location)}
                                    disabled={locationsSaving}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteLocation(location.id)
                                    }
                                    disabled={locationsSaving}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-foreground/60">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No locations added yet</p>
                        <p className="text-sm mb-4">
                          Add your first business location to get started
                        </p>
                        <Button
                          onClick={() => {
                            setAddingLocation(true);
                            setManagingLocations(true);
                            resetLocationForm();
                          }}
                          className="bg-roam-blue hover:bg-roam-blue/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Location
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Provider Services Tab */}
            {isProvider && !isOwner && !isDispatcher && (
              <TabsContent value="provider-services" className="space-y-6">
                <h2 className="text-2xl font-bold">My Services</h2>

                {providerServicesError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    {providerServicesError}
                  </div>
                )}

                {providerServicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading services...
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Assigned Services */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          My Assigned Services ({providerServices.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {providerServices.length === 0 ? (
                          <div className="text-center py-8 text-foreground/60">
                            <Star className="w-12 h-12 mx-auto mb-4 text-foreground/30" />
                            <p>No services assigned yet.</p>
                            <p className="text-sm mt-2">
                              Contact your manager to get services assigned.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {providerServices.map((service: any) => (
                              <div
                                key={service.id}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">
                                      {service.services.name}
                                    </h4>
                                    <p className="text-sm text-foreground/60 mt-1">
                                      {service.services.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-foreground/60 mt-3">
                                      <div>
                                        <span className="font-medium text-green-700">
                                          Business Price:
                                        </span>
                                        <br />$
                                        {service.custom_price ||
                                          service.services.min_price}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Status:
                                        </span>
                                        <br />
                                        <Badge
                                          variant={
                                            service.is_active
                                              ? "default"
                                              : "secondary"
                                          }
                                        >
                                          {service.is_active
                                            ? "Active"
                                            : "Inactive"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Assigned Add-ons */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="w-5 h-5 text-blue-600" />
                          My Add-ons ({assignedProviderAddons.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {assignedProviderAddons.length === 0 ? (
                          <div className="text-center py-8 text-foreground/60">
                            <Plus className="w-12 h-12 mx-auto mb-4 text-foreground/30" />
                            <p>No add-ons assigned yet.</p>
                            <p className="text-sm mt-2">
                              Contact your manager to get add-ons assigned.
                            </p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {assignedProviderAddons.map((addon: any) => (
                              <div
                                key={addon.id}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">
                                      {addon.service_addons.name}
                                    </h4>
                                    <p className="text-sm text-foreground/60 mt-1">
                                      {addon.service_addons.description}
                                    </p>
                                    <div className="flex justify-between items-center mt-3">
                                      <div className="text-sm">
                                        <span className="font-medium text-green-700">
                                          Business Price: $
                                          {addon.custom_price || "Not set"}
                                        </span>
                                      </div>
                                      <Badge
                                        variant={
                                          addon.is_active
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {addon.is_active
                                          ? "Active"
                                          : "Inactive"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Available Services - only show for non-provider roles */}
                    {availableProviderServices.length > 0 &&
                      provider?.provider_role !== "provider" && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-600" />
                              Available Services (
                              {availableProviderServices.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/60 mb-4">
                              These services are available but not yet assigned
                              to you.
                            </p>
                            <div className="grid gap-4">
                              {availableProviderServices.map((service: any) => (
                                <div
                                  key={service.id}
                                  className="border rounded-lg p-4 bg-muted/20"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-foreground">
                                        {service.name}
                                      </h4>
                                      <p className="text-sm text-foreground/60 mt-1">
                                        {service.description}
                                      </p>
                                      <div className="grid grid-cols-2 gap-4 text-sm text-foreground/60 mt-3">
                                        <div>
                                          <span className="font-medium">
                                            Category:
                                          </span>
                                          <br />
                                          {service.service_subcategories
                                            ?.service_categories
                                            ?.service_category_type ||
                                            "Uncategorized"}
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            Base Price:
                                          </span>
                                          <br />${service.min_price}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <h2 className="text-2xl font-bold">Provider Profile</h2>

              {/* Unified Profile Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Error and Success Messages */}
                  {(profileError || avatarError || bannerError) && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {profileError || avatarError || bannerError}
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                      {profileSuccess}
                    </div>
                  )}

                  {/* Cover Image Section - First */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-lg mb-4">Cover Image</h3>
                      <div className="relative">
                        <div
                          className="w-full h-32 bg-gradient-to-r from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={
                            provider?.cover_image_url
                              ? handleProviderImagePositionClick
                              : undefined
                          }
                        >
                          {provider?.cover_image_url ? (
                            <img
                              src={provider.cover_image_url}
                              alt="Cover Image"
                              className="w-full h-full object-cover transition-all duration-300"
                              style={{ objectPosition: providerCoverPosition }}
                            />
                          ) : (
                            <div className="text-center text-white">
                              <Camera className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">No cover image</p>
                            </div>
                          )}
                        </div>
                        {bannerUploading && (
                          <div className="absolute inset-0 w-full h-32 bg-black/50 rounded-lg flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {provider?.cover_image_url && (
                          <div className="absolute top-2 right-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowProviderPositionControls(
                                  !showProviderPositionControls,
                                )
                              }
                              className="bg-white/90 hover:bg-white"
                            >
                              <Move className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {bannerError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                          {bannerError}
                        </div>
                      )}

                      {/* Provider Position Controls */}
                      {provider?.cover_image_url &&
                        showProviderPositionControls && (
                          <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <Move className="w-4 h-4" />
                              Cover Image Position Controls
                            </h4>
                            <div className="space-y-3">
                              <p className="text-xs text-gray-600">
                                Click on the image above to set focal point, or
                                use preset positions:
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("0% 0%")
                                  }
                                  className="text-xs"
                                >
                                  Top Left
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("50% 0%")
                                  }
                                  className="text-xs"
                                >
                                  Top Center
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("100% 0%")
                                  }
                                  className="text-xs"
                                >
                                  Top Right
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("0% 50%")
                                  }
                                  className="text-xs"
                                >
                                  Center Left
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("50% 50%")
                                  }
                                  className="text-xs bg-roam-blue text-white border-roam-blue"
                                >
                                  Center
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("100% 50%")
                                  }
                                  className="text-xs"
                                >
                                  Center Right
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("0% 100%")
                                  }
                                  className="text-xs"
                                >
                                  Bottom Left
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("50% 100%")
                                  }
                                  className="text-xs"
                                >
                                  Bottom Center
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("100% 100%")
                                  }
                                  className="text-xs"
                                >
                                  Bottom Right
                                </Button>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-xs text-gray-600">
                                  Current position: {providerCoverPosition}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleProviderPresetPosition("50% 50%")
                                  }
                                  className="text-xs"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Reset
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                      <div className="flex gap-2 justify-center mt-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                          id="banner-upload"
                          disabled={bannerUploading || profileSaving}
                        />
                        <Button
                          variant="outline"
                          className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                          onClick={() =>
                            document.getElementById("banner-upload")?.click()
                          }
                          disabled={bannerUploading || profileSaving}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {provider?.cover_image_url
                            ? "Change Cover"
                            : "Upload Cover"}
                        </Button>

                        {provider?.cover_image_url && (
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={handleBannerRemove}
                            disabled={bannerUploading || profileSaving}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-foreground/60 text-center mt-2">
                        Upload a cover image for your profile (max 10MB).
                        Recommended size: 800x200px
                      </p>
                    </CardContent>
                  </Card>

                  {/* Profile Photo and Contact Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Photo Section */}
                    <div className="text-center space-y-4">
                      <h3 className="font-medium text-lg mb-4">
                        Profile Photo
                      </h3>
                      <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto overflow-hidden">
                          {provider?.image_url ? (
                            <img
                              src={provider.image_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-16 h-16 text-white" />
                          )}
                        </div>
                        {avatarUploading && (
                          <div className="absolute inset-0 w-32 h-32 bg-black/50 rounded-full flex items-center justify-center mx-auto">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                          disabled={avatarUploading || profileSaving}
                        />
                        <Button
                          variant="outline"
                          className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                          disabled={avatarUploading || profileSaving}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          {provider?.image_url
                            ? "Change Photo"
                            : "Upload Photo"}
                        </Button>

                        {provider?.image_url && (
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={handleAvatarRemove}
                            disabled={avatarUploading || profileSaving}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-foreground/60">
                        Upload a professional photo (max 5MB)
                      </p>
                    </div>

                    {/* Contact Information Section */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="font-medium text-lg mb-4">
                        Contact Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) =>
                              handleFormChange("firstName", e.target.value)
                            }
                            disabled={
                              profileSaving ||
                              avatarUploading ||
                              bannerUploading
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) =>
                              handleFormChange("lastName", e.target.value)
                            }
                            disabled={
                              profileSaving ||
                              avatarUploading ||
                              bannerUploading
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                          title="Email address cannot be changed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            handleFormChange("phone", e.target.value)
                          }
                          disabled={
                            profileSaving || avatarUploading || bannerUploading
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) =>
                            handleFormChange("bio", e.target.value)
                          }
                          rows={4}
                          placeholder="Tell customers about your professional background and expertise..."
                          disabled={
                            profileSaving || avatarUploading || bannerUploading
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Single Save Button */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      className="bg-roam-blue hover:bg-roam-blue/90"
                      onClick={handleSaveProfile}
                      disabled={
                        profileSaving || avatarUploading || bannerUploading
                      }
                    >
                      {profileSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleFormChange("dateOfBirth", e.target.value)
                          }
                          disabled={profileSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experienceYears">
                          Years of Experience
                        </Label>
                        <Input
                          id="experienceYears"
                          type="number"
                          min="0"
                          max="50"
                          value={formData.experienceYears}
                          onChange={(e) =>
                            handleFormChange("experienceYears", e.target.value)
                          }
                          disabled={profileSaving}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">
                          Verification Status
                        </span>
                        <Badge
                          className={
                            provider?.verification_status === "verified"
                              ? "bg-green-100 text-green-800"
                              : provider?.verification_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {provider?.verification_status || "Unknown"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground/60">
                          Background Check
                        </span>
                        <Badge
                          className={
                            provider?.background_check_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : provider?.background_check_status ===
                                  "under_review"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {provider?.background_check_status || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.total_bookings || 0}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Total Bookings
                        </div>
                      </div>

                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.completed_bookings || 0}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Completed
                        </div>
                      </div>

                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.average_rating || "0.0"}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Average Rating
                        </div>
                      </div>

                      <div className="text-center p-4 bg-accent/20 rounded-lg">
                        <div className="text-2xl font-bold text-roam-blue">
                          {provider?.total_reviews || 0}
                        </div>
                        <div className="text-sm text-foreground/60">
                          Total Reviews
                        </div>
                      </div>
                    </div>

                    {provider?.provider_role && (
                      <div className="mt-4 p-4 bg-roam-light-blue/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground/60">
                            Provider Role
                          </span>
                          <Badge className="bg-roam-blue/20 text-roam-blue capitalize">
                            {provider.provider_role}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            {isOwner && (
              <TabsContent value="analytics" className="space-y-6">
                <h2 className="text-2xl font-bold">Business Analytics</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-roam-blue" />
                        Revenue Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-gradient-to-r from-roam-light-blue/20 to-roam-blue/20 rounded-lg flex items-center justify-center">
                        <p className="text-foreground/60">
                          Chart visualization would go here
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-roam-blue" />
                        Service Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Deep Tissue Massage</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div className="w-3/4 h-2 bg-roam-blue rounded-full"></div>
                            </div>
                            <span className="text-sm text-roam-blue">75%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Swedish Massage</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div className="w-1/2 h-2 bg-roam-light-blue rounded-full"></div>
                            </div>
                            <span className="text-sm text-roam-blue">50%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Sports Recovery</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div className="w-1/4 h-2 bg-roam-yellow rounded-full"></div>
                            </div>
                            <span className="text-sm text-roam-blue">25%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Financial Tab */}
            {isOwner && (
              <TabsContent value="financial" className="space-y-6">
                <h2 className="text-2xl font-bold">Financial Management</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Earnings Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-roam-blue" />
                        Earnings Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            This Month
                          </span>
                          <span className="text-xl font-semibold text-roam-blue">
                            $3,250
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Last Month
                          </span>
                          <span className="text-lg font-medium">$2,890</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Total Earned
                          </span>
                          <span className="text-lg font-medium">$47,325</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600">
                              Growth
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              +12.4%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pending Payments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-roam-yellow" />
                        Pending Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Outstanding
                          </span>
                          <span className="text-xl font-semibold text-roam-yellow">
                            $485
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Next Payout
                          </span>
                          <span className="text-sm font-medium">Tomorrow</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground/60">
                            Completed Services
                          </span>
                          <span className="text-sm font-medium">
                            3 bookings
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-roam-yellow text-roam-yellow hover:bg-roam-yellow hover:text-white"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payout Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-roam-blue" />
                        Payout Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">
                                S
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Stripe Connect
                              </p>
                              <p className="text-xs text-foreground/60">
                                acct_****4532
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">Connected</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <span className="text-xs font-bold text-green-600">
                                P
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Plaid Link</p>
                              <p className="text-xs text-foreground/60">
                                Bank verification
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Verified</Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-foreground/60">
                              Transfer Speed
                            </span>
                            <span className="font-medium">Instant</span>
                          </div>
                        </div>
                        <Button
                          onClick={handleManagePayout}
                          variant="outline"
                          className="w-full border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage Payout
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tax Information Management */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Tax Information</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Business Tax Registration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="w-5 h-5 text-roam-blue" />
                          Business Tax Registration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {taxInfoError && (
                          <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                            {taxInfoError}
                          </div>
                        )}

                        {taxInfoSuccess && (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded mb-4">
                            {taxInfoSuccess}
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="legal_business_name">
                                Legal Business Name *
                              </Label>
                              <Input
                                id="legal_business_name"
                                value={taxInfo.legal_business_name}
                                onChange={(e) =>
                                  handleTaxInfoChange(
                                    "legal_business_name",
                                    e.target.value,
                                  )
                                }
                                placeholder="Business legal name for tax purposes"
                                disabled={taxInfoSaving}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tax_id">Tax ID (EIN/SSN) *</Label>
                              <Input
                                id="tax_id"
                                value={taxInfo.tax_id}
                                onChange={(e) =>
                                  handleTaxInfoChange("tax_id", e.target.value)
                                }
                                placeholder="XX-XXXXXXX"
                                disabled={taxInfoSaving}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tax_id_type">Tax ID Type *</Label>
                              <Select
                                value={taxInfo.tax_id_type}
                                onValueChange={(value) =>
                                  handleTaxInfoChange("tax_id_type", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select ID type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EIN">
                                    EIN (Employer Identification Number)
                                  </SelectItem>
                                  <SelectItem value="SSN">
                                    SSN (Social Security Number)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="business_entity_type">
                                Business Entity Type *
                              </Label>
                              <Select
                                value={taxInfo.business_entity_type}
                                onValueChange={(value) =>
                                  handleTaxInfoChange(
                                    "business_entity_type",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select entity type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sole_proprietorship">
                                    Sole Proprietorship
                                  </SelectItem>
                                  <SelectItem value="partnership">
                                    Partnership
                                  </SelectItem>
                                  <SelectItem value="llc">LLC</SelectItem>
                                  <SelectItem value="corporation">
                                    Corporation
                                  </SelectItem>
                                  <SelectItem value="non_profit">
                                    Non-Profit
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tax_contact_name">
                              Tax Contact Name *
                            </Label>
                            <Input
                              id="tax_contact_name"
                              value={taxInfo.tax_contact_name}
                              onChange={(e) =>
                                handleTaxInfoChange(
                                  "tax_contact_name",
                                  e.target.value,
                                )
                              }
                              placeholder="Primary contact for tax matters"
                              disabled={taxInfoSaving}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tax_contact_email">
                                Tax Contact Email *
                              </Label>
                              <Input
                                id="tax_contact_email"
                                type="email"
                                value={taxInfo.tax_contact_email}
                                onChange={(e) =>
                                  handleTaxInfoChange(
                                    "tax_contact_email",
                                    e.target.value,
                                  )
                                }
                                placeholder="tax@yourbusiness.com"
                                disabled={taxInfoSaving}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tax_contact_phone">
                                Tax Contact Phone
                              </Label>
                              <Input
                                id="tax_contact_phone"
                                type="tel"
                                value={taxInfo.tax_contact_phone}
                                onChange={(e) =>
                                  handleTaxInfoChange(
                                    "tax_contact_phone",
                                    e.target.value,
                                  )
                                }
                                placeholder="(XXX) XXX-XXXX"
                                disabled={taxInfoSaving}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" disabled={taxInfoSaving}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSaveTaxInfo}
                              className="bg-roam-blue hover:bg-roam-blue/90"
                              disabled={taxInfoSaving}
                            >
                              {taxInfoSaving && (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              )}
                              Save Tax Info
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tax Address */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-roam-blue" />
                          Tax Mailing Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="tax_address_line1">
                              Address Line 1 *
                            </Label>
                            <Input
                              id="tax_address_line1"
                              value={taxInfo.tax_address_line1}
                              onChange={(e) =>
                                handleTaxInfoChange(
                                  "tax_address_line1",
                                  e.target.value,
                                )
                              }
                              placeholder="Street address"
                              disabled={taxInfoSaving}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tax_address_line2">
                              Address Line 2
                            </Label>
                            <Input
                              id="tax_address_line2"
                              value={taxInfo.tax_address_line2}
                              onChange={(e) =>
                                handleTaxInfoChange(
                                  "tax_address_line2",
                                  e.target.value,
                                )
                              }
                              placeholder="Apt, suite, etc."
                              disabled={taxInfoSaving}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tax_city">City *</Label>
                              <Input
                                id="tax_city"
                                value={taxInfo.tax_city}
                                onChange={(e) =>
                                  handleTaxInfoChange(
                                    "tax_city",
                                    e.target.value,
                                  )
                                }
                                placeholder="City"
                                disabled={taxInfoSaving}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tax_state">State *</Label>
                              <Select
                                value={taxInfo.tax_state}
                                onValueChange={(value) =>
                                  handleTaxInfoChange("tax_state", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FL">Florida</SelectItem>
                                  <SelectItem value="CA">California</SelectItem>
                                  <SelectItem value="NY">New York</SelectItem>
                                  <SelectItem value="TX">Texas</SelectItem>
                                  {/* Add more states as needed */}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tax_postal_code">
                                ZIP Code *
                              </Label>
                              <Input
                                id="tax_postal_code"
                                value={taxInfo.tax_postal_code}
                                onChange={(e) =>
                                  handleTaxInfoChange(
                                    "tax_postal_code",
                                    e.target.value,
                                  )
                                }
                                placeholder="12345"
                                disabled={taxInfoSaving}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Stripe Tax Status & 1099 Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-roam-blue" />
                          Stripe Tax Registration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              Registration Status
                            </span>
                            <Badge className="bg-green-100 text-green-800">
                              Registered
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              Stripe Tax ID
                            </span>
                            <span className="text-sm font-medium">
                              txr_****xyz123
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              Registration Date
                            </span>
                            <span className="text-sm font-medium">
                              Jan 15, 2024
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              W-9 Status
                            </span>
                            <Badge className="bg-green-100 text-green-800">
                              Received
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              Tax Setup
                            </span>
                            <Badge className="bg-green-100 text-green-800">
                              Complete
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-roam-blue" />
                          1099 Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              2024 Earnings
                            </span>
                            <span className="text-xl font-semibold text-roam-blue">
                              $47,325
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              1099 Threshold
                            </span>
                            <span className="text-sm font-medium">
                              $600 (Met)
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              Threshold Reached
                            </span>
                            <span className="text-sm font-medium">
                              Feb 12, 2024
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">
                              1099 Status
                            </span>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Will Generate
                            </Badge>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs text-foreground/60">
                              1099-NEC forms will be generated and sent by
                              January 31st of the following year.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-roam-blue" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Payment Received</p>
                            <p className="text-sm text-foreground/60">
                              Deep Tissue Massage - Sarah M.
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +$120.00
                          </p>
                          <p className="text-xs text-foreground/60">
                            Jan 15, 2024
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Payout Processed</p>
                            <p className="text-sm text-foreground/60">
                              Weekly earnings
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">$850.00</p>
                          <p className="text-xs text-foreground/60">
                            Jan 12, 2024
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">Service Fee</p>
                            <p className="text-sm text-foreground/60">
                              Platform commission (8%)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-600">-$9.60</p>
                          <p className="text-xs text-foreground/60">
                            Jan 15, 2024
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Payment Received</p>
                            <p className="text-sm text-foreground/60">
                              Couples Massage - John & Lisa D.
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +$240.00
                          </p>
                          <p className="text-xs text-foreground/60">
                            Jan 14, 2024
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <Button
                        variant="outline"
                        className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                      >
                        View All Transactions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-roam-blue" />
                        Payout Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto Payout</Label>
                          <p className="text-sm text-foreground/60">
                            Automatically transfer earnings weekly
                          </p>
                        </div>
                        <Switch
                          defaultChecked
                          className="data-[state=checked]:bg-roam-blue"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payout Day</Label>
                        <Select defaultValue="friday">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Payout Amount</Label>
                        <Input type="number" defaultValue="50" min="25" />
                        <p className="text-xs text-foreground/60">
                          Minimum $25. Earnings below this amount will roll over
                          to next payout.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-roam-blue" />
                        Tax Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Tax ID</p>
                          <p className="text-sm text-foreground/60">
                            ***-**-1234
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Documents</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-accent/20 rounded border">
                            <span className="text-sm">2024 1099-NEC</span>
                            <Badge variant="secondary">Available Soon</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-accent/20 rounded border">
                            <span className="text-sm">2023 1099-NEC</span>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-foreground/60">
                          Tax documents are typically available by January 31st
                          of the following year.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Subscription Tab - Owner Only */}
            {isOwner && (
              <TabsContent value="subscription" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Subscription Plans</h2>
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200"
                  >
                    30-Day Free Trial Available
                  </Badge>
                </div>

                {currentSubscription && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                      <CardTitle className="text-blue-800">
                        Current Subscription
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {currentSubscription.plan_name}
                          </p>
                          <p className="text-sm text-foreground/60">
                            Status: {currentSubscription.subscription_status}
                          </p>
                          <p className="text-sm text-foreground/60">
                            Next billing: {currentSubscription.end_date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ${currentSubscription.price}/month
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subscriptionPlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`relative ${plan.recommended ? "border-blue-500 shadow-lg scale-105" : "border-gray-200"}`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-blue-500 text-white">
                            Recommended
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="text-center">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <div className="space-y-2">
                          <div className="text-4xl font-bold text-roam-blue">
                            ${plan.price}
                            <span className="text-lg font-normal text-foreground/60">
                              /month
                            </span>
                          </div>
                          <p className="text-sm text-foreground/60">
                            {plan.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {plan.staffLimit}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-4">
                          <Button
                            onClick={() => handleSelectPlan(plan.id)}
                            disabled={
                              subscriptionLoading || selectedPlan === plan.id
                            }
                            className={`w-full ${plan.recommended ? "bg-blue-500 hover:bg-blue-600" : "bg-roam-blue hover:bg-roam-blue/90"}`}
                          >
                            {subscriptionLoading && selectedPlan === plan.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Start Free Trial
                                <span className="ml-2 text-xs opacity-80">
                                  30 days free
                                </span>
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      What's Included in All Plans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-medium">Core Features</h4>
                        <ul className="space-y-1 text-foreground/70">
                          <li>• SSL Security</li>
                          <li>• 24/7 Support</li>
                          <li>• Mobile Apps</li>
                          <li>• Data Backup</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Business Tools</h4>
                        <ul className="space-y-1 text-foreground/70">
                          <li>�� Online Booking</li>
                          <li>• Payment Processing</li>
                          <li>• Customer Management</li>
                          <li>• Calendar Sync</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Growth Features</h4>
                        <ul className="space-y-1 text-foreground/70">
                          <li>• Analytics Dashboard</li>
                          <li>• Marketing Tools</li>
                          <li>• API Access</li>
                          <li>• Integrations</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center space-y-2 pt-4">
                  <p className="text-sm text-foreground/60">
                    All plans include a 30-day free trial. Cancel anytime.
                  </p>
                  <p className="text-xs text-foreground/50">
                    Powered by Stripe. Secure and reliable payment processing.
                  </p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Location Management Modal */}
      {managingLocations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Locations</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setManagingLocations(false);
                  setAddingLocation(false);
                  setEditingLocation(null);
                  resetLocationForm();
                }}
              >
                ×
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {locationsError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                  {locationsError}
                </div>
              )}

              {locationsSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded mb-4">
                  {locationsSuccess}
                </div>
              )}

              {!addingLocation ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                      Business Locations
                    </h3>
                    <Button
                      onClick={() => {
                        setAddingLocation(true);
                        if (!locations.length && !locationsLoading) {
                          fetchLocations();
                        }
                      }}
                      className="bg-roam-blue hover:bg-roam-blue/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </div>

                  {locationsLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p>Loading locations...</p>
                    </div>
                  ) : locations.length > 0 ? (
                    <div className="space-y-4">
                      {locations.map((location) => (
                        <Card key={location.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">
                                    {location.location_name}
                                  </h4>
                                  {location.is_primary && (
                                    <Badge className="bg-roam-blue/20 text-roam-blue">
                                      Primary
                                    </Badge>
                                  )}
                                  {!location.is_active && (
                                    <Badge
                                      variant="outline"
                                      className="text-red-600 border-red-300"
                                    >
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-foreground/70 space-y-1">
                                  <p>{location.address_line1}</p>
                                  {location.address_line2 && (
                                    <p>{location.address_line2}</p>
                                  )}
                                  <p>
                                    {location.city}, {location.state}{" "}
                                    {location.postal_code}
                                  </p>
                                  <p>{location.country}</p>
                                  {location.offers_mobile_services && (
                                    <p className="text-roam-blue">
                                      <Smartphone className="w-4 h-4 inline mr-1" />
                                      Mobile services within{" "}
                                      {location.mobile_service_radius} miles
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLocation(location)}
                                  disabled={locationsSaving}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteLocation(location.id)
                                  }
                                  disabled={locationsSaving}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-foreground/60">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No locations added yet</p>
                      <p className="text-sm">
                        Add your first business location to get started
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Location Form */
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    {editingLocation ? "Edit Location" : "Add New Location"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location_name">Location Name *</Label>
                      <Input
                        id="location_name"
                        value={locationForm.location_name}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "location_name",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., Downtown Office, Main Store"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line1">Address Line 1 *</Label>
                      <Input
                        id="address_line1"
                        value={locationForm.address_line1}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "address_line1",
                            e.target.value,
                          )
                        }
                        placeholder="Street address"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">Address Line 2</Label>
                      <Input
                        id="address_line2"
                        value={locationForm.address_line2}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "address_line2",
                            e.target.value,
                          )
                        }
                        placeholder="Apt, suite, unit, etc."
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={locationForm.city}
                        onChange={(e) =>
                          handleLocationFormChange("city", e.target.value)
                        }
                        placeholder="City"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={locationForm.state}
                        onChange={(e) =>
                          handleLocationFormChange("state", e.target.value)
                        }
                        placeholder="State"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={locationForm.postal_code}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "postal_code",
                            e.target.value,
                          )
                        }
                        placeholder="ZIP/Postal code"
                        disabled={locationsSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={locationForm.country}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        title="Country cannot be changed"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile_radius">
                        Mobile Service Radius (miles)
                      </Label>
                      <Input
                        id="mobile_radius"
                        type="number"
                        min="0"
                        max="100"
                        value={locationForm.mobile_service_radius}
                        onChange={(e) =>
                          handleLocationFormChange(
                            "mobile_service_radius",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        disabled={
                          locationsSaving ||
                          !locationForm.offers_mobile_services
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Primary Location</Label>
                        <p className="text-sm text-foreground/60">
                          Make this the main business location (only one primary
                          allowed)
                        </p>
                      </div>
                      <Switch
                        checked={locationForm.is_primary}
                        onCheckedChange={(checked) =>
                          handleLocationFormChange("is_primary", checked)
                        }
                        disabled={locationsSaving}
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Offers Mobile Services</Label>
                        <p className="text-sm text-foreground/60">
                          Services can be provided at customer locations
                        </p>
                      </div>
                      <Switch
                        checked={locationForm.offers_mobile_services}
                        onCheckedChange={(checked) =>
                          handleLocationFormChange(
                            "offers_mobile_services",
                            checked,
                          )
                        }
                        disabled={locationsSaving}
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Active Location</Label>
                        <p className="text-sm text-foreground/60">
                          Location is currently operational
                        </p>
                      </div>
                      <Switch
                        checked={locationForm.is_active}
                        onCheckedChange={(checked) =>
                          handleLocationFormChange("is_active", checked)
                        }
                        disabled={locationsSaving}
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleSaveLocation}
                      disabled={locationsSaving}
                      className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                    >
                      {locationsSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          {editingLocation ? "Update Location" : "Add Location"}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelLocationEdit}
                      disabled={locationsSaving}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Service</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelServiceEdit}
              >
                ×
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {serviceError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {typeof serviceError === "string"
                    ? serviceError
                    : "An error occurred while updating the service"}
                </div>
              )}

              {serviceSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {serviceSuccess}
                </div>
              )}

              {/* Service Info */}
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {editingService.services?.name}
                </h3>
                <p className="text-sm text-foreground/60">
                  {editingService.services?.service_subcategories
                    ?.service_categories?.description ||
                    editingService.services?.service_subcategories
                      ?.service_categories?.service_category_type}{" "}
                  ���{" "}
                  {editingService.services?.service_subcategories
                    ?.description ||
                    editingService.services?.service_subcategories
                      ?.service_subcategory_type}
                </p>
              </div>

              {/* Delivery Type */}
              <div className="space-y-2">
                <Label htmlFor="delivery_type">Delivery Type</Label>
                <Select
                  value={serviceForm.delivery_type}
                  onValueChange={(value) =>
                    handleServiceFormChange("delivery_type", value)
                  }
                  disabled={serviceSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_location">Business</SelectItem>
                    <SelectItem value="customer_location">Mobile</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="both_locations">
                      Business or Mobile
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Price */}
              <div className="space-y-2">
                <Label htmlFor="custom_price">Business Price ($)</Label>
                <Input
                  id="custom_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceForm.custom_price}
                  onChange={(e) =>
                    handleServiceFormChange("custom_price", e.target.value)
                  }
                  placeholder={`Default: $${editingService.services?.min_price || "0"}`}
                  disabled={serviceSaving}
                />
                <p className="text-xs text-foreground/60">
                  Leave empty to use default service price
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Service Active</Label>
                  <p className="text-sm text-foreground/60">
                    Allow bookings for this service
                  </p>
                </div>
                <Switch
                  checked={serviceForm.is_active}
                  onCheckedChange={(checked) =>
                    handleServiceFormChange("is_active", checked)
                  }
                  disabled={serviceSaving}
                  className="data-[state=checked]:bg-roam-blue"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveService}
                  disabled={serviceSaving}
                  className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                >
                  {serviceSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Service
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelServiceEdit}
                  disabled={serviceSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {addingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Service</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelAddService}
              >
                ×
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {serviceError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {typeof serviceError === "string"
                    ? serviceError
                    : "An error occurred while processing the service"}
                </div>
              )}

              {serviceSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {serviceSuccess}
                </div>
              )}

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service_selection">Select Service</Label>
                {availableServicesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="w-6 h-6 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading services...
                  </div>
                ) : availableServices.length > 0 ? (
                  <Select
                    value={selectedServiceId}
                    onValueChange={setSelectedServiceId}
                    disabled={serviceSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a service to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-xs text-foreground/60">
                              {service.service_subcategories?.service_categories
                                ?.description ||
                                service.service_subcategories
                                  ?.service_categories
                                  ?.service_category_type}{" "}
                              →{" "}
                              {service.service_subcategories?.description ||
                                service.service_subcategories
                                  ?.service_subcategory_type}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-4 text-foreground/60">
                    <p className="text-sm">
                      All available services have been added to your business
                    </p>
                  </div>
                )}
              </div>

              {/* Service Details */}
              {selectedServiceId &&
                (() => {
                  const selectedService = availableServices.find(
                    (s) => s.id === selectedServiceId,
                  );
                  return selectedService ? (
                    <div className="p-4 bg-accent/20 rounded-lg">
                      <h4 className="font-medium mb-2">
                        {selectedService.name}
                      </h4>
                      {selectedService.description && (
                        <p className="text-sm text-foreground/60 mb-2">
                          {selectedService.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-foreground/60">
                            Default Price:
                          </span>
                          <span className="font-medium ml-2">
                            ${selectedService.min_price || "0"}
                          </span>
                        </div>
                        <div>
                          <span className="text-foreground/60">Duration:</span>
                          <span className="font-medium ml-2">
                            {selectedService.duration_minutes || "N/A"} mins
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

              {/* Delivery Type */}
              <div className="space-y-2">
                <Label htmlFor="add_delivery_type">Delivery Type</Label>
                <Select
                  value={addServiceForm.delivery_type}
                  onValueChange={(value) =>
                    handleAddServiceFormChange("delivery_type", value)
                  }
                  disabled={serviceSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_location">Business</SelectItem>
                    <SelectItem value="customer_location">Mobile</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="both_locations">
                      Business or Mobile
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Price */}
              <div className="space-y-2">
                <Label htmlFor="add_custom_price">Business Price ($)</Label>
                <Input
                  id="add_custom_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={addServiceForm.custom_price}
                  onChange={(e) =>
                    handleAddServiceFormChange("custom_price", e.target.value)
                  }
                  placeholder={
                    selectedServiceId
                      ? `Default: $${availableServices.find((s) => s.id === selectedServiceId)?.min_price || "0"}`
                      : "Enter custom price"
                  }
                  disabled={serviceSaving}
                />
                <p className="text-xs text-foreground/60">
                  Leave empty to use default service price
                </p>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Service Active</Label>
                  <p className="text-sm text-foreground/60">
                    Allow bookings for this service immediately
                  </p>
                </div>
                <Switch
                  checked={addServiceForm.is_active}
                  onCheckedChange={(checked) =>
                    handleAddServiceFormChange("is_active", checked)
                  }
                  disabled={serviceSaving}
                  className="data-[state=checked]:bg-roam-blue"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleAddService}
                  disabled={
                    serviceSaving ||
                    !selectedServiceId ||
                    availableServices.length === 0
                  }
                  className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                >
                  {serviceSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelAddService}
                  disabled={serviceSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-roam-blue" />
              {isProvider && !isOwner && !isDispatcher
                ? "My Calendar"
                : "Business Calendar"}
            </DialogTitle>
          </DialogHeader>

          {calendarLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-roam-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading calendar...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Calendar Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-roam-blue">
                        {calendarBookings.length}
                      </div>
                      <div className="text-sm text-foreground/60">
                        Total Bookings
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {
                          calendarBookings.filter(
                            (b) => b.booking_status === "confirmed",
                          ).length
                        }
                      </div>
                      <div className="text-sm text-foreground/60">
                        Confirmed
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {
                          calendarBookings.filter(
                            (b) => b.booking_status === "pending",
                          ).length
                        }
                      </div>
                      <div className="text-sm text-foreground/60">Pending</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {
                          calendarBookings.filter(
                            (b) => b.booking_status === "completed",
                          ).length
                        }
                      </div>
                      <div className="text-sm text-foreground/60">
                        Completed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bookings List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Upcoming & Recent Bookings
                </h3>
                {calendarBookings.length > 0 ? (
                  <div className="space-y-3">
                    {calendarBookings.map((booking) => {
                      const statusConfig = getStatusBadge(
                        booking.booking_status,
                      );
                      const DeliveryIcon = getDeliveryIcon(
                        booking.delivery_type || "business_location",
                      );
                      const bookingDate = new Date(booking.booking_date);
                      const isUpcoming = bookingDate >= new Date();

                      return (
                        <Card
                          key={booking.id}
                          className={`hover:shadow-md transition-shadow ${
                            isUpcoming ? "border-l-4 border-l-roam-blue" : ""
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`w-3 h-3 rounded-full mt-2 ${
                                    booking.booking_status === "confirmed"
                                      ? "bg-green-500"
                                      : booking.booking_status === "pending"
                                        ? "bg-yellow-500"
                                        : booking.booking_status === "completed"
                                          ? "bg-blue-500"
                                          : "bg-gray-500"
                                  }`}
                                ></div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">
                                      {booking.services?.name || "Service"}
                                    </h4>
                                    {isUpcoming && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Upcoming
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    {booking.customer_profiles?.image_url ? (
                                      <img
                                        src={
                                          booking.customer_profiles.image_url
                                        }
                                        alt="Customer"
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-sm text-gray-600 font-medium">
                                          {booking.customer_profiles?.first_name?.charAt(
                                            0,
                                          ) ||
                                            booking.guest_name?.charAt(0) ||
                                            "C"}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-foreground/80">
                                        {booking.customer_profiles
                                          ?.first_name &&
                                        booking.customer_profiles?.last_name
                                          ? `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`
                                          : booking.guest_name ||
                                            "Unknown Customer"}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-foreground/60">
                                        {booking.customer_profiles?.email && (
                                          <span>
                                            {booking.customer_profiles.email}
                                          </span>
                                        )}
                                        {booking.customer_profiles?.phone && (
                                          <span>
                                            ���������{" "}
                                            {booking.customer_profiles.phone}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Booking Reference */}
                                  {booking.booking_reference && (
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg border-l-4 border-roam-blue">
                                      <Hash className="w-4 h-4 text-roam-blue" />
                                      <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                          Booking Reference
                                        </span>
                                        <p className="text-sm font-mono font-semibold text-gray-900">
                                          {booking.booking_reference}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 text-sm text-foreground/60">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {bookingDate.toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {booking.start_time}
                                    </div>
                                    <div className="flex items-start gap-1 min-w-0">
                                      <DeliveryIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <div className="flex flex-col min-w-0">
                                        {(() => {
                                          const location =
                                            formatBookingLocation(booking);
                                          if (typeof location === "string") {
                                            return (
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm">
                                                  {location}
                                                </span>
                                                <button
                                                  onClick={() =>
                                                    openGoogleMaps(location)
                                                  }
                                                  className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                  title="Open in Google Maps for directions"
                                                >
                                                  <MapPin className="w-4 h-4" />
                                                </button>
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="min-w-0">
                                                <div className="flex items-start gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium">
                                                      {location.name}
                                                    </span>
                                                    {location.address && (
                                                      <span className="text-xs text-foreground/50 block truncate">
                                                        {location.address}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {location.address && (
                                                    <button
                                                      onClick={() =>
                                                        openGoogleMaps(
                                                          location.address,
                                                        )
                                                      }
                                                      className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                      title="Open in Google Maps for directions"
                                                    >
                                                      <MapPin className="w-4 h-4" />
                                                    </button>
                                                  )}
                                                </div>
                                                {location.instructions && (
                                                  <span className="text-xs text-blue-600 block truncate">
                                                    📝 {location.instructions}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    </div>
                                    {!isProvider || isOwner || isDispatcher ? (
                                      <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {booking.providers?.first_name}{" "}
                                        {booking.providers?.last_name}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={statusConfig.color}>
                                  {statusConfig.label}
                                </Badge>
                                <p className="text-lg font-semibold text-roam-blue mt-2">
                                  ${booking.total_amount || "0"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground/60">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No bookings found</p>
                    <p className="text-sm">
                      {isProvider && !isOwner && !isDispatcher
                        ? "You don't have any bookings yet"
                        : "No bookings found for this business"}
                    </p>
                  </div>
                )}
              </div>

              {/* Calendar Note */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Calendar View:</strong>{" "}
                  {isProvider && !isOwner && !isDispatcher
                    ? "This shows only your personal bookings and appointments."
                    : "This shows all bookings for your business across all providers."}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCalendar(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Provider Modal */}
      <Dialog open={addProviderModal} onOpenChange={setAddProviderModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-roam-blue" />
              Add New Staff - Step {addProviderStep} of 3
            </DialogTitle>
          </DialogHeader>

          {addProviderError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {addProviderError}
            </div>
          )}

          {addProviderSuccess && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
              {addProviderSuccess}
            </div>
          )}

          {/* Step 1: User Creation and Email Verification */}
          {addProviderStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Step 1: Create User Account
                </h3>
                <p className="text-sm text-foreground/60">
                  Create a new user account for the staff member. They will
                  receive a verification email.
                </p>

                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider_email">
                        Staff Email Address *
                      </Label>
                      <Input
                        id="provider_email"
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="staff@example.com"
                        disabled={addProviderLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_email">
                        Confirm Email Address *
                      </Label>
                      <Input
                        id="confirm_email"
                        type="email"
                        value={newUserForm.confirmEmail}
                        onChange={(e) =>
                          setNewUserForm((prev) => ({
                            ...prev,
                            confirmEmail: e.target.value,
                          }))
                        }
                        placeholder="staff@example.com"
                        disabled={addProviderLoading}
                      />
                    </div>
                    <Button
                      onClick={handleCreateUserAndSendOTP}
                      disabled={
                        addProviderLoading ||
                        !newUserForm.email ||
                        newUserForm.email !== newUserForm.confirmEmail
                      }
                      className="w-full bg-roam-blue hover:bg-roam-blue/90"
                    >
                      {addProviderLoading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      )}
                      Send Verification Email
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          Verification Email Sent
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        A verification email has been sent to{" "}
                        <strong>{newUserForm.email}</strong>. Please ask the
                        staff member to check their email and enter the OTP code
                        below.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otp_code">OTP Verification Code</Label>
                      <Input
                        id="otp_code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        disabled={addProviderLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setOtpSent(false)}
                        disabled={addProviderLoading}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleVerifyOTPAndProceed}
                        disabled={addProviderLoading || !otpCode}
                        className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                      >
                        {addProviderLoading && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        )}
                        Verify & Continue
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Provider Profile Information */}
          {addProviderStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 2: Staff Profile</h3>
                <p className="text-sm text-foreground/60">
                  Complete the staff member's profile information.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={providerForm.first_name}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      disabled={addProviderLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={providerForm.last_name}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      disabled={addProviderLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff_phone">Phone Number</Label>
                    <Input
                      id="staff_phone"
                      type="tel"
                      value={providerForm.phone}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="(XXX) XXX-XXXX"
                      disabled={addProviderLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff_role">Staff Role</Label>
                    <Select
                      value={providerForm.provider_role}
                      onValueChange={(value) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          provider_role: value,
                        }))
                      }
                      disabled={addProviderLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="dispatcher">Dispatcher</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={providerForm.date_of_birth}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          date_of_birth: e.target.value,
                        }))
                      }
                      disabled={addProviderLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience_years">
                      Years of Experience
                    </Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      max="50"
                      value={providerForm.experience_years}
                      onChange={(e) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          experience_years: e.target.value,
                        }))
                      }
                      disabled={addProviderLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider_location">Assigned Location</Label>
                  <Select
                    value={providerForm.location_id}
                    onValueChange={(value) =>
                      setProviderForm((prev) => ({
                        ...prev,
                        location_id: value,
                      }))
                    }
                    disabled={addProviderLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location assigned</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_name}{" "}
                          {location.is_primary && "(Primary)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Description</Label>
                  <Textarea
                    id="bio"
                    value={providerForm.bio}
                    onChange={(e) =>
                      setProviderForm((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Brief description of the staff member's background and expertise..."
                    disabled={addProviderLoading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddProviderStep(1)}
                    disabled={addProviderLoading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSaveProviderProfile}
                    disabled={
                      addProviderLoading ||
                      !providerForm.first_name ||
                      !providerForm.last_name
                    }
                    className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Management Settings */}
          {addProviderStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Step 3: Management Settings
                </h3>
                <p className="text-sm text-foreground/60">
                  Configure how this staff member will be managed and what
                  services they inherit.
                </p>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Staff Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Managed by Business</Label>
                        <p className="text-sm text-foreground/60">
                          Business controls this staff member's services and
                          settings
                        </p>
                      </div>
                      <Switch
                        checked={managementSettings.business_managed}
                        onCheckedChange={(checked) =>
                          setManagementSettings((prev) => ({
                            ...prev,
                            business_managed: checked,
                            inherit_business_services: checked,
                            inherit_business_addons: checked,
                          }))
                        }
                        className="data-[state=checked]:bg-roam-blue"
                      />
                    </div>

                    {managementSettings.business_managed && (
                      <div className="space-y-4 pl-4 border-l-2 border-roam-blue/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Inherit Business Services</Label>
                            <p className="text-sm text-foreground/60">
                              Automatically inherit all business services
                            </p>
                          </div>
                          <Switch
                            checked={
                              managementSettings.inherit_business_services
                            }
                            onCheckedChange={(checked) =>
                              setManagementSettings((prev) => ({
                                ...prev,
                                inherit_business_services: checked,
                              }))
                            }
                            className="data-[state=checked]:bg-roam-blue"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Inherit Business Add-ons</Label>
                            <p className="text-sm text-foreground/60">
                              Automatically inherit all business add-ons
                            </p>
                          </div>
                          <Switch
                            checked={managementSettings.inherit_business_addons}
                            onCheckedChange={(checked) =>
                              setManagementSettings((prev) => ({
                                ...prev,
                                inherit_business_addons: checked,
                              }))
                            }
                            className="data-[state=checked]:bg-roam-blue"
                          />
                        </div>
                      </div>
                    )}

                    {!managementSettings.business_managed && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>Self-Managed Staff:</strong> This staff member
                          will have full control over their services and
                          settings. They can still choose to inherit business
                          services and later modify them.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Email:</span>
                        <span>{newUserForm.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Name:</span>
                        <span>
                          {providerForm.first_name} {providerForm.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Role:</span>
                        <span className="capitalize">
                          {providerForm.provider_role}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Location:</span>
                        <span>
                          {providerForm.location_id
                            ? locations.find(
                                (l) => l.id === providerForm.location_id,
                              )?.location_name || "Unknown"
                            : "No location assigned"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Management:</span>
                        <span>
                          {managementSettings.business_managed
                            ? "Business Managed"
                            : "Self Managed"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddProviderStep(2)}
                    disabled={addProviderLoading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCompleteProviderCreation}
                    disabled={addProviderLoading}
                    className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
                  >
                    {addProviderLoading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    )}
                    Create Staff
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetAddProviderModal}
              disabled={addProviderLoading}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Provider Modal */}
      <Dialog open={manageProviderModal} onOpenChange={setManageProviderModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Provider - {managingProvider?.first_name}{" "}
              {managingProvider?.last_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {manageProviderError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {manageProviderError}
              </div>
            )}

            {manageProviderSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                {manageProviderSuccess}
              </div>
            )}

            {/* Provider Info Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Provider Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Email:</span>
                    <span>{managingProvider?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Phone:</span>
                    <span>{managingProvider?.phone || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Created:</span>
                    <span>
                      {managingProvider?.created_at
                        ? new Date(
                            managingProvider.created_at,
                          ).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/60">Experience:</span>
                    <span>
                      {managingProvider?.experience_years
                        ? `${managingProvider.experience_years} years`
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Management Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Management Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status & Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider_role">Provider Role</Label>
                    <Select
                      value={providerManagementForm.provider_role}
                      onValueChange={(value) =>
                        handleProviderManagementFormChange(
                          "provider_role",
                          value,
                        )
                      }
                      disabled={manageProviderLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="dispatcher">Dispatcher</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verification_status">
                      Verification Status
                    </Label>
                    <Select
                      value={providerManagementForm.verification_status}
                      onValueChange={(value) =>
                        handleProviderManagementFormChange(
                          "verification_status",
                          value,
                        )
                      }
                      disabled={manageProviderLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location Assignment */}
                <div className="space-y-2">
                  <Label htmlFor="location_assignment">Assigned Location</Label>
                  <Select
                    value={providerManagementForm.location_id}
                    onValueChange={(value) =>
                      handleProviderManagementFormChange("location_id", value)
                    }
                    disabled={manageProviderLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location assigned</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_name}{" "}
                          {location.is_primary && "(Primary)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider Management Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active Status</Label>
                      <p className="text-sm text-foreground/60">
                        Provider can receive bookings and access the platform
                      </p>
                    </div>
                    <Switch
                      checked={providerManagementForm.is_active}
                      onCheckedChange={(checked) =>
                        handleProviderManagementFormChange("is_active", checked)
                      }
                      disabled={manageProviderLoading}
                      className="data-[state=checked]:bg-roam-blue"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Business Managed</Label>
                      <p className="text-sm text-foreground/60">
                        Business controls this provider's services and settings
                      </p>
                    </div>
                    <Switch
                      checked={providerManagementForm.business_managed}
                      onCheckedChange={(checked) =>
                        handleProviderManagementFormChange(
                          "business_managed",
                          checked,
                        )
                      }
                      disabled={manageProviderLoading}
                      className="data-[state=checked]:bg-roam-blue"
                    />
                  </div>
                </div>

                {/* Service Management Status Display */}
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-medium mb-2">Service Management</h4>
                  <p className="text-sm text-foreground/60">
                    {providerManagementForm.business_managed
                      ? "This provider's services are managed by the business. They can view assigned services but cannot change assignments or pricing."
                      : "This provider has self-management enabled. They can activate/deactivate their service assignments, though pricing is still controlled by the business."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSaveProviderManagement}
                disabled={manageProviderLoading}
                className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
              >
                {manageProviderLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCloseManageProvider}
                disabled={manageProviderLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Business Service Modal */}
      <Dialog open={editServiceModal} onOpenChange={setEditServiceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Business Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">
                {editingBusinessService?.services?.name}
              </h4>
              <p className="text-sm text-foreground/60">
                Minimum price: $
                {editingBusinessService?.services?.min_price || "0"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_price">Business Price ($)</Label>
              <Input
                id="business_price"
                type="number"
                step="0.01"
                min={editingBusinessService?.services?.min_price || "0"}
                value={editServiceForm.business_price}
                onChange={(e) =>
                  setEditServiceForm((prev) => ({
                    ...prev,
                    business_price: e.target.value,
                  }))
                }
                placeholder="Enter business price"
              />
              <p className="text-xs text-foreground/60">
                Must be at least $
                {editingBusinessService?.services?.min_price || "0"} (service
                minimum)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_type">Delivery Type</Label>
              <Select
                value={editServiceForm.delivery_type}
                onValueChange={(value) =>
                  setEditServiceForm((prev) => ({
                    ...prev,
                    delivery_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_location">
                    Business Location
                  </SelectItem>
                  <SelectItem value="customer_location">
                    Customer Location
                  </SelectItem>
                  <SelectItem value="both_locations">Both</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditServiceModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveBusinessService}
                disabled={businessServicesSaving}
                className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
              >
                {businessServicesSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Business Add-on Modal */}
      <Dialog open={editAddonModal} onOpenChange={setEditAddonModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Business Add-on</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">
                {editingBusinessAddon?.service_addons?.name}
              </h4>
              <p className="text-sm text-foreground/60">
                Default price: $
                {editingBusinessAddon?.service_addons?.default_price || "0"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_price">Custom Price ($)</Label>
              <Input
                id="custom_price"
                type="number"
                step="0.01"
                min="0"
                value={editAddonForm.custom_price}
                onChange={(e) =>
                  setEditAddonForm((prev) => ({
                    ...prev,
                    custom_price: e.target.value,
                  }))
                }
                placeholder="Enter custom price"
              />
              <p className="text-xs text-foreground/60">
                Leave empty to use default price ($
                {editingBusinessAddon?.service_addons?.default_price || "0"})
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditAddonModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveBusinessAddon}
                disabled={businessServicesSaving}
                className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
              >
                {businessServicesSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Modal */}
      <Dialog open={editProviderModal} onOpenChange={setEditProviderModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[75vh]">
            {/* Basic Provider Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Staff Member Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={editProviderForm.first_name}
                    onChange={(e) =>
                      setEditProviderForm((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={editProviderForm.last_name}
                    onChange={(e) =>
                      setEditProviderForm((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={editProviderForm.email}
                  onChange={(e) =>
                    setEditProviderForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={editProviderForm.phone}
                  onChange={(e) =>
                    setEditProviderForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider_role">Provider Role</Label>
                <Select
                  value={editProviderForm.provider_role}
                  onValueChange={(value) =>
                    setEditProviderForm((prev) => ({
                      ...prev,
                      provider_role: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="dispatcher">Dispatcher</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_id">Location (Optional)</Label>
                <Select
                  value={editProviderForm.location_id}
                  onValueChange={(value) =>
                    setEditProviderForm((prev) => ({
                      ...prev,
                      location_id: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Location Assigned</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.location_name}{" "}
                        {location.is_primary && "(Primary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">Experience (Years)</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={editProviderForm.experience_years}
                  onChange={(e) =>
                    setEditProviderForm((prev) => ({
                      ...prev,
                      experience_years: e.target.value,
                    }))
                  }
                  placeholder="Years of experience"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="verification_status">
                    Verification Status
                  </Label>
                  <Select
                    value={editProviderForm.verification_status}
                    onValueChange={(value) =>
                      setEditProviderForm((prev) => ({
                        ...prev,
                        verification_status: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="documents_submitted">
                        Documents Submitted
                      </SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background_check_status">
                    Background Check
                  </Label>
                  <Select
                    value={editProviderForm.background_check_status}
                    onValueChange={(value) =>
                      setEditProviderForm((prev) => ({
                        ...prev,
                        background_check_status: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="business_managed"
                  checked={editProviderForm.business_managed}
                  onChange={(e) =>
                    setEditProviderForm((prev) => ({
                      ...prev,
                      business_managed: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="business_managed">Business Managed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editProviderForm.is_active}
                  onChange={(e) =>
                    setEditProviderForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            {/* Service & Addon Assignment - Only for provider role */}
            {editProviderForm.provider_role === "provider" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Service & Addon Assignment
                </h3>

                {/* Services Section */}
                <div className="space-y-4">
                  <h4 className="font-medium">Services</h4>

                  {/* Currently Assigned Services */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-green-700">
                      Currently Assigned Services
                    </h5>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-green-50">
                      {editAssignmentsLoading ? (
                        <p className="text-sm text-gray-500">
                          Loading assignments...
                        </p>
                      ) : editProviderServices.length > 0 ? (
                        <div className="space-y-2">
                          {editProviderServices.map((providerService: any) => (
                            <div
                              key={providerService.id}
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div className="flex-1">
                                <span className="text-sm font-medium">
                                  {providerService.services?.name ||
                                    "Unknown Service"}
                                </span>
                                <p className="text-xs text-gray-500">
                                  ${providerService.services?.min_price || 0}
                                </p>
                              </div>
                              <button
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                                onClick={() =>
                                  removeServiceFromProvider(
                                    providerService.id,
                                    editingProvider?.id,
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No services currently assigned
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Available to Assign Services */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-blue-700">
                      Available to Assign
                    </h5>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-blue-50">
                      {businessServicesData.length > 0 ? (
                        <div className="space-y-2">
                          {businessServicesData
                            .filter(
                              (service) =>
                                !editProviderServices.some(
                                  (ps) =>
                                    ps.services?.id === service.services?.id,
                                ),
                            )
                            .map((service) => (
                              <div
                                key={service.id}
                                className="flex items-center justify-between p-2 bg-white rounded border"
                              >
                                <div className="flex-1">
                                  <span className="text-sm font-medium">
                                    {service.services?.name ||
                                      "Unknown Service"}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    ${service.services?.min_price || 0}
                                  </p>
                                </div>
                                <button
                                  className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                                  onClick={() =>
                                    assignServiceToProvider(
                                      editingProvider?.id,
                                      service.services?.id,
                                    )
                                  }
                                >
                                  Assign
                                </button>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No business services available for assignment
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Addons Section */}
                <div className="space-y-4">
                  <h4 className="font-medium">Addons</h4>

                  {/* Currently Assigned Addons */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-green-700">
                      Currently Assigned Addons
                    </h5>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-green-50">
                      {editAssignmentsLoading ? (
                        <p className="text-sm text-gray-500">
                          Loading assignments...
                        </p>
                      ) : editProviderAddons.length > 0 ? (
                        <div className="space-y-2">
                          {editProviderAddons.map((providerAddon: any) => (
                            <div
                              key={providerAddon.id}
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div className="flex-1">
                                <span className="text-sm font-medium">
                                  {providerAddon.service_addons?.name ||
                                    "Unknown Addon"}
                                </span>
                              </div>
                              <button
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                                onClick={() =>
                                  removeAddonFromProvider(
                                    providerAddon.id,
                                    editingProvider?.id,
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No addons currently assigned
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Available to Assign Addons */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-blue-700">
                      Available to Assign
                    </h5>
                    <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-blue-50">
                      {businessAddonsData.length > 0 ? (
                        <div className="space-y-2">
                          {businessAddonsData
                            .filter(
                              (addon) =>
                                !editProviderAddons.some(
                                  (pa) =>
                                    pa.service_addons?.id ===
                                    addon.service_addons?.id,
                                ),
                            )
                            .map((addon) => (
                              <div
                                key={addon.id}
                                className="flex items-center justify-between p-2 bg-white rounded border"
                              >
                                <div className="flex-1">
                                  <span className="text-sm font-medium">
                                    {addon.service_addons?.name ||
                                      "Unknown Addon"}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    ${addon.custom_price || "No price set"}
                                  </p>
                                </div>
                                <button
                                  className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                                  onClick={() =>
                                    assignAddonToProvider(
                                      editingProvider?.id,
                                      addon.service_addons?.id,
                                    )
                                  }
                                >
                                  Assign
                                </button>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No business addons available for assignment
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - spans both columns */}
            <div className="lg:col-span-2 flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditProviderModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProvider}
                disabled={providerActionLoading}
                className="flex-1 bg-roam-blue hover:bg-roam-blue/90"
              >
                {providerActionLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversations Components */}
      <ConversationChat
        isOpen={messagingModal}
        onClose={handleCloseMessaging}
        booking={
          selectedBookingForMessaging
            ? {
                id: selectedBookingForMessaging.id,
                customer_name:
                  selectedBookingForMessaging.customer_profiles?.first_name ||
                  selectedBookingForMessaging.guest_name ||
                  "Customer",
                customer_email:
                  selectedBookingForMessaging.customer_profiles?.email ||
                  selectedBookingForMessaging.guest_email ||
                  "",
                customer_phone:
                  selectedBookingForMessaging.customer_profiles?.phone ||
                  selectedBookingForMessaging.guest_phone ||
                  "",
                service_name:
                  selectedBookingForMessaging.services?.name || "Service",
                provider_name:
                  `${provider?.first_name || ""} ${provider?.last_name || ""}`.trim() ||
                  "Provider",
                business_id: provider?.business_id || "",
                customer_id: selectedBookingForMessaging.customer_id,
                // Include the actual database profile objects
                customer_profiles:
                  selectedBookingForMessaging.customer_profiles,
                providers: selectedBookingForMessaging.providers,
              }
            : undefined
        }
      />

      <ConversationsList
        isOpen={conversationsListModal}
        onClose={handleCloseConversationsList}
      />

      {/* Delete Location Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogTrigger asChild>
          <button style={{ display: "none" }} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{locationToDelete?.location_name}
              "?
            </AlertDialogDescription>
            {locationToDelete?.is_primary && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 font-medium">
                  ⚠️ Warning: This is your primary location
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Deleting it will leave your business without a primary
                  location.
                </p>
              </div>
            )}
            <div className="mt-3 text-sm text-foreground/80">
              This action cannot be undone. Any bookings or assignments to this
              location may be affected.
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLocationToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLocation}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payout Management Modal */}
      <Dialog
        open={payoutManagementModal}
        onOpenChange={setPayoutManagementModal}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-roam-blue" />
              Manage Payouts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {plaidError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {plaidError}
              </div>
            )}

            {plaidSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                {plaidSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Bank Account Connection</h4>
                <p className="text-sm text-foreground/60 mb-4">
                  Connect your bank account securely through Plaid to receive
                  payouts from Stripe.
                </p>
              </div>

              {payoutInfo?.bank_connected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">
                          Bank Account Connected
                        </p>
                        <p className="text-sm text-green-600">
                          {payoutInfo?.bank_name} ****
                          {payoutInfo?.account_last4}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/60">
                        Payout Schedule
                      </span>
                      <span className="font-medium">
                        {payoutInfo?.payout_schedule || "Daily"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/60">Transfer Speed</span>
                      <span className="font-medium">
                        {payoutInfo?.transfer_speed || "Standard (2-3 days)"}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleDisconnectBankAccount}
                    disabled={stripeConnectLoading}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {stripeConnectLoading && (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    )}
                    Disconnect Bank Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Secure Connection
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      We use Plaid's bank-grade security to safely connect your
                      account. Your banking credentials are never stored on our
                      servers.
                    </p>
                  </div>

                  {!plaidLinkToken ? (
                    <Button
                      onClick={createPlaidLinkToken}
                      disabled={plaidLoading}
                      className="w-full bg-roam-blue hover:bg-roam-blue/90"
                    >
                      {plaidLoading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      )}
                      Connect Bank Account
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 text-center">
                          ✓ Connection token ready! Plaid Link should open
                          automatically.
                        </p>
                      </div>
                      <Button
                        onClick={openPlaidLink}
                        disabled={plaidLoading}
                        variant="outline"
                        className="w-full border-green-500 text-green-700 hover:bg-green-50"
                      >
                        {plaidLoading && (
                          <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                        )}
                        Open Plaid Link Manually
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-foreground/60 text-center">
                    By connecting your bank account, you agree to our terms of
                    service and Stripe's connected account agreement.
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPayoutManagementModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Booking Modal */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Decline Booking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBookingForDecline && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm">
                  {selectedBookingForDecline.services?.name || "Service"}
                </h4>
                <p className="text-sm text-gray-600">
                  Customer:{" "}
                  {selectedBookingForDecline.customer_profiles?.first_name}{" "}
                  {selectedBookingForDecline.customer_profiles?.last_name ||
                    selectedBookingForDecline.guest_name}
                </p>
                <p className="text-sm text-gray-600">
                  Date:{" "}
                  {new Date(
                    selectedBookingForDecline.booking_date,
                  ).toLocaleDateString()}{" "}
                  at {selectedBookingForDecline.start_time}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="decline-reason" className="text-sm font-medium">
                Decline Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="decline-reason"
                placeholder="Please provide a reason for declining this booking. This message will be visible to the customer."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                The customer will be able to see this reason in their booking
                details.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeclineModal(false);
                  setSelectedBookingForDecline(null);
                  setDeclineReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={declineBookingWithReason}
                disabled={!declineReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Decline Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-roam-blue" />
              Profile Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Notification Preferences</h3>

            <Card>
              <CardContent className="space-y-6 pt-6">
                {/* Notification Contact Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      Notification Contact Details
                    </h4>
                    <p className="text-sm text-foreground/60 mb-4">
                      Specify dedicated contact details for receiving
                      notifications and alerts
                    </p>
                  </div>

                  {notificationSettingsError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {notificationSettingsError}
                    </div>
                  )}

                  {notificationSettingsSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                      {notificationSettingsSuccess}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notification_email">
                        Notification Email
                      </Label>
                      <Input
                        id="notification_email"
                        type="email"
                        value={notificationSettings.notification_email}
                        onChange={(e) =>
                          handleNotificationSettingsChange(
                            "notification_email",
                            e.target.value,
                          )
                        }
                        placeholder="Enter email for notifications (optional)"
                        disabled={notificationSettingsSaving}
                      />
                      <p className="text-xs text-foreground/60">
                        If provided, notifications will be sent to this email
                        instead of your main account email
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notification_phone">
                        Notification Phone
                      </Label>
                      <Input
                        id="notification_phone"
                        type="tel"
                        value={notificationSettings.notification_phone}
                        onChange={(e) =>
                          handleNotificationSettingsChange(
                            "notification_phone",
                            e.target.value,
                          )
                        }
                        placeholder="Enter phone for SMS notifications (optional)"
                        disabled={notificationSettingsSaving}
                      />
                      <p className="text-xs text-foreground/60">
                        If provided, SMS notifications will be sent to this
                        number instead of your main phone number
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveNotificationSettings}
                        disabled={notificationSettingsSaving}
                        className="bg-roam-blue hover:bg-roam-blue/90"
                        size="sm"
                      >
                        {notificationSettingsSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          "Save Notification Settings"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowSettingsModal(false)}
                        size="sm"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Booking Page Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-roam-blue" />
                Share Your Booking Page
              </DialogTitle>
              <Badge
                variant="outline"
                className="text-green-600 border-green-200"
              >
                Public Booking Page
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-roam-blue" />
                  Customer Booking URL
                </CardTitle>
                <p className="text-foreground/60">
                  Share this link with customers so they can book your services
                  directly
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Public Booking Page</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${window.location.origin}/book/${provider?.business_id}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${window.location.origin}/book/${provider?.business_id}`,
                          );
                          toast({
                            title: "Link copied!",
                            description:
                              "Booking page URL has been copied to your clipboard",
                          });
                        } catch (err) {
                          toast({
                            title: "Copy failed",
                            description: "Please manually copy the URL",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(
                          `${window.location.origin}/book/${provider?.business_id}`,
                          "_blank",
                        );
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    What customers will see:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your business information and description</li>
                    <li>• All available services with pricing</li>
                    <li>• Available add-ons and extras</li>
                    <li>• Easy booking form to request appointments</li>
                    <li>• Your contact information and location</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">
                        Share via Social Media
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/book/${provider?.business_id}`;
                            const text = `Book services with ${business?.business_name}!`;
                            window.open(
                              `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
                              "_blank",
                            );
                          }}
                        >
                          Twitter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/book/${provider?.business_id}`;
                            window.open(
                              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                              "_blank",
                            );
                          }}
                        >
                          Facebook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/book/${provider?.business_id}`;
                            const text = `Book services with ${business?.business_name}! ${url}`;
                            window.open(
                              `https://wa.me/?text=${encodeURIComponent(text)}`,
                              "_blank",
                            );
                          }}
                        >
                          WhatsApp
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">QR Code</h4>
                      <div className="text-center space-y-2">
                        <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">
                              QR Code
                            </div>
                            <div className="text-xs text-gray-400">
                              Coming Soon
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-foreground/60">
                          QR code for easy mobile sharing
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">
                    How to use your booking page:
                  </h4>
                  <div className="space-y-2 text-sm text-foreground/70">
                    <p>
                      1. <strong>Share the link</strong> - Send the URL to
                      customers via email, text, or social media
                    </p>
                    <p>
                      2. <strong>Add to your website</strong> - Link to this
                      page from your website or business cards
                    </p>
                    <p>
                      3. <strong>Print materials</strong> - Include the URL or
                      QR code on flyers, business cards, or signage
                    </p>
                    <p>
                      4. <strong>Receive bookings</strong> - Customers fill out
                      the booking form and you'll receive notifications
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowShareModal(false)}
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>

            {business && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview Your Business Information</CardTitle>
                  <p className="text-foreground/60">
                    This is what customers will see on your booking page
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {business.logo_url || business.image_url ? (
                          <img
                            src={business.logo_url || business.image_url}
                            alt={business.business_name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-2xl font-bold text-gray-500">
                            {business.business_name
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">
                          {business.business_name}
                        </h3>
                        <Badge variant="secondary" className="mb-2">
                          {business.business_type}
                        </Badge>
                        {business.business_description && (
                          <p className="text-foreground/70">
                            {business.business_description}
                          </p>
                        )}
                        <div className="mt-2 space-y-1 text-sm text-foreground/60">
                          {business.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{business.contact_email}</span>
                            </div>
                          )}
                          {business.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{business.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
