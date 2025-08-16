-- Alternative approach: Use Supabase's built-in webhook functionality
-- This can be configured through the Supabase Dashboard or via SQL

-- First, let's create a more robust email tracking system
alter table email_logs add column if not exists metadata jsonb default '{}';
alter table email_logs add column if not exists retry_count integer default 0;
alter table email_logs add column if not exists last_retry_at timestamptz;

-- Create index for better performance
create index if not exists idx_email_logs_business_id on email_logs(business_id);
create index if not exists idx_email_logs_email_type on email_logs(email_type);
create index if not exists idx_email_logs_status on email_logs(status);

-- Function to handle business approval (can be called directly from admin app)
create or replace function approve_business(business_id_param uuid)
returns json as $$
declare
  business_record record;
  webhook_url text;
  webhook_response json;
begin
  -- Update the business status to approved
  update business_profiles 
  set 
    verification_status = 'approved',
    approved_at = now()
  where id = business_id_param
  returning * into business_record;

  if not found then
    return json_build_object('success', false, 'error', 'Business not found');
  end if;

  -- Get webhook URL (should be set in Supabase secrets)
  webhook_url := current_setting('app.webhook.provider_approval_url', true);
  
  if webhook_url is not null and webhook_url != '' then
    -- Call the approval email function
    select net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'APPROVAL',
        'business_id', business_record.id,
        'business_name', business_record.business_name,
        'contact_email', business_record.contact_email,
        'approved_at', business_record.approved_at
      )
    ) into webhook_response;
  end if;

  return json_build_object(
    'success', true, 
    'business_id', business_record.id,
    'approved_at', business_record.approved_at,
    'email_triggered', webhook_url is not null
  );
end;
$$ language plpgsql security definer;

-- Grant permission to authenticated users (your admin app)
grant execute on function approve_business(uuid) to authenticated;

-- Comment for documentation
comment on function approve_business(uuid) is 
'Approves a business and triggers approval email notification';

-- Example usage:
-- SELECT approve_business('123e4567-e89b-12d3-a456-426614174000');
