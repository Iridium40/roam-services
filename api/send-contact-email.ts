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
    console.log("Processing contact form submission...");

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { to, from, subject, html } = body;

    console.log("Form data received:", {
      to,
      from,
      subject: subject?.substring(0, 50),
    });

    // Validate required fields
    if (!to || !from || !subject || !html) {
      console.log("Missing required fields:", {
        to: !!to,
        from: !!from,
        subject: !!subject,
        html: !!html,
      });
      return res.status(400).json({
        error: "Missing required fields",
        missing: {
          to: !to,
          from: !from,
          subject: !subject,
          html: !html,
        },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from)) {
      console.log("Invalid email format:", from);
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract the actual message content from HTML
    const messageContent = html
      .replace(/<h2>New Contact Form Submission<\/h2>/, "")
      .replace(/<p><strong>Name:<\/strong>.*?<\/p>/, "")
      .replace(/<p><strong>Email:<\/strong>.*?<\/p>/, "")
      .replace(/<p><strong>Subject:<\/strong>.*?<\/p>/, "")
      .replace(/<p><strong>Message:<\/strong><\/p>/, "")
      .replace(/<p>|<\/p>/g, "")
      .replace(/<br>/g, "\n")
      .trim();

    // Store contact submission in Supabase
    const contactSubmission = {
      from_email: from,
      to_email: to,
      subject: subject.replace("Contact Form: ", ""),
      message: messageContent,
      status: "received",
      created_at: new Date().toISOString(),
    };

    const { data, error: supabaseError } = await supabase
      .from("contact_submissions")
      .insert([contactSubmission])
      .select()
      .single();

    if (supabaseError) {
      console.error("Error storing contact submission:", supabaseError);
      // Continue anyway - don't fail the whole request
    } else {
      console.log("Contact submission stored successfully:", data?.id);
    }

    // For now, we'll store the submission in Supabase for manual follow-up
    // In the future, you can integrate with email services like:
    // - Resend: https://resend.com/
    // - SendGrid: https://sendgrid.com/
    // - AWS SES: https://aws.amazon.com/ses/
    // - Postmark: https://postmarkapp.com/

    console.log("Contact form submission processed:", {
      to,
      from,
      subject,
      timestamp: new Date().toISOString(),
      submissionId: data?.id,
    });

    return res.status(200).json({
      success: true,
      message: "Contact form submitted successfully",
      submissionId: data?.id,
    });
  } catch (error: any) {
    console.error("Error processing contact form:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
