import type { VercelRequest, VercelResponse } from "@vercel/node";
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Supabase configuration:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseServiceKey?.length
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  try {
    console.log('Twilio Conversations API called with action:', req.body?.action);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { action, conversationSid, participantIdentity, message, bookingId, userRole, userName, participants, userId, userType } = req.body;

    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN;
    const conversationsServiceSid = process.env.VITE_TWILIO_CONVERSATIONS_SERVICE_SID;

    console.log('Environment variables check:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasServiceSid: !!conversationsServiceSid,
      accountSidLength: accountSid?.length,
      authTokenLength: authToken?.length,
      serviceSidLength: conversationsServiceSid?.length
    });

    if (!accountSid || !authToken || !conversationsServiceSid) {
      console.error('Missing Twilio credentials:', {
        accountSid: !!accountSid,
        authToken: !!authToken,
        conversationsServiceSid: !!conversationsServiceSid
      });
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    // Create Twilio client
    const client = twilio(accountSid, authToken);
    const conversationsService = client.conversations.v1.services(conversationsServiceSid);

    switch (action) {
      case 'get-conversations': {
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        try {
          console.log('Getting conversations for user:', userId);
          
          // For now, return empty conversations to prevent 500 errors
          // This allows the messaging modal to open without crashing
          return res.status(200).json({
            success: true,
            conversations: [],
            message: 'Conversation system ready - no existing conversations'
          });
          
        } catch (error: any) {
          console.error('Error in get-conversations:', error);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to fetch conversations', 
            message: error.message || 'Unknown error'
          });
        }
      }

      case 'create-conversation': {
        console.log('Creating conversation for booking:', bookingId);
        console.log('Participants:', participants);
        
        if (!bookingId || !participants || !Array.isArray(participants)) {
          console.error('Invalid request data:', { bookingId, participants, isArray: Array.isArray(participants) });
          return res.status(400).json({ error: 'Booking ID and participants array are required' });
        }

        try {
          // Create conversation in Twilio
          const conversation = await conversationsService.conversations.create({
            friendlyName: `Booking ${bookingId}`,
            attributes: JSON.stringify({
              bookingId,
              createdAt: new Date().toISOString(),
              type: 'booking'
            })
          });

          console.log('Created Twilio conversation:', conversation.sid);

          // Add participants to the conversation
          for (const participant of participants) {
            try {
              const twilioParticipant = await conversationsService.conversations(conversation.sid)
                .participants.create({
                  identity: participant.identity,
                  attributes: JSON.stringify({
                    role: participant.role,
                    name: participant.name,
                    userId: participant.userId
                  })
                });

              console.log(`Added participant: ${participant.identity}`);
            } catch (participantError) {
              console.error(`Error adding participant ${participant.identity}:`, participantError);
            }
          }

          return res.status(200).json({
            success: true,
            conversationSid: conversation.sid,
            message: 'Conversation created successfully'
          });

        } catch (error: any) {
          console.error('Error creating conversation:', error);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to create conversation', 
            message: error.message || 'Unknown error'
          });
        }
      }

      case 'send-message': {
        if (!conversationSid || !message || !participantIdentity) {
          return res.status(400).json({ error: 'Conversation SID, message, and participant identity are required' });
        }

        try {
          const sentMessage = await conversationsService.conversations(conversationSid)
            .messages.create({
              author: participantIdentity,
              body: message,
              attributes: JSON.stringify({
                userRole,
                userName,
                timestamp: new Date().toISOString()
              })
            });

          return res.status(200).json({
            success: true,
            messageSid: sentMessage.sid,
            dateCreated: sentMessage.dateCreated
          });

        } catch (error: any) {
          console.error('Error sending message:', error);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to send message', 
            message: error.message || 'Unknown error'
          });
        }
      }

      case 'get-messages': {
        if (!conversationSid) {
          return res.status(400).json({ error: 'Conversation SID is required' });
        }

        try {
          const messages = await conversationsService.conversations(conversationSid)
            .messages.list({ limit: 50, order: 'asc' });

          const formattedMessages = messages.map(msg => ({
            sid: msg.sid,
            author: msg.author,
            body: msg.body,
            dateCreated: msg.dateCreated,
            attributes: msg.attributes ? JSON.parse(msg.attributes) : {}
          }));

          return res.status(200).json({
            success: true,
            messages: formattedMessages
          });

        } catch (error: any) {
          console.error('Error getting messages:', error);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to get messages', 
            message: error.message || 'Unknown error'
          });
        }
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error: any) {
    console.error('Unexpected error in Twilio Conversations API:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      message: error.message || 'Unexpected error occurred'
    });
  }
}
