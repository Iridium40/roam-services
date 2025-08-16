import React, { useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Settings, Calendar, Shield, Database, Wifi, WifiOff, RefreshCw, Crown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useChatbot } from '@/contexts/ChatbotContext';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    isConnected,
    userData,
    lastDataRefresh,
    userContext,
    refreshUserData,
    sendMessage,
  } = useChatbot();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    await sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const roleConfig = {
    owner: { label: 'Business Owner', icon: Settings, quickActions: [
      { label: 'Check Bookings', query: 'Show me my recent bookings' },
      { label: 'Business Analytics', query: 'How is my business performing?' },
      { label: 'Manage Services', query: 'Help me manage my services' },
      { label: 'Financial Summary', query: 'Show me my earnings summary' }
    ]},
    provider: { label: 'Provider', icon: User, quickActions: [
      { label: 'My Schedule', query: 'What are my upcoming appointments?' },
      { label: 'Availability', query: 'Help me update my availability' },
      { label: 'Earnings', query: 'Show me my recent earnings' },
      { label: 'Profile Settings', query: 'Help me update my profile' }
    ]},
    customer: { label: 'Customer', icon: User, quickActions: [
      { label: 'Book Service', query: 'I want to book a beauty service' },
      { label: 'My Bookings', query: 'Show me my upcoming appointments' },
      { label: 'Find Providers', query: 'Help me find providers near me' },
      { label: 'Account Settings', query: 'Help me update my account' }
    ]},
    admin: { label: 'Platform Admin', icon: Crown, quickActions: [
      { label: 'System Status', query: 'Show me platform statistics' },
      { label: 'User Management', query: 'Help me manage users' },
      { label: 'Business Overview', query: 'Show me business metrics' },
      { label: 'Support Issues', query: 'What support issues need attention?' }
    ]}
  };

  const currentRoleConfig = roleConfig[userContext.role as keyof typeof roleConfig] || roleConfig.customer;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="border-b bg-gradient-to-r from-roam-blue to-roam-light-blue text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">ROAM AI Assistant</h2>
                <p className="text-sm text-white/80">
                  {isConnected ? 'Connected to Claude.ai' : 'Connection Issue'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* User Status Bar */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <currentRoleConfig.icon className="h-4 w-4 text-roam-blue" />
                <span className="text-sm font-medium">{currentRoleConfig.label}</span>
                {userContext.isAuthenticated && (
                  <Badge variant="outline" className="text-xs">
                    {userContext.userType}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {lastDataRefresh && (
                  <span className="text-xs text-gray-500">
                    Data: {lastDataRefresh.toLocaleTimeString()}
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshUserData}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {userContext.isAuthenticated && (
            <div className="p-4 bg-blue-50 border-b">
              <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                {currentRoleConfig.quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(action.query)}
                    className="text-xs h-8"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-roam-blue text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <p className="text-sm whitespace-pre-wrap flex-1">
                      {message.content}
                      {/* Show cursor for streaming messages */}
                      {message.type === 'bot' && isLoading && message.content && (
                        <span className="animate-pulse">|</span>
                      )}
                    </p>
                  </div>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                    {message.type === 'bot' && isLoading && message.content && (
                      <span className="ml-2 text-roam-blue">Streaming...</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-roam-blue"></div>
                    <span className="text-sm text-gray-600">
                      {messages.some(m => m.type === 'bot' && m.content === '')
                        ? 'AI is responding...'
                        : 'AI is thinking...'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <div className="flex items-center gap-2 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">
                  Connection to AI service lost. Some features may be limited.
                </span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about ROAM services..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-roam-blue hover:bg-roam-blue/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Powered by Claude.ai • Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
