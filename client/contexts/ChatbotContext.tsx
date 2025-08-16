import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
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

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  userData: UserDataMap;
  setUserData: React.Dispatch<React.SetStateAction<UserDataMap>>;
  lastDataRefresh: Date | null;
  setLastDataRefresh: (date: Date | null) => void;
  userContext: {
    userId: string;
    isAuthenticated: boolean;
    userType: string;
    role: string;
    hasActiveBookings: boolean;
    isPremiumUser: boolean;
  };
  refreshUserData: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  const { user, customer, userType } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userData, setUserData] = useState<UserDataMap>({});
  const [lastDataRefresh, setLastDataRefresh] = useState<Date | null>(null);

  // Get current user (provider or customer)
  const currentUser = user || customer;

  // Create user context
  const userContext = {
    userId: currentUser?.id || 'anonymous',
    isAuthenticated: !!currentUser,
    userType: userType || (currentUser?.provider_role ? 'provider' : 'customer'),
    role: currentUser?.provider_role || userType || 'customer',
    hasActiveBookings: (userData.bookings || []).some(b => b.status === 'confirmed'),
    isPremiumUser: currentUser?.subscription_tier === 'premium' || false,
  };

  // Check AI Gateway connection status
  const checkConnection = async () => {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'test',
          userContext: { userId: 'test', userType: 'customer', isAuthenticated: false }
        })
      });
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  // Refresh user data from Supabase
  const refreshUserData = async () => {
    if (!currentUser) return;

    try {
      const newUserData: UserDataMap = {};

      // Get user profile
      if (userContext.userType === 'provider' || userContext.userType === 'owner') {
        const { data: profile } = await supabase
          .from('providers')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        newUserData.profile = profile;

        // Get business data for owners
        if (userContext.role === 'owner') {
          const { data: business } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('provider_id', currentUser.id)
            .single();
          newUserData.business = business;
        }
      } else {
        const { data: profile } = await supabase
          .from('customers')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        newUserData.profile = profile;
      }

      // Get bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq(userContext.userType === 'customer' ? 'customer_id' : 'business_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      newUserData.bookings = bookings || [];

      // Get additional data based on user type
      if (userContext.userType === 'customer') {
        const { data: favorites } = await supabase
          .from('customer_favorites')
          .select('*')
          .eq('customer_id', currentUser.id);
        newUserData.favorites = favorites || [];

        const { data: locations } = await supabase
          .from('customer_locations')
          .select('*')
          .eq('customer_id', currentUser.id);
        newUserData.locations = locations || [];
      }

      setUserData(newUserData);
      setLastDataRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Send message using Vercel AI Gateway with streaming
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Create a placeholder bot message for streaming
    const botMessageId = Date.now() + 1;
    const botMessage: Message = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      // Use Vercel AI Gateway API route with streaming
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userContext: userContext,
          userData: userData
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;

            try {
              // Parse data stream format
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'text-delta' && data.textDelta) {
                  accumulatedContent += data.textDelta;

                  // Update the bot message with streaming content
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === botMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
              }
            } catch (parseError) {
              // Continue processing other lines if one fails
              continue;
            }
          }
        }
      }

      // Ensure we have some content
      if (!accumulatedContent) {
        throw new Error('No content received from streaming response');
      }

    } catch (error) {
      console.error('Error sending message:', error);

      // Update the bot message with error content
      const errorContent = 'I\'m having trouble connecting to my AI service right now. Please try again in a moment, or contact support if the issue persists.';

      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, content: errorContent }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize connection check and welcome message
  useEffect(() => {
    checkConnection();

    // Add welcome message when first opened
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 0,
        type: 'bot',
        content: `Hello! I'm your ROAM AI Assistant. I'm here to help you with booking services, managing your account, and navigating our platform. ${
          userContext.isAuthenticated 
            ? `I can see you're logged in as a ${userContext.userType}. How can I assist you today?`
            : 'Feel free to ask me anything about our services!'
        }`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  // Refresh user data when user changes
  useEffect(() => {
    if (currentUser && isOpen) {
      refreshUserData();
    }
  }, [currentUser, isOpen]);

  const value: ChatbotContextType = {
    isOpen,
    setIsOpen,
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    setIsLoading,
    isConnected,
    setIsConnected,
    userData,
    setUserData,
    lastDataRefresh,
    setLastDataRefresh,
    userContext,
    refreshUserData,
    sendMessage,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};
