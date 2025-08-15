import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, RoleBasedRedirect } from "@/components/ProtectedRoute";
import SystemBrandingInitializer from "@/components/SystemBrandingInitializer";

// Type declaration for React root container
declare global {
  interface HTMLElement {
    _reactRoot?: ReturnType<typeof createRoot>;
  }
}
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Providers from "./pages/Providers";
import About from "./pages/About";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import MyBookings from "./pages/MyBookings";
import ProviderPortal from "./pages/ProviderPortal";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderOnboarding from "./pages/ProviderOnboarding";
import ProviderProfile from "./pages/ProviderProfile";
import ProviderBooking from "./pages/ProviderBooking";
import ProviderDocumentVerification from "./pages/ProviderDocumentVerification";
import BusinessManagement from "./pages/BusinessManagement";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerSettings from "./pages/CustomerSettings";
import CustomerTransactions from "./pages/CustomerTransactions";
import CustomerFavorites from "./pages/CustomerFavorites";
import CustomerLocations from "./pages/CustomerLocations";
import BusinessProfile from "./pages/BusinessProfile";
import NotFound from "./pages/NotFound";
import ServiceBookingFlow from "./pages/ServiceBookingFlow";
import BusinessAvailability from "./pages/BusinessAvailability";
import BusinessServiceBooking from "./pages/BusinessServiceBooking";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import BookingSuccess from "./pages/BookingSuccess";
import SignIn from "./pages/SignIn";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import PartnerFAQ from "./pages/PartnerFAQ";
import PlaidTest from "./pages/PlaidTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SystemBrandingInitializer />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Index />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/support" element={<Support />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/provider-portal" element={<ProviderPortal />} />
            <Route path="/plaid-test" element={<PlaidTest />} />
            <Route
              path="/provider-document-verification"
              element={<ProviderDocumentVerification />}
            />

            {/* Protected routes - any authenticated provider */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Owner-specific routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />

            {/* Dispatcher-specific routes */}
            <Route
              path="/dispatcher/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner", "dispatcher"]}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />

            {/* Provider-specific routes */}
            <Route
              path="/provider/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={["owner", "dispatcher", "provider"]}
                >
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />

            {/* Legacy route redirects */}
            <Route
              path="/provider-dashboard"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />

            {/* Business management - owner only */}
            <Route
              path="/business-management"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <BusinessManagement />
                </ProtectedRoute>
              }
            />

            {/* General protected routes */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            {/* Customer-specific routes */}
            <Route
              path="/customer/bookings"
              element={
                <ProtectedRoute redirectTo="/sign-in">
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute redirectTo="/sign-in">
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/settings"
              element={
                <ProtectedRoute redirectTo="/sign-in">
                  <CustomerSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/transactions"
              element={
                <ProtectedRoute redirectTo="/sign-in">
                  <CustomerTransactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/favorites"
              element={
                <ProtectedRoute redirectTo="/sign-in">
                  <CustomerFavorites />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/locations"
              element={
                <ProtectedRoute redirectTo="/sign-in">
                  <CustomerLocations />
                </ProtectedRoute>
              }
            />

            <Route
              path="/provider-onboarding"
              element={
                <ProtectedRoute>
                  <ProviderOnboarding />
                </ProtectedRoute>
              }
            />

            <Route path="/provider/:providerId" element={<ProviderProfile />} />

            <Route path="/book/:businessId" element={<ProviderBooking />} />

            <Route path="/business/:businessId" element={<BusinessProfile />} />

            {/* Booking Flow Routes */}
            <Route
              path="/book-service/:serviceId"
              element={<ServiceBookingFlow />}
            />
            <Route
              path="/book-service/:serviceId/businesses"
              element={<BusinessAvailability />}
            />
            <Route
              path="/business/:businessId/book-service"
              element={<BusinessServiceBooking />}
            />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/booking-success" element={<BookingSuccess />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Prevent multiple root creations during hot module reloading
const container = document.getElementById("root")!;

if (import.meta.hot) {
  // In development with HMR, always create a new root to avoid stale closures
  const root = createRoot(container);
  root.render(<App />);

  // Clean up on HMR update
  import.meta.hot.dispose(() => {
    root.unmount();
  });
} else {
  // In production or when HMR is not available
  if (!container._reactRoot) {
    const root = createRoot(container);
    container._reactRoot = root;
    root.render(<App />);
  } else {
    container._reactRoot.render(<App />);
  }
}
