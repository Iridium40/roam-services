import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Calendar,
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
} from "lucide-react";

export default function Providers() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Earnings",
      description:
        "Keep everything you charge customers. Only payout transaction fees apply.",
      highlight: "$50-200/hour average",
    },
    {
      icon: Calendar,
      title: "Flexible Schedule",
      description:
        "Work when you want, where you want. Set your own availability and rates.",
      highlight: "100% control",
    },
    {
      icon: Users,
      title: "Quality Clients",
      description:
        "Connect with verified customers who value premium services.",
      highlight: "Pre-screened customers",
    },
    {
      icon: Shield,
      title: "Full Support",
      description:
        "Comprehensive insurance coverage, background verification, and 24/7 support.",
      highlight: "Protected & supported",
    },
  ];

  const requirements = [
    "Professional certification or 2+ years experience",
    "Pass background check and verification process",
    "Maintain 4.5+ star rating",
    "Provide your own equipment and transportation",
    "Available in Florida service areas",
    "Professional liability insurance (we can help)",
  ];

  const earnings = [
    { service: "Personal Training", range: "$60-120/hour", demand: "High" },
    { service: "Massage Therapy", range: "$80-150/hour", demand: "Very High" },
    { service: "Beauty Services", range: "$40-100/hour", demand: "High" },
    { service: "Home Cleaning", range: "$25-50/hour", demand: "Very High" },
    { service: "Wellness Coaching", range: "$75-125/hour", demand: "Growing" },
    { service: "Healthcare Services", range: "$100-200/hour", demand: "High" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      <Header />

      {/* Hero Section */}
      <section
        className="relative py-20 lg:py-32 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        }}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 bg-roam-light-blue/20 text-roam-blue border-roam-light-blue/30">
                💼 Now accepting provider applications
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-roam-blue via-foreground to-roam-blue bg-clip-text text-transparent leading-tight">
                Grow Your Business
                <br />
                <span className="text-roam-blue">On Your Terms</span>
              </h1>
              <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join Florida's premier network of service professionals. Connect
                with quality clients, set your own rates, and build your
                business with the support you deserve.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  asChild
                  size="lg"
                  className="bg-roam-blue hover:bg-roam-blue/90 text-lg px-8 py-6"
                >
                  <Link to="/provider-portal">
                    <Users className="w-5 h-5 mr-2" />
                    Apply Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white text-lg px-8 py-6"
                >
                  <Link to="/provider-portal">
                    <Calendar className="w-5 h-5 mr-2" />
                    Learn More
                  </Link>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-roam-blue">$85k</div>
                  <div className="text-sm text-foreground/60">
                    Average annual earnings
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-roam-blue">4.9/5</div>
                  <div className="text-sm text-foreground/60">
                    Provider satisfaction
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-roam-blue">24/7</div>
                  <div className="text-sm text-foreground/60">
                    Support available
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose <span className="text-roam-blue">ROAM</span>?
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              We're more than a platform – we're your business partner,
              dedicated to your success and growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-border/50 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-foreground/70 mb-3">
                        {benefit.description}
                      </p>
                      <Badge
                        variant="secondary"
                        className="bg-roam-light-blue/20 text-roam-blue"
                      >
                        {benefit.highlight}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Potential */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-roam-blue">Earning Potential</span> by
              Service
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              See what providers in your field are earning on the ROAM platform.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-roam-blue" />
                  Florida Provider Earnings (2024)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earnings.map((earning, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{earning.service}</div>
                        <div className="text-sm text-foreground/60">
                          Per hour, before taxes
                        </div>
                      </div>
                      <div className="text-center mx-4">
                        <div className="text-lg font-bold text-roam-blue">
                          {earning.range}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            earning.demand === "Very High"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            earning.demand === "Very High"
                              ? "bg-roam-success text-white"
                              : ""
                          }
                        >
                          {earning.demand} Demand
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Application <span className="text-roam-blue">Requirements</span>
              </h2>
              <p className="text-lg text-foreground/70">
                We maintain high standards to ensure the best experience for
                both providers and customers.
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-roam-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{requirement}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-roam-light-blue/10 rounded-lg border border-roam-light-blue/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-roam-blue flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-roam-blue mb-2">
                        Verification Process
                      </h4>
                      <p className="text-sm text-foreground/70">
                        All providers undergo comprehensive background checks,
                        identity verification, and skill assessment. We also
                        provide ongoing training and certification opportunities
                        to help you grow.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-roam-blue to-roam-light-blue">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Earning More?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful providers who've grown their business
            with ROAM. Application takes less than 10 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-roam-blue hover:bg-white/90 text-lg px-8 py-6"
            >
              <Users className="w-5 h-5 mr-2" />
              Start Application
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Quick 10-min application
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure verification process
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Florida-wide opportunities
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
