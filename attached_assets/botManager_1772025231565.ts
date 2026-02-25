import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
  type ConnectionState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs-extra";
import path from "path";
import { storage } from "./storage";
import { handleCommand } from "./commands";
import { uploadSession, downloadSession } from "./sessionStorage";

export class BotManager {
  private instances: Map<string, {
    sock: WASocket | null;
    qr: string | null;
    pairingCode: string | null;
    status: "offline" | "starting" | "online" | "error";
    reconnectAttempts: number;
  }> = new Map();
  private maxReconnectAttempts = 5;
  private authDir = path.join(process.cwd(), "session");

  constructor() {
    fs.ensureDirSync(this.authDir);
  }

  private getInstance(userId: string = "default") {
    if (!this.instances.has(userId)) {
      this.instances.set(userId, {
        sock: null,
        qr: null,
        pairingCode: null,
        status: "offline",
        reconnectAttempts: 0,
      });
    }
    return this.instances.get(userId)!;
  }

  public getStatus(userId: string = "default"): any {
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

  public async start(phoneNumber?: string, forceNewSession: boolean = true, userId: string = "default") {
    const instance = this.getInstance(userId);
    if (instance.status === "online" || instance.status === "starting") return;
    
    instance.status = "starting";
    instance.pairingCode = null;
    instance.qr = null;
    
    try {
      const userAuthDir = userId === "default" ? this.authDir : path.join(this.authDir, userId);
      let sessionExists = false;

      // Always try to download session first if not forcing a new one
      if (!forceNewSession) {
        sessionExists = await downloadSession(userId, this.authDir);
      } else {
        // Even if forceNewSession is true, if we have a local creds.json, it might be a reboot
        sessionExists = await fs.pathExists(path.join(userAuthDir, 'creds.json'));
      }

      if (sessionExists) {
        this.log(userId, "info", "Session found");
        this.log(userId, "info", "Establishing connection...");
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
        logger: pino({ level: "silent" }) as any,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }) as any),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: new Map() as any,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        retryRequestDelayMs: 5000,
      });

      instance.sock.ev.on("creds.update", async () => {
        await saveCreds();
        await uploadSession(userId, this.authDir);
      });

      // Pairing code logic
      if (!instance.sock.authState.creds.registered) {
        if (phoneNumber) {
          // No log here to avoid premature linking message
          setTimeout(async () => {
            try {
              if (instance.sock && !instance.sock.authState.creds.registered && instance.sock.ws.isOpen) {
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

    instance.sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.connectionReplaced;

        this.log(userId, "warn", `Connection closed: ${statusCode}, reconnecting: ${shouldReconnect}`);
        instance.status = "offline";
        instance.qr = null;
        instance.pairingCode = null;

        if (shouldReconnect) {
          this.log(userId, "info", "Auto-reconnecting...");
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
            if (instance.sock) {
              // Ensure we pass the correct userId for session-specific settings
              await handleCommand(instance.sock, msg, userId);
            }
          }
        }
      });

    } catch (err: any) {
      this.log(userId, "error", `Failed to start bot: ${err.message}`);
      instance.status = "error";
    }
  }

  public async stop(userId: string = "default") {
    const instance = this.getInstance(userId);
    if (instance.sock) {
      instance.sock.end(undefined);
      instance.sock = null;
      instance.status = "offline";
      instance.qr = null;
      this.log(userId, "info", "Bot stopped.");
    }
  }

  public async logout(userId: string = "default") {
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

  private logListeners: Map<string, Set<(log: any) => void>> = new Map();

  public subscribeLogs(userId: string, listener: (log: any) => void) {
    if (!this.logListeners.has(userId)) {
      this.logListeners.set(userId, new Set());
    }
    this.logListeners.get(userId)!.add(listener);
    return () => {
      this.logListeners.get(userId)?.delete(listener);
    };
  }

  private async log(userId: string, level: "info" | "warn" | "error", message: string) {
    const logData = { level, message, timestamp: new Date().toISOString(), userId };
    console.log(`[${userId.toUpperCase()}] [${level.toUpperCase()}] ${message}`);
    
    // Store in memory via storage
    await storage.addUserLog(userId, level, message);
    
    // Stream to memory listeners (SSE)
    const listeners = this.logListeners.get(userId);
    if (listeners) {
      listeners.forEach(listener => listener(logData));
    }
  }

  public emitLog(userId: string, level: "info" | "warn" | "error", message: string) {
    const logData = { level, message, timestamp: new Date().toISOString(), userId };
    const listeners = this.logListeners.get(userId);
    if (listeners) {
      listeners.forEach(listener => listener(logData));
    }
  }
}

export const botManager = new BotManager();
