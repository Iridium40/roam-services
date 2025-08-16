// Provider approval email - Sends notification when business is approved
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: any
  old_record: any
  schema: string
  timestamp: string
}

console.info('Provider approval email function initialized');

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Provider approval email function triggered')
    
    const payload: WebhookPayload = await req.json()
    console.log('Webhook payload:', JSON.stringify(payload, null, 2))

    // Only process business_profiles table updates
    if (payload.table !== 'business_profiles') {
      console.log('Ignoring webhook for table:', payload.table)
      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    const oldStatus = payload.old_record?.verification_status
    const newStatus = payload.record?.verification_status

    // Only trigger email when status changes from non-approved to approved
    if (oldStatus !== 'approved' && newStatus === 'approved') {
      console.log('Business approved! Sending email notification...')
      
      const businessId = payload.record.id
      const businessName = payload.record.business_name
      const contactEmail = payload.record.contact_email
      
      if (!contactEmail) {
        console.error('No contact email found for business:', businessId)
        return new Response('No contact email', { 
          status: 400, 
          headers: corsHeaders 
        })
      }

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase credentials')
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Update the approved_at timestamp
      await supabase
        .from('business_profiles')
        .update({ approved_at: new Date().toISOString() })
        .eq('id', businessId)

      // Send email notification
      await sendApprovalEmail({
        businessId,
        businessName,
        contactEmail,
        supabase
      })

      console.log('Approval email sent successfully')
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Approval email sent' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Status change does not require email notification')
    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Error in provider approval email function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendApprovalEmail({
  businessId,
  businessName,
  contactEmail,
  supabase
}: {
  businessId: string
  businessName: string
  contactEmail: string
  supabase: any
}) {
  try {
    // Email configuration - you'll need to set these environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@roamapp.com'
    const appUrl = Deno.env.get('APP_URL') || 'https://roamapp.com'

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not found, email will not be sent')
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    const phase2Url = `${appUrl}/provider-application-phase-2?business_id=${businessId}`

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Approved - Complete Your Setup</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .button:hover { background: #218838; }
          .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .step { margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .step:last-child { border-bottom: none; }
          .step-number { background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 10px; }
          .highlight { background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <h2>Your ROAM Application Has Been Approved</h2>
        </div>
        
        <div class="content">
          <p>Hello ${businessName} team,</p>
          
          <p>Great news! Your business application has been <strong>approved</strong> and you're now ready to complete your ROAM provider setup.</p>
          
          <div class="highlight">
            <strong>Next Step:</strong> Complete your financial onboarding to start accepting bookings and receiving payments.
          </div>
          
          <div class="steps">
            <h3>What's Next - Phase 2 Setup:</h3>
            
            <div class="step">
              <span class="step-number">1</span>
              <strong>Identity Verification:</strong> Complete Stripe Identity verification for secure payment processing
            </div>
            
            <div class="step">
              <span class="step-number">2</span>
              <strong>Bank Account Connection:</strong> Connect your bank account through Plaid for secure payouts
            </div>
            
            <div class="step">
              <span class="step-number">3</span>
              <strong>Service Configuration:</strong> Set up your services, pricing, and availability
            </div>
            
            <div class="step">
              <span class="step-number">4</span>
              <strong>Profile Completion:</strong> Add photos, bio, and complete your business profile
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${phase2Url}" class="button">Complete Phase 2 Setup →</a>
          </div>
          
          <div class="highlight">
            <p><strong>Important:</strong> You'll need to complete Phase 2 within 30 days to maintain your approved status and start receiving bookings.</p>
          </div>
          
          <p>If you have any questions during the setup process, our support team is here to help.</p>
          
          <p>Welcome to the ROAM provider community!</p>
          
          <p>Best regards,<br>
          The ROAM Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent because your business application was approved in our system.</p>
          <p>If you have questions, contact us at support@roamapp.com</p>
        </div>
      </body>
      </html>
    `

    const emailText = `
Congratulations! Your ROAM Application Has Been Approved

Hello ${businessName} team,

Great news! Your business application has been approved and you're now ready to complete your ROAM provider setup.

Next Step: Complete your financial onboarding to start accepting bookings and receiving payments.

What's Next - Phase 2 Setup:
1. Identity Verification: Complete Stripe Identity verification for secure payment processing
2. Bank Account Connection: Connect your bank account through Plaid for secure payouts  
3. Service Configuration: Set up your services, pricing, and availability
4. Profile Completion: Add photos, bio, and complete your business profile

Complete Phase 2 Setup: ${phase2Url}

Important: You'll need to complete Phase 2 within 30 days to maintain your approved status and start receiving bookings.

If you have any questions during the setup process, our support team is here to help.

Welcome to the ROAM provider community!

Best regards,
The ROAM Team

---
This email was sent because your business application was approved in our system.
If you have questions, contact us at support@roamapp.com
    `

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [contactEmail],
        subject: `🎉 Application Approved - Complete Your ROAM Setup`,
        html: emailHtml,
        text: emailText,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send email:', errorText)
      throw new Error(`Email API error: ${emailResponse.status} ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    // Log the email in our database for tracking
    const { error } = await supabase
      .from('email_logs')
      .insert({
        business_id: businessId,
        email_type: 'provider_approval',
        recipient_email: contactEmail,
        email_id: emailResult.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      
    if (error) {
      console.error('Error logging email to database:', error)
    }

  } catch (error) {
    console.error('Error sending approval email:', error)
    
    // Log failed email attempt
    try {
      await supabase
        .from('email_logs')
        .insert({
          business_id: businessId,
          email_type: 'provider_approval',
          recipient_email: contactEmail,
          status: 'failed',
          error_message: error.message
        })
    } catch (logError) {
      console.error('Error logging email failure:', logError)
    }
    
    throw error
  }
}
