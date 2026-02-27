const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { botManager } = require('./BotManager');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Boss Bot Alive 🔥", time: new Date() });
});

// Bot Status
app.get("/api/bot/status", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const status = botManager.getStatus(userId);
  res.json({ 
    status: status.status, 
    qr: status.qr, 
    pairingCode: status.pairingCode, 
    uptime: status.uptime,
    currentUserId: status.currentUserId 
  });
});

// Bot Actions
app.post("/api/bot/action", async (req, res) => {
  const { action, phoneNumber, userId } = req.body;
  if (!action) return res.status(400).json({ message: "Action is required" });

  try {
    switch (action) {
      case "start":
        if (phoneNumber) {
          // If phone number provided, it's a pairing code request
          await botManager.start(phoneNumber, true, userId || "default");
          // Wait slightly for code generation
          setTimeout(() => {
            const status = botManager.getStatus(userId || "default");
            res.json({ success: true, message: "Pairing code requested", code: status.pairingCode });
          }, 5000);
        } else {
          // Normal QR start
          await botManager.start(null, true, userId || "default");
          res.json({ success: true, message: "Bot starting (QR mode)" });
        }
        break;
      case "stop":
      case "logout":
        await botManager.logout(userId || "default");
        res.json({ success: true, message: "Bot disconnected" });
        break;
      case "restart":
        await botManager.logout(userId || "default");
        await botManager.start(null, true, userId || "default");
        res.json({ success: true, message: "Bot restarting" });
        break;
      default:
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Compatibility routes for direct frontend calls if needed
app.post('/link/qr', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  
  const status = botManager.getStatus(userId);
  if (status.status === 'online') {
    return res.json({ success: true, message: 'Already connected' });
  }
  
  await botManager.start(null, true, userId);
  
  // Wait a bit for QR to be generated
  setTimeout(() => {
    const updatedStatus = botManager.getStatus(userId);
    res.json({ success: true, qr: updatedStatus.qr, userId });
  }, 3000);
});

app.post('/link/code', async (req, res) => {
  const { userId, phone } = req.body;
  if (!userId || !phone) return res.status(400).json({ error: 'userId and phone required' });
  
  await botManager.start(phone, true, userId);
  
  setTimeout(() => {
    const status = botManager.getStatus(userId);
    res.json({ success: true, code: status.pairingCode, userId });
  }, 5000);
});

app.get('/status', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const status = botManager.getStatus(userId);
  res.json({ userId, status: status.status, details: status });
});

app.post('/send', async (req, res) => {
  const { userId, to, message } = req.body;
  const instance = botManager.getInstance(userId);
  if (!instance || instance.status !== 'online') {
    return res.status(400).json({ error: 'Session not connected' });
  }
  try {
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await instance.sock.sendMessage(jid, { text: message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/disconnect', async (req, res) => {
  const { userId } = req.body;
  try {
    await botManager.logout(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
