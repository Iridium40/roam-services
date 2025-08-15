import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Download,
  ArrowRight,
  Users,
  Building,
  DollarSign,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import PartnerFAQAccordion from "@/components/PartnerFAQAccordion";

export default function PartnerFAQ() {
  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Help Center in App",
      description: "Access our comprehensive help center directly in the ROAM app",
      action: "Open App",
      href: "#",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Contact us directly for any questions or concerns",
      action: "Email Us",
      href: "mailto:contactus@roamyourbestlife.com",
    },
    {
      icon: Building,
      title: "Partner Sign Up",
      description: "Create your service provider profile to get started",
      action: "Sign Up",
      href: "https://roamyourbestlife.com/service-partner-sign-up/",
    },
  ];

  const partnerBenefits = [
    {
      icon: DollarSign,
      title: "You Control Your Earnings",
      description: "Set your own prices and keep everything you charge (minus transaction fees)",
    },
    {
      icon: Users,
      title: "Quality Verified Clients",
      description: "Connect with pre-screened customers who value premium services",
    },
    {
      icon: Shield,
      title: "Full Platform Support",
      description: "24/7 support for scheduling, payments, and customer management",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-roam-blue to-roam-light-blue text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="mb-6">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              <HelpCircle className="w-4 h-4 mr-2" />
              Partner Resources & FAQ
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Partner <span className="text-yellow-300">Support Hub</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about becoming a ROAM service partner 
            and growing your business with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-roam-blue hover:bg-gray-100"
              asChild
            >
              <a href="https://roamyourbestlife.com/service-partner-sign-up/" target="_blank" rel="noopener noreferrer">
                <Users className="w-5 h-5 mr-2" />
                Become a Partner
              </a>
            </Button>
            <Link to="/provider-portal">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Building className="w-5 h-5 mr-2" />
                Provider Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Partner with ROAM?
          </h2>
          <p className="text-lg text-gray-600">
            Join Florida's premier network of service professionals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {partnerBenefits.map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow group">
              <CardContent className="p-6">
                <div className="bg-roam-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-roam-blue/20 transition-colors">
                  <benefit.icon className="w-8 h-8 text-roam-blue" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Partner FAQ
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about becoming a ROAM service partner, 
            managing your business, and maximizing your earnings.
          </p>
        </div>

        <PartnerFAQAccordion className="mb-12" />
      </section>

      {/* Support Options */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Need More Help?
            </h2>
            <p className="text-lg text-gray-600">
              Our partner support team is here to help you succeed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {supportOptions.map((option, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow group">
                <CardContent className="p-6">
                  <div className="bg-roam-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-roam-blue/20 transition-colors">
                    <option.icon className="w-8 h-8 text-roam-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {option.description}
                  </p>
                  <Button 
                    variant="outline" 
                    className="group-hover:bg-roam-blue group-hover:text-white transition-colors"
                    asChild
                  >
                    <a 
                      href={option.href} 
                      target={option.href.startsWith('http') ? '_blank' : undefined} 
                      rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {option.action}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-roam-blue to-roam-light-blue text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Stay Connected with ROAM Partners
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get the latest partner news, events, and platform updates delivered to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-roam-blue hover:bg-gray-100"
              asChild
            >
              <a href="https://roamyourbestlife.com/partner-resources/#link-newsletter" target="_blank" rel="noopener noreferrer">
                <Mail className="w-5 h-5 mr-2" />
                Subscribe to Partner Updates
              </a>
            </Button>
            <Link to="/provider-portal">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Access Provider Portal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
