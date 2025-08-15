import { Request, Response } from "express";

// Plaid configuration using provided credentials
const PLAID_CLIENT_ID = "670d967ef5ca2b001925eee0";
const PLAID_SECRET = "b5caf79d242c0fd40a939924c8ef96";
const PLAID_ENV = "sandbox"; // Change to 'production' for live

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

export const handleCreateLinkToken = async (req: Request, res: Response) => {
  try {
    const { business_id, user_id, business_name } = req.body;

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
      webhook: `${process.env.URL || "https://your-domain.com"}/api/plaid/webhook`,
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
    const plaidResponse = await fetch(
      "https://sandbox.plaid.com/link/token/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(linkTokenRequest),
      },
    );

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

      return res.status(400).json({
        error: "Failed to create Plaid link token",
        details: errorData,
        status: plaidResponse.status,
        statusText: plaidResponse.statusText,
      });
    }

    const plaidData: PlaidLinkTokenResponse = await plaidResponse.json();
    console.log("Plaid link token created successfully:", plaidData.request_id);

    return res.json({
      link_token: plaidData.link_token,
      expiration: plaidData.expiration,
      request_id: plaidData.request_id,
    });
  } catch (error) {
    console.error("Plaid Integration Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleExchangeToken = async (req: Request, res: Response) => {
  try {
    const { public_token, business_id, account_id, institution } = req.body;

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

    const exchangeResponse = await fetch(
      "https://sandbox.plaid.com/link/token/exchange",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exchangeRequest),
      },
    );

    if (!exchangeResponse.ok) {
      const errorData = await exchangeResponse.json();
      console.error("Plaid Exchange Error:", errorData);
      return res.status(400).json({
        error: "Failed to exchange public token",
        details: errorData,
      });
    }

    const exchangeData = await exchangeResponse.json();

    // Get account details
    const accountRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: exchangeData.access_token,
    };

    const accountResponse = await fetch(
      "https://sandbox.plaid.com/accounts/get",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountRequest),
      },
    );

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      console.error("Plaid Account Error:", errorData);
      return res.status(400).json({
        error: "Failed to get account details",
        details: errorData,
      });
    }

    const accountData = await accountResponse.json();

    // TODO: Here you would integrate with Stripe to create an external account
    // and save the bank account information to your database

    return res.json({
      success: true,
      access_token: exchangeData.access_token,
      item_id: exchangeData.item_id,
      accounts: accountData.accounts,
      message: "Bank account connected successfully",
    });
  } catch (error) {
    console.error("Plaid Exchange Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
