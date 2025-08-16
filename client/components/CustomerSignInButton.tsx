import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomerAuthModal } from "@/components/CustomerAuthModal";
import { User } from "lucide-react";

interface CustomerSignInButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function CustomerSignInButton({ 
  variant = "outline", 
  size = "default",
  className = "",
  children 
}: CustomerSignInButtonProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");

  const handleSignInClick = () => {
    setAuthModalTab("signin");
    setAuthModalOpen(true);
  };

  const handleModalClose = () => {
    setAuthModalOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleSignInClick}
        className={className}
      >
        {children || (
          <>
            <User className="w-4 h-4 mr-2" />
            Customer Sign In
          </>
        )}
      </Button>
      
      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={handleModalClose}
        defaultTab={authModalTab}
      />
    </>
  );
}
