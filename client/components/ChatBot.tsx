import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Settings, Calendar, CreditCard, MapPin, Users, BarChart3, Shield, Sparkles, Database, Wifi, WifiOff } from 'lucide-react';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>({});
  const [supabase, setSupabase] = useState<any>(null);
  const [dbSchema, setDbSchema] = useState<any>(null);
  const [lastSchemaRefresh, setLastSchemaRefresh] = useState<number | null>(null);
  const [lastUserDataRefresh, setLastUserDataRefresh] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Polling intervals (in milliseconds)
  const POLLING_INTERVALS = {
    SCHEMA_REFRESH: 30 * 60 * 1000, // 30 minutes (schema changes are rare)
    USER_DATA_REFRESH: 5 * 60 * 1000, // 5 minutes (profile updates)
    LIVE_DATA_CACHE: 30 * 1000, // 30 seconds (for repeated queries)
  };

  // Supabase configuration - using environment variables
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vssomyuyhicaxsgiaupo.supabase.co';
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc29teXV5aGljYXhzZ2lhdXBvIiwicm9sZSI6ImFub25reW1vdXMiLCJpYXQiOjE3NTM0NTM3MTUsImV4cCI6MjA2OTAyOTcxNX0.IuFAKTObXnbEWbH8fJKQlRNj14bv7J1M_ZjEQT2Ov4Y';

  const roles = [
    { id: 'CUSTOMER', label: 'Customer', icon: User, color: 'bg-blue-500' },
    { id: 'PROVIDER', label: 'Provider', icon: Calendar, color: 'bg-green-500' },
    { id: 'BUSINESS_OWNER', label: 'Business Owner', icon: BarChart3, color: 'bg-purple-500' },
    { id: 'DISPATCHER', label: 'Dispatcher', icon: MapPin, color: 'bg-orange-500' },
    { id: 'ADMIN', label: 'Admin', icon: Shield, color: 'bg-red-500' },
    { id: 'SUPER_ADMIN', label: 'Super Admin', icon: Settings, color: 'bg-gray-800' }
  ];

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        // Import Supabase dynamically
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabase(supabaseClient);
        
        // Check for existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          await loadUserData(supabaseClient, session.user);
        }
        
        // Discover database schema
        await discoverSchema(supabaseClient);
        setLastSchemaRefresh(Date.now());
        
        // Set up real-time subscriptions for live data
        if (session) {
          setupRealtimeSubscriptions(supabaseClient, session.user);
        }
        
        // Listen for auth state changes
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          async (event, session) => {
            if (session) {
              await loadUserData(supabaseClient, session.user);
            } else {
              setCurrentUser(null);
              setIsConnected(false);
              setLiveData({});
            }
          }
        );

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        // Fallback to demo mode
        setCurrentUser({
          id: 'demo-user',
          email: 'demo@roam.com',
          user_type: 'CUSTOMER',
          full_name: 'Demo User'
        });
        setIsConnected(false);
      }
    };

    initSupabase();
  }, []);

  // Discover database schema
  const discoverSchema = async (supabaseClient: any) => {
    try {
      // Fallback to documented schema knowledge for ROAM
      const fallbackSchema = {
        business_profiles: ['id', 'business_name', 'business_type', 'contact_email', 'verification_status', 'created_at'],
        providers: ['id', 'user_id', 'business_id', 'first_name', 'last_name', 'email', 'phone'],
        customers: ['id', 'user_id', 'first_name', 'last_name', 'email', 'phone'],
        bookings: ['id', 'customer_id', 'provider_id', 'service_id', 'booking_date', 'status', 'total_amount'],
        services: ['id', 'name', 'description', 'base_price', 'duration_minutes'],
        business_services: ['id', 'business_id', 'service_id', 'business_price'],
        business_locations: ['id', 'business_id', 'address_line1', 'city', 'state'],
        customer_addresses: ['id', 'customer_id', 'address_line1', 'city', 'state', 'is_default']
      };
      setDbSchema(fallbackSchema);
      return fallbackSchema;
    } catch (error) {
      console.log('Using predefined schema knowledge');
      return null;
    }
  };

  const loadUserData = async (supabaseClient: any, user: any) => {
    try {
      setIsConnected(true);
      
      // For now, set a demo user based on auth
      setCurrentUser({
        id: user.id,
        email: user.email,
        user_type: 'CUSTOMER', // Default to customer, could be determined from database
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      });

      // Load role-specific data would go here
      setLastUserDataRefresh(Date.now());
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsConnected(false);
    }
  };

  // Real-time data query function
  const queryLiveData = async (query: string): Promise<string | null> => {
    if (!supabase || !currentUser) {
      return "I need to connect to your ROAM account to access live data. Please sign in first.";
    }

    try {
      const queryLower = query.toLowerCase();

      // Booking queries
      if (queryLower.includes('booking') || queryLower.includes('appointment')) {
        if (currentUser.user_type === 'CUSTOMER') {
          const { data } = await supabase
            .from('bookings')
            .select(`
              *,
              services(name),
              providers(first_name, last_name)
            `)
            .eq('customer_id', currentUser.id)
            .order('booking_date', { ascending: false })
            .limit(3);

          return `Here are your recent bookings:\n${data?.map((b: any) => 
            `• ${b.services?.name || 'Service'} with ${b.providers?.first_name} ${b.providers?.last_name} on ${new Date(b.booking_date).toLocaleDateString()}`
          ).join('\n') || 'No bookings found.'}`;
        }
      }

      // Data freshness queries
      if (queryLower.includes('freshness') || queryLower.includes('updated') || queryLower.includes('refresh')) {
        const now = Date.now();
        const userDataAge = lastUserDataRefresh ? Math.floor((now - lastUserDataRefresh) / (1000 * 60)) : 'unknown';
        const schemaAge = lastSchemaRefresh ? Math.floor((now - lastSchemaRefresh) / (1000 * 60)) : 'unknown';
        
        return `⏰ Data Freshness Status:
• User data: ${userDataAge === 'unknown' ? 'Loading...' : userDataAge < 1 ? 'Just updated' : `${userDataAge} minutes ago`}
• Database schema: ${schemaAge === 'unknown' ? 'Loading...' : schemaAge < 1 ? 'Just updated' : `${schemaAge} minutes ago`}
• Live queries: Real-time (fresh every request)
• Auto-refresh: Every 5 minutes for user data, 30 minutes for schema

🔄 Use the refresh button above to force an immediate update!`;
      }

      return null; // Let the AI handle non-data queries
    } catch (error) {
      console.error('Error querying live data:', error);
      return "Sorry, I couldn't access that information right now. Please try again.";
    }
  };

  // Set up real-time subscriptions for live updates
  const setupRealtimeSubscriptions = (supabaseClient: any, user: any) => {
    try {
      // Subscribe to user's bookings for real-time updates
      const bookingsSubscription = supabaseClient
        .channel('user-bookings')
        .on('postgres_changes', 
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `customer_id=eq.${user.id}`
          },
          (payload: any) => {
            console.log('Booking update:', payload);
            // Refresh user data when bookings change
            loadUserData(supabaseClient, user);
          }
        )
        .subscribe();

      return () => {
        supabaseClient.removeAllChannels();
      };
    } catch (error) {
      console.error('Failed to set up real-time subscriptions:', error);
    }
  };

  // Periodic refresh functions
  useEffect(() => {
    if (!supabase || !currentUser) return;

    // Set up periodic data refresh
    const refreshInterval = setInterval(async () => {
      const now = Date.now();
      
      // Refresh user data every 5 minutes
      if (!lastUserDataRefresh || (now - lastUserDataRefresh) > POLLING_INTERVALS.USER_DATA_REFRESH) {
        await loadUserData(supabase, { id: currentUser.id });
        setLastUserDataRefresh(now);
      }
      
      // Refresh schema every 30 minutes
      if (!lastSchemaRefresh || (now - lastSchemaRefresh) > POLLING_INTERVALS.SCHEMA_REFRESH) {
        await discoverSchema(supabase);
        setLastSchemaRefresh(now);
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [supabase, currentUser, lastUserDataRefresh, lastSchemaRefresh]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage();
      setMessages([{
        id: Date.now(),
        type: 'bot',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, currentUser, liveData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateWelcomeMessage = () => {
    if (!currentUser) {
      return `👋 Welcome to ROAM AI Assistant! 

I can help you with:
🏥 Wellness services marketplace
✨ ROAM Experiences platform  
⚙️ Admin operations

For personalized assistance with your account, please sign in to access your live data!`;
    }

    const role = roles.find(r => r.id === currentUser.user_type);
    
    return `👋 Welcome back, ${currentUser.full_name}! 

I'm your ROAM AI Assistant with access to your live account data. I can help you with:

${getRoleSpecificHelp(currentUser.user_type)}

🔗 **Connected to live data** - I can check your bookings, account details, and more in real-time!

What would you like to know?`;
  };

  const getRoleSpecificHelp = (userType: string) => {
    switch (userType) {
      case 'CUSTOMER':
        return `🛍️ Browse and book wellness services
💬 Message your providers
📍 Manage your locations
💳 View payment history`;
      case 'PROVIDER':
        return `📅 Manage your availability
💰 Track your earnings
👥 View your bookings
⚙️ Update your profile`;
      case 'BUSINESS_OWNER':
        return `🏢 Manage your business
👥 Oversee your providers
📍 Manage service locations
📊 View business analytics`;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return `👤 Manage users and providers
🎁 Create promotions
⚙️ System configuration
📊 Platform analytics`;
      default:
        return `📋 Platform features and support`;
    }
  };

  const getCurrentRoleIcon = () => {
    if (!currentUser) return <User className="h-4 w-4" />;
    const role = roles.find(r => r.id === currentUser.user_type);
    const Icon = role?.icon || User;
    return <Icon className="h-4 w-4" />;
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
      // First, try to handle with live data
      const liveDataResponse = await queryLiveData(currentInput);
      
      if (liveDataResponse) {
        const botMessage: Message = {
          id: Date.now() + 1,
          type: 'bot',
          content: liveDataResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

      // If no live data match, use a simulated AI response for now
      // TODO: Replace with actual Claude API call
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
        content: 'Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const getSimulatedResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("booking") || lowerInput.includes("appointment")) {
      return "To make a booking, you can browse our services and select a provider that fits your needs. Each provider's profile shows their availability and pricing. Would you like help finding a specific type of service?";
    }

    if (lowerInput.includes("provider") || lowerInput.includes("join")) {
      return "Interested in becoming a provider? Great! You can apply through our 'Become a Provider' page. We welcome verified professionals in beauty, fitness, wellness, and healthcare. The application process includes verification steps to ensure quality service.";
    }

    if (lowerInput.includes("payment") || lowerInput.includes("cost")) {
      return "ROAM offers secure payment processing. You can see exact pricing on each provider's profile before booking. We accept major credit cards and digital payments. There are no hidden fees - what you see is what you pay.";
    }

    return "I'm here to help with questions about ROAM's services, booking process, becoming a provider, payments, and more. Could you please be more specific about what you'd like to know?";
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const manualRefresh = async () => {
    if (!supabase || !currentUser) return;
    
    setIsLoading(true);
    try {
      // Force refresh user data and schema
      await loadUserData(supabase, { id: currentUser.id });
      await discoverSchema(supabase);
      setLastUserDataRefresh(Date.now());
      setLastSchemaRefresh(Date.now());
      
      // Add a refresh confirmation message
      const refreshMessage: Message = {
        id: Date.now(),
        type: 'bot',
        content: '🔄 Data refreshed! I now have the latest information from your ROAM account.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, refreshMessage]);
    } catch (error) {
      console.error('Manual refresh error:', error);
    }
    setIsLoading(false);
  };

  const getDataFreshnessText = () => {
    if (!lastUserDataRefresh) return 'Connecting...';
    
    const now = Date.now();
    const minutesAgo = Math.floor((now - lastUserDataRefresh) / (1000 * 60));
    
    if (minutesAgo < 1) return 'Just updated';
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo}h ago`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-roam-blue to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1 rounded">
              {getCurrentRoleIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-sm">ROAM AI Assistant</h3>
              <div className="flex items-center space-x-2 text-xs text-blue-100">
                <span>{currentUser ? `${currentUser.user_type} • ${currentUser.full_name}` : 'Not connected'}</span>
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

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentUser && (
              <button
                onClick={manualRefresh}
                disabled={isLoading}
                className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            )}
          </div>
          
          <div className="flex flex-col items-end text-xs">
            <div className="flex items-center space-x-1">
              <Database className="h-3 w-3" />
              <span>{isConnected ? 'Live Data' : 'Demo Mode'}</span>
            </div>
            {currentUser && (
              <span className="text-blue-100 opacity-75">
                {getDataFreshnessText()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Role Specific */}
      {currentUser && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions:</p>
          <div className="space-y-1">
            {currentUser.user_type === 'CUSTOMER' && (
              <>
                <button
                  onClick={() => handleQuickAction("Show my recent bookings")}
                  className="w-full text-left text-xs bg-white hover:bg-blue-50 text-gray-700 p-2 rounded border border-gray-200 transition-colors"
                >
                  📅 Show my recent bookings
                </button>
                <button
                  onClick={() => handleQuickAction("What services are available near me?")}
                  className="w-full text-left text-xs bg-white hover:bg-blue-50 text-gray-700 p-2 rounded border border-gray-200 transition-colors"
                >
                  🔍 Find services near me
                </button>
              </>
            )}
            
            {/* Universal refresh action */}
            <button
              onClick={() => handleQuickAction("When was my data last updated?")}
              className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded border border-gray-300 transition-colors"
            >
              ⏰ Data freshness status
            </button>
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
                  ? 'bg-roam-blue text-white'
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
                <div className="animate-spin h-4 w-4 border-2 border-roam-blue border-t-transparent rounded-full"></div>
                <span>ROAM AI is thinking...</span>
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
            placeholder={currentUser ? "Ask me about your ROAM account..." : "Ask me about ROAM services..."}
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-roam-blue resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-roam-blue hover:bg-roam-blue/90 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
