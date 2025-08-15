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

    const { type, record } = await req.json()

    console.log('Auth event received:', { type, record })

    // Handle user signup
    if (type === 'INSERT' && record.email) {
      const { id, email, user_metadata } = record

      // Create user profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert([
          {
            id,
            email,
            full_name: user_metadata?.full_name || '',
            avatar_url: user_metadata?.avatar_url || '',
            user_type: user_metadata?.user_type || 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      } else {
        console.log('User profile created successfully for:', email)
      }

      // Send welcome notification
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert([
          {
            user_id: id,
            type: 'welcome',
            title: 'Welcome to ROAM!',
            message: 'Thank you for joining our platform. Complete your profile to get started.',
            data: { user_type: user_metadata?.user_type || 'customer' },
            created_at: new Date().toISOString()
          }
        ])

      if (notificationError) {
        console.error('Error creating welcome notification:', notificationError)
      }

      // If provider, create provider profile
      if (user_metadata?.user_type === 'provider') {
        const { error: providerError } = await supabaseClient
          .from('providers')
          .insert([
            {
              user_id: id,
              business_name: user_metadata?.business_name || '',
              service_type: user_metadata?.service_type || '',
              verification_status: 'pending',
              identity_verified: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (providerError) {
          console.error('Error creating provider profile:', providerError)
        } else {
          console.log('Provider profile created successfully for:', email)
        }
      }
    }

    // Handle user deletion
    if (type === 'DELETE' && record.id) {
      const { id } = record

      // Clean up related data
      const cleanupTables = ['profiles', 'providers', 'notifications', 'bookings']
      
      for (const table of cleanupTables) {
        const { error } = await supabaseClient
          .from(table)
          .delete()
          .eq('user_id', id)

        if (error) {
          console.error(`Error cleaning up ${table}:`, error)
        }
      }

      console.log('User data cleanup completed for:', id)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Auth event processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in auth handler:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
