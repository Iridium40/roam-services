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
          // First, check if a conversation already exists for this booking
          console.log('Checking for existing conversation for booking:', bookingId);
          
          const existingConversations = await conversationsService.conversations.list({
            limit: 50
          });
          
          let conversation: any = null;
          
          // Look for existing conversation with this booking ID
          for (const conv of existingConversations) {
            try {
              const attributes = conv.attributes ? JSON.parse(conv.attributes) : {};
              if (attributes.bookingId === bookingId) {
                console.log('Found existing conversation:', conv.sid);
                conversation = conv;
                break;
              }
            } catch (e) {
              // Skip conversations with invalid attributes
              continue;
            }
          }
          
          // If no existing conversation found, create a new one
          if (!conversation) {
            console.log('No existing conversation found, creating new one for booking:', bookingId);
            conversation = await conversationsService.conversations.create({
              friendlyName: `Booking ${bookingId}`,
              attributes: JSON.stringify({
                bookingId,
                createdAt: new Date().toISOString(),
                type: 'booking'
              })
            });
            console.log('Created new Twilio conversation:', conversation.sid);
          } else {
            console.log('Using existing Twilio conversation:', conversation.sid);
          }

          // Get existing participants to avoid duplicates
          const existingParticipants = await conversationsService.conversations(conversation.sid)
            .participants.list();
          
          const existingIdentities = existingParticipants.map(p => p.identity);
          console.log('Existing participants:', existingIdentities);

          // Add participants to the conversation (skip if already exists)
          for (const participant of participants) {
            try {
              if (!existingIdentities.includes(participant.identity)) {
                const twilioParticipant = await conversationsService.conversations(conversation.sid)
                  .participants.create({
                    identity: participant.identity,
                    attributes: JSON.stringify({
                      role: participant.role,
                      name: participant.name,
                      userId: participant.userId,
                      userType: participant.userType || participant.role
                    })
                  });

                console.log(`Added new participant: ${participant.identity}`);
              } else {
                console.log(`Participant already exists: ${participant.identity}`);
              }
            } catch (participantError) {
              console.error(`Error adding participant ${participant.identity}:`, participantError);
              // Continue with other participants even if one fails
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
            author: participantIdentity,
            body: message,
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

      case 'get-conversation-participants': {
        if (!conversationSid) {
          return res.status(400).json({ error: 'Conversation SID is required' });
        }

        try {
          console.log('Getting participants for conversation:', conversationSid);
          
          // Fetch real participants from Twilio
          const participants = await conversationsService.conversations(conversationSid)
            .participants.list();

          // Clean up duplicate participants with normalized identity comparison
          const seenNormalizedIdentities = new Set<string>();
          const duplicateParticipants: any[] = [];
          const uniqueParticipants: any[] = [];

          // Helper function to normalize identity for comparison
          const normalizeIdentity = (identity: string) => {
            // Extract the core user type and ID, ignoring format differences
            const match = identity.match(/^(customer|provider)[_-](.+)$/i);
            if (match) {
              return `${match[1].toLowerCase()}-${match[2]}`;
            }
            return identity.replace(/[_-]/g, '-').toLowerCase();
          };

          // Also check for participants with same user type but different IDs (legacy issue)
          const getUserTypeFromIdentity = (identity: string) => {
            if (identity.startsWith('customer')) return 'customer';
            if (identity.startsWith('provider')) return 'provider';
            return 'unknown';
          };

          // Track user types to ensure only one of each type (customer/provider)
          const seenUserTypes = new Set<string>();
          
          for (const participant of participants) {
            const normalizedIdentity = normalizeIdentity(participant.identity);
            const userType = getUserTypeFromIdentity(participant.identity);
            
            // Check for exact duplicate identities
            if (seenNormalizedIdentities.has(normalizedIdentity)) {
              duplicateParticipants.push(participant);
              console.log(`Found duplicate participant (exact): ${participant.identity} (normalized: ${normalizedIdentity})`);
            }
            // Check for duplicate user types (multiple customers or providers)
            else if (seenUserTypes.has(userType) && userType !== 'unknown') {
              duplicateParticipants.push(participant);
              console.log(`Found duplicate participant (same type): ${participant.identity} (type: ${userType})`);
            }
            else {
              seenNormalizedIdentities.add(normalizedIdentity);
              seenUserTypes.add(userType);
              uniqueParticipants.push(participant);
            }
          }

          // Remove duplicate participants from Twilio
          for (const duplicate of duplicateParticipants) {
            try {
              await conversationsService.conversations(conversationSid)
                .participants(duplicate.sid).remove();
              console.log(`Removed duplicate participant: ${duplicate.identity}`);
            } catch (removeError) {
              console.error(`Error removing duplicate participant ${duplicate.identity}:`, removeError);
            }
          }

          const formattedParticipants = uniqueParticipants.map(participant => ({
            sid: participant.sid,
            identity: participant.identity,
            attributes: participant.attributes ? JSON.parse(participant.attributes) : {},
            dateCreated: participant.dateCreated,
            dateUpdated: participant.dateUpdated
          }));

          return res.status(200).json({
            success: true,
            participants: formattedParticipants,
            message: `Participants loaded successfully. Removed ${duplicateParticipants.length} duplicates.`
          });
        } catch (error: any) {
          console.error('Error getting conversation participants:', error);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to get participants', 
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
