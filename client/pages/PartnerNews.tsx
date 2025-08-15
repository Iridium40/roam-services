import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface PartnerNewsPost {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  href: string;
  categoryHref: string;
}

const partnerNewsPosts: PartnerNewsPost[] = [
  {
    id: "1",
    title: "Service Partner Spotlight: Maureen – Hair and Makeup Expert on The Emerald Coast",
    category: "Partner Spotlight",
    image: "https://i0.wp.com/roamyourbestlife.com/wp-content/uploads/2024/09/2-Maureen_Spotlight_Blog-Thumbnail.jpg?w=1600&ssl=1",
    alt: "Maureen styling a bride's hair on the Emerald Coast in Florida",
    href: "https://roamyourbestlife.com/service-partner-spotlight-maureen-hair-and-makeup-expert/",
    categoryHref: "https://roamyourbestlife.com/category/partner-spotlight/"
  },
  {
    id: "2",
    title: "Service Partner Spotlight: Joey – Transforming Fitness and Wellness on the Emerald Coast with ROAM App",
    category: "Partner Spotlight",
    image: "https://i0.wp.com/roamyourbestlife.com/wp-content/uploads/2024/09/Joey_S_Spotlight_Blog-Thumbnail.jpg?w=1600&ssl=1",
    alt: "ROAM App interface showcasing wellness service providers in the Emerald Coast area",
    href: "https://roamyourbestlife.com/service-partner-spotlight-joey-transforming-fitness-and-wellness-on-the-emerald-coast-with-roam-app/",
    categoryHref: "https://roamyourbestlife.com/category/partner-spotlight/"
  },
  {
    id: "3",
    title: "Service Partner Spotlight: Heather – Elevating Health and Wellness on the Emerald Coast with ROAM App",
    category: "Partner Spotlight",
    image: "https://i0.wp.com/roamyourbestlife.com/wp-content/uploads/2024/09/Health_Coach_30A_Thumbnail-blog.jpg?w=1600&ssl=1",
    alt: "Heather Strickland guiding a client through a personalized wellness plan on the beach.",
    href: "https://roamyourbestlife.com/service-partner-spotlight-heather-elevating-health-and-wellness-on-the-emerald-coast-with-roam-app/",
    categoryHref: "https://roamyourbestlife.com/category/partner-spotlight/"
  },
  {
    id: "4",
    title: "Service Partner Spotlight: Katie – IV Therapy and Aesthetics Provider on the ROAM App",
    category: "Partner Spotlight",
    image: "https://i0.wp.com/roamyourbestlife.com/wp-content/uploads/2024/09/Blog-Thumbnail-Katie-Porter.jpg?w=1600&ssl=1",
    alt: "Katie of ROAM - Your Best Life administering IV hydration to a client at the beach",
    href: "https://roamyourbestlife.com/service-partner-spotlight-katie-iv-therapy-and-aesthetics/",
    categoryHref: "https://roamyourbestlife.com/category/partner-spotlight/"
  },
  {
    id: "5",
    title: "ROAM Team Supports: Empowering Our Service Partners",
    category: "Partner News",
    image: "https://i0.wp.com/roamyourbestlife.com/wp-content/uploads/2024/04/ROAM_Team_Blog_1920x1080.jpg?w=1600&ssl=1",
    alt: "Three men and two women standing in a group photo smiling.",
    href: "https://roamyourbestlife.com/roam-team-supports-empowering-our-service-partners/",
    categoryHref: "https://roamyourbestlife.com/category/partner-news/"
  },
  {
    id: "6",
    title: "Connecting Communities and Elevating Experiences: Join Our ROAM Team",
    category: "Partner News",
    image: "https://i0.wp.com/roamyourbestlife.com/wp-content/uploads/2024/04/Sean_dog_yoga_1920x1080.jpg?w=1600&ssl=1",
    alt: "Man in casual clothing and dog back facing sitting on beach watching a yoga class on the sand with four people.",
    href: "https://roamyourbestlife.com/connecting-communities-and-elevating-experiences-join-our-roam-team/",
    categoryHref: "https://roamyourbestlife.com/category/partner-news/"
  }
];

