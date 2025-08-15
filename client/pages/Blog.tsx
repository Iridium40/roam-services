import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, User, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title:
      "Mobile IV Therapy Services: Discover Convenience on the Emerald Coast with ROAM",
    excerpt:
      "Explore the benefits of mobile IV therapy and how ROAM brings professional wellness services directly to your location.",
    category: "IV THERAPY WELLNESS",
    image:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
    author: "Dr. Sarah Chen",
    date: "March 15, 2024",
    readTime: "5 min read",
    slug: "mobile-iv-therapy-emerald-coast",
  },
  {
    id: "2",
    title: "Connecting Wellness and Community at the YOLO & ROAM Event",
    excerpt:
      "Recap of our community wellness event bringing together local providers and health-conscious individuals.",
    category: "COMMUNITY",
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop",
    author: "Jessica Martinez",
    date: "March 12, 2024",
    readTime: "4 min read",
    slug: "yolo-roam-community-event",
  },
  {
    id: "3",
    title: "Glow Goals: How a Spray Tan Lifts Your Look & Your Spirits",
    excerpt:
      "Discover the confidence-boosting benefits of professional spray tanning and why mobile services are the future.",
    category: "BEAUTY SPRAY TAN",
    image:
      "https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2Fc812f66efc8641e5a5e8b82ad8a50e3e?format=webp&width=800",
    author: "Emma Thompson",
    date: "March 10, 2024",
    readTime: "6 min read",
    slug: "spray-tan-confidence-boost",
  },
  {
    id: "4",
    title:
      "Glow On The Go: Why Mobile Spray Tanning Is the Ultimate Beauty Hack",
    excerpt:
      "Learn why mobile spray tanning services are revolutionizing the beauty industry and how to achieve the perfect glow.",
    category: "BEAUTY SPRAY TAN",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop",
    author: "Maria Rodriguez",
    date: "March 8, 2024",
    readTime: "7 min read",
    slug: "mobile-spray-tanning-beauty-hack",
  },
  {
    id: "5",
    title: "Celebrating Connections: The New Inlet Beach Underpass",
    excerpt:
      "How community infrastructure improvements are making wellness services more accessible in coastal communities.",
    category: "COMMUNITY",
    image:
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop",
    author: "Mike Johnson",
    date: "March 5, 2024",
    readTime: "3 min read",
    slug: "inlet-beach-underpass-community",
  },
  {
    id: "6",
    title: "Prioritize Self-Care with ROAM: Massage Therapy Delivered to You",
    excerpt:
      "The importance of regular massage therapy for mental and physical health, now available in your home.",
    category: "MASSAGE WELLNESS",
    image:
      "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop",
    author: "Alex Rivera",
    date: "March 3, 2024",
    readTime: "8 min read",
    slug: "mobile-massage-therapy-selfcare",
  },
  {
    id: "7",
    title: "The Science Behind Mobile Fitness: Personal Training at Home",
    excerpt:
      "Research-backed benefits of in-home personal training and how it compares to traditional gym workouts.",
    category: "FITNESS",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    author: "Coach David Lee",
    date: "March 1, 2024",
    readTime: "9 min read",
    slug: "mobile-fitness-personal-training",
  },
  {
    id: "8",
    title: "Wellness at Your Doorstep: The Future of Healthcare",
    excerpt:
      "How mobile wellness services are transforming healthcare delivery and improving patient outcomes.",
    category: "WELLNESS",
    image:
      "https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=400&h=300&fit=crop",
    author: "Dr. Rachel Kim",
    date: "February 28, 2024",
    readTime: "6 min read",
    slug: "mobile-wellness-future-healthcare",
  },
];

const categories = [
  { id: "all", label: "ALL", color: "bg-gray-600" },
  { id: "about", label: "ABOUT US", color: "bg-roam-blue" },
  { id: "beauty", label: "BEAUTY", color: "bg-pink-500" },
  { id: "community", label: "COMMUNITY", color: "bg-green-500" },
  { id: "fitness", label: "FITNESS", color: "bg-orange-500" },
  { id: "wellness", label: "WELLNESS", color: "bg-purple-500" },
];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      activeCategory === "all" ||
      post.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    if (category.includes("BEAUTY")) return "bg-pink-500";
    if (category.includes("COMMUNITY")) return "bg-green-500";
    if (category.includes("FITNESS")) return "bg-orange-500";
    if (category.includes("WELLNESS")) return "bg-purple-500";
    return "bg-roam-blue";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
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
              <span className="text-roam-blue font-medium">Blog</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-roam-blue/5 to-roam-light-blue/10 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              ROAM Blog
            </h1>
            <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
              Insights, tips, and stories from the world of mobile wellness and
              beauty services
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className={`${
                    activeCategory === category.id
                      ? `${category.color} text-white hover:opacity-90`
                      : "hover:bg-gray-100"
                  } transition-all duration-200`}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No articles found
              </h3>
              <p className="text-foreground/60">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge
                        className={`${getCategoryColor(post.category)} text-white font-semibold text-xs`}
                      >
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-roam-blue transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-foreground/70 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/50">
                        {post.date}
                      </span>
                      <div className="flex items-center gap-2 text-roam-blue font-medium group-hover:gap-3 transition-all">
                        <BookOpen className="w-4 h-4" />
                        <span>Read More</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-gradient-to-br from-roam-blue to-roam-light-blue py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Get the latest wellness tips and ROAM updates delivered to your
              inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white text-foreground"
              />
              <Button
                variant="secondary"
                className="bg-white text-roam-blue hover:bg-gray-100"
              >
                Subscribe
              </Button>
            </div>
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
                Your best life, everywhere. Mobile wellness and beauty services
                at your fingertips.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    to="/home"
                    className="hover:text-white transition-colors"
                  >
                    Beauty
                  </Link>
                </li>
                <li>
                  <Link
                    to="/home"
                    className="hover:text-white transition-colors"
                  >
                    Fitness
                  </Link>
                </li>
                <li>
                  <Link
                    to="/home"
                    className="hover:text-white transition-colors"
                  >
                    Wellness
                  </Link>
                </li>
                <li>
                  <Link
                    to="/home"
                    className="hover:text-white transition-colors"
                  >
                    Lifestyle
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="hover:text-white transition-colors"
                  >
                    Support
                  </Link>
                </li>
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
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    LinkedIn
                  </a>
                </li>
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
