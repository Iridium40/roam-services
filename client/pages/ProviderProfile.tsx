import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Shield,
  Users,
  Share2,
  Heart,
  Smartphone,
  Building,
  Video,
  Car,
  Award,
  CheckCircle,
  Camera,
  ChevronRight,
  QrCode,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import BookingModal from "@/components/BookingModal";
import ShareModal from "@/components/ShareModal";

export default function ProviderProfile() {
  const { providerId } = useParams();
  const { toast } = useToast();
  const [provider, setProvider] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch real provider data from database
  useEffect(() => {
    const fetchProviderData = async () => {
      if (!providerId) return;

      try {
        setLoading(true);

        const { data: providerData, error } = await supabase
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
            business_id,
            is_active,
            created_at
          `,
          )
          .eq("id", providerId)
          .eq("is_active", true)
          .single();

        if (error || !providerData) {
          throw new Error("Provider not found");
        }

        // Transform the data to match the expected format
        setProvider({
          id: providerData.id,
          business_id: providerData.business_id,
          name: `${providerData.first_name} ${providerData.last_name}`,
          title: "Service Provider", // Generic title since we don't have this field
          rating: providerData.average_rating || 0,
          reviews: providerData.total_reviews || 0,
          responseRate: "95%", // Default value
          responseTime: "Within 2 hours", // Default value
          location: "Service Area", // Default value
          joinedDate: new Date(providerData.created_at).toLocaleDateString(
            "en-US",
            { month: "long", year: "numeric" },
          ),
          verified: true,
          profileImage: providerData.image_url || "/api/placeholder/120/120",
          coverImage:
            providerData.cover_image_url ||
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=300&fit=crop",
          bio: providerData.bio || "Professional service provider",
          specialties: [], // Could fetch from separate table if available
          languages: ["English"], // Default value
          certifications: [], // Could fetch from separate table if available
          deliveryTypes: ["mobile", "business"], // Default values
          businessAddress: "", // Could fetch from business_locations if available
          serviceArea: "Local Area", // Default value
          availableDays: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ], // Default values
        });

        // Fetch services assigned to this provider
        const { data: servicesData, error: servicesError } = await supabase
          .from("business_services")
          .select(
            `
            id,
            business_price,
            delivery_type,
            services:service_id (
              id,
              name,
              description,
              min_price,
              duration_minutes,
              image_url
            )
          `,
          )
          .eq("business_id", providerData.business_id)
          .eq("is_active", true);

        if (servicesError) {
          console.error("Error fetching services:", servicesError);
        } else if (servicesData) {
          const transformedServices = servicesData.map(
            (businessService: any) => {
              const service = businessService.services;
              const serviceName = service?.name || "Professional Service";

              return {
                id: businessService.id,
                name: serviceName,
                duration: `${service?.duration_minutes || 60} minutes`,
                price:
                  businessService.business_price || service?.min_price || 50,
                description:
                  service?.description ||
                  "Professional service delivered by experienced and qualified practitioners.",
                deliveryTypes: businessService.delivery_type
                  ? [businessService.delivery_type]
                  : ["mobile", "business"],
                popularity: null, // Could be determined by booking frequency
                image_url:
                  service?.image_url ||
                  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=300&fit=crop",
              };
            },
          );

          setServices(transformedServices);
        }
      } catch (error: any) {
        console.error("Error fetching provider:", error);
        toast({
          title: "Error",
          description: "Failed to load provider information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [providerId, toast]);

  const reviews = [
    {
      id: 1,
      customerName: "Maria L.",
      rating: 5,
      date: "2 weeks ago",
      service: "Deep Tissue Massage",
      review:
        "Sarah is absolutely amazing! She relieved all the tension in my shoulders and back. Very professional and skilled. Will definitely book again!",
      verified: true,
    },
    {
      id: 2,
      customerName: "John D.",
      rating: 5,
      date: "1 month ago",
      service: "Sports Recovery Massage",
      review:
        "Perfect for post-workout recovery. Sarah knows exactly how to target problem areas. Great communication and very punctual.",
      verified: true,
    },
    {
      id: 3,
      customerName: "Lisa K.",
      rating: 5,
      date: "1 month ago",
      service: "Swedish Massage",
      review:
        "So relaxing! Sarah created the perfect ambiance and her technique is excellent. Love that she comes to my home.",
      verified: true,
    },
  ];

  // Delivery icons matching home page
  const deliveryIcons = {
    customer_location: Car,
    business_location: Building,
    virtual: Video,
  };

  const getDeliveryIcon = (type: string) => {
    return deliveryIcons[type as keyof typeof deliveryIcons] || Building;
  };

  const getDeliveryBadge = (type: string) => {
    const config = {
      customer_location: {
        label: "Mobile",
        color: "bg-green-100 text-green-800",
      },
      business_location: {
        label: "Business",
        color: "bg-blue-100 text-blue-800",
      },
      virtual: { label: "Virtual", color: "bg-purple-100 text-purple-800" },
    };
    return (
      config[type as keyof typeof config] || {
        label: type,
        color: "bg-gray-100 text-gray-800",
      }
    );
  };

  const handleBookService = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      // Check if service has only one delivery type
      if (service.deliveryTypes.length === 1) {
        // Skip delivery selection step and set the single delivery type
        setSelectedService({
          ...service,
          preselectedDeliveryType: service.deliveryTypes[0],
        });
      } else {
        // Multiple delivery types, let user choose
        setSelectedService(service);
      }
    }
    setShowBookingModal(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-roam-blue mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading provider information...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-xl mb-4">Provider not found</p>
          <Link to="/providers" className="text-roam-blue hover:underline">
            Back to Providers
          </Link>
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
                <Link to="/home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
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
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <QrCode className="w-4 h-4 mr-2" />
                Share & QR Code
              </Button>
              <Button asChild className="bg-roam-blue hover:bg-roam-blue/90">
                <Link to="/my-bookings">
                  <Calendar className="w-4 h-4 mr-2" />
                  My Bookings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${provider.coverImage})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 pb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={provider.profileImage}
                    alt={provider.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-roam-blue to-roam-light-blue text-white text-2xl font-bold">
                    {provider.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {provider.verified && (
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-roam-blue rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {provider.name}
                      </h1>
                      <p className="text-lg text-gray-600 mb-2">
                        {provider.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {provider.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Member since {provider.joinedDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-center md:text-right">
                      <div className="flex items-center justify-center md:justify-end gap-1 mb-2">
                        <Star className="w-5 h-5 text-roam-warning fill-current" />
                        <span className="text-2xl font-bold">
                          {provider.rating}
                        </span>
                        <span className="text-gray-600">
                          ({provider.reviews} reviews)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-roam-blue hover:bg-roam-blue/90"
                          onClick={() => handleBookService(1)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Now
                        </Button>
                        {provider.business_id && (
                          <Button
                            asChild
                            variant="outline"
                            className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                          >
                            <Link
                              to={`/business/${provider.business_id}?tab=team`}
                            >
                              <Building className="w-4 h-4 mr-2" />
                              View Business
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <p>Services</p>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start">
                          <div className="w-24 h-24 flex-shrink-0">
                            <img
                              src={service.image_url}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {service.name}
                                  </h3>
                                  {service.popularity && (
                                    <Badge className="bg-roam-yellow text-gray-900">
                                      {service.popularity}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-3 text-sm">
                                  {service.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {service.deliveryTypes.map((type) => {
                                    const Icon = getDeliveryIcon(type);
                                    const badge = getDeliveryBadge(type);
                                    return (
                                      <Badge
                                        key={type}
                                        className={`text-xs ${badge.color}`}
                                      >
                                        <Icon className="w-3 h-3 mr-1" />
                                        {badge.label}
                                      </Badge>
                                    );
                                  })}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {service.duration}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-roam-blue mb-2">
                                  ${service.price}
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-roam-blue hover:bg-roam-blue/90"
                                  onClick={() => handleBookService(service.id)}
                                >
                                  Book Service
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About {provider.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {provider.bio}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.map((specialty) => (
                          <Badge
                            key={specialty}
                            variant="outline"
                            className="border-roam-blue text-roam-blue"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.languages.map((language) => (
                          <Badge key={language} variant="secondary">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Certifications</h4>
                    <ul className="space-y-2">
                      {provider.certifications.map((cert, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <Award className="w-4 h-4 text-roam-blue" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews ({provider.reviews})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b pb-6 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                {review.customerName}
                              </span>
                              {review.verified && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="flex">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 text-roam-warning fill-current"
                                  />
                                ))}
                              </div>
                              <span>{review.service}</span>
                              <span>•</span>
                              <span>{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.review}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-roam-blue" />
                    Provider Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="font-semibold">
                      {provider.responseRate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold">
                      {provider.responseTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Reviews</span>
                    <span className="font-semibold">{provider.reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-semibold">{provider.joinedDate}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Service Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-roam-blue" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-gray-600 block mb-1">
                      Service Area
                    </span>
                    <span className="font-semibold">
                      {provider.serviceArea}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-1">
                      Studio Location
                    </span>
                    <span className="font-semibold">
                      {provider.businessAddress}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">
                      Available Days
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {provider.availableDays.map((day) => (
                        <Badge
                          key={day}
                          variant="secondary"
                          className="text-xs"
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        service={selectedService}
        provider={{
          id: provider.id,
          name: provider.name,
          businessAddress: provider.businessAddress,
          serviceArea: provider.serviceArea,
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        providerName={provider.name}
        providerTitle={provider.title}
        pageUrl={window.location.href}
      />
    </div>
  );
}
