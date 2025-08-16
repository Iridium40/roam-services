# ROAM AI Chatbot Setup

This document explains the setup and structure of the ROAM AI Chatbot powered by Claude.ai.

## Setup Steps Completed

### 1. ✅ ChatbotProvider Context
- Created `client/contexts/ChatbotContext.tsx` - Global state management for chatbot
- Manages user authentication, data fetching, and Claude.ai integration
- Provides centralized state for all chatbot components

### 2. ✅ Updated App.tsx Structure
- Added `ChatbotProvider` wrapper around the entire application
- Provides chatbot context to all components and pages
- Maintains proper provider hierarchy: QueryClient → Tooltip → Router → Auth → **Chatbot**

### 3. ✅ Component Structure
```
client/
├── components/
│   ├── chatbot/
│   │   └── index.ts              # Barrel exports for chatbot components
│   ├── ChatBot.tsx               # Main chatbot modal component
│   └── FloatingChatBot.tsx       # Floating chat button
├── contexts/
│   └── ChatbotContext.tsx        # Chatbot state management
└── App.tsx                       # Updated with ChatbotProvider
```

## Features Implemented

### 🤖 AI Integration
- **Claude.ai API Integration** - Uses Anthropic's Claude-3-sonnet model
- **Smart Context Awareness** - Knows user type (customer/provider/owner/admin)
- **Real-time Data Access** - Fetches user data from Supabase
- **Role-based Responses** - Tailored responses based on user role

### 🎯 User Experience
- **Quick Actions** - Role-specific quick action buttons
- **Connection Status** - Shows Claude.ai connection status
- **Data Refresh** - Manual refresh of user data
- **Responsive Design** - Works on all screen sizes

### 🔐 Security & Data
- **Auth Integration** - Uses existing AuthContext
- **Supabase Integration** - Accesses user data securely
- **Privacy Focused** - Only accesses relevant user data
- **Error Handling** - Graceful fallbacks for API failures

## Environment Variables Required

**No API keys needed!** Vercel AI Gateway handles everything automatically.

## Vercel AI Gateway Setup

1. **Enable AI Gateway in Vercel**:
   - Go to your Vercel project dashboard
   - Settings → Integrations
   - Find "AI Gateway" and enable it
   - No API keys needed - Vercel handles everything!

2. **Deploy to Vercel**:
   - Push your code to trigger deployment
   - AI Gateway will be automatically configured

3. **Verify Connection**:
   - Open the chatbot (floating button)
   - Check connection status indicator
   - Green dot = Connected, Red dot = Connection issue

## Usage Examples

### For Customers:
- "I want to book a beauty service"
- "Show me my upcoming appointments"
- "Help me find providers near me"

### For Providers:
- "What are my upcoming appointments?"
- "Help me update my availability"
- "Show me my recent earnings"

### For Business Owners:
- "How is my business performing?"
- "Show me my recent bookings"
- "Help me manage my services"

## Technical Architecture

### State Management Flow:
1. **ChatbotContext** - Global state management
2. **AuthContext Integration** - User authentication data
3. **Supabase Queries** - Real-time user data
4. **Claude.ai API** - AI responses with context

### Component Hierarchy:
```
App
├── ChatbotProvider
    ├── FloatingChatBot (shows on all pages)
    └── ChatBot (modal when opened)
```

### Data Flow:
1. User clicks floating chat button
2. ChatbotProvider loads user data from Supabase
3. User sends message
4. Context + user data sent to Claude.ai
5. AI response displayed with user-specific actions

## Deployment Considerations

### Environment Variables:
- Ensure `VITE_CLAUDE_API_KEY` is set in production
- Use different API keys for development/production

### API Limits:
- Claude.ai has rate limits - monitor usage
- Implement fallback responses for API failures
- Consider caching frequently requested data

### Security:
- API key is exposed in client (standard for Vite)
- Implement proper CORS and rate limiting
- Monitor API usage for abuse

## Troubleshooting

### Common Issues:

1. **Red Connection Dot**:
   - Check API key is correct
   - Verify internet connection
   - Check Claude.ai service status

2. **User Data Not Loading**:
   - Verify Supabase connection
   - Check user authentication
   - Refresh user data manually

3. **Messages Not Sending**:
   - Check API key validity
   - Verify rate limits not exceeded
   - Check browser console for errors

### Development Tips:
- Use browser dev tools to inspect network requests
- Check console for detailed error messages
- Test with different user roles/types
- Monitor API usage in Anthropic console

## Future Enhancements

- [ ] Message history persistence
- [ ] Custom training on ROAM-specific data
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with booking system
- [ ] Advanced analytics and insights

---

**Note**: This chatbot is now fully integrated into the ROAM application and ready for use. The ChatbotProvider ensures proper state management across the entire application.
