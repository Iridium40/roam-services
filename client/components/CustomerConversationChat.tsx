import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Send,
  MessageCircle,
  Users,
  Clock,
  User,
  X
} from 'lucide-react';
import { useSimpleCustomerConversations, ConversationMessage } from '@/hooks/useSimpleCustomerConversations';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CustomerConversationChatProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: {
    id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    service_name?: string;
    provider_name?: string;
    business_id?: string;
  };
  conversationSid?: string;
}

const CustomerConversationChat = ({ isOpen, onClose, booking, conversationSid }: CustomerConversationChatProps) => {
  const { user, customer, userType } = useAuth();
  
  // Get the current user data (either provider or customer)
  const currentUser = user || customer;
  
  const {
    conversations,
    currentConversation,
    messages,
    participants,
    loading,
    sending,
    sendMessage,
    createConversation,
    getUserIdentity,
    getUserType,
    setActiveConversation
  } = useSimpleCustomerConversations(currentUser, userType || (currentUser?.provider_role ? 'provider' : 'customer'));

  const [newMessage, setNewMessage] = useState('');
  const [activeConversationSid, setActiveConversationSid] = useState<string | null>(conversationSid || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom only when user sends a message or when initially loading
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. It's the initial load (messages.length was 0)
    // 2. User just sent a message (shouldAutoScroll is true)
    // 3. User is already at the bottom of the chat
    if (messages.length > lastMessageCount) {
      const messagesContainer = document.querySelector('[data-radix-scroll-area-viewport]');
      const isAtBottom = messagesContainer ? 
        messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 50 : true;
      
      if (shouldAutoScroll || isAtBottom || lastMessageCount === 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      
      setLastMessageCount(messages.length);
      setShouldAutoScroll(false); // Reset auto-scroll flag
    }
  }, [messages, shouldAutoScroll, lastMessageCount]);

  // Initialize conversation when modal opens
  useEffect(() => {
    console.log('CustomerConversationChat useEffect triggered:', {
      isOpen,
      booking: booking?.id,
      conversationSid,
      activeConversationSid,
      user: currentUser?.id,
      userType: userType || (currentUser?.provider_role ? 'provider' : 'customer')
    });

    if (isOpen && booking && !activeConversationSid) {
      console.log('🎯 Triggering initializeBookingConversation...');
      initializeBookingConversation();
    } else if (isOpen && conversationSid) {
      console.log('Setting conversation SID from prop:', conversationSid);
      setActiveConversationSid(conversationSid);
      setActiveConversation(conversationSid);
    }
  }, [isOpen, booking, conversationSid, activeConversationSid, currentUser, userType]);

  // Load messages when active conversation changes
  useEffect(() => {
    console.log('Active conversation changed:', {
      activeConversationSid,
      currentConversation
    });
    
    if (activeConversationSid && activeConversationSid !== currentConversation) {
      console.log('Loading messages for conversation:', activeConversationSid);
      setActiveConversation(activeConversationSid);
    }
  }, [activeConversationSid, currentConversation, setActiveConversation]);

  const initializeBookingConversation = async () => {
    console.log('🚀 initializeBookingConversation called with:', {
      booking: booking?.id,
      user: currentUser?.id,
      userType: userType || (currentUser?.provider_role ? 'provider' : 'customer'),
      bookingData: booking,
      currentUserData: currentUser
    });

    if (!booking || !currentUser) {
      console.log('❌ Missing required data:', { 
        booking: !!booking, 
        user: !!currentUser,
        bookingId: booking?.id,
        userId: currentUser?.id
      });
      return;
    }

    console.log('📋 Initializing booking conversation for:', booking.id);

    const userIdentity = getUserIdentity();
    const userType = getUserType();
    console.log('👤 User identity:', userIdentity, 'User type:', userType);

    if (!userIdentity || !userType) {
      console.error('❌ Failed to get user identity or type');
      console.log('🔍 Debug info:', {
        currentUser: currentUser,
        userIdentity: userIdentity,
        userType: userType,
        getUserIdentity: getUserIdentity,
        getUserType: getUserType
      });
      return;
    }

    const bookingParticipants = [
      {
        identity: userIdentity,
        role: userType,
        name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(),
        userId: currentUser.id,
        userType: userType
      }
    ];

    console.log('👥 Booking participants:', bookingParticipants);

    try {
      console.log('📞 Calling createConversation...');
      const convSid = await createConversation(booking.id, bookingParticipants);
      console.log('✅ Conversation SID returned:', convSid);
      if (convSid) {
        console.log('🎯 Setting active conversation SID:', convSid);
        setActiveConversationSid(convSid);
        setActiveConversation(convSid);
      } else {
        console.error('❌ Failed to get conversation SID - returned null/undefined');
      }
    } catch (error) {
      console.error('💥 Error initializing conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversationSid || sending) return;

    try {
      setShouldAutoScroll(true); // Trigger auto-scroll when user sends a message
      await sendMessage(activeConversationSid, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const getMessageAuthorInfo = (message: ConversationMessage) => {
    const userIdentity = getUserIdentity();
    const isCurrentUser = message.author === userIdentity;
    const attributes = message.attributes || {};
    
    return {
      isCurrentUser,
      name: attributes.userName || message.author,
      role: attributes.userRole || 'participant',
      initials: (attributes.userName || message.author)
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    };
  };

  const getParticipantInfo = (participant: any) => {
    const userIdentity = getUserIdentity();
    const isCurrentUser = participant.identity === userIdentity;
    
    return {
      isCurrentUser,
      name: participant.attributes?.name || participant.identity,
      role: participant.attributes?.role || participant.userType || 'participant',
      imageUrl: participant.attributes?.imageUrl,
      initials: (participant.attributes?.name || participant.identity)
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    };
  };

  // Debug info
  const debugInfo = (
    <div className="text-xs text-gray-500 mb-2">
      Debug: activeConversationSid={activeConversationSid ? 'Set' : 'Not set'}, 
      sending={sending ? 'Yes' : 'No'}, 
      loading={loading ? 'Yes' : 'No'}
      {booking && (
        <div>
          Booking ID: {booking.id}, 
          User: {currentUser?.id || 'No user ID'}, 
          User Type: {userType || (currentUser?.provider_role ? 'provider' : 'customer')},
          User Data: {currentUser ? JSON.stringify({id: currentUser.id, first_name: currentUser.first_name, last_name: currentUser.last_name, provider_role: currentUser.provider_role}) : 'No user data'},
          Booking Data: {booking ? JSON.stringify({id: booking.id, customer_name: booking.customer_name}) : 'No booking data'}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {booking ? `Chat - ${booking.service_name || 'Booking'}` : 'Conversation'}
          </DialogTitle>
        </DialogHeader>

        {debugInfo}

        <div className="flex-1 flex flex-col min-h-0">
          {/* Participants Info */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => {
                  const info = getParticipantInfo(participant);
                  return (
                    <Badge
                      key={participant.sid}
                      variant={info.isCurrentUser ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={info.imageUrl} />
                        <AvatarFallback className="text-xs">
                          {info.initials}
                        </AvatarFallback>
                      </Avatar>
                      {info.name}
                      {info.isCurrentUser && " (You)"}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  {loading ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((message) => {
                      const authorInfo = getMessageAuthorInfo(message);
                      return (
                        <div
                          key={message.sid}
                          className={`flex gap-3 ${
                            authorInfo.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {authorInfo.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex flex-col max-w-[70%] ${
                              authorInfo.isCurrentUser ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {authorInfo.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {authorInfo.role}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(message.dateCreated)}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg px-3 py-2 text-sm ${
                                authorInfo.isCurrentUser
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.body}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Input */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={!activeConversationSid || sending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !activeConversationSid || sending}
                  className="bg-roam-blue hover:bg-roam-blue/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerConversationChat;
