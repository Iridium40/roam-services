import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Processing business approval...");

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { business_id, admin_user_id, notes } = body;

    console.log("Approval request:", {
      business_id,
      admin_user_id,
      has_notes: !!notes,
    });

    // Validate required fields
    if (!business_id) {
      return res.status(400).json({
        error: "business_id is required",
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the current business details
    const { data: business, error: fetchError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", business_id)
      .single();

    if (fetchError || !business) {
      console.error("Error fetching business:", fetchError);
      return res.status(404).json({ error: "Business not found" });
    }

    // Check if already approved
    if (business.verification_status === "approved") {
      return res.status(400).json({ 
        error: "Business is already approved",
        current_status: business.verification_status 
      });
    }

    // Update business status to approved
    const { data: updatedBusiness, error: updateError } = await supabase
      .from("business_profiles")
      .update({
        verification_status: "approved",
        approved_at: new Date().toISOString(),
        verification_notes: notes || null,
      })
      .eq("id", business_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating business:", updateError);
      return res.status(500).json({ error: "Failed to approve business" });
    }

    console.log("Business approved successfully:", business_id);

    // Trigger approval email
    try {
      await sendApprovalEmail({
        businessId: business_id,
        businessName: updatedBusiness.business_name,
        contactEmail: updatedBusiness.contact_email,
        supabase,
      });
      console.log("Approval email sent successfully");
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail the approval if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Business approved successfully",
      business: {
        id: updatedBusiness.id,
        business_name: updatedBusiness.business_name,
        verification_status: updatedBusiness.verification_status,
        approved_at: updatedBusiness.approved_at,
      },
    });
  } catch (error: any) {
    console.error("Error processing business approval:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

async function sendApprovalEmail({
  businessId,
  businessName,
  contactEmail,
  supabase,
}: {
  businessId: string;
  businessName: string;
  contactEmail: string;
  supabase: any;
}) {
  if (!contactEmail) {
    console.warn("No contact email provided, skipping email notification");
    return;
  }

  try {
    // Email configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "noreply@roamapp.com";
    const appUrl = process.env.APP_URL || "https://roamapp.com";

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured, email will not be sent");
      return;
    }

    const phase2Url = `${appUrl}/provider-application-phase-2?business_id=${businessId}`;

    // Simple email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .highlight { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Application Approved!</h1>
        </div>
        <div class="content">
          <p>Hello ${businessName} team,</p>
          <p>Congratulations! Your ROAM provider application has been <strong>approved</strong>.</p>
          
          <div class="highlight">
            <strong>Next Step:</strong> Complete your Phase 2 setup to start accepting bookings.
          </div>
          
          <p>Phase 2 includes:</p>
          <ul>
            <li>Identity verification with Stripe</li>
            <li>Bank account connection via Plaid</li>
            <li>Service configuration and pricing</li>
            <li>Complete your business profile</li>
          </ul>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="${phase2Url}" class="button">Complete Phase 2 Setup →</a>
          </p>
          
          <p><strong>Important:</strong> Please complete Phase 2 within 30 days to maintain your approved status.</p>
          
          <p>Welcome to ROAM!</p>
          <p>The ROAM Team</p>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [contactEmail],
        subject: "🎉 Application Approved - Complete Your ROAM Setup",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email API error: ${emailResponse.status} ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult.id);

    // Log the email in database
    await supabase.from("email_logs").insert({
      business_id: businessId,
      email_type: "provider_approval",
      recipient_email: contactEmail,
      email_id: emailResult.id,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error sending approval email:", error);
    
    // Log failed email attempt
    await supabase.from("email_logs").insert({
      business_id: businessId,
      email_type: "provider_approval",
      recipient_email: contactEmail,
      status: "failed",
      error_message: error.message,
      sent_at: new Date().toISOString(),
    });
    
    throw error;
  }
}