const filterCategories = [
  { id: "all", label: "All", active: true },
  { id: "partner-news", label: "Partner News", active: false },
  { id: "partner-spotlight", label: "Partner Spotlight", active: false }
];

export default function PartnerNews() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredPosts = partnerNewsPosts.filter(post => {
    if (activeFilter === "all") return true;
    if (activeFilter === "partner-news") return post.category === "Partner News";
    if (activeFilter === "partner-spotlight") return post.category === "Partner Spotlight";
    return true;
  });

  const getCategoryColor = (category: string) => {
    return category === "Partner Spotlight" ? "bg-purple-600" : "bg-blue-600";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM - Your Best Life. Everywhere."
                className="h-10 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/home"
                className="text-foreground/80 hover:text-roam-blue transition-colors"
              >
                Services
              </Link>
              <Link
                to="/providers"
                className="text-foreground/80 hover:text-roam-blue transition-colors"
              >
                Providers
              </Link>
              <Link
                to="/blog"
                className="text-foreground/80 hover:text-roam-blue transition-colors"
              >
                Blog
              </Link>
              <span className="text-roam-blue font-medium">Partner News</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Filter Section */}
          <div className="py-6">
            <div className="flex flex-wrap gap-5 justify-center">
              {filterCategories.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`
                    text-xs font-bold uppercase tracking-wider px-4 py-2
                    ${activeFilter === filter.id 
                      ? "bg-blue-600 text-white border-gray-800" 
                      : "bg-transparent text-blue-600 border-gray-300 hover:bg-gray-50"
                    }
                    transition-all duration-300
                  `}
                  style={{
                    order: filter.id === "all" ? -1 : 0
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          <div className="pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card 
                  key={post.id} 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer bg-gradient-to-b from-white to-blue-50 border-0"
                >
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={post.image}
                      alt={post.alt}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <CardContent className="p-0">
                    {/* Category Badge */}
                    <div className="bg-white px-3 py-2">
                      <div className="flex items-center">
                        <Badge 
                          className={`${getCategoryColor(post.category)} text-white text-xs font-bold uppercase tracking-wide`}
                        >
                          <a 
                            href={post.categoryHref}
                            className="hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {post.category}
                          </a>
                        </Badge>
                      </div>
                    </div>

                    {/* Title and CTA */}
                    <div className="bg-yellow-400 px-3 py-4 mb-5">
                      <h3 className="text-white font-normal text-lg leading-7 mb-4 group-hover:text-gray-100 transition-colors">
                        {post.title}
                      </h3>
                      
                      <div>
                        <a
                          href={post.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-black text-white px-6 py-3 rounded-full font-medium text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors duration-300"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <span>Read More</span>
                            <ChevronRight className="w-4 h-4 fill-yellow-400" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <section className="bg-gradient-to-br from-roam-blue to-roam-light-blue py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Stay Connected with ROAM Partners
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Get the latest partner news, events, and platform updates delivered to your inbox.
            </p>
            <Button
              asChild
              variant="secondary"
              className="bg-white text-roam-blue hover:bg-gray-100 font-semibold px-8 py-3"
            >
              <a 
                href="https://roamyourbestlife.com/partner-resources/#link-newsletter" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Subscribe to Partner Updates
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                alt="ROAM"
                className="h-8 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400">
                Your best life, everywhere. Mobile wellness and beauty services at your fingertips.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/home" className="hover:text-white transition-colors">Beauty</Link></li>
                <li><Link to="/home" className="hover:text-white transition-colors">Fitness</Link></li>
                <li><Link to="/home" className="hover:text-white transition-colors">Wellness</Link></li>
                <li><Link to="/home" className="hover:text-white transition-colors">Lifestyle</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="https://www.instagram.com/roam_yourbestlife/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ROAM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
