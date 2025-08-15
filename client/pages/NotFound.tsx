import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowLeft, Search, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      <Header />

      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-border/50">
              <CardContent className="p-12">
                <div className="w-20 h-20 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-roam-blue">
                  404
                </h1>

                <h2 className="text-2xl font-semibold mb-4">
                  Service Not Found
                </h2>

                <p className="text-lg text-foreground/70 mb-8">
                  Looks like you've wandered off the map! The page you're
                  looking for doesn't exist, but don't worry – we'll help you
                  find your way back to amazing services.
                </p>

                <div className="bg-roam-light-blue/10 rounded-lg p-6 mb-8 border border-roam-light-blue/20">
                  <p className="text-sm text-foreground/80">
                    💡 <strong>Quick Suggestions:</strong> Try visiting our
                    homepage to explore services, or use the navigation menu to
                    find what you need. Our premium providers are ready to serve
                    you!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    className="bg-roam-blue hover:bg-roam-blue/90"
                  >
                    <Link to="/home">
                      <Home className="w-4 h-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    <Link to="/providers">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Services
                    </Link>
                  </Button>
                </div>

                <div className="mt-8 text-sm text-foreground/60">
                  <p>
                    Need help?{" "}
                    <Link
                      to="/support"
                      className="text-roam-blue hover:underline"
                    >
                      Contact our support team
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
