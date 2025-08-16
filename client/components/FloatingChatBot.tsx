import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatBot from './ChatBot';
import { useChatbot } from '@/contexts/ChatbotContext';

export default function FloatingChatBot() {
  const { isOpen, setIsOpen } = useChatbot();

  if (isOpen) {
    return <ChatBot isOpen={isOpen} onClose={() => setIsOpen(false)} />;
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 bg-roam-blue hover:bg-roam-blue/90 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50 group"
      aria-label="Open AI Assistant"
    >
      <MessageCircle className="h-6 w-6" />
      
      {/* Pulse animation */}
      <div className="absolute inset-0 rounded-full bg-roam-blue animate-ping opacity-20"></div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
          Ask ROAM AI Assistant
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </button>
  );
}
