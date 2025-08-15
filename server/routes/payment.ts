import { RequestHandler } from "express";
import Stripe from "stripe";

export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    console.log("💳 Payment Intent Request:", {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    const {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName,
    } = req.body;

    console.log("💳 Extracted values:", {
      bookingId,
      totalAmount,
      serviceFee,
      customerEmail,
      customerName,
      businessName,
      serviceName,
    });

    if (!bookingId || !totalAmount || !customerEmail) {
      console.log("❌ Missing required fields:", {
        bookingId,
        totalAmount,
        customerEmail,
      });
      return res.status(400).json({
        error: "Booking ID, total amount, and customer email are required",
      });
    }

    // Validate totalAmount is a number
    const amount =
      typeof totalAmount === "string" ? parseFloat(totalAmount) : totalAmount;
    if (isNaN(amount) || amount <= 0) {
      console.log("❌ Invalid amount:", { totalAmount, parsedAmount: amount });
      return res.status(400).json({
        error: "Total amount must be a valid positive number",
      });
    }

    // Check if Stripe secret key is available
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log("❌ Stripe secret key not configured");
      return res.status(500).json({
        error:
          "Stripe secret key not configured. Please set STRIPE_SECRET_KEY environment variable.",
      });
    }

    console.log("✅ Stripe secret key is configured");

    // Initialize Stripe with proper ES import
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    });

    // Convert to cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(amount * 100);
    console.log("💰 Amount calculation:", {
      originalAmount: amount,
      amountInCents,
    });

    // Create payment intent
    console.log("🚀 Creating payment intent with Stripe...");
    console.log(
      "🍎 Apple Pay should be available with automatic_payment_methods enabled",
    );
    const paymentIntent = await stripe.paymentIntents.create({
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
      },
      description: `Booking payment for ${serviceName || "service"} at ${businessName || "business"}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    console.log("✅ Payment intent created successfully:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      automatic_payment_methods: paymentIntent.automatic_payment_methods,
      payment_method_types: paymentIntent.payment_method_types,
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: "usd",
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      error: "Failed to create payment intent",
      details: error.message,
    });
  }
};
