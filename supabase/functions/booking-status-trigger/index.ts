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

    console.log('Database trigger received:', { table, type, record })

    // Handle booking status changes
    if (table === 'bookings' && type === 'UPDATE') {
      const { id, status, customer_id, provider_id, old_record } = record

      // Only process if status actually changed
      if (old_record.status !== status) {
        console.log(`Booking ${id} status changed from ${old_record.status} to ${status}`)

        // Create notification for status change
        const { error: notificationError } = await supabaseClient
          .from('notifications')
          .insert([
            {
              user_id: customer_id,
              type: 'booking_status_update',
              title: `Booking ${status}`,
              message: `Your booking has been ${status.toLowerCase()}`,
              data: { booking_id: id, new_status: status, old_status: old_record.status },
              created_at: new Date().toISOString()
            },
            {
              user_id: provider_id,
              type: 'booking_status_update', 
              title: `Booking ${status}`,
              message: `Booking has been ${status.toLowerCase()}`,
              data: { booking_id: id, new_status: status, old_status: old_record.status },
              created_at: new Date().toISOString()
            }
          ])

        if (notificationError) {
          console.error('Error creating notifications:', notificationError)
        }

        // Trigger real-time updates
        const { error: realtimeError } = await supabaseClient
          .channel('booking-updates')
          .send({
            type: 'broadcast',
            event: 'booking_status_changed',
            payload: { booking_id: id, status, customer_id, provider_id }
          })

        if (realtimeError) {
          console.error('Error sending realtime update:', realtimeError)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Trigger processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in booking status trigger:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
