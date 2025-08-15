import { createClient } from '@supabase/supabase-js';

// Plaid configuration
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || "670d967ef5ca2b001925eee0";
const PLAID_SECRET = process.env.PLAID_SECRET || "b5caf79d242c0fd40a939924c8ef96";
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PlaidExchangeRequest {
  public_token: string;
  business_id: string;
  account_id?: string;
  institution?: any;
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

    const { public_token, business_id, account_id, institution }: PlaidExchangeRequest = await req.json();

    console.log("Exchanging Plaid public token for:", {
      business_id,
      account_id,
      institution,
    });

    // Exchange public token for access token
    const exchangeRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      public_token: public_token,
    };

    const plaidApiUrl = PLAID_ENV === 'production' 
      ? "https://production.plaid.com/link/token/exchange"
      : "https://sandbox.plaid.com/link/token/exchange";

    const exchangeResponse = await fetch(plaidApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exchangeRequest),
    });

    if (!exchangeResponse.ok) {
      const errorData = await exchangeResponse.json();
      console.error("Plaid Exchange Error:", errorData);
      return new Response(JSON.stringify({
        error: "Failed to exchange public token",
        details: errorData,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const exchangeData = await exchangeResponse.json();

    // Get account details
    const accountRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: exchangeData.access_token,
    };

    const accountApiUrl = PLAID_ENV === 'production' 
      ? "https://production.plaid.com/accounts/get"
      : "https://sandbox.plaid.com/accounts/get";

    const accountResponse = await fetch(accountApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountRequest),
    });

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      console.error("Plaid Account Error:", errorData);
      return new Response(JSON.stringify({
        error: "Failed to get account details",
        details: errorData,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accountData = await accountResponse.json();

    // Store bank account information in Supabase
    try {
      const { error: insertError } = await supabase
        .from('provider_bank_accounts')
        .upsert({
          user_id: user.id,
          business_id: business_id,
          plaid_access_token: exchangeData.access_token,
          plaid_item_id: exchangeData.item_id,
          account_data: accountData.accounts,
          institution_data: institution,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error storing bank account data:', insertError);
        // Continue anyway, as the Plaid connection was successful
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway, as the Plaid connection was successful
    }

    // TODO: Here you would integrate with Stripe to create an external account
    // and save the bank account information to your database

    return new Response(JSON.stringify({
      success: true,
      access_token: exchangeData.access_token,
      item_id: exchangeData.item_id,
      accounts: accountData.accounts,
      message: "Bank account connected successfully",
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Plaid Exchange Error:", error);
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
