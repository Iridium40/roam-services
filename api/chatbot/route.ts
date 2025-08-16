// Create this file: api/chatbot/route.ts
// This is the complete API route using Vercel AI Gateway with streaming

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(request: Request) {
  try {
    const { message, userContext, userData } = await request.json();

    // Validate required fields
    if (!message || !userContext) {
      return Response.json(
        { error: 'Missing message or user context', success: false },
        { status: 400 }
      );
    }

    // Use Vercel AI Gateway with streaming (no API keys needed!)
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt: `You are the ROAM AI Assistant with access to user account data.

CURRENT USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

USER DATA:
${JSON.stringify(userData, null, 2)}

USER QUESTION: "${message}"

ROAM PLATFORM INFO:
- Wellness services marketplace with React/TypeScript + Supabase
- Role-based access: customer, provider, dispatcher, owner, admin
- Booking system with payments, locations, provider management

INSTRUCTIONS:
1. Use the user's specific data for personalized responses
2. Reference actual dates, amounts, names from their data
3. For location queries, provide business recommendations with booking links
4. Guide users to relevant platform features
5. Be helpful and specific

Respond as the ROAM AI Assistant.`,
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Return the streaming response
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('AI Gateway error:', error);

    return Response.json({
      response: "I'm having trouble right now, but I can still help with your ROAM account! Try asking about your bookings, earnings, or schedule.",
      success: true,
      fallback: true
    });
  }
}
