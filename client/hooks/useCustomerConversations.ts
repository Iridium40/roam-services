import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ConversationMessage {
  sid: string;
  author: string;
  body: string;
  dateCreated: string;
  attributes?: {
    userRole?: string;
    userName?: string;
    userId?: string;
    timestamp?: string;
  };
}

export interface ConversationParticipant {
  sid: string;
  identity: string;
  userId: string;
  userType: string;
  attributes?: {
    role?: string;
    name?: string;
    imageUrl?: string;
    email?: string;
  };
}

export const useCustomerConversations = () => {
  const { user, customer, userType } = useAuth();
  const { toast } = useToast();
  
  // Get the current user data (either provider or customer)
  const currentUser = user || customer;
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate unique identity for current user
  const getUserIdentity = useCallback(() => {
    console.log('🔍 getUserIdentity called with:', { currentUser, userType });
    if (!currentUser) {
      console.log('❌ No currentUser available');
      return null;
    }
    const currentUserType = userType || (currentUser.provider_role ? 'provider' : 'customer');
    const identity = `${currentUserType}-${currentUser.id}`;
    console.log('✅ Generated identity:', identity);
    return identity;
  }, [currentUser, userType]);

  // Get user type for API calls
  const getUserType = useCallback(() => {
    console.log('🔍 getUserType called with:', { currentUser, userType });
    if (!currentUser) {
      console.log('❌ No currentUser available');
      return null;
    }
    const userTypeResult = userType || (currentUser.provider_role ? 'provider' : 'customer');
    console.log('✅ Determined user type:', userTypeResult);
    return userTypeResult;
  }, [currentUser, userType]);

  // Create a new conversation for a booking
  const createConversation = useCallback(async (bookingId: string, participants: Array<{
    identity: string;
    role: string;
    name: string;
    userId: string;
    userType: string;
  }>) => {
    console.log('🚀 createConversation called with:', { bookingId, participants });
    
    try {
      setLoading(true);
      setError(null);
      
      const requestBody = {
        action: 'create-conversation',
        bookingId,
        participants
      };
      console.log('📤 Sending request to /api/twilio-conversations:', requestBody);
      
      const response = await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create conversation');
      }

      console.log('✅ Conversation created successfully');
      return result.conversationSid;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      setError(error.message || 'Failed to create conversation');
      toast({
        title: "Error",
        description: error.message || 'Failed to create conversation',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Send a message
  const sendMessage = useCallback(async (conversationSid: string, message: string) => {
    if (!currentUser) return;
    
    console.log('📤 sendMessage called:', { conversationSid, message });
    
    try {
      setSending(true);
      setError(null);
      
      const currentUserType = getUserType();
      const userIdentity = getUserIdentity();
      
      if (!currentUserType || !userIdentity) {
        throw new Error('User not properly authenticated');
      }
      
      const requestBody = {
        action: 'send-message',
        conversationSid,
        message,
        participantIdentity: userIdentity,
        userRole: currentUserType,
        userName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
        userId: currentUser.id
      };
      console.log('📤 Sending request to /api/twilio-conversations:', requestBody);
      
      const response = await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Add the new message to the current messages list
      const newMessage: ConversationMessage = {
        sid: result.messageSid,
        author: result.author,
        body: result.body,
        dateCreated: result.dateCreated,
        attributes: {
          userRole: currentUserType,
          userName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
          userId: currentUser.id,
          timestamp: new Date().toISOString()
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      return result.messageSid;
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
      toast({
        title: "Error",
        description: error.message || 'Failed to send message',
        variant: "destructive",
      });
      throw error;
    } finally {
      setSending(false);
    }
  }, [currentUser, getUserType, getUserIdentity, toast]);

  // Set current conversation
  const setActiveConversation = useCallback((conversationSid: string | null) => {
    console.log('🎯 setActiveConversation called with:', conversationSid);
    setCurrentConversation(conversationSid);
    if (conversationSid) {
      // Load messages and participants directly
      const loadMessagesDirectly = async () => {
        console.log('📨 Loading messages for conversation:', conversationSid);
        try {
          setLoading(true);
          setError(null);
          
          const requestBody = {
            action: 'get-messages',
            conversationSid
          };
          console.log('📤 Sending request to /api/twilio-conversations:', requestBody);
          
          const response = await fetch('/api/twilio-conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          console.log('📥 Response status:', response.status);
          const result = await response.json();
          console.log('📥 Response result:', result);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to load messages');
          }

          setMessages(result.messages || []);
        } catch (error: any) {
          console.error('Error loading messages:', error);
          setError(error.message || 'Failed to load messages');
          toast({
            title: "Error",
            description: error.message || 'Failed to load messages',
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      const loadParticipantsDirectly = async () => {
        console.log('👥 Loading participants for conversation:', conversationSid);
        try {
          setLoading(true);
          setError(null);
          
          const requestBody = {
            action: 'get-conversation-participants',
            conversationSid
          };
          console.log('📤 Sending request to /api/twilio-conversations:', requestBody);
          
          const response = await fetch('/api/twilio-conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          console.log('📥 Response status:', response.status);
          const result = await response.json();
          console.log('📥 Response result:', result);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to load participants');
          }

          setParticipants(result.participants || []);
        } catch (error: any) {
          console.error('Error loading participants:', error);
          setError(error.message || 'Failed to load participants');
          toast({
            title: "Error",
            description: error.message || 'Failed to load participants',
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      loadMessagesDirectly();
      loadParticipantsDirectly();
    } else {
      setMessages([]);
      setParticipants([]);
    }
  }, [toast]);

  return {
    conversations,
    currentConversation,
    messages,
    participants,
    loading,
    sending,
    error,
    createConversation,
    sendMessage,
    setActiveConversation,
    getUserIdentity,
    getUserType
  };
};
