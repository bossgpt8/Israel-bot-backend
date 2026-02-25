# Linking Frontend to KnightBot SaaS Backend

Your frontend application (React, Vue, mobile app, etc.) communicates with this backend using standard HTTP REST requests and WebSockets for real-time updates.

### 1. REST API Integration
Use `axios` or `fetch` in your frontend to call the following endpoints:

- **Base URL**: `https://your-replit-url.repl.co`

| Endpoint | Method | Payload | Description |
| :--- | :--- | :--- | :--- |
| `/link/qr` | POST | `{ "userId": "user_123" }` | Get QR code for a user |
| `/link/code` | POST | `{ "userId": "user_123", "phone": "123456789" }` | Get pairing code for phone number |
| `/status` | GET | `?userId=user_123` | Check connection status, QR, and uptime |
| `/send` | POST | `{ "userId": "user_123", "to": "91...", "message": "Hi" }` | Send a WhatsApp message |
| `/disconnect` | POST | `{ "userId": "user_123" }` | Logout and clear session data |

### 2. Real-time Updates (Socket.io)
The backend emits events that your frontend can listen to for a reactive UI.

```javascript
import { io } from "socket.io-client";

const socket = io("https://your-replit-url.repl.co");

// Listen for status changes (e.g., 'online', 'offline', 'connecting')
socket.on("status", (data) => {
  if (data.userId === myUserId) {
    console.log("Status updated:", data.status);
  }
});

// Listen for QR code updates
socket.on("qr", (data) => {
  if (data.userId === myUserId) {
    setQrCode(data.qr);
  }
});
```

### 3. Authentication (Optional)
Currently, the API is open for testing. For production, you should add an API Key or JWT middleware in `src/server.js` to secure your endpoints.
