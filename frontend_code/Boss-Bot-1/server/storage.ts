import {
  type BotSettings,
  type UpdateBotSettings,
  type Log,
  type UserSession,
  type InsertUserSession,
  type UpdateUserSession,
  type UserSettings,
  type UpdateUserSettings,
  type UserLog,
  botSettings,
  userSettings,
  userSessions,
  userLogs,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getSettings(): Promise<BotSettings>;
  updateSettings(settings: UpdateBotSettings): Promise<BotSettings>;
  addLog(level: string, message: string): Promise<Log>;
  getLogs(limit?: number): Promise<Log[]>;
  clearLogs(): Promise<void>;
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(userId: string): Promise<UserSession | null>;
  updateUserSession(userId: string, updates: UpdateUserSession): Promise<UserSession>;
  deleteUserSession(userId: string): Promise<void>;
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;
  addUserLog(userId: string, level: string, message: string): Promise<UserLog>;
  getUserLogs(userId: string, limit?: number): Promise<UserLog[]>;
  clearUserLogs(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<BotSettings> {
    const [settings] = await db.select().from(botSettings).where(eq(botSettings.id, 1));
    if (!settings) {
      const [newSettings] = await db.insert(botSettings).values({
        botName: "Boss",
        ownerNumber: "2349164898577",
        publicMode: "public",
        autoRead: false,
        welcomeEnabled: false,
        goodbyeEnabled: false,
        autoStatusRead: false,
        autoTyping: false
      }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateSettings(updates: UpdateBotSettings): Promise<BotSettings> {
    const [settings] = await db
      .update(botSettings)
      .set(updates)
      .where(eq(botSettings.id, 1))
      .returning();
    return settings;
  }

  async addLog(level: string, message: string): Promise<Log> {
    const [log] = await db.insert(userLogs).values({
      userId: "default",
      level,
      message,
    }).returning();
    return log as any;
  }

  async getLogs(limit = 50): Promise<Log[]> {
    return await db.select().from(userLogs).where(eq(userLogs.userId, "default")).limit(limit).orderBy(desc(userLogs.timestamp)) as any;
  }

  async clearLogs(): Promise<void> {
    await db.delete(userLogs).where(eq(userLogs.userId, "default"));
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getUserSession(userId: string): Promise<UserSession | null> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.userId, userId));
    return session || null;
  }

  async updateUserSession(userId: string, updates: UpdateUserSession): Promise<UserSession> {
    const [session] = await db
      .update(userSessions)
      .set(updates)
      .where(eq(userSessions.userId, userId))
      .returning();
    return session;
  }

  async deleteUserSession(userId: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (!settings) {
      const [newSettings] = await db.insert(userSettings).values({
        userId,
        botName: "Boss",
        publicMode: "public"
      }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateUserSettings(userId: string, updates: UpdateUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, userId))
      .returning();
    return settings;
  }

  async addUserLog(userId: string, level: string, message: string): Promise<UserLog> {
    const [log] = await db.insert(userLogs).values({
      userId,
      level,
      message,
    }).returning();
    return log;
  }

  async getUserLogs(userId: string, limit = 100): Promise<UserLog[]> {
    return await db
      .select()
      .from(userLogs)
      .where(eq(userLogs.userId, userId))
      .limit(limit)
      .orderBy(desc(userLogs.timestamp));
  }

  async clearUserLogs(userId: string): Promise<void> {
    await db.delete(userLogs).where(eq(userLogs.userId, userId));
  }
}

export const storage = new DatabaseStorage();
