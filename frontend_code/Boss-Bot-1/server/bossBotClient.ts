import axios from "axios";

const BOSS_BOT_API_URL = process.env.BOSS_BOT_BACKEND_URL || "https://your-boss-bot-backend.com";

export class BossBotClient {
  private baseUrl: string;

  constructor(baseUrl: string = BOSS_BOT_API_URL) {
    this.baseUrl = baseUrl;
  }

  async linkQR(userId: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/link/qr`, { userId });
      return response.data;
    } catch (err: any) {
      if (err.response?.data) {
        throw new Error(err.response.data.message || "Failed to generate QR code");
      }
      throw err;
    }
  }

  async linkCode(userId: string, phone: string) {
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const response = await axios.post(`${this.baseUrl}/link/code`, { userId, phone: cleanPhone });
      return response.data;
    } catch (err: any) {
      if (err.response?.data) {
        throw new Error(err.response.data.message || "Failed to get pairing code");
      }
      throw err;
    }
  }

  async getStatus(userId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/status`, { params: { userId } });
      return response.data;
    } catch (err: any) {
      if (err.response?.data) {
        throw new Error(err.response.data.message || "Failed to get status");
      }
      throw err;
    }
  }

  async sendMessage(userId: string, to: string, message: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/send`, { userId, to, message });
      return response.data;
    } catch (err: any) {
      if (err.response?.data) {
        throw new Error(err.response.data.message || "Failed to send message");
      }
      throw err;
    }
  }

  async disconnect(userId: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/disconnect`, { userId });
      return response.data;
    } catch (err: any) {
      if (err.response?.data) {
        throw new Error(err.response.data.message || "Failed to disconnect");
      }
      throw err;
    }
  }
}

export const bossBotClient = new BossBotClient();
