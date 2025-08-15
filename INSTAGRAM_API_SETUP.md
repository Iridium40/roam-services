# Instagram Basic Display API Setup Guide

## Overview

The Instagram feed is now configured to use the Instagram Basic Display API to fetch real posts from your account @roam_yourbestlife. If the API is not configured, it will fall back to mock content.

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" as the app type
4. Fill in app details:
   - **App Name**: ROAM Instagram Feed
   - **App Contact Email**: your-email@domain.com

## Step 2: Add Instagram Basic Display Product

1. In your Facebook app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display

## Step 3: Create Instagram App

1. In the Instagram Basic Display settings:
   - Click "Create New App"
   - **Display Name**: ROAM Instagram Feed
   - Click "Create App"

## Step 4: Add Instagram Test User

1. Still in Instagram Basic Display settings
2. Go to "Roles" → "Instagram Testers"
3. Add your Instagram account (@roam_yourbestlife)
4. Accept the invite in your Instagram app settings

## Step 5: Configure OAuth Redirect

1. In Instagram Basic Display → Basic Display
2. Find "Instagram App Secret" and note it down
3. Add OAuth Redirect URI:
   ```
   https://your-domain.vercel.app/auth/instagram/callback
   https://localhost:3000/auth/instagram/callback (for development)
   ```

## Step 6: Generate Access Token

1. Use this URL format to get authorization code:

```
https://api.instagram.com/oauth/authorize?client_id={app-id}&redirect_uri={redirect-uri}&scope=user_profile,user_media&response_type=code
```

2. Replace with your values:

   - `{app-id}`: Your Instagram App ID
   - `{redirect-uri}`: Your redirect URI (URL encoded)

3. Visit the URL and authorize your app
4. Instagram will redirect with a code parameter

## Step 7: Exchange Code for Access Token

Make a POST request to exchange the authorization code:

```bash
curl -X POST \
  https://api.instagram.com/oauth/access_token \
  -F client_id={app-id} \
  -F client_secret={app-secret} \
  -F grant_type=authorization_code \
  -F redirect_uri={redirect-uri} \
  -F code={authorization-code}
```

This returns a short-lived access token.

## Step 8: Get Long-Lived Access Token

Exchange the short-lived token for a long-lived one (60 days):

```bash
curl -i -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={app-secret}&access_token={short-lived-token}"
```

## Step 9: Configure Environment Variables

Add to your Vercel environment variables:

```env
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
```

## Step 10: Test the Integration

1. Deploy to Vercel with the environment variable
2. The Instagram feed should now show real posts
3. Check the data source indicator shows "Live Instagram API"

## Refreshing Access Tokens

Long-lived tokens expire after 60 days. To refresh:

```bash
curl -i -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token={current-token}"
```

## Troubleshooting

### Common Issues:

1. **"Invalid OAuth access token"**

   - Token expired (refresh it)
   - Wrong token format
   - App not properly configured

2. **"Instagram API returned 400"**

   - Check app permissions
   - Verify Instagram account is added as tester
   - Confirm redirect URI matches

3. **CORS errors**
   - API endpoint handles CORS automatically
   - Ensure requests go through `/api/instagram-feed`

### Fallback Behavior:

The app gracefully handles API failures:

- Shows loading spinner during fetch
- Displays error message with retry button
- Falls back to mock content if API unavailable
- Always provides link to visit Instagram directly

## API Endpoints

- **Instagram API**: `https://graph.instagram.com/me/media`
- **Your App API**: `/api/instagram-feed`
- **Instagram Profile**: `https://www.instagram.com/roam_yourbestlife/`

## Rate Limits

- **Basic Display API**: 200 requests per hour per user
- **Recommendation**: Cache responses for 1 hour minimum
- **Current Implementation**: No caching (can be added)

## Security Notes

- Keep your App Secret secure
- Use environment variables for tokens
- Refresh tokens before expiration
- Monitor API usage in Facebook Developer Console
