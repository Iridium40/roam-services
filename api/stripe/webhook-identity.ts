import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Handle Identity verification events
    switch (event.type) {
      case 'identity.verification_session.verified':
      case 'identity.verification_session.requires_input':
      case 'identity.verification_session.processing':
      case 'identity.verification_session.canceled':
        await handleVerificationSessionUpdate(event.data.object as Stripe.Identity.VerificationSession);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleVerificationSessionUpdate(session: Stripe.Identity.VerificationSession) {
  try {
    console.log(`Processing verification session update: ${session.id} - ${session.status}`);

    // Update the verification status in our database
    const { error: updateError } = await supabase
      .from('provider_verifications')
      .update({
        verification_status: session.status,
        verified_data: session.verified_outputs || null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_verification_session_id', session.id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
      throw updateError;
    }

    // If verification is complete, update provider status
    if (session.status === 'verified') {
      const user_id = session.metadata?.user_id;
      
      if (user_id) {
        // Update provider profile to mark identity as verified
        const { error: providerUpdateError } = await supabase
          .from('providers')
          .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);

        if (providerUpdateError) {
          console.error('Error updating provider identity status:', providerUpdateError);
        }

        // You could also send a notification to the user here
        console.log(`Identity verification completed for user: ${user_id}`);
      }
    }

    console.log(`Successfully processed verification session update: ${session.id}`);

  } catch (error) {
    console.error('Error handling verification session update:', error);
    throw error;
  }
}

export const config = {
  runtime: 'edge',
};
