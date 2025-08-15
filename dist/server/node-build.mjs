import path from "path";
import "dotenv/config";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import Stripe from "stripe";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const PLAID_CLIENT_ID = "670d967ef5ca2b001925eee0";
const PLAID_SECRET = "b5caf79d242c0fd40a939924c8ef96";
const handleCreateLinkToken = async (req, res) => {
  try {
    const { business_id, user_id, business_name } = req.body;
    console.log("Creating Plaid link token for:", {
      business_id,
      user_id,
      business_name
    });
    const linkTokenRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      user: {
        // This should correspond to a unique id for the current user
        client_user_id: user_id || `user_${business_id}`
      },
      client_name: business_name || "ROAM Business",
      products: ["auth"],
      language: "en",
      webhook: `${process.env.URL || "https://your-domain.com"}/api/plaid/webhook`,
      redirect_uri: null,
      // Not needed for web integration
      country_codes: ["US"],
      account_filters: {
        depository: {
          account_subtypes: ["checking", "savings"]
        }
      }
    };
    console.log(
      "Sending request to Plaid:",
      JSON.stringify(linkTokenRequest, null, 2)
    );
    const plaidResponse = await fetch(
      "https://sandbox.plaid.com/link/token/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(linkTokenRequest)
      }
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
        statusText: plaidResponse.statusText
      });
    }
    const plaidData = await plaidResponse.json();
    console.log("Plaid link token created successfully:", plaidData.request_id);
    return res.json({
      link_token: plaidData.link_token,
      expiration: plaidData.expiration,
      request_id: plaidData.request_id
    });
  } catch (error) {
    console.error("Plaid Integration Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const handleExchangeToken = async (req, res) => {
  try {
    const { public_token, business_id, account_id, institution } = req.body;
    console.log("Exchanging Plaid public token for:", {
      business_id,
      account_id,
      institution
    });
    const exchangeRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      public_token
    };
    const exchangeResponse = await fetch(
      "https://sandbox.plaid.com/link/token/exchange",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(exchangeRequest)
      }
    );
    if (!exchangeResponse.ok) {
      const errorData = await exchangeResponse.json();
      console.error("Plaid Exchange Error:", errorData);
      return res.status(400).json({
        error: "Failed to exchange public token",
        details: errorData
      });
    }
    const exchangeData = await exchangeResponse.json();
    const accountRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: exchangeData.access_token
    };
    const accountResponse = await fetch(
      "https://sandbox.plaid.com/accounts/get",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(accountRequest)
      }
    );
    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      console.error("Plaid Account Error:", errorData);
      return res.status(400).json({
        error: "Failed to get account details",
        details: errorData
      });
    }
    const accountData = await accountResponse.json();
    return res.json({
      success: true,
      access_token: exchangeData.access_token,
      item_id: exchangeData.item_id,
      accounts: accountData.accounts,
      message: "Bank account connected successfully"
    });
  } catch (error) {
    console.error("Plaid Exchange Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
  // 50MB limit
});
const handleFileUpload = upload.single("file");
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `business-documents/${fileName}`;
    const { data, error } = await supabase.storage.from("roam-file-storage").upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      cacheControl: "3600",
      upsert: false
    });
    if (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: error.message });
    }
    const {
      data: { publicUrl }
    } = supabase.storage.from("roam-file-storage").getPublicUrl(filePath);
    res.json({
      success: true,
      publicUrl,
      filePath: data.path
    });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
};
const createPaymentIntent = async (req, res) => {
  try {
    console.log("💳 Payment Intent Request:", {
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    const {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName
    } = req.body;
    console.log("💳 Extracted values:", {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName
    });
    if (!bookingId || !totalAmount || !customerEmail) {
      console.log("❌ Missing required fields:", {
        bookingId,
        totalAmount,
        customerEmail
      });
      return res.status(400).json({
        error: "Booking ID, total amount, and customer email are required"
      });
    }
    const amount = typeof totalAmount === "string" ? parseFloat(totalAmount) : totalAmount;
    if (isNaN(amount) || amount <= 0) {
      console.log("❌ Invalid amount:", { totalAmount, parsedAmount: amount });
      return res.status(400).json({
        error: "Total amount must be a valid positive number"
      });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log("❌ Stripe secret key not configured");
      return res.status(500).json({
        error: "Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable."
      });
    }
    console.log("✅ Stripe secret key is configured");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia"
    });
    const amountInCents = Math.round(amount * 100);
    console.log("💰 Amount calculation:", {
      originalAmount: amount,
      amountInCents
    });
    console.log("🚀 Creating payment intent with Stripe...");
    console.log(
      "🍎 Apple Pay should be available with automatic_payment_methods enabled"
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        booking_id: bookingId,
        service_fee: serviceFee ? (parseFloat(serviceFee) * 100).toString() : "0",
        customer_name: customerName || "",
        customer_email: customerEmail || "",
        business_name: businessName || "",
        service_name: serviceName || "",
        payment_type: "booking_payment"
      },
      description: `Booking payment for ${serviceName || "service"} at ${businessName || "business"}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never"
      }
    });
    console.log("✅ Payment intent created successfully:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      automatic_payment_methods: paymentIntent.automatic_payment_methods,
      payment_method_types: paymentIntent.payment_method_types
    });
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency: "usd"
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      error: "Failed to create payment intent",
      details: error.message
    });
  }
};
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json());
  app2.use(express__default.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  app2.post("/api/plaid/create-link-token", handleCreateLinkToken);
  app2.post("/api/plaid/exchange-token", handleExchangeToken);
  app2.post("/api/upload-document", handleFileUpload, uploadDocument);
  app2.post("/api/create-payment-intent", createPaymentIntent);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
