import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MapPin,
  Heart,
  Star,
  CheckCircle,
  Sparkles,
  Globe,
  TrendingUp,
  Target,
  Award,
  Download,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import FAQAccordion from "@/components/FAQAccordion";

export default function About() {
  const communityAreas = [
    { name: "30A", description: "Scenic Highway 30A corridor" },
    { name: "Destin", description: "Premier beach destination" },
    { name: "Panama City", description: "Gulf Coast hub" },
  ];

  const values = [
    {
      icon: Star,
      title: "Premium Quality",
      description:
        "We partner only with verified, high-quality professionals to ensure exceptional experiences.",
    },
    {
      icon: Heart,
      title: "Community Focused",
      description:
        "Supporting local businesses and fostering economic development in our communities.",
    },
    {
      icon: CheckCircle,
      title: "Trusted & Verified",
      description:
        "All providers undergo thorough verification processes for your safety and peace of mind.",
    },
    {
      icon: Sparkles,
      title: "Luxury Convenience",
      description:
        "Bringing premium beauty, fitness, and wellness services directly to your door.",
    },
  ];

  const stats = [
    { number: "500+", label: "Verified Professionals" },
    { number: "3", label: "Florida Communities" },
    { number: "50+", label: "Service Categories" },
    { number: "98%", label: "Customer Satisfaction" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-roam-blue to-roam-light-blue text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="mb-6">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              Florida's Premier On-Demand Services Platform
            </Badge>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your Best Life. <span className="text-yellow-300">Everywhere.</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            ROAM is a premium booking app connecting residents and visitors to
            luxury beauty, fitness, and wellness experiences along Florida's
            Emerald Coast.
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
              <Users className="w-5 h-5 mr-2" />
              Become a Provider
            </Button>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Mission & Vision
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Redefining what it means to prioritize personal well-being and
            enjoyment
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-l-4 border-l-roam-blue">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-roam-blue" />
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg leading-relaxed">
                To create and foster premium connections that enrich experiences
                in the communities around us. We empower local businesses while
                providing residents and visitors with convenient access to
                luxury wellness services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-yellow-500" />
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg leading-relaxed">
                To be the leading platform that transforms how people access
                premium wellness services, creating thriving communities where
                luxury, convenience, and local business success intersect.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-roam-blue to-roam-light-blue text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Growing the Community
            </h2>
            <p className="text-xl opacity-90">
              Building trust and connections across Florida's Emerald Coast
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-yellow-300">
                  {stat.number}
                </div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Where We Serve
          </h2>
          <p className="text-lg text-gray-600">
            Currently available across three premier Florida communities
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {communityAreas.map((area, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 text-roam-blue mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {area.name}
                </h3>
                <p className="text-gray-600">{area.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <TrendingUp className="w-4 h-4 mr-1" />
            Expanding to new communities soon
          </Badge>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-lg text-gray-600">
              The values that shape every interaction and experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-roam-blue/10 p-3 rounded-lg">
                      <value.icon className="w-6 h-6 text-roam-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Premium Services at Your Door
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            From indulgent home med-spa treatments to invigorating fitness
            sessions, we bring luxury wellness experiences directly to you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Beauty & Spa
              </h3>
              <p className="text-gray-600">
                Professional beauty treatments and spa services in the comfort
                of your home
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Fitness & Wellness
              </h3>
              <p className="text-gray-600">
                Personal training and wellness services tailored to your
                lifestyle
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Premium Experiences
              </h3>
              <p className="text-gray-600">
                Curated luxury experiences that elevate your well-being
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about ROAM services and membership.
          </p>
        </div>

        <FAQAccordion />

        <div className="text-center mt-8">
          <Link to="/faq">
            <Button variant="outline" className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white">
              View All FAQs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-roam-blue to-roam-light-blue text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience Your Best Life?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers and experience the convenience
            of premium on-demand services.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse">
              <Button
                size="lg"
                className="bg-white text-roam-blue hover:bg-gray-100"
              >
                Browse Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/business-registration">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Users className="w-5 h-5 mr-2" />
                Join as a Provider
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
