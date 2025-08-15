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
BEGIN
  -- Only trigger when verification_status changes to 'approved'
  IF OLD.verification_status != 'approved' AND NEW.verification_status = 'approved' THEN
    -- Get the webhook URL from environment or construct from SUPABASE_URL
    webhook_url := current_setting('app.settings.webhook_url', true);

    IF webhook_url IS NULL THEN
      -- Construct from project reference if available
      webhook_url := rtrim(current_setting('app.settings.supabase_url', true), '/') || '/functions/v1/provider-approval-email';
    END IF;

    -- Call the Edge Function asynchronously via webhook
    PERFORM
      net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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

-- Set application settings (do this once for your project)
-- Replace with your actual service role key
DO $$
BEGIN
  -- Only set if not already set
  BEGIN
    PERFORM set_config('app.settings.service_role_key', 'your-service-role-key-here', false);
  EXCEPTION
    WHEN undefined_object THEN
      -- Setting doesn't exist yet, create it
      PERFORM set_config('app.settings.service_role_key', 'your-service-role-key-here', false);
  END;

  -- You can also set webhook URL explicitly if needed
  BEGIN
    PERFORM set_config('app.settings.webhook_url', 'https://your-project-ref.supabase.co/functions/v1/provider-approval-email', false);
  EXCEPTION
    WHEN undefined_object THEN
      PERFORM set_config('app.settings.webhook_url', 'https://your-project-ref.supabase.co/functions/v1/provider-approval-email', false);
  END;

  -- Set Supabase URL for constructing webhook URLs
  BEGIN
    PERFORM set_config('app.settings.supabase_url', 'https://your-project-ref.supabase.co', false);
  EXCEPTION
    WHEN undefined_object THEN
      PERFORM set_config('app.settings.supabase_url', 'https://your-project-ref.supabase.co', false);
  END;
END $$;
