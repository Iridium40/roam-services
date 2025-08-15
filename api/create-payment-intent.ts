import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName,
    } = body;

    if (!bookingId || !totalAmount || !customerEmail) {
      return res.status(400).json({
        error: "Booking ID, total amount, and customer email are required",
      });
    }

    // Ensure totalAmount is a valid number
    const amount =
      typeof totalAmount === "string" ? parseFloat(totalAmount) : totalAmount;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Total amount must be a valid positive number",
      });
    }

    // Check if Stripe secret key is available
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({
        error:
          "Stripe secret key not configured. Please check environment variables.",
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-07-30.basil",
    });

    // Convert to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(amount * 100);

    // Create or retrieve Stripe customer
    let stripeCustomer;
    try {
      // First, try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomer = existingCustomers.data[0];
      } else {
        // Create new Stripe customer
        stripeCustomer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            booking_id: bookingId,
            source: "roam_booking_platform",
          },
        });
      }
    } catch (error) {
      console.error("Error creating/retrieving Stripe customer:", error);
      // Continue without customer if there's an error
      stripeCustomer = null;
    }

    // Create payment intent
    const paymentIntentData: any = {
      amount: amountInCents,
      currency: "usd",
      metadata: {
        booking_id: bookingId,
        service_fee: serviceFee
          ? (parseFloat(serviceFee) * 100).toString()
          : "0",
        customer_name: customerName || "",
        customer_email: customerEmail || "",
        business_name: businessName || "",
        service_name: serviceName || "",
        payment_type: "booking_payment",
        stripe_customer_id: stripeCustomer?.id || "",
      },
      description: `Booking payment for ${serviceName || "service"} at ${businessName || "business"}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    };

    // Associate with Stripe customer if available
    if (stripeCustomer) {
      paymentIntentData.customer = stripeCustomer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeCustomerId: stripeCustomer?.id || null,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return res.status(500).json({
      error: "Failed to create payment intent",
      details: error.message,
    });
  }
}
