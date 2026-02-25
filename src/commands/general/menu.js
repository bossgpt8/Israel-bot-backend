module.exports = {
  name: 'menu',
  description: 'Menu command',
  execute: async (sock, msg, args, { from }) => {
    await sock.sendMessage(from, { text: 'KnightBot SaaS Menu' });
  }
};
