const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const handler = require('./handler');
const config = require('./config');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());

// MongoDB Session Schema
const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  status: { type: String, default: 'disconnected' },
  addedAt: { type: Date, default: Date.now }
});
const Session = mongoose.model('Session', sessionSchema);

const sessions = new Map(); // userId -> { sock, status }

async function connectToWhatsApp(userId, res = null, pairingCode = false, phoneNumber = null) {
  const sessionDir = path.join(__dirname, 'sessions', userId);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['KnightBot SaaS', 'Chrome', '1.0.0']
  });

  sessions.set(userId, { sock, status: 'connecting' });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
       io.emit('qr', { userId, qr });
       if (res && !pairingCode) {
         res.json({ success: true, qr, userId });
         res = null;
       }
    }

    if (connection === 'open') {
      console.log(`[${userId}] Connected`);
      sessions.set(userId, { sock, status: 'connected' });
      await Session.findOneAndUpdate({ userId }, { status: 'connected' }, { upsert: true });
      io.emit('status', { userId, status: 'connected' });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        connectToWhatsApp(userId);
      } else {
        console.log(`[${userId}] Logged out`);
        sessions.delete(userId);
        await Session.deleteOne({ userId });
        fs.rmSync(sessionDir, { recursive: true, force: true });
        io.emit('status', { userId, status: 'disconnected' });
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      handler.handleMessage(sock, msg).catch(console.error);
    }
  });

  if (pairingCode && phoneNumber && res) {
    try {
      setTimeout(async () => {
        const code = await sock.requestPairingCode(phoneNumber);
        res.json({ success: true, code, userId });
      }, 3000);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

// API Routes
app.post('/link/qr', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  if (sessions.has(userId) && sessions.get(userId).status === 'connected') {
    return res.json({ success: true, message: 'Already connected' });
  }
  connectToWhatsApp(userId, res);
});

app.post('/link/code', async (req, res) => {
  const { userId, phone } = req.body;
  if (!userId || !phone) return res.status(400).json({ error: 'userId and phone required' });
  connectToWhatsApp(userId, res, true, phone);
});

app.get('/status', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const session = sessions.get(userId);
  res.json({ userId, status: session ? session.status : 'disconnected' });
});

app.post('/send', async (req, res) => {
  const { userId, to, message } = req.body;
  const session = sessions.get(userId);
  if (!session || session.status !== 'connected') {
    return res.status(400).json({ error: 'Session not connected' });
  }
  try {
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await session.sock.sendMessage(jid, { text: message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/disconnect', async (req, res) => {
  const { userId } = req.body;
  const session = sessions.get(userId);
  if (session) {
    await session.sock.logout();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Auto-load sessions
async function loadSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const activeSessions = await Session.find();
    for (const sess of activeSessions) {
      console.log(`Auto-loading session: ${sess.userId}`);
      connectToWhatsApp(sess.userId);
    }
  } catch (err) {
    console.error('Database connection failed', err);
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  loadSessions();
});
