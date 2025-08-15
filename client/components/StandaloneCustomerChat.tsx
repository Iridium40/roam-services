import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Send, X, MessageCircle, Clock, User, Phone } from 'lucide-react';

interface StandaloneCustomerChatProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  conversationSid?: string;
  currentUser: any;
  userType: string;
}

interface ConversationMessage {
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

interface ConversationParticipant {
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

const StandaloneCustomerChat: React.FC<StandaloneCustomerChatProps> = ({
  isOpen,
  onClose,
  booking,
  conversationSid,
  currentUser,
  userType
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeConversationSid, setActiveConversationSid] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate unique identity for current user
  const getUserIdentity = () => {
    console.log('🔍 getUserIdentity called with:', { currentUser, userType });
    if (!currentUser) {
      console.log('❌ No currentUser available');
      return null;
    }
    const identity = `${userType}-${currentUser.id}`;
    console.log('✅ Generated identity:', identity);
    return identity;
  };

  // Initialize conversation when modal opens
  useEffect(() => {
    if (isOpen && booking && currentUser) {
      console.log('🎯 StandaloneCustomerChat useEffect triggered:', {
        isOpen,
        booking: booking.id,
        conversationSid,
        activeConversationSid,
        user: currentUser.id,
        userType
      });

      const initializeBookingConversation = async () => {
        console.log('🎯 Triggering initializeBookingConversation...');
        
        try {
          setLoading(true);
          setError(null);

          // Check if we already have a conversation for this booking
          if (conversationSid) {
            console.log('📞 Using existing conversation SID:', conversationSid);
            setActiveConversationSid(conversationSid);
            await loadMessages(conversationSid);
            await loadParticipants(conversationSid);
            return;
          }

          // Create new conversation
          console.log('🚀 Creating new conversation for booking:', booking.id);
          
          const userIdentity = getUserIdentity();
          if (!userIdentity) {
            throw new Error('User not properly authenticated');
          }

          // Prepare participants
          const participants = [
            {
              identity: userIdentity,
              role: userType,
              name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
              userId: currentUser.id,
              userType: userType
            }
          ];

          // Add provider if available
          if (booking.provider) {
            console.log('👥 Found provider in booking:', booking.provider);
            // Use provider.user_id which maps to auth.users.id
            const providerIdentity = `provider-${booking.provider.user_id}`;
            participants.push({
              identity: providerIdentity,
              role: 'provider',
              name: `${booking.provider.firstName || ''} ${booking.provider.lastName || ''}`.trim(),
              userId: booking.provider.user_id,
              userType: 'provider'
            });
          } else if (booking.providers) {
            console.log('👥 Found providers in booking:', booking.providers);
            const providerIdentity = `provider-${booking.providers.user_id}`;
            participants.push({
              identity: providerIdentity,
              role: 'provider',
              name: `${booking.providers.first_name || ''} ${booking.providers.last_name || ''}`.trim(),
              userId: booking.providers.user_id,
              userType: 'provider'
            });
          } else {
            console.log('❌ No provider found in booking');
          }

          console.log('👥 Participants for conversation:', participants);

          const requestBody = {
            action: 'create-conversation',
            bookingId: booking.id,
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

          console.log('✅ Conversation created successfully:', result.conversationSid);
          setActiveConversationSid(result.conversationSid);
          
          // Load messages and participants
          await loadMessages(result.conversationSid);
          await loadParticipants(result.conversationSid);

        } catch (error: any) {
          console.error('❌ Error initializing conversation:', error);
          setError(error.message || 'Failed to initialize conversation');
        } finally {
          setLoading(false);
        }
      };

      initializeBookingConversation();
    }
  }, [isOpen, booking, currentUser, conversationSid]);

  // Load messages for a conversation
  const loadMessages = async (conversationSid: string) => {
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
    } finally {
      setLoading(false);
    }
  };

  // Load participants for a conversation
  const loadParticipants = async (conversationSid: string) => {
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
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversationSid || !currentUser) return;
    
    console.log('📤 handleSendMessage called:', { message: newMessage, conversationSid: activeConversationSid });
    
    try {
      setSending(true);
      setError(null);
      
      const userIdentity = getUserIdentity();
      
      if (!userIdentity) {
        throw new Error('User not properly authenticated');
      }
      
      const requestBody = {
        action: 'send-message',
        conversationSid: activeConversationSid,
        message: newMessage,
        participantIdentity: userIdentity,
        userRole: userType,
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
      const newMessageObj: ConversationMessage = {
        sid: result.messageSid,
        author: result.author,
        body: result.body,
        dateCreated: result.dateCreated,
        attributes: {
          userRole: userType,
          userName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
          userId: currentUser.id,
          timestamp: new Date().toISOString()
        }
      };
      
      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with Provider
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Booking Info */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {booking.customer_name || 'Customer'}
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {booking.customer_phone || 'No phone'}
                    </span>
                  </div>
                </div>
                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                  {booking.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </DialogHeader>

        {/* Debug Info */}
        <div className="flex-shrink-0 p-2 bg-muted text-xs">
          <div>Debug: activeConversationSid={activeConversationSid || 'Not set'}, sending={sending ? 'Yes' : 'No'}, loading={loading ? 'Yes' : 'No'}</div>
          <div>Booking ID: {booking.id}, User: {currentUser?.id || 'No user ID'}, User Type: {userType}</div>
          <div>User Data: {currentUser ? JSON.stringify({id: currentUser.id, first_name: currentUser.first_name, last_name: currentUser.last_name}) : 'No user data'}</div>
          <div>Booking Data: {JSON.stringify({id: booking.id, customer_id: booking.customer_id, customer_name: booking.customer_name})}</div>
          <div>Provider Data: {booking.provider ? JSON.stringify({user_id: booking.provider.user_id, name: `${booking.provider.firstName} ${booking.provider.lastName}`}) : 'No provider data'}</div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Loading conversation...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p>Error: {error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.author === getUserIdentity();
                const participant = participants.find(p => p.identity === message.author);
                
                return (
                  <div
                    key={message.sid}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant?.attributes?.imageUrl} />
                      <AvatarFallback>
                        {participant?.attributes?.name?.charAt(0) || message.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : ''}`}>
                      <div className={`rounded-lg px-3 py-2 ${
                        isOwnMessage 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.body}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                        isOwnMessage ? 'flex-row-reverse' : ''
                      }`}>
                        <span>{participant?.attributes?.name || message.author}</span>
                        <span>•</span>
                        <span>{new Date(message.dateCreated).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending || !activeConversationSid}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || !activeConversationSid}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StandaloneCustomerChat;
