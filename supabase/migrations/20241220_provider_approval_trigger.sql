-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES business_profiles(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  email_id text, -- External email service ID (like Resend ID)
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz DEFAULT now(),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Add RLS (Row Level Security) to email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for email_logs (service role can access)
CREATE POLICY "Service role can manage email logs" ON email_logs
  FOR ALL TO service_role USING (true);

-- Create policy for authenticated users to view their own business emails
CREATE POLICY "Businesses can view their own email logs" ON email_logs
  FOR SELECT TO authenticated
  USING (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));

-- Create or replace the trigger function for provider approval emails
CREATE OR REPLACE FUNCTION trigger_provider_approval_email()
RETURNS trigger AS $$
DECLARE
  webhook_url text;
  service_role_key text;
BEGIN
  -- Only trigger when verification_status changes to 'approved'
  IF OLD.verification_status != 'approved' AND NEW.verification_status = 'approved' THEN
    -- Construct webhook URL from SUPABASE_URL environment variable
    -- This will be available in the database context from Supabase secrets
    webhook_url := 'https://vssomyuyhicaxsgiaupo.supabase.co/functions/v1/provider-approval-email';

    -- Use the service role key from secrets
    -- Note: In database triggers, we'll use a hardcoded approach since env vars aren't directly accessible
    -- The Edge Function itself will have access to the secrets via Deno.env.get()
    service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc29teXV5aGljYXhzZ2lhdXBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ1MzcxNSwiZXhwIjoyMDY5MDI5NzE1fQ.54i9VPExknTktnWbyT9Z9rZKvSJOjs9fG60wncLhLlA';

    -- Call the Edge Function asynchronously via webhook
    PERFORM
      net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'business_profiles',
          'record', row_to_json(NEW),
          'old_record', row_to_json(OLD),
          'schema', 'public',
          'timestamp', now()
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_business_approval ON business_profiles;

-- Create the trigger on business_profiles table
CREATE TRIGGER on_business_approval
  AFTER UPDATE ON business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_provider_approval_email();

-- Add comments for documentation
COMMENT ON FUNCTION trigger_provider_approval_email() IS
'Triggers provider approval email when business verification_status changes to approved';

COMMENT ON TRIGGER on_business_approval ON business_profiles IS
'Sends approval email notification when business gets approved';

-- Instead of database parameters, set project secrets using the CLI
-- Run these commands in your terminal:
-- supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzc29teXV5aGljYXhzZ2lhdXBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ1MzcxNSwiZXhwIjoyMDY5MDI5NzE1fQ.54i9VPExknTktnWbyT9Z9rZKvSJOjs9fG60wncLhLlA"
-- supabase secrets set SUPABASE_URL="https://vssomyuyhicaxsgiaupo.supabase.co"

-- Access these in Edge Functions via:
-- Deno.env.get("SERVICE_ROLE_KEY")
-- Deno.env.get("SUPABASE_URL")

-- Optional: Set other email-related secrets
-- supabase secrets set RESEND_API_KEY="your_resend_api_key"
-- supabase secrets set FROM_EMAIL="noreply@roamapp.com"
-- supabase secrets set APP_URL="https://your-app-domain.com"
