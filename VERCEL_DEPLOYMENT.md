# Vercel Deployment Guide

## Environment Variables Setup

When deploying to Vercel, make sure to set these environment variables in your Vercel dashboard:

### Required Environment Variables:
```
VITE_SUPABASE_URL=https://vssomyuyhicaxsgiaupo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=332905057054-k2ft4b7nadjgm62qoiseg7r6n8rt18co.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDuTYClctxxl_cq2Hr8gKbuOY-1-t4bqfw
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RtWP3CpMcwgGgU0aiye0NpwchvfsZlO9Wf8iQx6rgd6tsSt3DTr7QREn46PMPTyubYfmxLWjT5jCUK83DmBlT5t00D3zTLJLM
STRIPE_SECRET_KEY=sk_test_51RtWP3CpMcwgGgU0W9cVUXv3hl0rLkVjUgbfjrfObtBDPtXcvzuGwjE2A9gLROgfaDhBBAQ0r6zq64VFShGh7fkd00CsOrSm1H
GOOGLE_CLIENT_SECRET=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
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Configuration

### Content Security Policy (CSP)
The app includes CSP headers to allow Stripe, Google APIs, and Supabase:
- Stripe domains: `js.stripe.com`, `api.stripe.com`, `hooks.stripe.com`
- Google domains: `accounts.google.com`, `apis.google.com`, `maps.googleapis.com`
- Supabase: `vssomyuyhicaxsgiaupo.supabase.co`

### Files Updated for Vercel:
1. `vercel.json` - Vercel configuration with headers and rewrites
2. `public/_headers` - Additional header configuration
3. `index.html` - Updated CSP meta tags
4. `vite.config.ts` - Optimized build configuration
5. `api/create-payment-intent.ts` - Vercel API function

## Troubleshooting CSS/Stripe Issues

### Common Issues:
1. **CSS not loading**: Usually due to CSP blocking inline styles
   - Solution: CSP includes `'unsafe-inline'` for styles
   
2. **Stripe not loading**: CSP blocking Stripe scripts
   - Solution: Added `https://js.stripe.com` to script-src
   
3. **Payment API failures**: Missing environment variables
   - Solution: Ensure `STRIPE_SECRET_KEY` is set in Vercel dashboard

### Debugging Steps:
1. Check browser console for CSP violations
2. Verify environment variables are set in Vercel dashboard
3. Check Network tab for failed API requests
4. Ensure Stripe domains are allowlisted in CSP

## Deployment Command

```bash
# Build and deploy
npm run build
vercel --prod

# Or use Vercel Git integration for automatic deployments
```

## Development vs Production

- **Development**: Uses Express server fallback for API routes
- **Production**: Uses Vercel API functions
- **Mock Mode**: Automatically enabled when Stripe fails to load

## Domain Configuration

Update these services with your Vercel domain:
1. **Google OAuth**: Add Vercel domain to authorized origins
2. **Stripe**: Add domain to allowed domains
3. **Supabase**: Update CORS settings if needed
