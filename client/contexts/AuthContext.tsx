import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast } from "../hooks/use-toast";

console.log('🔥 AuthContext.tsx file is being loaded...');

import type {
  AuthUser,
  AuthCustomer,
  ProviderRole,
} from "../lib/database.types";

type UserType = "provider" | "customer";

interface AuthContextType {
  user: AuthUser | null;
  customer: AuthCustomer | null;
  userType: UserType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInCustomer: (email: string, password: string) => Promise<void>;
  signUpCustomer: (customerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleIdToken: (idToken: string, nonce: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  updateCustomerProfile: (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    bio?: string;
    imageUrl?: string;
  }) => Promise<void>;
  uploadCustomerAvatar: (file: File) => Promise<string>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: ProviderRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isOwner: boolean;
  isDispatcher: boolean;
  isProvider: boolean;
  isCustomer: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🚀 AuthProvider component is mounting...');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customer, setCustomer] = useState<AuthCustomer | null>(null);
  const [userType, setUserType] = useState<"provider" | "customer" | null>(null);
  const [loading, setLoading] = useState(true);

  const clearStoredData = () => {
    localStorage.removeItem("roam_user");
    localStorage.removeItem("roam_customer");
    localStorage.removeItem("roam_access_token");
    localStorage.removeItem("roam_user_type");
  };

  useEffect(() => {
    // Try to restore session from localStorage first
    const initializeAuth = async () => {
      try {
        console.log("AuthContext: Initializing with session restoration...");

        // Check if we have stored session data
        const storedUser = localStorage.getItem("roam_user");
        const storedCustomer = localStorage.getItem("roam_customer");
        const storedToken = localStorage.getItem("roam_access_token");
        const storedUserType = localStorage.getItem(
          "roam_user_type",
        ) as UserType | null;

        if ((storedUser || storedCustomer) && storedToken && storedUserType) {
          console.log("AuthContext: Found stored session and token", {
            hasUser: !!storedUser,
            hasCustomer: !!storedCustomer,
            userType: storedUserType,
          });

          // Restore the access token to the directSupabaseAPI
          const { directSupabaseAPI } = await import("../lib/directSupabase");
          directSupabaseAPI.currentAccessToken = storedToken;

          if (storedUserType === "provider" && storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setUserType("provider");
            console.log("AuthContext: Provider session restored", userData);
          } else if (storedUserType === "customer" && storedCustomer) {
            const customerData = JSON.parse(storedCustomer);
            console.log("🔐 AuthContext: Customer session restored from localStorage", customerData);
            console.log("🔐 AuthContext: Customer user_id from localStorage:", customerData.user_id);
            
            // If user_id is missing from stored data, clear localStorage and fetch fresh data
            if (!customerData.user_id) {
              console.log("🔐 AuthContext: user_id missing from localStorage, clearing and fetching fresh data...");
              clearStoredData();
              // Continue to fresh session fetch below
            } else {
              setCustomer(customerData);
              setUserType("customer");
              setLoading(false);
              return;
            }
          }

          setLoading(false);
          return;
        } else if (
          (storedUser || storedCustomer) &&
          (!storedToken || !storedUserType)
        ) {
          console.log(
            "AuthContext: Found incomplete stored session, clearing data",
          );
          clearStoredData();
        }

        // If no stored session, try to get current session from Supabase
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            console.log(
              "AuthContext: Found active Supabase session, fetching provider...",
            );

            // First check for provider account
            const { data: provider } = await supabase
              .from("providers")
              .select("*")
              .eq("user_id", session.user.id)
              .eq("is_active", true)
              .single();

            if (provider) {
              const userData = {
                id: session.user.id,
                email: provider.email,
                provider_id: provider.id,
                business_id: provider.business_id,
                location_id: provider.location_id,
                provider_role: provider.provider_role,
                first_name: provider.first_name,
                last_name: provider.last_name,
              };

              setUser(userData);
              setUserType("provider");
              localStorage.setItem("roam_user", JSON.stringify(userData));
              localStorage.setItem("roam_user_type", "provider");
              console.log(
                "AuthContext: Provider session restored successfully",
              );
            } else {
              // Check if user is a customer instead
              console.log("Session user found, checking for customer profile", session.user.id);

              const { data: customerProfile, error: customerError } = await supabase
                .from("customer_profiles")
                .select("id, user_id, email, first_name, last_name, phone, image_url")
                .eq("user_id", session.user.id)
                .single();

              console.log('Customer profile query result:', { customerProfile, customerError });

              if (customerProfile) {
                const customerData = {
                  id: customerProfile.id,
                  user_id: customerProfile.user_id, // Add user_id for foreign key relationships
                  email: customerProfile.email,
                  customer_id: customerProfile.id,
                  first_name: customerProfile.first_name,
                  last_name: customerProfile.last_name,
                  phone: customerProfile.phone,
                  image_url: customerProfile.image_url,
                };
                
                console.log('Customer data structure:', customerData);

                setCustomer(customerData);
                setUserType("customer");
                localStorage.setItem(
                  "roam_customer",
                  JSON.stringify(customerData),
                );
                localStorage.setItem("roam_user_type", "customer");
                console.log(
                  "AuthContext: Customer session restored successfully",
                );
              } else {
                // For OAuth users without existing customer profile, create one
                if (session.user.app_metadata?.provider) {
                  console.log(
                    "AuthContext: OAuth user without profile, creating customer profile...",
                  );
                  await createCustomerProfileFromOAuth(session.user);
                } else {
                  console.log(
                    "AuthContext: No provider or customer profile found, clearing session",
                  );
                  clearStoredData();
                }
              }
            }
          } else {
            console.log(
              "AuthContext: No active session, clearing stored data if any",
            );
            clearStoredData();
          }
        } catch (sessionError) {
          console.log(
            "AuthContext: Error during session restoration:",
            sessionError,
          );
          // Clear potentially corrupted stored data
          clearStoredData();
        }
      } catch (error) {
        console.error("AuthContext: Error during initialization:", error);
      } finally {
        setLoading(false);
      }
    };
    
    console.log('🔐 AuthContext: useEffect triggered, initializing auth...');
    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("AuthContext signIn: Starting authentication...");

      // Use standard Supabase client for authentication
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.error("AuthContext signIn: Auth error:", authError);

        // Provide user-friendly error messages
        if (authError.message === "Invalid login credentials") {
          throw new Error("Invalid email or password");
        } else if (authError.message.includes("Email not confirmed")) {
          throw new Error(
            "Please check your email and click the confirmation link before signing in.",
          );
        } else if (authError.message.includes("Too many requests")) {
          throw new Error(
            "Too many login attempts. Please wait a few minutes before trying again.",
          );
        } else {
          throw new Error(`Authentication failed: ${authError.message}`);
        }
      }

