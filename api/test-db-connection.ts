import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing database connection...');
    console.log('Supabase configuration:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseServiceKey?.length
    });

    // Test 1: Check if conversation_participants table exists
    console.log('Testing conversation_participants table...');
    const { data: participantsData, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('*')
      .limit(1);

    console.log('conversation_participants test result:', {
      hasData: !!participantsData,
      dataLength: participantsData?.length,
      error: participantsError
    });

    // Test 2: Check if conversations table exists
    console.log('Testing conversations table...');
    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    console.log('conversations test result:', {
      hasData: !!conversationsData,
      dataLength: conversationsData?.length,
      error: conversationsError
    });

    // Test 3: Check if message_notifications table exists
    console.log('Testing message_notifications table...');
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('message_notifications')
      .select('*')
      .limit(1);

    console.log('message_notifications test result:', {
      hasData: !!notificationsData,
      dataLength: notificationsData?.length,
      error: notificationsError
    });

    // Test 4: Check if we can query with a specific user_id
    const testUserId = req.query.userId as string;
    let userConversations: any[] | null = null;
    let userError: any = null;
    
    if (testUserId) {
      console.log('Testing query with user_id:', testUserId);
      const result = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_type')
        .eq('user_id', testUserId);
      
      userConversations = result.data;
      userError = result.error;

      console.log('User conversations test result:', {
        hasData: !!userConversations,
        dataLength: userConversations?.length,
        error: userError,
        conversations: userConversations
      });
    }

    return res.status(200).json({
      success: true,
      tests: {
        conversation_participants: {
          exists: !participantsError,
          error: participantsError?.message,
          sampleData: participantsData?.length || 0
        },
        conversations: {
          exists: !conversationsError,
          error: conversationsError?.message,
          sampleData: conversationsData?.length || 0
        },
        message_notifications: {
          exists: !notificationsError,
          error: notificationsError?.message,
          sampleData: notificationsData?.length || 0
        },
        userQuery: testUserId ? {
          userId: testUserId,
          conversations: userConversations?.length || 0,
          error: userError?.message
        } : null
      }
    });

  } catch (error: any) {
    console.error('Database connection test error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
