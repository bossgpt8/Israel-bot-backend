// Mock storage for KnightBot SaaS
module.exports = {
  updateUserSession: async (userId, data) => console.log(`[Storage] Updating session for ${userId}:`, data),
  updateUserSettings: async (userId, data) => console.log(`[Storage] Updating settings for ${userId}:`, data),
  updateSettings: async (data) => console.log(`[Storage] Updating global settings:`, data),
  addUserLog: async (userId, level, message) => console.log(`[Log][${userId}] [${level}] ${message}`)
};
