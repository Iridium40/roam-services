// Enhanced ROAM Chatbot with Correct User Data Relationships
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Settings, Calendar, Shield, Database, Wifi, WifiOff, RefreshCw, Crown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface UserDataMap {
  profile?: any;
  bookings?: any[];
  locations?: any[];
  earnings?: any;
  availability?: any[];
  business?: any;
  providers?: any[];
  services?: any[];
  transactions?: any[];
  favorites?: any[];
  adminStats?: any;
  allUsers?: any[];
  allBusinesses?: any[];
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userData, setUserData] = useState<UserDataMap>({});
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Mock user context until we have proper auth context
  const userContext = {
    userId: currentUser?.id || 'demo-user',
    isAuthenticated: !!currentUser,
    userType: currentUser?.user_metadata?.role || 'customer',
    fullName: currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User'
  };

  const roleConfig = {
    owner: {
      label: 'Business Owner',
      icon: Settings,
      color: 'bg-purple-500',
      quickActions: [
        "Show my business performance this month",
        "How many bookings do my providers have today?",
        "What's my total business revenue?",
        "Which provider is performing best?"
      ]
    },
    dispatcher: {
      label: 'Dispatcher',
      icon: Calendar,
      color: 'bg-orange-500',
      quickActions: [
        "Show today's bookings for all providers",
        "Which providers are available now?",
        "Show me any booking conflicts",
        "What's the schedule for tomorrow?"
      ]
    },
    provider: {
      label: 'Provider',
      icon: User,
      color: 'bg-green-500',
      quickActions: [
        "Show my earnings this month",
        "When is my next appointment?",
        "Show my availability this week",
        "How many bookings do I have today?"
      ]
    },
    customer: {
      label: 'Customer',
      icon: User,
      color: 'bg-blue-500',
      quickActions: [
        "When is my next booking?",
        "Find massage providers near me",
        "Show providers who do yoga near my location",
        "How much have I spent this month?"
      ]
    },
    admin: {
      label: 'Platform Admin',
      icon: Crown,
      color: 'bg-red-600',
      quickActions: [
        "Show platform statistics",
        "How many new users this month?",
        "Show top performing businesses",
        "Platform revenue summary"
      ]
    }
  };

  // Initialize and check auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          await loadUserData();
        } else {
          // Demo mode
          setCurrentUser({
            id: 'demo-user',
            email: 'demo@roam.com',
            user_metadata: {
              role: 'customer',
              full_name: 'Demo User'
            }
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          await loadUserData();
        } else {
          setCurrentUser(null);
          setUserData({});
          setIsConnected(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Comprehensive data loading based on correct user relationships
  const loadUserData = async () => {
    if (!userContext.userId || !userContext.isAuthenticated) return;

    try {
      setIsLoading(true);
      const userId = userContext.userId;
      const userType = userContext.userType || 'customer';
      const newUserData: UserDataMap = {};

      switch (userType) {
        case 'customer':
          await loadCustomerData(userId, newUserData);
          break;
          
        case 'provider':
        case 'dispatcher':  
        case 'owner':
          // All these roles use providers.user_id -> auth.users.id relationship
          await loadProviderBasedData(userId, userType, newUserData);
          break;
          
        case 'admin':
          // Admin has access to ALL platform data
          await loadAdminData(userId, newUserData);
          break;
      }

      setUserData(newUserData);
      setLastDataRefresh(new Date());
      setIsConnected(true);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerData = async (userId: string, userData: UserDataMap) => {
    try {
      // Customer bookings with provider and service details
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          services(id, name, description, base_price, duration_minutes),
          providers(
            id,
            first_name,
            last_name,
            business_id,
            businesses(id, business_name, phone)
          )
        `)
        .eq('customer_id', userId)
        .order('booking_date', { ascending: false })
        .limit(10);

      // Customer saved locations
      const { data: locations } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', userId)
        .order('is_default', { ascending: false });

      // Customer transactions/payment history
      const { data: transactions } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          total_amount,
          tip_amount,
          status,
          services(name),
          providers(first_name, last_name)
        `)
        .eq('customer_id', userId)
        .not('total_amount', 'is', null)
        .order('booking_date', { ascending: false });

      userData.bookings = bookings || [];
      userData.locations = locations || [];
      userData.transactions = transactions || [];
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const loadProviderBasedData = async (userId: string, userType: string, userData: UserDataMap) => {
    try {
      // Get provider record using providers.user_id -> auth.users.id
      const { data: providerRecord } = await supabase
        .from('providers')
        .select(`
          *,
          businesses(id, business_name, phone, contact_email),
          business_locations(id, location_name, address_line1, city, state)
        `)
        .eq('user_id', userId)
        .single();

      if (!providerRecord) {
        console.error('No provider record found for user');
        return;
      }

      const providerId = providerRecord.id;
      const businessId = providerRecord.business_id;

      // Get bookings based on user role scope
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
          services(name, base_price, duration_minutes),
          customers(id, first_name, last_name, email),
          providers(
            id,
            first_name,
            last_name
          )
        `);

      if (userType === 'provider') {
        // Provider: only their own bookings
        bookingsQuery = bookingsQuery.eq('provider_id', providerId);
      } else if (userType === 'dispatcher' || userType === 'owner') {
        // Dispatcher/Owner: all bookings for their business
        const { data: businessProviders } = await supabase
          .from('providers')
          .select('id')
          .eq('business_id', businessId);
        
        const providerIds = businessProviders?.map(p => p.id) || [];
        if (providerIds.length > 0) {
          bookingsQuery = bookingsQuery.in('provider_id', providerIds);
        }
      }

      const { data: bookings } = await bookingsQuery
        .order('booking_date', { ascending: false })
        .limit(50);

      // Calculate earnings based on scope
      const completedBookings = bookings?.filter(b => b.status === 'COMPLETED') || [];
      let earnings;

      if (userType === 'provider') {
        // Personal earnings only
        const personalBookings = completedBookings.filter(b => b.provider_id === providerId);
        const totalEarnings = personalBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
        const thisMonthEarnings = personalBookings
          .filter(b => new Date(b.booking_date).getMonth() === new Date().getMonth())
          .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);

        earnings = {
          total: totalEarnings,
          thisMonth: thisMonthEarnings,
          completedBookings: personalBookings.length
        };
      } else {
        // Business-wide earnings (dispatcher/owner)
        const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
        const thisMonthRevenue = completedBookings
          .filter(b => new Date(b.booking_date).getMonth() === new Date().getMonth())
          .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);

        // Get all providers for this business
        const { data: businessProviders } = await supabase
          .from('providers')
          .select(`
            id,
            first_name,
            last_name,
            is_active
          `)
          .eq('business_id', businessId);

        earnings = {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          completedBookings: completedBookings.length,
          activeProviders: businessProviders?.length || 0
        };

        userData.providers = businessProviders;
      }

      userData.profile = providerRecord;
      userData.bookings = bookings || [];
      userData.earnings = earnings;
      userData.business = providerRecord.businesses;
    } catch (error) {
      console.error('Error loading provider data:', error);
    }
  };

  const loadAdminData = async (userId: string, userData: UserDataMap) => {
    try {
      // Platform statistics
      const [
        { count: userCount },
        { count: bookingCount },
        { count: businessCount },
        { count: providerCount }
      ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('business_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('providers').select('*', { count: 'exact', head: true })
      ]);

      // Recent platform activity
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name),
          customers(first_name, last_name),
          providers(first_name, last_name, businesses(business_name))
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Revenue calculations
      const { data: completedBookings } = await supabase
        .from('bookings')
        .select('total_amount, booking_date')
        .eq('status', 'COMPLETED');

      const totalPlatformRevenue = completedBookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const thisMonthRevenue = completedBookings?.filter(b => 
        new Date(b.booking_date).getMonth() === new Date().getMonth()
      ).reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

      userData.adminStats = {
        totalUsers: userCount || 0,
        totalBookings: bookingCount || 0,
        totalBusinesses: businessCount || 0,
        totalProviders: providerCount || 0,
        totalPlatformRevenue,
        thisMonthRevenue,
        recentActivity: recentBookings?.slice(0, 10) || []
      };

      userData.bookings = recentBookings || [];

    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  // Enhanced query processing for user-specific questions
  const processUserQuery = async (query: string): Promise<string | null> => {
    const queryLower = query.toLowerCase();
    const userType = userContext.userType || 'customer';

    // Admin-specific queries
    if (userType === 'admin') {
      if (queryLower.includes('platform') || queryLower.includes('statistics') || queryLower.includes('stats')) {
        const stats = userData.adminStats;
        return `📊 Platform Statistics:
• **Total Users:** ${stats?.totalUsers || 0}
• **Total Bookings:** ${stats?.totalBookings || 0}
• **Total Businesses:** ${stats?.totalBusinesses || 0}
• **Total Providers:** ${stats?.totalProviders || 0}
• **Platform Revenue:** $${stats?.totalPlatformRevenue?.toFixed(2) || '0.00'}
• **This Month Revenue:** $${stats?.thisMonthRevenue?.toFixed(2) || '0.00'}`;
      }
    }

    // Next booking queries
    if (queryLower.includes('next booking') || queryLower.includes('upcoming appointment')) {
      const upcomingBookings = userData.bookings?.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        const today = new Date();
        return bookingDate > today && booking.status !== 'CANCELLED';
      }).sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

      if (!upcomingBookings?.length) {
        return `📅 ${userType === 'customer' ? 'You don\'t have any upcoming bookings.' : 'No upcoming appointments scheduled.'}`;
      }

      const nextBooking = upcomingBookings[0];
      const bookingDate = new Date(nextBooking.booking_date);
      const serviceInfo = nextBooking.services;
      
      let personInfo;
      if (userType === 'customer') {
        personInfo = `${nextBooking.providers?.first_name} ${nextBooking.providers?.last_name}`;
      } else {
        personInfo = `${nextBooking.customers?.first_name} ${nextBooking.customers?.last_name}`;
      }

      return `📅 Your next ${userType === 'customer' ? 'booking' : 'appointment'}:
• **Service:** ${serviceInfo?.name || 'N/A'}
• **Date:** ${bookingDate.toLocaleDateString()} at ${nextBooking.start_time || 'TBD'}
• **${userType === 'customer' ? 'Provider' : 'Customer'}:** ${personInfo || 'N/A'}
• **Cost:** $${nextBooking.total_amount || serviceInfo?.base_price || 0}
• **Duration:** ${serviceInfo?.duration_minutes || 'N/A'} minutes
• **Status:** ${nextBooking.status}`;
    }

    // Earnings/spending queries
    if (queryLower.includes('earning') || queryLower.includes('income') || queryLower.includes('money') || queryLower.includes('revenue')) {
      if (userType === 'customer') {
        const totalSpent = userData.transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
        const thisMonthSpent = userData.transactions?.filter(t => 
          new Date(t.booking_date).getMonth() === new Date().getMonth()
        ).reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

        return `💰 Your spending summary:
• **Total spent:** $${totalSpent.toFixed(2)}
• **This month:** $${thisMonthSpent.toFixed(2)}
• **Total bookings:** ${userData.transactions?.length || 0}`;
      } else {
        const earnings = userData.earnings;
        const isBusinessScope = userType === 'owner' || userType === 'dispatcher';
        
        return `💰 ${isBusinessScope ? 'Business' : 'Your'} earnings summary:
• **Total ${isBusinessScope ? 'revenue' : 'earnings'}:** $${earnings?.total?.toFixed(2) || '0.00'}
• **This month:** $${earnings?.thisMonth?.toFixed(2) || '0.00'}
• **Completed bookings:** ${earnings?.completedBookings || 0}
${isBusinessScope ? `• **Active providers:** ${earnings?.activeProviders || 0}` : ''}`;
      }
    }

    // Recent bookings
    if (queryLower.includes('recent booking') || queryLower.includes('my booking')) {
      const recentBookings = userData.bookings?.slice(0, 3) || [];
      
      if (!recentBookings.length) {
        return "📅 No recent bookings found.";
      }

      const bookingsList = recentBookings.map(booking => {
        const date = new Date(booking.booking_date).toLocaleDateString();
        const service = booking.services?.name || 'Service';
        
        if (userType === 'customer') {
          const provider = `${booking.providers?.first_name} ${booking.providers?.last_name}`;
          return `• ${service} with ${provider} on ${date}`;
        } else {
          const customer = `${booking.customers?.first_name} ${booking.customers?.last_name}`;
          return `• ${service} with ${customer} on ${date}`;
        }
      }).join('\n');

      return `📅 Your recent bookings:\n${bookingsList}`;
    }

    return null; // Let AI handle other queries
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // First, try to handle with specific user data
      const userDataResponse = await processUserQuery(currentInput);
      
      if (userDataResponse) {
        const botMessage: Message = {
          id: Date.now() + 1,
          type: 'bot',
          content: userDataResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

      // Fallback to simulated response
      const simulatedResponse = getSimulatedResponse(currentInput);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: simulatedResponse,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error accessing your account data. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const getSimulatedResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("booking") || lowerInput.includes("appointment")) {
      return "To make a booking, browse our services and select a provider that fits your needs. Each provider's profile shows their availability and pricing.";
    }

    if (lowerInput.includes("provider") || lowerInput.includes("join")) {
      return "Interested in becoming a provider? You can apply through our 'Become a Provider' page. We welcome verified professionals in beauty, fitness, wellness, and healthcare.";
    }

    if (lowerInput.includes("payment") || lowerInput.includes("cost")) {
      return "ROAM offers secure payment processing. You can see exact pricing on each provider's profile before booking. We accept major credit cards and digital payments.";
    }

    return "I'm here to help with questions about ROAM's services, booking process, becoming a provider, payments, and more. Could you please be more specific about what you'd like to know?";
  };

  // Initialize with user data and welcome message
  useEffect(() => {
    if (isOpen && userContext.isAuthenticated && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now(),
        type: 'bot',
        content: generateWelcomeMessage(),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, userContext.isAuthenticated]);

  const generateWelcomeMessage = () => {
    const userType = userContext.userType || 'customer';
    const config = roleConfig[userType as keyof typeof roleConfig];
    
    return `👋 Welcome back, ${userContext.fullName}!

I'm your ROAM AI Assistant with access to your live account data as a **${config?.label}**.

🔗 **I can help you with:**
• Your bookings and appointments
• Your account information
• Platform features and navigation
• General ROAM questions

📊 **Live Data Access:** I'm connected to your account data and can answer specific questions in real-time!

What would you like to know? 🚀`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return null;
  }

  const currentRole = userContext.userType || 'customer';
  const config = roleConfig[currentRole as keyof typeof roleConfig];
  const Icon = config?.icon || User;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header with role-specific styling */}
      <div className={`bg-gradient-to-r ${
        currentRole === 'admin' ? 'from-red-600 to-red-500' : 'from-roam-blue to-roam-light-blue'
      } text-white p-4 rounded-t-lg`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1 rounded">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">ROAM AI Assistant</h3>
              <div className="flex items-center space-x-2 text-xs text-blue-100">
                <span>{config?.label} • {userContext.fullName}</span>
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-300" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-300" />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={loadUserData}
            disabled={isLoading}
            className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          
          <span className="text-blue-100">
            {lastDataRefresh ? `Updated ${lastDataRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
          </span>
        </div>
      </div>

      {/* Role-specific quick actions */}
      {config?.quickActions && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions:</p>
          <div className="space-y-1">
            {config.quickActions.slice(0, 2).map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="w-full text-left text-xs bg-white hover:bg-roam-blue/5 text-gray-700 p-2 rounded border border-gray-200 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.type === 'user'
                  ? currentRole === 'admin' 
                    ? 'bg-red-600 text-white'
                    : 'bg-roam-blue text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <div className={`animate-spin h-4 w-4 border-2 ${
                  currentRole === 'admin' ? 'border-red-600' : 'border-roam-blue'
                } border-t-transparent rounded-full`}></div>
                <span>{currentRole === 'admin' ? 'Analyzing platform data...' : 'Checking your account data...'}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentRole === 'admin' 
              ? "Ask about platform statistics, users, businesses..."
              : "Ask about your bookings, earnings, schedule..."
            }
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-roam-blue resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className={`${
              currentRole === 'admin' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-roam-blue hover:bg-roam-blue/90'
            } disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {currentRole === 'admin' 
            ? 'Ask about platform-wide data and statistics'
            : 'Ask specific questions about your ROAM account'
          }
        </p>
      </div>
    </div>
  );
}
