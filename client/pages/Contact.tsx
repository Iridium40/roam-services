import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  Send,
  Instagram,
  Facebook,
  Bot,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import ChatBot from "@/components/ChatBot";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email using Vercel API route
      const response = await fetch("/api/send-contact-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "contactus@roamyourbestlife.com",
          from: formData.email,
          subject: `Contact Form: ${formData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${formData.message.replace(/\n/g, "<br>")}</p>
          `,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Email send failed:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        });
        throw new Error(
          responseData.error || `Server error: ${response.status}`,
        );
      }

      setIsSubmitted(true);
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error sending message",
        description:
          "Please try again or contact us directly at contactus@roamyourbestlife.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.subject.trim() &&
      formData.message.trim()
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-roam-blue via-roam-light-blue to-roam-yellow py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            We're here to help! Reach out to us through any of the channels
            below and our team will get back to you as soon as possible.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-roam-blue" />
                  Send us a Message
                </CardTitle>
                <p className="text-foreground/70">
                  Fill out the form below and we'll respond within 24 hours
                </p>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-green-700 mb-2">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-foreground/70 mb-6">
                      Thank you for contacting us. We'll get back to you within
                      24 hours.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="What can we help you with?"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Please provide details about your inquiry..."
                        className="min-h-[120px]"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!isFormValid() || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-foreground/60 text-center mt-2">
                      By submitting this form, you agree to our{" "}
                      <a
                        href="https://app.termly.io/policy-viewer/policy.html?policyUUID=8bd3c211-2aaa-4626-9910-794dc2d85aff"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-roam-blue hover:underline"
                      >
                        Terms & Conditions
                      </a>{" "}
                      and Privacy Policy.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information & Alternative Methods */}
          <div className="space-y-6">
            {/* Direct Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-roam-blue" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-roam-blue" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-foreground/70">
                      contactus@roamyourbestlife.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-roam-blue" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-foreground/70">
                      Within 24 hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-roam-blue" />
                  Follow Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  Connect with us on social media for updates, tips, and
                  community discussions.
                </p>
                <div className="flex gap-3">
                  <a
                    href="https://www.instagram.com/roam_yourbestlife/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </Button>
                  </a>
                  <a
                    href="https://www.facebook.com/roamtheapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Chat AI Bot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-roam-blue" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  Get instant answers to common questions with our AI-powered
                  chat assistant.
                </p>
                <Badge
                  variant="default"
                  className="mb-4 bg-green-100 text-green-700"
                >
                  Available Now
                </Badge>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Chat with AI Assistant
                </Button>
                <p className="text-xs text-foreground/60 mt-2">
                  Powered by Vercel AI SDK
                </p>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Common Topics:</h4>
                  <ul className="text-sm text-foreground/70 space-y-1">
                    <li>• Booking and scheduling</li>
                    <li>• Account and profile issues</li>
                    <li>• Payment and billing</li>
                    <li>• Provider applications</li>
                    <li>• Technical support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="py-6">
              <h3 className="text-xl font-semibold mb-4">We're Here to Help</h3>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Whether you're a customer looking for services or a provider
                wanting to join our platform, our team is dedicated to providing
                you with the best possible experience. Don't hesitate to reach
                out with any questions, feedback, or suggestions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Bot */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
