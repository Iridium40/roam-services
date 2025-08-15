import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { table, record, type } = await req.json()

    console.log('Notification trigger received:', { table, type, record })

    // Handle verification completion
    if (table === 'provider_verifications' && type === 'UPDATE') {
      const { user_id, verification_status, old_record } = record

      if (old_record.verification_status !== verification_status && verification_status === 'verified') {
        // Get user profile for notification
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', user_id)
          .single()

        if (profile) {
          // Create in-app notification
          await supabaseClient
            .from('notifications')
            .insert([
              {
                user_id,
                type: 'verification_complete',
                title: 'Identity Verification Complete',
                message: 'Your identity has been successfully verified. You can now receive payments.',
                data: { verification_status },
                created_at: new Date().toISOString()
              }
            ])

          // Send email notification via external service
          const emailPayload = {
            to: profile.email,
            subject: 'Identity Verification Complete - ROAM',
            template: 'verification_complete',
            data: {
              name: profile.full_name,
              verification_status
            }
          }

          // You could integrate with SendGrid, Resend, or other email service here
          console.log('Email notification queued:', emailPayload)
        }
      }
    }

    // Handle booking creation
    if (table === 'bookings' && type === 'INSERT') {
      const { id, customer_id, provider_id, service_date, service_type } = record

      // Get customer and provider details
      const { data: customer } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', customer_id)
        .single()

      const { data: provider } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', provider_id)
        .single()

      if (customer && provider) {
        // Create notifications for both parties
        await supabaseClient
          .from('notifications')
          .insert([
            {
              user_id: customer_id,
              type: 'booking_confirmation',
              title: 'Booking Confirmed',
              message: `Your ${service_type} booking for ${service_date} has been confirmed.`,
              data: { booking_id: id, provider_name: provider.full_name },
              created_at: new Date().toISOString()
            },
            {
              user_id: provider_id,
              type: 'new_booking',
              title: 'New Booking Request',
              message: `You have a new ${service_type} booking for ${service_date}.`,
              data: { booking_id: id, customer_name: customer.full_name },
              created_at: new Date().toISOString()
            }
          ])

        // Queue email notifications
        console.log('Booking notifications created for booking:', id)
      }
    }

    // Handle payment completion
    if (table === 'payments' && type === 'UPDATE') {
      const { user_id, status, amount, booking_id, old_record } = record

      if (old_record.status !== status && status === 'completed') {
        await supabaseClient
          .from('notifications')
          .insert([
            {
              user_id,
              type: 'payment_received',
              title: 'Payment Received',
              message: `Payment of $${amount} has been processed successfully.`,
              data: { booking_id, amount, payment_status: status },
              created_at: new Date().toISOString()
            }
          ])

        console.log('Payment notification created for user:', user_id)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in notification sender:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
