import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleAuth } from "./routes/auth";

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

  // Auth routes
  app.post("/api/auth/register", handleAuth);
  app.post("/api/auth/login", handleAuth);
  app.post("/api/auth/verify", handleAuth);

  // Note: For a local Express server, we use in-memory storage since Cloudflare D1 is not available
  // To use database features, deploy to Cloudflare Workers with D1
  app.get("/api/transactions", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  app.post("/api/transactions", (_req, res) => {
    res.json({ success: true, message: "Use database by deploying to Cloudflare" });
  });

  app.get("/api/categories", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  app.get("/api/investments", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  app.get("/api/goals", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  app.get("/api/budget/divisions", (_req, res) => {
    res.json({ success: true, data: [] });
  });

  return app;
}
