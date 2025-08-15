import { createClient } from '@supabase/supabase-js';

// Plaid configuration
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || "670d967ef5ca2b001925eee0";
const PLAID_SECRET = process.env.PLAID_SECRET || "b5caf79d242c0fd40a939924c8ef96";
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PlaidLinkTokenRequest {
  business_id: string;
  user_id: string;
  business_name: string;
}

interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { business_id, user_id, business_name }: PlaidLinkTokenRequest = await req.json();

    // Validate that the user_id matches the authenticated user
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log("Creating Plaid link token for:", {
      business_id,
      user_id,
      business_name,
    });

    // Create Plaid Link Token following proper API structure
    const linkTokenRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      user: {
        // This should correspond to a unique id for the current user
        client_user_id: user_id || `user_${business_id}`,
      },
      client_name: business_name || "ROAM Business",
      products: ["auth"],
      language: "en",
      webhook: `${new URL(req.url).origin}/api/plaid/webhook`,
      redirect_uri: null, // Not needed for web integration
      country_codes: ["US"],
      account_filters: {
        depository: {
          account_subtypes: ["checking", "savings"],
        },
      },
    };

    console.log(
      "Sending request to Plaid:",
      JSON.stringify(linkTokenRequest, null, 2),
    );

    // Call Plaid API to create link token
    const plaidApiUrl = PLAID_ENV === 'production' 
      ? "https://production.plaid.com/link/token/create"
      : "https://sandbox.plaid.com/link/token/create";

    const plaidResponse = await fetch(plaidApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(linkTokenRequest),
    });

    console.log("Plaid response status:", plaidResponse.status);

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text();
      console.error("Plaid API Error Response:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }

      return new Response(JSON.stringify({
        error: "Failed to create Plaid link token",
        details: errorData,
        status: plaidResponse.status,
        statusText: plaidResponse.statusText,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const plaidData: PlaidLinkTokenResponse = await plaidResponse.json();
    console.log("Plaid link token created successfully:", plaidData.request_id);

    return new Response(JSON.stringify({
      link_token: plaidData.link_token,
      expiration: plaidData.expiration,
      request_id: plaidData.request_id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Plaid Integration Error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  runtime: 'edge',
};
