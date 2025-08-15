import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { ProviderRole } from "@/lib/database.types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ProviderRole[];
  requiredPermissions?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  redirectTo = "/provider-portal",
  fallback = null,
}) => {
  const { user, customer, userType, loading } = useAuth();
  const location = useLocation();

  const isAuthenticated = !!(user || customer);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    // For customer routes, redirect to home page instead of provider portal
    const customerRedirect =
      location.pathname === "/my-bookings" ? "/" : redirectTo;
    return (
      <Navigate to={customerRedirect} state={{ from: location }} replace />
    );
  }

  // Check role permissions (only for provider routes)
  if (
    allowedRoles.length > 0 &&
    userType === "provider" &&
    user &&
    !allowedRoles.includes(user.provider_role)
  ) {
    return (
      fallback || (
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-foreground/70 mb-6">
              You don't have permission to access this area. Contact your
              administrator if you believe this is an error.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-roam-blue text-white rounded-lg hover:bg-roam-blue/90"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    );
  }

  // Check specific permissions (only for provider routes)
  if (requiredPermissions.length > 0 && userType === "provider") {
    const { hasPermission } = useAuth();
    const hasRequiredPermissions = requiredPermissions.every((permission) =>
      hasPermission(permission),
    );

    if (!hasRequiredPermissions) {
      return (
        fallback || (
          <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Insufficient Permissions
              </h2>
              <p className="text-foreground/70 mb-6">
                You don't have the required permissions to perform this action.
              </p>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-roam-blue text-white rounded-lg hover:bg-roam-blue/90"
              >
                Go Back
              </button>
            </div>
          </div>
        )
      );
    }
  }

  return <>{children}</>;
};

// Role-based redirect component
export const RoleBasedRedirect: React.FC = () => {
  const { user, customer, userType, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-lg font-semibold">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!user && !customer) {
    return <Navigate to="/provider-portal" replace />;
  }

  // Redirect based on user type and role
  const getDefaultRoute = (): string => {
    if (userType === "customer") {
      return "/"; // Customers go to home page
    }

    if (user) {
      switch (user.provider_role) {
        case "owner":
          return "/owner/dashboard";
        case "dispatcher":
          return "/dispatcher/dashboard";
        case "provider":
          return "/provider/dashboard";
        default:
          return "/provider-portal";
      }
    }

    return "/provider-portal";
  };

  const defaultRoute = getDefaultRoute();
  const redirectTo = location.state?.from?.pathname || defaultRoute;

  return <Navigate to={redirectTo} replace />;
};