      if (!authData.user) {
        console.error("AuthContext signIn: No user returned");
        throw new Error("Authentication failed - no user returned");
      }

      console.log("AuthContext signIn: Auth successful, fetching profile...");

      // First check for provider account
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("is_active", true)
        .single();

      if (provider && !providerError) {
        console.log("AuthContext signIn: Provider found:", provider);

        const userData = {
          id: authData.user.id,
          email: provider.email,
          provider_id: provider.id,
          business_id: provider.business_id,
          location_id: provider.location_id,
          provider_role: provider.provider_role,
          first_name: provider.first_name,
          last_name: provider.last_name,
        };

        setUser(userData);
        setUserType("provider");
        localStorage.setItem("roam_user", JSON.stringify(userData));
        localStorage.setItem(
          "roam_access_token",
          authData.session?.access_token || "",
        );
        localStorage.setItem("roam_user_type", "provider");
      } else {
        // Check for business owner/profile
        console.log(
          "AuthContext signIn: Provider not found, checking for business owner...",
        );

        const { data: business, error: businessError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("owner_user_id", authData.user.id)
          .eq("is_active", true)
          .single();

        if (business && !businessError) {
          console.log("AuthContext signIn: Business owner found:", business);

          const userData = {
            id: authData.user.id,
            email: authData.user.email || business.contact_email,
            business_id: business.id,
            business_name: business.business_name,
            owner_user_id: business.owner_user_id,
            provider_role: "owner" as any, // Business owners have owner role
            first_name: business.owner_first_name,
            last_name: business.owner_last_name,
          };

          setUser(userData);
          setUserType("provider"); // Keep as provider type for compatibility
          localStorage.setItem("roam_user", JSON.stringify(userData));
          localStorage.setItem(
            "roam_access_token",
            authData.session?.access_token || "",
          );
          localStorage.setItem("roam_user_type", "provider");
        } else {
          // No provider or business owner found
          console.error(
            "AuthContext signIn: No provider or business owner found",
            {
              providerError: providerError?.message || providerError,
              businessError: businessError?.message || businessError,
              userEmail: authData.user.email,
              userId: authData.user.id,
            },
          );
          await supabase.auth.signOut();
          throw new Error(
            "Account not found or inactive. Please contact support if you believe this is an error.",
          );
        }
      }

      console.log(
        "AuthContext signIn: Provider state updated and persisted successfully",
      );
    } catch (error) {
      console.error("AuthContext signIn: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInCustomer = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("AuthContext signInCustomer: Starting authentication...");

      // Use standard Supabase client for authentication
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.error("AuthContext signInCustomer: Auth error:", authError);

        // Provide user-friendly error messages
        if (authError.message === "Invalid login credentials") {
          throw new Error("Invalid email or password");
        } else if (authError.message.includes("Email not confirmed")) {
          throw new Error(
            "Please check your email and click the confirmation link before signing in.",
          );
        } else if (authError.message.includes("Too many requests")) {
          throw new Error(
            "Too many login attempts. Please wait a few minutes before trying again.",
          );
        } else {
          throw new Error(`Authentication failed: ${authError.message}`);
        }
      }

      if (!authData.user) {
        console.error("AuthContext signInCustomer: No user returned");
        throw new Error("Authentication failed - no user returned");
      }

      console.log(
        "AuthContext signInCustomer: Auth successful, fetching customer profile...",
      );

      // Fetch or create customer profile
      const { data: customerProfile, error: profileError } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 is "not found" error
        console.error(
          "AuthContext signInCustomer: Error fetching customer profile:",
          profileError,
        );
        throw new Error("Failed to fetch customer profile");
      }

