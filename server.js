const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const { storage } = require("./storage");
const handler = require("./handler");
const { uploadSession, downloadSession } = require("./sessionStorage");

class BotManager {
  constructor() {
    this.instances = new Map();
    this.maxReconnectAttempts = 5;
    this.authDir = path.join(process.cwd(), "sessions");
    fs.ensureDirSync(this.authDir);
  }

  getInstance(userId = "default") {
    if (!this.instances.has(userId)) {
      this.instances.set(userId, {
        sock: null,
        qr: null,
        pairingCode: null,
        status: "offline",
        reconnectAttempts: 0,
      });
    }
    return this.instances.get(userId);
  }

  getStatus(userId = "default") {
    const instance = this.getInstance(userId);
    return {
      status: instance.status,
      qr: instance.qr,
      pairingCode: instance.pairingCode,
      uptime: process.uptime(),
      currentUserId: userId === "default" ? null : userId,
      linkedWhatsAppNumber: instance.sock?.user?.id?.split(":")[0] || null
    };
  }

  async start(phoneNumber, forceNewSession = false, userId = "default") {
    const instance = this.getInstance(userId);
    if (instance.status === "online" || instance.status === "starting") return;
    
    instance.status = "starting";
    instance.pairingCode = null;
    instance.qr = null;
    
    try {
      const userAuthDir = userId === "default" ? this.authDir : path.join(this.authDir, userId);
      let sessionExists = false;

      if (!forceNewSession) {
        sessionExists = await downloadSession(userId, this.authDir);
      } else {
        sessionExists = await fs.pathExists(path.join(userAuthDir, 'creds.json'));
      }

      if (sessionExists) {
        this.log(userId, "info", "Session found");
      } else {
        this.log(userId, "info", "No session found. Please link bot.");
        if (forceNewSession) {
          await fs.remove(userAuthDir);
        }
      }

      await fs.ensureDir(userAuthDir);

      const { state, saveCreds } = await useMultiFileAuthState(userAuthDir);
      const { version } = await fetchLatestBaileysVersion();

      instance.sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        syncFullHistory: false,
      });

      instance.sock.ev.on("creds.update", async () => {
        await saveCreds();
        await uploadSession(userId, this.authDir);
      });

      if (!instance.sock.authState.creds.registered) {
        if (phoneNumber) {
          setTimeout(async () => {
            try {
              if (instance.sock && !instance.sock.authState.creds.registered) {
                const code = await instance.sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
                instance.pairingCode = code?.match(/.{1,4}/g)?.join("-") || code || null;
                this.log(userId, "info", `Pairing code generated: ${instance.pairingCode}`);
                instance.qr = null;
              }
            } catch (err) {
              this.log(userId, "error", `Failed to generate pairing code: ${err}`);
            }
          }, 3000);
        }
      }

      instance.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          instance.qr = qr;
        }

        if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.connectionReplaced;

          this.log(userId, "warn", `Connection closed: ${statusCode}, reconnecting: ${shouldReconnect}`);
          instance.status = "offline";
          instance.qr = null;
          instance.pairingCode = null;

          if (shouldReconnect) {
            setTimeout(() => this.start(undefined, false, userId), 5000);
          } else if (statusCode === DisconnectReason.loggedOut) {
            await fs.remove(userAuthDir);
            instance.sock = null;
          }
        } else if (connection === "open") {
          instance.status = "online";
          instance.qr = null;
          instance.reconnectAttempts = 0;
          
          const user = instance.sock?.user;
          const connectedNumber = user?.id?.split(":")[0] || "Unknown";
          this.log(userId, "info", `Connected to WhatsApp: ${connectedNumber}`);
          
          if (user) {
            if (userId !== "default") {
              await storage.updateUserSession(userId, { linkedWhatsAppNumber: connectedNumber, botActiveStatus: true });
              await storage.updateUserSettings(userId, { ownerNumber: connectedNumber });
            } else {
              await storage.updateSettings({ ownerNumber: connectedNumber });
            }
          }
        }
      });

      instance.sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (instance.sock && !msg.key.fromMe) {
              await handler.handleMessage(instance.sock, msg, userId).catch(console.error);
            }
          }
        }
      });

    } catch (err) {
      this.log(userId, "error", `Failed to start bot: ${err.message}`);
      instance.status = "error";
    }
  }

  async stop(userId = "default") {
    const instance = this.getInstance(userId);
    if (instance.sock) {
      instance.sock.end(undefined);
      instance.sock = null;
      instance.status = "offline";
      instance.qr = null;
      this.log(userId, "info", "Bot stopped.");
    }
  }

  async logout(userId = "default") {
    const instance = this.getInstance(userId);
    if (instance.sock) {
      await instance.sock.logout();
      instance.sock = null;
      instance.status = "offline";
      instance.qr = null;
      const userDir = userId === "default" ? this.authDir : path.join(this.authDir, userId);
      await fs.remove(userDir);
      this.log(userId, "info", "Logged out and session cleared.");
    }
  }

  logListeners = new Map();

  subscribeLogs(userId, listener) {
    if (!this.logListeners.has(userId)) {
      this.logListeners.set(userId, new Set());
    }
    this.logListeners.get(userId).add(listener);
    return () => {
      this.logListeners.get(userId)?.delete(listener);
    };
  }

  async log(userId, level, message) {
    const logData = { level, message, timestamp: new Date().toISOString(), userId };
    console.log(`[${userId.toUpperCase()}] [${level.toUpperCase()}] ${message}`);
    await storage.addUserLog(userId, level, message);
    const listeners = this.logListeners.get(userId);
    if (listeners) {
      listeners.forEach(listener => listener(logData));
    }
  }
}

const botManager = new BotManager();

// Express API Server Integration
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

app.post('/link/qr', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  await botManager.start(null, false, userId);
  res.json({ success: true, message: "Instance starting, check status for QR" });
});

app.post('/link/code', async (req, res) => {
  const { userId, phone } = req.body;
  if (!userId || !phone) return res.status(400).json({ error: 'userId and phone required' });
  await botManager.start(phone, true, userId);
  res.json({ success: true, message: "Pairing code requested" });
});

app.get('/status', (req, res) => {
  const { userId } = req.query;
  res.json(botManager.getStatus(userId || "default"));
});

app.post('/disconnect', async (req, res) => {
  const { userId } = req.body;
  await botManager.logout(userId || "default");
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { botManager };
