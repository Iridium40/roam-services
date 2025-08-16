import { VercelRequest, VercelResponse } from '@vercel/node';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // System prompt for ROAM assistant
    const systemPrompt = `You are a helpful AI assistant for ROAM, a platform that connects customers with local service providers for beauty, fitness, wellness, and healthcare services.

Key information about ROAM:
- Customers can browse and book services from verified local providers
- Services include beauty (hair, nails, skincare), fitness (personal training, yoga), wellness (massage, therapy), and healthcare
- Providers offer both in-home services and studio appointments
- Secure payment processing with transparent pricing
- 24-hour cancellation policy for most services
- Providers go through verification process to ensure quality

Be helpful, friendly, and informative. Keep responses concise and relevant to ROAM's services.`;

    const result = await streamText({
      model: anthropic('claude-3-haiku-20240307'),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chatbot API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process chat request'
    });
  }
}
