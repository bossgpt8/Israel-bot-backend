const config = require('./config');
const database = require('./database');
const { loadCommands } = require('./utils/commandLoader');
const { jidDecode, jidEncode } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const commands = loadCommands();

const isSystemJid = (jid) => {
  if (!jid) return true;
  return jid.includes('@broadcast') || jid.includes('status.broadcast') || jid.includes('@newsletter');
};

const handleMessage = async (sock, msg, userId = "default") => {
  try {
    if (!msg.message) return;
    const from = msg.key.remoteJid;
    if (isSystemJid(from)) return;

    const content = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (!content.startsWith(config.prefix)) return;

    const args = content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = commands.get(commandName);

    if (command) {
      await command.execute(sock, msg, args, { from, userId });
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
};

module.exports = { handleMessage };
