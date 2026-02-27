import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  ownerNumber: text("owner_number").default(""),
  botName: text("bot_name").default("Boss"),
  autoRead: boolean("auto_read").default(false),
  autoStatusRead: boolean("auto_status_read").default(false),
  publicMode: text("public_mode").default("public"), // public, private, inbox
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBotSettingsSchema = createInsertSchema(botSettings);

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type UpdateBotSettings = Partial<InsertBotSettings>;

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // info, warn, error
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type Log = typeof logs.$inferSelect;

// User sessions for multi-user support
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Firebase UID
  email: text("email").notNull(),
  linkedWhatsAppNumber: text("linked_whatsapp_number"),
  botActiveStatus: boolean("bot_active_status").default(false),
  sessionData: jsonb("session_data"), // Store session info
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSessionSchema = createInsertSchema(userSessions);

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UpdateUserSession = Partial<InsertUserSession>;

// User-specific settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  botName: text("bot_name").default("Boss"),
  ownerNumber: text("owner_number").default(""),
  autoRead: boolean("auto_read").default(false),
  autoStatusRead: boolean("auto_status_read").default(false),
  autoTyping: boolean("auto_typing").default(false),
  antiDelete: boolean("anti_delete").default(false),
  pmBlocker: boolean("pm_blocker").default(false),
  antiCall: boolean("anti_call").default(false),
  publicMode: text("public_mode").default("public"), // public, private, inbox
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings);

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UpdateUserSettings = Partial<InsertUserSettings>;

// User logs
export const userLogs = pgTable("user_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  level: text("level").notNull(), // info, warn, error
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type UserLog = typeof userLogs.$inferSelect;

export * from "./models/chat";
export * from "./models/auth";
