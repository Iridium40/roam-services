import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Download,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import FAQAccordion from "@/components/FAQAccordion";

export default function FAQ() {
  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Help Center",
      description: "Access our comprehensive help center in the app",
      action: "Open Help Center",
      href: "#",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your questions and we'll get back to you",
      action: "Email Us",
      href: "https://roamyourbestlife.com/members/#link-popup",
    },
    {
      icon: Download,
      title: "Download App",
      description: "Get the ROAM app to access all features",
      action: "Download Now",
      href: "#",
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
              Frequently Asked Questions
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            We're Here to <span className="text-yellow-300">Help</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about ROAM services, membership, 
            and how to get the most out of your experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-roam-blue hover:bg-gray-100"
            >
              <Download className="w-5 h-5 mr-2" />
              Download the App
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about ROAM services, membership, and booking appointments.
          </p>
        </div>

        <FAQAccordion className="mb-12" />
      </section>

      {/* Support Options */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-lg text-gray-600">
              Our support team is here to assist you with any questions or concerns
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
                    <a href={option.href} target={option.href.startsWith('http') ? '_blank' : undefined} rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
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

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-roam-blue to-roam-light-blue text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Stay Updated with ROAM
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get the latest news about new services, service areas, and special offers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-roam-blue hover:bg-gray-100"
              asChild
            >
              <a href="https://roamyourbestlife.com/members/#link-newsletter" target="_blank" rel="noopener noreferrer">
                <Mail className="w-5 h-5 mr-2" />
                Subscribe to Newsletter
              </a>
            </Button>
            <Link to="/browse">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Browse Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
