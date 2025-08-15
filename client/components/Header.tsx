import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { EdgeNotificationCenter } from "@/components/EdgeNotificationCenter";
import { CustomerDropdown } from "@/components/CustomerDropdown";
import { CustomerSignInButton } from "@/components/CustomerSignInButton";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemConfig } from "@/hooks/useSystemConfig";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, customer } = useAuth();
  const { siteLogo } = useSystemConfig();
  const isProvider = !!user;
  const isCustomer = !!customer;

  return (
    <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <img
                src={siteLogo || "https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"}
                alt="ROAM - Your Best Life. Everywhere."
                className="h-10 w-auto hover:opacity-80 transition-opacity"
                onError={(e) => {
                  // Fallback to default logo if dynamic logo fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = "https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800";
                }}
              />
            </Link>
            <span className="text-2xl font-semibold text-roam-blue">Services</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isProvider && <EdgeNotificationCenter />}

            {/* Customer Authentication */}
            {isCustomer ? (
              <CustomerDropdown />
            ) : (
              <CustomerSignInButton
                variant="outline"
                className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
              />
            )}

            {/* Become a Provider link */}
            <Link
              to="/providers"
              className="text-foreground/70 hover:text-roam-blue transition-colors"
            >
              Become a Provider
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link
                to="/providers"
                className="text-foreground/70 hover:text-roam-blue transition-colors"
              >
                Become a Provider
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                {/* Customer Authentication */}
                {isCustomer ? (
                  <CustomerDropdown className="justify-start" />
                ) : (
                  <CustomerSignInButton
                    variant="outline"
                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white justify-start"
                  />
                )}

                {/* Provider Authentication - only show if not a customer */}
                {!isCustomer && (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                    >
                      <Link to="/provider-portal">Provider Sign In</Link>
                    </Button>
                    <Button asChild className="bg-roam-blue hover:bg-roam-blue/90">
                      <Link to="/provider-portal?tab=signup">Provider Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
