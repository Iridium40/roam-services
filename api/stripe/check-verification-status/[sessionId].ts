import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract sessionId from the URL path
    const url = new URL(req.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify that this session belongs to the authenticated user
    const { data: verification, error: verificationError } = await supabase
      .from('provider_verifications')
      .select('user_id, verification_status')
      .eq('stripe_verification_session_id', sessionId)
      .single();

    if (verificationError || !verification) {
      return new Response(JSON.stringify({ error: 'Verification session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (verification.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retrieve the verification session from Stripe
    const verificationSession = await stripe.identity.verificationSessions.retrieve(sessionId);

    // Update our database with the latest status
    const { error: updateError } = await supabase
      .from('provider_verifications')
      .update({
        verification_status: verificationSession.status,
        verified_data: verificationSession.verified_outputs || null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_verification_session_id', sessionId);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
    }

    // Return the verification session data
    return new Response(JSON.stringify({
      id: verificationSession.id,
      status: verificationSession.status,
      url: verificationSession.url,
      verified_outputs: verificationSession.verified_outputs,
      last_error: verificationSession.last_error,
      client_secret: verificationSession.client_secret
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking verification status:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return new Response(JSON.stringify(
        { error: `Stripe error: ${error.message}` }
      ), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(
      { error: 'Internal server error' }
    ), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  runtime: 'edge',
};
