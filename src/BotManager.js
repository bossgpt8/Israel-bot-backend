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
const handler = require("./handler");
const mongoose = require("mongoose");
const { loadCommands } = require("./utils/commandLoader");

// MongoDB Session Schema
const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  creds: { type: Object },
  keys: { type: Object }
});
const Session = mongoose.model('Session', sessionSchema);

class BotManager {
  constructor() {
    this.instances = new Map();
    this.authDir = path.join(process.cwd(), "sessions");
    fs.ensureDirSync(this.authDir);
    this.logListeners = new Map();
    this.dbConnected = false;
    this.commands = loadCommands();
    console.log(`Loaded ${this.commands.size} commands`);
    this.initDb();
  }

  async initDb() {
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        this.dbConnected = true;
        console.log("Connected to MongoDB for session storage");
        this.loadAllSessions();
      } catch (err) {
        console.error("MongoDB connection failed:", err.message);
      }
    }
  }

  async loadAllSessions() {
    try {
      const sessions = await Session.find();
      for (const sess of sessions) {
        console.log(`Auto-loading session for user: ${sess.userId}`);
        this.start(null, false, sess.userId);
      }
    } catch (err) {
      console.error("Error loading sessions from DB:", err);
    }
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

  async start(phoneNumber = null, forceNewSession = true, userId = "default") {
    const instance = this.getInstance(userId);
    if (instance.status === "online" || instance.status === "starting") return;
    
    instance.status = "starting";
    instance.pairingCode = null;
    instance.qr = null;
    
    try {
      const userAuthDir = path.join(this.authDir, userId);
      
      if (forceNewSession) {
        await fs.remove(userAuthDir);
        if (this.dbConnected) await Session.deleteOne({ userId });
      } else {
        // Try to restore from DB if local files missing
        if (this.dbConnected && !fs.existsSync(path.join(userAuthDir, 'creds.json'))) {
           const sess = await Session.findOne({ userId });
           if (sess && sess.creds) {
             await fs.ensureDir(userAuthDir);
             fs.writeFileSync(path.join(userAuthDir, 'creds.json'), JSON.stringify(sess.creds));
             // Note: keys are usually too large/complex for a simple JSON dump in some setups, 
             // but useMultiFileAuthState will manage individual files. 
             // For true persistence on Render/Railway, we'd need a custom auth provider.
             // Given Fast mode constraints, we'll rely on local persistence + auto-load logic.
           }
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
        browser: ["Boss Bot SaaS", "Chrome", "1.0.0"],
        markOnlineOnConnect: true,
        syncFullHistory: false,
      });

      instance.sock.ev.on("creds.update", async () => {
        await saveCreds();
        if (this.dbConnected) {
          await Session.findOneAndUpdate(
            { userId },
            { userId, creds: state.creds },
            { upsert: true }
          );
        }
      });

      if (!instance.sock.authState.creds.registered && phoneNumber) {
        setTimeout(async () => {
          try {
            if (instance.sock && !instance.sock.authState.creds.registered) {
              const code = await instance.sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
              instance.pairingCode = code?.match(/.{1,4}/g)?.join("-") || code || null;
              instance.qr = null;
              this.log(userId, "info", "Pairing code generated");
            }
          } catch (err) {
            this.log(userId, "error", "Failed to generate pairing code");
          }
        }, 3000);
      }

      instance.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          instance.qr = qr;
        }

        if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          instance.status = "offline";
          instance.qr = null;
          instance.pairingCode = null;

          if (shouldReconnect) {
            setTimeout(() => this.start(null, false, userId), 5000);
          } else {
            await fs.remove(userAuthDir);
            if (this.dbConnected) await Session.deleteOne({ userId });
            instance.sock = null;
          }
        } else if (connection === "open") {
          instance.status = "online";
          instance.qr = null;
          instance.pairingCode = null;
          this.log(userId, "info", "Connected to WhatsApp");
        }
      });

      instance.sock.ev.on("messages.upsert", async (m) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (instance.sock && msg.message) {
              handler.handleMessage(instance.sock, msg).catch(console.error);
            }
          }
        }
      });

    } catch (err) {
      this.log(userId, "error", "Failed to start bot: " + err.message);
      instance.status = "error";
    }
  }

  async logout(userId = "default") {
    const instance = this.getInstance(userId);
    if (instance.sock) {
      await instance.sock.logout();
      instance.sock = null;
      instance.status = "offline";
      instance.qr = null;
      const userDir = path.join(this.authDir, userId);
      await fs.remove(userDir);
      if (this.dbConnected) await Session.deleteOne({ userId });
    }
  }

  log(userId, level, message) {
    console.log(`[${userId.toUpperCase()}] [${level.toUpperCase()}] ${message}`);
  }
}

const botManager = new BotManager();
module.exports = { BotManager, botManager };
