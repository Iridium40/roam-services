import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FavoriteService {
  id: string;
  service_id: string;
  service_name: string;
  service_description: string;
  min_price: number;
  duration_minutes: number;
  image_url: string;
  service_category_type: string;
  service_subcategory_type: string;
  created_at: string;
}

export interface FavoriteBusiness {
  id: string;
  business_id: string;
  business_name: string;
  image_url: string;
  logo_url: string;
  cover_image_url: string;
  business_type: string;
  service_categories: string[];
  service_subcategories: string[];
  verification_status: string;
  created_at: string;
}

export interface FavoriteProvider {
  id: string;
  provider_id: string;
  first_name: string;
  last_name: string;
  image_url: string;
  bio: string;
  experience_years: number;
  average_rating: number;
  total_reviews: number;
  business_id: string;
  business_name: string;
  created_at: string;
}

export function useFavorites() {
  const { customer, isCustomer } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Service favorites
  const addServiceToFavorites = useCallback(
    async (serviceId: string) => {
      if (!isCustomer || !customer?.id) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add favorites",
          variant: "destructive",
        });
        return false;
      }

      if (!serviceId || serviceId === "undefined") {
        console.warn("Invalid service ID provided");
        return false;
      }

      // Validate UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(customer.id) || !uuidRegex.test(serviceId)) {
        console.warn("Invalid UUID format for customer ID or service ID");
        toast({
          title: "Error",
          description: "Invalid service or customer information",
          variant: "destructive",
        });
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase
          .from("customer_favorite_services")
          .insert({
            customer_id: customer.id,
            service_id: serviceId,
          });

        if (error) {
          console.error(
            "Error adding service to favorites:",
            error?.message || error,
          );
          toast({
            title: "Error",
            description: "Failed to add service to favorites",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Added to favorites",
          description: "Service has been added to your favorites",
        });
        return true;
      } catch (error) {
        console.error(
          "Error adding service to favorites:",
          error?.message || error,
        );
        toast({
          title: "Error",
          description: "Failed to add service to favorites",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isCustomer, toast],
  );

  const removeServiceFromFavorites = useCallback(
    async (serviceId: string) => {
      if (!isCustomer || !customer?.id) {
        return false;
      }

      if (!serviceId || serviceId === "undefined") {
        console.warn("Invalid service ID provided");
        return false;
      }

      // Validate UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(customer.id) || !uuidRegex.test(serviceId)) {
        console.warn("Invalid UUID format for customer ID or service ID");
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase
          .from("customer_favorite_services")
          .delete()
          .eq("customer_id", customer.id)
          .eq("service_id", serviceId);

        if (error) {
          console.error(
            "Error removing service from favorites:",
            error?.message || error,
          );
          toast({
            title: "Error",
            description: "Failed to remove service from favorites",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Removed from favorites",
          description: "Service has been removed from your favorites",
        });
        return true;
      } catch (error) {
        console.error(
          "Error removing service from favorites:",
          error?.message || error,
        );
        toast({
          title: "Error",
          description: "Failed to remove service from favorites",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isCustomer, toast],
  );

  const isServiceFavorited = useCallback(
    async (serviceId: string): Promise<boolean> => {
      if (
        !isCustomer ||
        !customer?.id ||
        !serviceId ||
        serviceId === "undefined"
      ) {
        return false;
      }

      // Validate UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(customer.id) || !uuidRegex.test(serviceId)) {
        console.warn("Invalid UUID format for customer ID or service ID");
        return false;
      }

      // Retry logic for network issues
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from("customer_favorite_services")
            .select("id")
            .eq("customer_id", customer.id)
            .eq("service_id", serviceId)
            .maybeSingle();

          if (error) {
            console.error(
              "Error checking if service is favorited:",
              error?.message || error,
            );
            return false;
          }

          return !!data;
        } catch (error: any) {
          retryCount++;

          // Check if it's a network error that might benefit from retry
          const isNetworkError =
            error?.message?.includes("Failed to fetch") ||
            error?.message?.includes("ERR_NETWORK") ||
            error?.message?.includes("ERR_CONNECTION_CLOSED") ||
            error?.name === "TypeError";

          if (isNetworkError && retryCount < maxRetries) {
            console.warn(
              `Retrying favorite check (${retryCount}/${maxRetries})...`,
            );
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000),
            );
            continue;
          }

          console.error(
            "Error checking if service is favorited:",
            error?.message || error,
          );
          return false;
        }
      }

      return false;
    },
    [isCustomer, customer?.id],
  );

  // Business favorites
  const addBusinessToFavorites = useCallback(
    async (businessId: string) => {
      if (!isCustomer) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add favorites",
          variant: "destructive",
        });
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase
          .from("customer_favorite_businesses")
          .insert({
            customer_id: customer.id,
            business_id: businessId,
          });

        if (error) {
          console.error(
            "Error adding business to favorites:",
            error?.message || error,
          );
          toast({
            title: "Error",
            description: "Failed to add business to favorites",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Added to favorites",
          description: "Business has been added to your favorites",
        });
        return true;
      } catch (error) {
        console.error(
          "Error adding business to favorites:",
          error?.message || error,
        );
        toast({
          title: "Error",
          description: "Failed to add business to favorites",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isCustomer, toast],
  );

  const removeBusinessFromFavorites = useCallback(
    async (businessId: string) => {
      if (!isCustomer) {
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase
          .from("customer_favorite_businesses")
          .delete()
          .eq("customer_id", customer.id)
          .eq("business_id", businessId);

        if (error) {
          console.error(
            "Error removing business from favorites:",
            error?.message || error,
          );
          toast({
            title: "Error",
            description: "Failed to remove business from favorites",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Removed from favorites",
          description: "Business has been removed from your favorites",
        });
        return true;
      } catch (error) {
        console.error(
          "Error removing business from favorites:",
          error?.message || error,
        );
        toast({
          title: "Error",
          description: "Failed to remove business from favorites",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isCustomer, toast],
  );

  const isBusinessFavorited = useCallback(
    async (businessId: string): Promise<boolean> => {
      if (
        !isCustomer ||
        !customer?.id ||
        !businessId ||
        businessId === "undefined"
      ) {
        return false;
      }

      // Validate UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(customer.id) || !uuidRegex.test(businessId)) {
        console.warn("Invalid UUID format for customer ID or business ID");
        return false;
      }

      // Retry logic for network issues
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from("customer_favorite_businesses")
            .select("id")
            .eq("customer_id", customer.id)
            .eq("business_id", businessId)
            .maybeSingle();

          if (error) {
            console.error(
              "Error checking if business is favorited:",
              error?.message || error,
            );
            return false;
          }

          return !!data;
        } catch (error: any) {
          retryCount++;

          // Check if it's a network error that might benefit from retry
          const isNetworkError =
            error?.message?.includes("Failed to fetch") ||
            error?.message?.includes("ERR_NETWORK") ||
            error?.message?.includes("ERR_CONNECTION_CLOSED") ||
            error?.name === "TypeError";

          if (isNetworkError && retryCount < maxRetries) {
            console.warn(
              `Retrying business favorite check (${retryCount}/${maxRetries})...`,
            );
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000),
            );
            continue;
          }

          console.error(
            "Error checking if business is favorited:",
            error?.message || error,
          );
          return false;
        }
      }

      return false;
    },
    [isCustomer, customer?.id],
  );

  // Provider favorites
  const addProviderToFavorites = useCallback(
    async (providerId: string) => {
      if (!isCustomer) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add favorites",
          variant: "destructive",
        });
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase
          .from("customer_favorite_providers")
          .insert({
            customer_id: customer.id,
            provider_id: providerId,
          });

        if (error) {
          console.error(
            "Error adding provider to favorites:",
            error?.message || error,
          );
          toast({
            title: "Error",
            description: "Failed to add provider to favorites",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Added to favorites",
          description: "Provider has been added to your favorites",
        });
        return true;
      } catch (error) {
        console.error(
          "Error adding provider to favorites:",
          error?.message || error,
        );
        toast({
          title: "Error",
          description: "Failed to add provider to favorites",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isCustomer, toast],
  );

  const removeProviderFromFavorites = useCallback(
    async (providerId: string) => {
      if (!isCustomer) {
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase
          .from("customer_favorite_providers")
          .delete()
          .eq("customer_id", customer.id)
          .eq("provider_id", providerId);

        if (error) {
          console.error(
            "Error removing provider from favorites:",
            error?.message || error,
          );
          toast({
            title: "Error",
            description: "Failed to remove provider from favorites",
            variant: "destructive",
          });
          return false;
        }

        toast({
          title: "Removed from favorites",
          description: "Provider has been removed from your favorites",
        });
        return true;
      } catch (error) {
        console.error(
          "Error removing provider from favorites:",
          error?.message || error,
        );
        toast({
          title: "Error",
          description: "Failed to remove provider from favorites",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isCustomer, toast],
  );

  const isProviderFavorited = useCallback(
    async (providerId: string): Promise<boolean> => {
      if (
        !isCustomer ||
        !customer?.id ||
        !providerId ||
        providerId === "undefined"
      ) {
        return false;
      }

      // Validate UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(customer.id) || !uuidRegex.test(providerId)) {
        console.warn("Invalid UUID format for customer ID or provider ID");
        return false;
      }

      // Retry logic for network issues
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from("customer_favorite_providers")
            .select("id")
            .eq("customer_id", customer.id)
            .eq("provider_id", providerId)
            .maybeSingle();

          if (error) {
            console.error(
              "Error checking if provider is favorited:",
              error?.message || error,
            );
            return false;
          }

          return !!data;
        } catch (error: any) {
          retryCount++;

          // Check if it's a network error that might benefit from retry
          const isNetworkError =
            error?.message?.includes("Failed to fetch") ||
            error?.message?.includes("ERR_NETWORK") ||
            error?.message?.includes("ERR_CONNECTION_CLOSED") ||
            error?.name === "TypeError";

          if (isNetworkError && retryCount < maxRetries) {
            console.warn(
              `Retrying provider favorite check (${retryCount}/${maxRetries})...`,
            );
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000),
            );
            continue;
          }

          console.error(
            "Error checking if provider is favorited:",
            error?.message || error,
          );
          return false;
        }
      }

      return false;
    },
    [isCustomer, customer?.id],
  );

  // Get favorites lists
  const getFavoriteServices = useCallback(async (): Promise<
    FavoriteService[]
  > => {
    if (!isCustomer) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("customer_favorite_services_view")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Error fetching favorite services:",
          error?.message || error,
        );
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(
        "Error fetching favorite services:",
        error?.message || error,
      );
      return [];
    }
  }, [isCustomer]);

  const getFavoriteBusinesses = useCallback(async (): Promise<
    FavoriteBusiness[]
  > => {
    if (!isCustomer) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("customer_favorite_businesses_view")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Error fetching favorite businesses:",
          error?.message || error,
        );
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(
        "Error fetching favorite businesses:",
        error?.message || error,
      );
      return [];
    }
  }, [isCustomer]);

  const getFavoriteProviders = useCallback(async (): Promise<
    FavoriteProvider[]
  > => {
    if (!isCustomer) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("customer_favorite_providers_view")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Error fetching favorite providers:",
          error?.message || error,
        );
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(
        "Error fetching favorite providers:",
        error?.message || error,
      );
      return [];
    }
  }, [isCustomer]);

  return {
    isLoading,

    // Service favorites
    addServiceToFavorites,
    removeServiceFromFavorites,
    isServiceFavorited,

    // Business favorites
    addBusinessToFavorites,
    removeBusinessFromFavorites,
    isBusinessFavorited,

    // Provider favorites
    addProviderToFavorites,
    removeProviderFromFavorites,
    isProviderFavorited,

    // Get favorites lists
    getFavoriteServices,
    getFavoriteBusinesses,
    getFavoriteProviders,
  };
}
