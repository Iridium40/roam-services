# Provider Approval Email System

This document explains how the provider approval email system works when businesses are approved in the ROAM Admin application.

## Overview

When a business application is approved in your separate ROAM Admin application, the system automatically sends an email notification to the provider directing them to complete Phase 2 of their onboarding.

## Architecture

The system provides three approaches for triggering approval emails:

### 1. Database Trigger (Automatic)
- **File:** `supabase/migrations/20241220_provider_approval_trigger.sql`
- **How it works:** Automatically triggers when `verification_status` changes to "approved" in the `business_profiles` table
- **Pros:** Fully automatic, works regardless of how the status is updated
- **Cons:** Requires network access from database

### 2. Supabase Edge Function (Webhook)
- **File:** `supabase/functions/provider-approval-email/index.ts`
- **How it works:** Called by database trigger or external webhook
- **Features:** 
  - Rich HTML email template
  - Automatic email logging
  - Error handling and retry logic
  - Environment-based configuration

### 3. API Endpoint (Direct Call)
- **File:** `api/admin/approve-business.ts`
- **How it works:** Your admin app calls this endpoint directly
- **Pros:** Simple integration, immediate feedback
- **Best for:** Direct integration with your admin application

## Setup Instructions

### Step 1: Run Database Migrations

```sql
-- Run the migration to create email_logs table and triggers
-- File: supabase/migrations/20241220_provider_approval_trigger.sql
```

### Step 2: Deploy Supabase Edge Function (Optional)

```bash
# Deploy the edge function
supabase functions deploy provider-approval-email

# Set environment variables
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set FROM_EMAIL=noreply@roamapp.com
supabase secrets set APP_URL=https://your-app-domain.com
```

### Step 3: Configure Email Service

Set up your email service (recommended: Resend) and add the API key to your environment variables:

- `RESEND_API_KEY`: Your Resend API key
- `FROM_EMAIL`: Email address to send from (e.g., noreply@roamapp.com)
- `APP_URL`: Your application URL for Phase 2 links

### Step 4: Integration Options

#### Option A: Use API Endpoint (Recommended)

Call the approval endpoint from your admin app:

```javascript
// Example: Approve a business from your admin app
const response = await fetch('/api/admin/approve-business', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    business_id: 'uuid-of-business',
    admin_user_id: 'admin-user-id',
    notes: 'Optional approval notes'
  })
});

const result = await response.json();
```

#### Option B: Direct Database Update (Automatic Trigger)

Simply update the database directly and the trigger will handle email:

```sql
UPDATE business_profiles 
SET verification_status = 'approved',
    approved_at = NOW()
WHERE id = 'business-uuid';
```

## Email Template Features

The approval email includes:

1. **Congratulations header** with business name
2. **Phase 2 setup instructions** with clear steps:
   - Stripe Identity verification
   - Plaid bank account connection
   - Service configuration
   - Profile completion
3. **Direct link** to Phase 2 with business_id parameter
4. **30-day completion deadline** notice
5. **Professional styling** with ROAM branding

## Database Schema

### email_logs Table

Tracks all sent emails for auditing and debugging:

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  email_id TEXT, -- External service email ID (like Resend ID)
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role can manage email logs" ON email_logs
  FOR ALL TO service_role USING (true);

-- Businesses can view their own email logs
CREATE POLICY "Businesses can view their own email logs" ON email_logs
  FOR SELECT TO authenticated
  USING (business_id IN (
    SELECT id FROM business_profiles WHERE user_id = auth.uid()
  ));
```

### business_profiles Updates

The approval process updates:
- `verification_status` → "approved"
- `approved_at` → current timestamp
- `verification_notes` → admin notes (optional)

## Environment Variables

Required environment variables:

```env
# Email Service
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@roamapp.com
APP_URL=https://your-app-domain.com

# Supabase (should already be configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

### Test the API Endpoint

```bash
curl -X POST http://localhost:3000/api/admin/approve-business \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "123e4567-e89b-12d3-a456-426614174000",
    "admin_user_id": "admin-123",
    "notes": "Test approval"
  }'
```

### Test Database Trigger

```sql
-- Insert a test business
INSERT INTO business_profiles (business_name, business_type, contact_email, verification_status)
VALUES ('Test Business', 'independent', 'test@example.com', 'pending');

-- Approve it (should trigger email)
UPDATE business_profiles 
SET verification_status = 'approved' 
WHERE business_name = 'Test Business';
```

## Monitoring and Troubleshooting

### Check Email Logs

```sql
-- View recent email attempts
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check failed emails
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Common Issues

1. **Emails not sending:**
   - Check RESEND_API_KEY is set correctly
   - Verify FROM_EMAIL is authorized in Resend
   - Check business has valid contact_email

2. **Trigger not firing:**
   - Verify trigger exists: `\d+ business_profiles` in psql
   - Check function permissions
   - Review database logs

3. **Wrong Phase 2 URL:**
   - Update APP_URL environment variable
   - Ensure Phase 2 route exists in your application

## Production Checklist

- [ ] Database migration applied
- [ ] Email service configured (Resend account + API key)
- [ ] Environment variables set
- [ ] FROM_EMAIL domain verified in Resend
- [ ] Phase 2 route accessible at generated URLs
- [ ] Test approval email sent successfully
- [ ] Email logs table receiving entries
- [ ] Admin app integrated with approval endpoint

## Future Enhancements

1. **Email Templates:** Create multiple templates for different approval scenarios
2. **Retry Logic:** Implement automatic retry for failed emails
3. **Admin Dashboard:** Build UI to view email logs and resend failed emails
4. **Multiple Languages:** Support for localized email templates
5. **SMS Notifications:** Add SMS backup for critical notifications
