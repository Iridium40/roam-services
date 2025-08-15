import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleCreateLinkToken, handleExchangeToken } from "./routes/plaid";
import { handleFileUpload, uploadDocument } from "./routes/upload";
import { createPaymentIntent } from "./routes/payment";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Plaid integration routes
  app.post("/api/plaid/create-link-token", handleCreateLinkToken);
  app.post("/api/plaid/exchange-token", handleExchangeToken);

  // File upload route
  app.post("/api/upload-document", handleFileUpload, uploadDocument);

  // Payment routes
  app.post("/api/create-payment-intent", createPaymentIntent);

  return app;
}
