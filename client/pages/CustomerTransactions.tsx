import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  User,
  DollarSign,
  Download,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerTransactions() {
  const { customer } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Mock transaction data - in real app this would come from API
  const transactions = [
    {
      id: "TXN-001",
      date: "2024-01-15",
      service: "Deep Tissue Massage",
      provider: {
        name: "Sarah Johnson",
        id: "provider-1",
        image: "/api/placeholder/60/60",
        rating: 4.9,
      },
      amount: 120.0,
      tip: 20.0,
      total: 140.0,
      status: "completed",
      duration: "90 minutes",
      location: "Your Home - 123 Ocean Dr, Miami, FL",
      deliveryType: "mobile",
      paymentMethod: "Credit Card",
      receipt: "RCP-001",
    },
    {
      id: "TXN-002",
      date: "2024-01-08",
      service: "Personal Training Session",
      provider: {
        name: "Michael Chen",
        id: "provider-2",
        image: "/api/placeholder/60/60",
        rating: 5.0,
      },
      amount: 80.0,
      tip: 15.0,
      total: 95.0,
      status: "completed",
      duration: "60 minutes",
      location: "Your Home - 456 Park Ave, Orlando, FL",
      deliveryType: "mobile",
      paymentMethod: "Credit Card",
      receipt: "RCP-002",
    },
    {
      id: "TXN-003",
      date: "2024-01-20",
      service: "Hair Cut & Color",
      provider: {
        name: "Emily Rodriguez",
        id: "provider-3",
        image: "/api/placeholder/60/60",
        rating: 4.8,
      },
      amount: 185.0,
      tip: 0.0,
      total: 185.0,
      status: "pending",
      duration: "3 hours",
      location: "Beauty Studio - 789 Main St, Tampa, FL",
      deliveryType: "in-studio",
      paymentMethod: "Credit Card",
      receipt: "RCP-003",
    },
  ];

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg">Please sign in to view your transactions.</p>
          <Button asChild className="mt-4 bg-roam-blue hover:bg-roam-blue/90">
            <Link to="/">Go Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.provider.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesYear = transaction.date.startsWith(selectedYear);
    const matchesStatus =
      selectedStatus === "all" || transaction.status === selectedStatus;

    return matchesSearch && matchesYear && matchesStatus;
  });

  const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTips = transactions.reduce((sum, t) => sum + t.tip, 0);
  const completedBookings = transactions.filter(
    (t) => t.status === "completed",
  ).length;

  const getStatusConfig = (status: string) => {
    const configs = {
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
      refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-roam-light-blue/10">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fa42b6f9ec53e4654a92af75aad56d14f%2F38446bf6c22b453fa45caf63b0513e21?format=webp&width=800"
                  alt="ROAM Logo"
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Transactions Content */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  Transaction <span className="text-roam-blue">History</span>
                </h1>
                <p className="text-lg text-foreground/70">
                  View your booking history, payments, and transaction details.
                </p>
              </div>
              <Button className="bg-roam-blue hover:bg-roam-blue/90">
                <Download className="w-4 h-4 mr-2" />
                Export History
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-roam-blue/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-roam-blue" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-foreground/60">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold">
                        ${totalSpent.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-foreground/60">
                        Tips Given
                      </p>
                      <p className="text-2xl font-bold">
                        ${totalTips.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-foreground/60">
                        Completed
                      </p>
                      <p className="text-2xl font-bold">{completedBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-foreground/60">
                        Avg. Per Service
                      </p>
                      <p className="text-2xl font-bold">
                        $
                        {completedBookings > 0
                          ? (totalSpent / completedBookings).toFixed(2)
                          : "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <Input
                        placeholder="Search services or providers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const statusConfig = getStatusConfig(transaction.status);

                return (
                  <Card
                    key={transaction.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-roam-blue to-roam-light-blue rounded-full flex items-center justify-center">
                            <Receipt className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">
                                  {transaction.service}
                                </h3>
                                <p className="text-foreground/60 mb-2">
                                  with {transaction.provider.name}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-foreground/60">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                      transaction.date,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {transaction.duration}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {transaction.deliveryType === "mobile"
                                      ? "Mobile"
                                      : "Business"}
                                  </div>
                                </div>
                              </div>
                              <Badge className={statusConfig.color}>
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="bg-accent/20 rounded-lg p-3 mb-3">
                              <p className="text-sm">
                                <strong>Location:</strong>{" "}
                                {transaction.location}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-foreground/60">
                                  Service Amount
                                </p>
                                <p className="font-semibold">
                                  ${transaction.amount.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-foreground/60">Tip</p>
                                <p className="font-semibold">
                                  {transaction.tip > 0
                                    ? `$${transaction.tip.toFixed(2)}`
                                    : "No tip"}
                                </p>
                              </div>
                              <div>
                                <p className="text-foreground/60">Total Paid</p>
                                <p className="font-semibold text-roam-blue">
                                  ${transaction.total.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-foreground/60">
                                  Payment Method
                                </p>
                                <p className="font-semibold">
                                  {transaction.paymentMethod}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-2">
                          <Button variant="outline" size="sm">
                            <Receipt className="w-4 h-4 mr-2" />
                            View Receipt
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/provider/${transaction.provider.id}`}>
                              <User className="w-4 h-4 mr-2" />
                              View Provider
                            </Link>
                          </Button>
                          {transaction.status === "completed" &&
                            transaction.tip === 0 && (
                              <Button
                                size="sm"
                                className="bg-roam-blue hover:bg-roam-blue/90"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Add Tip
                              </Button>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTransactions.length === 0 && (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No transactions found
                  </h3>
                  <p className="text-foreground/60 mb-4">
                    Try adjusting your search criteria or browse all
                    transactions.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedYear("2024");
                      setSelectedStatus("all");
                    }}
                    className="border-roam-blue text-roam-blue hover:bg-roam-blue hover:text-white"
                  >
                    Clear Filters
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
