-- Create email_logs table to track sent emails
create table if not exists email_logs (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references business_profiles(id) on delete cascade,
  email_type text not null,
  recipient_email text not null,
  email_id text, -- External email service ID (like Resend ID)
  status text not null default 'pending',
  sent_at timestamptz default now(),
  error_message text,
  created_at timestamptz default now()
);

-- Add RLS (Row Level Security) to email_logs
alter table email_logs enable row level security;

-- Create policy for email_logs (only service role can access)
create policy "Service role can manage email logs" on email_logs
  for all using (auth.role() = 'service_role');

-- Create or replace the trigger function for provider approval emails
create or replace function trigger_provider_approval_email()
returns trigger as $$
declare
  webhook_url text;
begin
  -- Only trigger when verification_status changes to 'approved'
  if OLD.verification_status != 'approved' and NEW.verification_status = 'approved' then
    -- Get the webhook URL from environment or use default
    webhook_url := coalesce(
      current_setting('app.settings.webhook_url', true),
      'https://your-project.supabase.co/functions/v1/provider-approval-email'
    );
    
    -- Call the Edge Function asynchronously
    perform
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
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_business_approval on business_profiles;

-- Create the trigger on business_profiles table
create trigger on_business_approval
  after update on business_profiles
  for each row
  execute function trigger_provider_approval_email();

-- Add comment for documentation
comment on function trigger_provider_approval_email() is 
'Triggers provider approval email when business verification_status changes to approved';

comment on trigger on_business_approval on business_profiles is 
'Sends approval email notification when business gets approved';
