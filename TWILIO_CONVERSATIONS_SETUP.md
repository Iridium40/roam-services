# Twilio Conversations API Setup

This application now uses Twilio Conversations API for in-app messaging between business owners, dispatchers, providers, and customers.

## Required Environment Variables

You need to set these environment variables using the DevServerControl tool:

### Existing Twilio Variables (already configured)
- `VITE_TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `VITE_TWILIO_AUTH_TOKEN` - Your Twilio Auth Token  
- `VITE_TWILIO_PHONE_NUMBER` - Your Twilio phone number

### New Required Variable
- `VITE_TWILIO_CONVERSATIONS_SERVICE_SID` - Your Twilio Conversations Service SID

## Setting Up Twilio Conversations Service

1. **Login to Twilio Console**: Go to https://console.twilio.com
2. **Navigate to Conversations**: Go to Conversations > Services
3. **Create a Service**: 
   - Click "Create a Service"
   - Give it a name like "ROAM App Conversations"
   - Configure settings as needed
4. **Get the Service SID**: Copy the Service SID (starts with `IS...`)
5. **Set Environment Variable**: Use the DevServerControl tool to set:
   ```
   VITE_TWILIO_CONVERSATIONS_SERVICE_SID=IS5069b5cf49b04c40a9174548f5b1470e
   ```

## How to Set Environment Variables

Use the DevServerControl tool in the Builder.io interface:
1. Click on the DevServerControl tool
2. Use `set_env_variable: ["VITE_TWILIO_CONVERSATIONS_SERVICE_SID", "YOUR_SERVICE_SID"]`

## Features Enabled

With the Conversations API, users can now:
- ✅ Create conversations for each booking
- ✅ Send real-time messages within the app
- ✅ View conversation history organized by booking
- ✅ See participant information (roles, names)
- ✅ Mark conversations as read/unread
- ✅ Access conversations from the Messages tab in the dashboard
- ✅ Start conversations directly from booking cards

## User Roles Supported

- **Owner**: Full access to all conversations
- **Dispatcher**: Full access to all conversations  
- **Provider**: Access to conversations for their bookings
- **Customer**: Can participate in conversations for their bookings

## Usage

1. **From Booking Cards**: Click the "Message" button on any booking card
2. **From Messages Tab**: Access all conversations from the main Messages tab
3. **Automatic Creation**: Conversations are automatically created when messaging is initiated

The system replaces the previous SMS-only messaging with a full in-app chat experience while maintaining the same user interface patterns.
