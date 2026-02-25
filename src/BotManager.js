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

class BotManager {
  constructor() {
    this.instances = new Map();
    this.authDir = path.join(process.cwd(), "sessions");
    fs.ensureDirSync(this.authDir);
    this.logListeners = new Map();
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
      const userAuthDir = userId === "default" ? path.join(this.authDir, "default") : path.join(this.authDir, userId);
      
      if (forceNewSession) {
        await fs.remove(userAuthDir);
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
        browser: ["KnightBot SaaS", "Chrome", "1.0.0"],
        markOnlineOnConnect: true,
        syncFullHistory: false,
      });

      instance.sock.ev.on("creds.update", saveCreds);

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
      const userDir = userId === "default" ? path.join(this.authDir, "default") : path.join(this.authDir, userId);
      await fs.remove(userDir);
    }
  }

  log(userId, level, message) {
    console.log([${userId.toUpperCase()}] [${level.toUpperCase()}] ${message});
  }
}

const botManager = new BotManager();
module.exports = { BotManager, botManager };