      let customerData;
      if (!customerProfile) {
        // Create customer profile if it doesn't exist
        console.log("AuthContext signInCustomer: Creating customer profile...");
        const emailParts = authData.user.email?.split("@")[0] || "";
        const nameParts = emailParts.split(".");

        const { data: newProfile, error: createError } = await supabase
          .from("customer_profiles")
          .insert({
            user_id: authData.user.id,
            email: authData.user.email || email,
            first_name: nameParts[0] || "Customer",
            last_name: nameParts[1] || "",
          })
          .select()
          .single();

        if (createError) {
          console.error(
            "AuthContext signInCustomer: Error creating customer profile:",
            createError,
          );
          throw new Error("Failed to create customer profile");
        }

        customerData = {
          id: newProfile.id,
          email: newProfile.email,
          customer_id: newProfile.id,
          first_name: newProfile.first_name,
          last_name: newProfile.last_name,
          phone: newProfile.phone,
          image_url: newProfile.image_url,
        };
      } else {
        customerData = {
          id: customerProfile.id,
          user_id: customerProfile.user_id,
          email: customerProfile.email,
          customer_id: customerProfile.id,
          first_name: customerProfile.first_name,
          last_name: customerProfile.last_name,
          phone: customerProfile.phone,
          image_url: customerProfile.image_url,
        };
      }

      setCustomer(customerData);
      setUserType("customer");
      localStorage.setItem("roam_customer", JSON.stringify(customerData));
      localStorage.setItem(
        "roam_access_token",
        authData.session?.access_token || "",
      );
      localStorage.setItem("roam_user_type", "customer");

