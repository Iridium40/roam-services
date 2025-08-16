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
- **Vercel AI Gateway** - Uses Anthropic's Claude-4-sonnet model via Vercel
- **Streaming Responses** - Real-time text streaming for better UX
- **Smart Context Awareness** - Knows user type (customer/provider/owner/admin)
- **Real-time Data Access** - Fetches user data from Supabase
- **Role-based Responses** - Tailored responses based on user role
- **API Key Support** - Optional AI Gateway API key for enhanced access

### 🎯 User Experience
- **Streaming Responses** - Real-time text streaming as AI types
- **Quick Actions** - Role-specific quick action buttons
- **Connection Status** - Shows AI Gateway connection status
- **Data Refresh** - Manual refresh of user data
- **Responsive Design** - Works on all screen sizes
- **Typing Indicators** - Visual feedback during response generation

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
4. **Vercel AI Gateway** - AI responses with context via `/api/chatbot`

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
4. Message + context + user data sent to `/api/chatbot`
5. Vercel AI Gateway processes request with Claude-3.5-sonnet
6. AI response displayed with user-specific actions

## Deployment Considerations

### Environment Variables:
- **No environment variables needed!** Vercel AI Gateway handles everything
- Automatic scaling and optimization

### API Limits:
- Vercel AI Gateway handles rate limits automatically
- Built-in fallback responses for API failures
- Global optimization and caching included

### Security:
- **No API keys to manage** - Vercel handles security
- Built-in CORS and rate limiting
- Automatic abuse protection

## Troubleshooting

### Common Issues:

1. **Red Connection Dot**:
   - Ensure Vercel AI Gateway is enabled in project settings
   - Verify deployment is successful
   - Check Vercel dashboard for any issues

2. **User Data Not Loading**:
   - Verify Supabase connection
   - Check user authentication
   - Refresh user data manually

3. **Messages Not Sending**:
   - Check `/api/chatbot` endpoint is accessible
   - Verify deployment status in Vercel
   - Check browser console for errors

### Development Tips:
- Use browser dev tools to inspect network requests to `/api/chatbot`
- Check console for detailed error messages
- Test with different user roles/types
- Monitor usage in Vercel dashboard

## Future Enhancements

- [ ] Message history persistence
- [ ] Custom training on ROAM-specific data
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with booking system
- [ ] Advanced analytics and insights

---

**Note**: This chatbot is now fully integrated into the ROAM application and ready for use. The ChatbotProvider ensures proper state management across the entire application.
