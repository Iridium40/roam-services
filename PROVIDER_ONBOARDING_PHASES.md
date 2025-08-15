# ROAM Provider Onboarding - Two-Phase System

## Overview

The provider onboarding has been restructured into a logical two-phase approach that separates initial application screening from financial setup, creating a better experience for both providers and the platform.

## Phase 1: Initial Application (Pre-Approval)

**Goal:** Collect essential information to make an approval decision
**Route:** `/provider-application/phase1`
**File:** `client/pages/ProviderApplicationPhase1.tsx`

### Steps in Phase 1:

#### Step 1: Contact Information
- First Name, Last Name
- Email Address 
- Phone Number
- Primary business contact details

#### Step 2: Business Details
- Business Name & Type (LLC, Inc, Sole Prop, etc.)
- Business Address & Service Areas
- Services Offered (Beauty, Massage, Training, etc.)
- Business Description

#### Step 3: Required Documents
- Professional License/Certification
- Liability Insurance Certificate
- Business License (if applicable)

#### Step 4: Verification & Agreement
- Background Check Consent
- Terms of Service Agreement
- Privacy Policy Agreement

### What Happens After Phase 1:
1. Application submitted for review
2. Background check and document verification (2-3 business days)
3. Admin approval/rejection decision
4. Email sent with approval result
5. If approved: Secure link sent for Phase 2

## Phase 2: Financial Onboarding (Post-Approval)

**Goal:** Complete financial setup and activate provider account
**Route:** `/provider-application/phase2?token=APPROVAL_TOKEN`
**File:** `client/pages/ProviderApplicationPhase2.tsx`

### Steps in Phase 2:

#### Step 1: Identity Verification
- Stripe Identity verification (full KYC)
- Government ID verification
- Identity confirmation

#### Step 2: Tax & Banking Setup
- Tax information (SSN/EIN)
- W-9 completion
- Plaid bank account connection
- Stripe Connect account creation

#### Step 3: Service Configuration
- Detailed pricing setup
- Service-specific rates
- Mobile/travel fees
- Service area configuration

#### Step 4: Profile & Availability
- Detailed bio and profile completion
- Professional photos upload
- Initial availability setup
- Specialization details

#### Step 5: Platform Activation
- Final review and confirmation
- Account activation
- Redirect to provider dashboard

## Technical Implementation

### Security Features:
- **Approval Token:** Phase 2 requires a secure token from approval email
- **Identity Verification:** Full Stripe Identity KYC process
- **Bank Verification:** Plaid secure bank account connection
- **Document Security:** Encrypted document storage

### Integration Points:
- **Stripe Identity:** For KYC verification
- **Plaid:** For bank account connection
- **Stripe Connect:** For payout processing
- **Background Check API:** For criminal history verification

### Database Schema Considerations:
```sql
-- Provider Applications (Phase 1)
provider_applications (
  id, email, first_name, last_name, business_name,
  business_type, services_offered, status, documents,
  submitted_at, reviewed_at, approval_token
)

-- Provider Accounts (Phase 2 Complete)
provider_accounts (
  id, application_id, user_id, stripe_account_id,
  plaid_account_id, onboarding_complete, activated_at
)
```

## User Experience Flow

### For New Providers:
1. Visit `/provider-portal`
2. Click "Get Started" → redirects to Phase 1
3. Complete 4-step application
4. Receive "Application Submitted" confirmation
5. Wait for approval email (2-3 days)
6. Click secure link in approval email → Phase 2
7. Complete financial setup
8. Account activated → access dashboard

### Email Notifications:
- **Application Received:** Confirmation after Phase 1
- **Approval Email:** Contains secure Phase 2 link
- **Setup Complete:** Welcome to platform
- **Rejection Email:** Feedback and reapplication process

## Benefits of Two-Phase Approach

### For Providers:
- ✅ Faster initial application (5-10 minutes)
- ✅ No financial setup until approved
- ✅ Clear expectations and timeline
- ✅ Secure financial data handling

### For Platform:
- ✅ Screen candidates before KYC costs
- ✅ Reduce fraudulent applications
- ✅ Better approval workflow
- ✅ Compliance with financial regulations

### For Customers:
- ✅ Higher quality, vetted providers
- ✅ Verified financial accounts
- ✅ Professional service standards

## Migration Notes

The existing `ProviderOnboarding.tsx` remains available for testing, but new applications should use the two-phase system. The `ProviderPortal.tsx` now directs new signups to Phase 1.

## Next Steps

1. **Backend API Development:** Create endpoints for both phases
2. **Email System:** Setup approval/rejection email templates
3. **Admin Dashboard:** Create approval workflow interface
4. **Testing:** End-to-end testing of both phases
5. **Documentation:** API documentation for integrations

This system provides a much more logical and user-friendly provider onboarding experience while maintaining security and compliance requirements.
