module.exports = {
  name: 'ping',
  description: 'Ping command',
  execute: async (sock, msg, args, { from }) => {
    await sock.sendMessage(from, { text: 'Pong!' });
  }
};
