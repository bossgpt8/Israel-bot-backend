import { z } from "zod";
import { insertBotSettingsSchema, botSettings, logs, type Log, type UpdateBotSettings } from "./schema";

export { type Log, type UpdateBotSettings };

export const api = {
  bot: {
    status: {
      method: "GET" as const,
      path: "/api/bot/status",
      responses: {
        200: z.object({
          status: z.enum(["offline", "starting", "online", "error"]),
          qr: z.string().nullable(),
          pairingCode: z.string().nullable(),
          uptime: z.number(),
          currentUserId: z.string().optional().nullable(),
        }),
      },
    },
    action: {
      method: "POST" as const,
      path: "/api/bot/action",
      input: z.object({
        action: z.enum(["start", "stop", "restart", "logout"]),
        phoneNumber: z.string().optional(), // For pairing code
        userId: z.string().optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
    logs: {
      method: "GET" as const,
      path: "/api/bot/logs",
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect>()),
      },
    },
  },
  settings: {
    get: {
      method: "GET" as const,
      path: "/api/settings",
      responses: {
        200: z.custom<typeof botSettings.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/settings",
      input: insertBotSettingsSchema.partial(),
      responses: {
        200: z.custom<typeof botSettings.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