      console.log(
        "AuthContext signInCustomer: Customer state updated and persisted successfully",
      );
    } catch (error) {
      console.error("AuthContext signInCustomer: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpCustomer = async (customerData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    setLoading(true);
    try {
      console.log("AuthContext signUpCustomer: Starting registration...");

      const { directSupabaseAPI } = await import("../lib/directSupabase");

      // Create auth user first
      const authData = await directSupabaseAPI.signUpWithPassword(
        customerData.email,
        customerData.password,
      );

      console.log("AuthContext signUpCustomer: Sign up response:", authData);

      // Supabase sign up may not return user immediately if email confirmation is required
      if (!authData.user && !authData.session) {
        console.log("AuthContext signUpCustomer: Email confirmation required");
        // This is normal for Supabase with email confirmation enabled
        return; // Exit gracefully - user needs to confirm email
      }

      console.log("AuthContext signUpCustomer: Auth user created successfully");

      // For now, we'll just use the auth user without creating a separate customer profile
      // since the customers table may not exist yet. The user metadata can be updated later
      // when the customers table is available.

      console.log(
        "AuthContext signUpCustomer: Customer registration completed successfully",
      );
    } catch (error) {
      console.error("AuthContext signUpCustomer: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Determine the appropriate redirect URL based on environment
      const redirectTo = import.meta.env.DEV
        ? `${window.location.origin}/home`
        : `${window.location.origin}/home`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            // Force password authentication instead of passkey
            authuser: "0",
            login_hint: "",
            // Disable passkey prompts
            disable_hi_res: "1",
            // Force traditional sign-in flow
            flowName: "GlifWebSignIn",
          },
        },
      });

      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }

      // The OAuth flow will redirect, so we don't need to handle the response here
      // The session will be handled when the user returns from OAuth
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogleIdToken = async (idToken: string, nonce: string) => {
    setLoading(true);
    try {
      console.log(
        "AuthContext signInWithGoogleIdToken: Starting Google ID token authentication...",
      );

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
      });

      if (error) {
        console.error("Google ID token sign-in error:", error);
        throw error;
      }

      if (data.user) {
        console.log(
          "AuthContext signInWithGoogleIdToken: Google authentication successful",
        );

        // Check if customer profile exists
        const { data: customerProfile, error: profileError } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching customer profile:", profileError);
          throw new Error("Failed to fetch customer profile");
        }

        if (!customerProfile) {
          // Create customer profile from Google OAuth data
          console.log("Creating customer profile from Google OAuth data...");
          await createCustomerProfileFromOAuth(data.user);
        } else {
          // Set existing customer data
          const customerData = {
            id: customerProfile.id,
            user_id: customerProfile.user_id,
            email: customerProfile.email,
            customer_id: customerProfile.id,
            first_name: customerProfile.first_name,
            last_name: customerProfile.last_name,
            phone: customerProfile.phone,
            image_url: customerProfile.image_url,
          };

          setCustomer(customerData);
          setUserType("customer");
          localStorage.setItem("roam_customer", JSON.stringify(customerData));
          localStorage.setItem("roam_user_type", "customer");

          if (data.session?.access_token) {
            localStorage.setItem(
              "roam_access_token",
              data.session.access_token,
            );
          }
        }

        console.log(
          "AuthContext signInWithGoogleIdToken: Authentication completed successfully",
        );
      }
    } catch (error: any) {
      console.error("Google ID token sign-in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    setLoading(true);
    try {
      // Determine the appropriate redirect URL based on environment
      const redirectTo = import.meta.env.DEV
        ? `${window.location.origin}/home`
        : `${window.location.origin}/home`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Apple sign-in error:", error);
        throw error;
      }

      // The OAuth flow will redirect, so we don't need to handle the response here
      // The session will be handled when the user returns from OAuth
      console.log("Apple OAuth initiated successfully");
    } catch (error: any) {
      console.error("Apple sign-in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    setLoading(true);
    try {
      console.log("Resending verification email for:", email);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("Resend verification email error:", error);
        throw error;
      }

      console.log("Verification email resent successfully");
    } catch (error: any) {
      console.error("Resend verification email error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createCustomerProfileFromOAuth = async (user: any) => {
    try {
      console.log("Creating customer profile from OAuth user:", user);

      const { data: customerProfile, error } = await supabase
        .from("customer_profiles")
        .insert({
          user_id: user.id,
          email: user.email,
          first_name:
            user.user_metadata?.full_name?.split(" ")[0] ||
            user.user_metadata?.name?.split(" ")[0] ||
            "",
          last_name:
            user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
            user.user_metadata?.name?.split(" ").slice(1).join(" ") ||
            "",
          phone: user.user_metadata?.phone || "",
          image_url:
            user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
          date_of_birth: null,
          bio: null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating customer profile:", error);
        throw error;
      }

      const customerData = {
        id: customerProfile.id,
        user_id: customerProfile.user_id, // Add user_id for foreign key relationships
        email: customerProfile.email,
        customer_id: customerProfile.id,
        first_name: customerProfile.first_name,
        last_name: customerProfile.last_name,
        phone: customerProfile.phone,
        image_url: customerProfile.image_url,
      };

      setCustomer(customerData);
      setUserType("customer");
      localStorage.setItem("roam_customer", JSON.stringify(customerData));
      localStorage.setItem("roam_user_type", "customer");
      localStorage.setItem(
        "roam_access_token",
        (await supabase.auth.getSession()).data.session?.access_token || "",
      );

      console.log("AuthContext: OAuth customer profile created successfully");
      return customerData;
    } catch (error) {
      console.error("Error creating OAuth customer profile:", error);
      throw error;
    }
  };

  const updateCustomerProfile = async (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    bio?: string;
    imageUrl?: string;
  }) => {
    if (!customer) {
      throw new Error("No customer logged in");
    }

    setLoading(true);
    try {
      console.log("AuthContext updateCustomerProfile: Starting update...");

      const { directSupabaseAPI } = await import("../lib/directSupabase");

      // Ensure we have a valid access token
      const storedToken = localStorage.getItem("roam_access_token");
      if (storedToken) {
        directSupabaseAPI.currentAccessToken = storedToken;
        console.log(
          "AuthContext updateCustomerProfile: Using stored access token",
        );
      } else {
        console.warn(
          "AuthContext updateCustomerProfile: No access token found in localStorage",
        );
        // Clear any stale auth state and prompt for re-authentication
        await signOut();
        throw new Error(
          "Your session has expired. Please sign in again to continue.",
        );
      }

      // Try to update the database first
      try {
        console.log("AuthContext updateCustomerProfile: Updating database...", {
          customerId: customer.customer_id,
          hasToken: !!directSupabaseAPI.currentAccessToken,
          updateData: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone || null,
            date_of_birth: profileData.dateOfBirth || null,
            bio: profileData.bio || null,
            image_url: profileData.imageUrl || null,
          },
        });

        // Use Edge Function for customer profile updates
        const { updateCustomerProfileViaEdgeFunction } = await import(
          "../lib/directSupabase_new"
        );
        await updateCustomerProfileViaEdgeFunction(
          directSupabaseAPI.baseURL,
          directSupabaseAPI.apiKey,
          directSupabaseAPI.accessToken,
          customer.customer_id,
          {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone || null,
            date_of_birth: profileData.dateOfBirth || null,
            bio: profileData.bio || null,
            image_url: profileData.imageUrl || null,
          },
        );

        console.log(
          "AuthContext updateCustomerProfile: Database update successful",
        );
      } catch (dbError) {
        console.error(
          "AuthContext updateCustomerProfile: Database update failed:",
          dbError,
        );

        // Handle authentication errors specifically
        if (
          dbError.message &&
          (dbError.message.includes("Authentication failed") ||
            dbError.message.includes("401"))
        ) {
          console.log(
            "AuthContext updateCustomerProfile: Authentication error detected, clearing session",
          );
          // Clear the invalid session
          await signOut();
          throw new Error(
            "Your session has expired. Please sign in again to save your changes.",
          );
        }

        // Handle user existence errors (HTTP 409 foreign key constraint)
        if (
          dbError.message &&
          (dbError.message.includes(
            "no longer valid in the authentication system",
          ) ||
            dbError.message.includes("foreign key"))
        ) {
          console.log(
            "AuthContext updateCustomerProfile: User does not exist in auth system, clearing session",
          );
          await signOut();
          throw new Error(
            "Your account is no longer valid in the authentication system. Please sign up again to continue.",
          );
        }

        // Handle duplicate profile errors
        if (
          dbError.message &&
          dbError.message.includes("profile already exists")
        ) {
          console.log(
            "AuthContext updateCustomerProfile: Duplicate profile detected",
          );
          throw new Error(
            "A profile already exists for this account. Please refresh the page and try again.",
          );
        }

        // Handle other HTTP 409 conflicts
        if (dbError.message && dbError.message.includes("HTTP 409")) {
          console.log(
            "AuthContext updateCustomerProfile: Database conflict detected",
          );
          throw new Error(
            "A database conflict occurred. Please try again or contact support if the issue persists.",
          );
        }

        // Re-throw the error so the UI can show it to the user
        throw new Error(
          `Database update failed: ${dbError.message || dbError}`,
        );
      }

      // Update local customer state
      const updatedCustomer = {
        ...customer,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone || null,
        image_url: profileData.imageUrl || customer.image_url,
      };

      setCustomer(updatedCustomer);
      localStorage.setItem("roam_customer", JSON.stringify(updatedCustomer));

      console.log(
        "AuthContext updateCustomerProfile: Profile updated successfully",
      );
    } catch (error) {
      console.error("AuthContext updateCustomerProfile: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadCustomerAvatar = async (file: File): Promise<string> => {
    if (!customer) {
      throw new Error("No customer logged in");
    }

    setLoading(true);
    try {
      console.log("AuthContext uploadCustomerAvatar: Starting upload...");

      const { directSupabaseAPI } = await import("../lib/directSupabase");

      // Upload file to Supabase storage
      const uploadResult = await directSupabaseAPI.uploadCustomerAvatar(
        customer.customer_id,
        file,
      );

      console.log(
        "AuthContext uploadCustomerAvatar: Upload successful",
        uploadResult,
      );

      // Update customer profile with new image URL
      const updatedCustomer = {
        ...customer,
        image_url: uploadResult.publicUrl,
      };

      setCustomer(updatedCustomer);
      localStorage.setItem("roam_customer", JSON.stringify(updatedCustomer));

      return uploadResult.publicUrl;
    } catch (error) {
      console.error("AuthContext uploadCustomerAvatar: Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { directSupabaseAPI } = await import("../lib/directSupabase");
      await directSupabaseAPI.signOut();
    } catch (error) {
      console.warn("SignOut error:", error);
    } finally {
      setUser(null);
      setCustomer(null);
      setUserType(null);
      clearStoredData();
    }
  };

  const refreshUser = async () => {
    // Since we're managing auth state directly, refreshUser is not needed
    // User state is updated directly in signIn method
    console.log("refreshUser: Not implemented - using direct auth management");
  };

  const hasRole = (roles: ProviderRole[]): boolean => {
    return user ? roles.includes(user.provider_role) : false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = getPermissions(user.provider_role);
    return permissions.includes(permission);
  };

  const isOwner = user?.provider_role === "owner";
  const isDispatcher = user?.provider_role === "dispatcher";
  const isProvider = user?.provider_role === "provider";
  const isCustomer = userType === "customer";
  const isAuthenticated = !!(user || customer);

  const value: AuthContextType = {
    user,
    customer,
    userType,
    loading,
    signIn,
    signInCustomer,
    signUpCustomer,
    signInWithGoogle,
    signInWithGoogleIdToken,
    signInWithApple,
    resendVerificationEmail,
    updateCustomerProfile,
    uploadCustomerAvatar,
    signOut,
    refreshUser,
    hasRole,
    hasPermission,
    isOwner,
    isDispatcher,
    isProvider,
    isCustomer,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Permission definitions based on role matrix from spec
const getPermissions = (role: ProviderRole): string[] => {
  const basePermissions = ["view_own_profile", "edit_own_profile"];

  switch (role) {
    case "owner":
      return [
        ...basePermissions,
        "manage_business_profile",
        "manage_services_pricing",
        "manage_staff",
        "view_all_bookings",
        "manage_all_bookings",
        "reassign_bookings",
        "view_all_provider_data",
        "view_all_revenue",
        "send_all_messages",
        "manage_all_calendars",
        "send_all_notifications",
        "manage_integrations",
        "view_analytics",
        "manage_subscription",
        "manage_locations",
      ];

    case "dispatcher":
      return [
        ...basePermissions,
        "manage_business_profile",
        "manage_services_pricing",
        "manage_staff",
        "view_all_bookings",
        "manage_all_bookings",
        "reassign_bookings",
        "view_all_provider_data",
        "view_all_revenue",
        "send_all_messages",
        "manage_all_calendars",
        "send_all_notifications",
        "manage_integrations",
        "view_analytics",
        "manage_subscription",
        "manage_locations",
      ];

    case "provider":
      return [
        ...basePermissions,
        "view_business_profile",
        "view_services_pricing",
        "view_own_bookings",
        "manage_own_bookings",
        "view_own_revenue",
        "send_own_messages",
        "manage_own_calendar",
        "receive_notifications",
      ];

    default:
      return basePermissions;
  }
};
