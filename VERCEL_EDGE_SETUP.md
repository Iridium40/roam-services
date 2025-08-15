# Vercel Edge Functions for Communications & Notifications

This document outlines the implementation of Vercel Edge Functions for real-time communications and status notifications in the ROAM application.

## 🚀 **Features Implemented**

### **1. Real-time Notifications (Server-Sent Events)**
- **File**: `api/notifications/edge.ts`
- **Runtime**: Edge Runtime
- **Purpose**: Real-time notifications via SSE
- **Features**:
  - WebSocket-like connections using SSE
  - Automatic reconnection
  - Multi-channel notifications (email, SMS, push, in-app)
  - User preference management

### **2. Booking Status Updates**
- **File**: `api/bookings/status-update.ts`
- **Runtime**: Edge Runtime
- **Purpose**: Handle booking status changes
- **Features**:
  - Real-time status updates
  - Notification broadcasting
  - Twilio Conversations integration
  - Webhook support for external updates

### **3. React Hook for Notifications**
- **File**: `client/hooks/useEdgeNotifications.ts`
- **Purpose**: React integration for real-time notifications
- **Features**:
  - SSE connection management
  - Automatic reconnection
  - Notification preferences
  - Toast notifications

### **4. Notification Center Component**
- **File**: `client/components/EdgeNotificationCenter.tsx`
- **Purpose**: UI for managing notifications
- **Features**:
  - Real-time notification display
  - Mark as read functionality
  - Notification preferences
  - Connection status indicator

## 🔧 **Setup Instructions**

### **1. Environment Variables**

Add these to your `.env` file:

```bash
# Vercel Edge Functions Configuration
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
VERCEL_URL=http://localhost:8080
```

### **2. Vercel Configuration**

The `vercel.json` file is configured for:
- Edge Runtime functions
- CORS headers for SSE
- Function routing

### **3. Database Tables (Optional)**

Run the `create_messaging_tables.sql` file in Supabase for:
- Conversation metadata
- Message notifications
- Analytics tracking

## 📡 **How It Works**

### **Real-time Flow**

1. **User connects** to SSE stream via `/api/notifications/edge`
2. **Booking status changes** trigger notifications
3. **Edge Function** processes the update
4. **Notifications sent** via multiple channels:
   - SSE (real-time)
   - Email (if enabled)
   - SMS (if enabled)
   - Push notifications (if enabled)

### **Notification Types**

- **`booking_status_update`**: Booking status changes
- **`new_message`**: New Twilio Conversations messages
- **`booking_reminder`**: Upcoming booking reminders
- **`system`**: System notifications

### **User Preferences**

Users can control notification delivery:
- **Email**: SendGrid/Resend integration
- **SMS**: Twilio SMS integration
- **Push**: Web push notifications
- **In-App**: Real-time SSE notifications

## 🎯 **Integration Points**

### **With Twilio Conversations**
- Status updates trigger conversation notifications
- Message notifications for new chat messages
- Seamless integration with existing chat system

### **With Supabase**
- Real-time database updates
- Row Level Security (RLS) policies
- Service role key for admin operations

### **With React Components**
- Header notification center
- Booking management pages
- Provider dashboard

## 🔒 **Security**

### **Edge Function Security**
- Input validation
- Rate limiting (can be added)
- CORS configuration
- Service role key protection

### **Database Security**
- RLS policies for data access
- User-specific notification filtering
- Secure service role operations

## 📊 **Performance**

### **Edge Runtime Benefits**
- **Global distribution**: Deployed to edge locations
- **Low latency**: Sub-100ms response times
- **Scalability**: Automatic scaling
- **Cost efficiency**: Pay-per-request

### **SSE Benefits**
- **Real-time**: Instant notifications
- **Efficient**: Single connection per user
- **Reliable**: Automatic reconnection
- **Lightweight**: Minimal overhead

## 🚀 **Deployment**

### **Vercel Deployment**
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### **Environment Variables in Vercel**
```bash
SUPABASE_SERVICE_ROLE_KEY=your_production_key
VERCEL_URL=https://your-app.vercel.app
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_CONVERSATIONS_SERVICE_SID=your_twilio_conversations_service_sid
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 🔧 **Development**

### **Local Development**
```bash
# Start development server
npm run dev

# Test Edge Functions
curl -X POST http://localhost:8080/api/notifications/edge \
  -H "Content-Type: application/json" \
  -d '{"type":"test","userId":"test","message":"Test notification"}'
```

### **Testing SSE Connection**
```javascript
// In browser console
const eventSource = new EventSource('/api/notifications/edge?userId=test&userType=customer');
eventSource.onmessage = (event) => console.log(JSON.parse(event.data));
```

## 📈 **Monitoring**

### **Vercel Analytics**
- Function execution metrics
- Response times
- Error rates
- Usage patterns

### **Custom Monitoring**
- Connection status tracking
- Notification delivery rates
- User engagement metrics

## 🔮 **Future Enhancements**

### **Planned Features**
- **WebSocket support** for bi-directional communication
- **Message queuing** for offline users
- **Advanced analytics** dashboard
- **Multi-language** notifications
- **Rich media** notifications (images, videos)

### **Scalability Improvements**
- **Redis integration** for connection management
- **Message persistence** for offline delivery
- **Load balancing** across edge locations
- **Advanced caching** strategies

## 📚 **Resources**

- [Vercel Edge Functions Documentation](https://vercel.com/docs/functions/edge-functions)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Twilio Conversations API](https://www.twilio.com/docs/conversations-api)
