import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { bossBotClient } from "./bossBotClient";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cors());

  // Bot Status
  app.get(api.bot.status.path, async (req, res) => {
    const userId = (req.query.userId as string) || "default";
    try {
      const status = await bossBotClient.getStatus(userId);
      res.json(status);
    } catch (err: any) {
      res.json({ connected: false, status: "disconnected", error: err.message });
    }
  });

  // Bot Actions
  app.post(api.bot.action.path, async (req, res) => {
    const { action, phoneNumber, userId } = req.body;
    try {
      if (!action) {
        return res.status(400).json({ message: "Action is required" });
      }

      switch (action) {
        case "start":
          // For QR linking
          const qrData = await bossBotClient.linkQR(userId || "default");
          res.json({ success: true, qr: qrData.qr });
          break;
        case "link-code":
          if (!phoneNumber) {
            return res.status(400).json({ message: "Phone number is required for pairing code" });
          }
          const codeData = await bossBotClient.linkCode(userId || "default", phoneNumber);
          res.json({ success: true, code: codeData.code });
          break;
        case "stop":
        case "logout":
          await bossBotClient.disconnect(userId || "default");
          res.json({ success: true, message: "Bot disconnected." });
          break;
        default:
          res.status(400).json({ message: `Invalid action: ${action}` });
      }
    } catch (err: any) {
      log(`Action error: ${err.message}`, "error");
      res.status(500).json({ message: err.message || "An unexpected error occurred" });
    }
  });

  // Send Message
  app.post("/api/bot/send", async (req, res) => {
    const { userId, to, message } = req.body;
    try {
      const result = await bossBotClient.sendMessage(userId || "default", to, message);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Logs (Legacy endpoint - returns from in-memory)
  app.get(api.bot.logs.path, async (req, res) => {
    const userId = (req.query.userId as string) || "default";
    const logs = await storage.getUserLogs(userId);
    res.json(logs);
  });

  // Clear Logs
  app.delete("/api/bot/logs", async (req, res) => {
    const userId = req.query.userId as string;
    try {
      if (userId) {
        await storage.clearUserLogs(userId);
      } else {
        await storage.clearLogs();
      }
      res.json({ success: true, message: "Logs cleared." });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Settings
  app.get(api.settings.get.path, async (req, res) => {
    const userId = req.query.userId as string;
    const settings = userId ? await storage.getUserSettings(userId) : await storage.getSettings();
    res.json(settings);
  });

  app.patch(api.settings.update.path, async (req, res) => {
    const userId = req.query.userId as string;
    const input = api.settings.update.input.parse(req.body);
    const settings = userId ? await storage.updateUserSettings(userId, input) : await storage.updateSettings(input);
    res.json(settings);
  });

  // Seed default settings on startup
  await storage.getSettings();

  return httpServer;
}
