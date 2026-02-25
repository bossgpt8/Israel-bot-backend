# KnightBot Multi-User SaaS Architecture

## Architectural Changes

1.  **Entry Point Shift**: `index.js` (single bot) is replaced by `server.js` (Express API) as the main entry point. `index.js` is preserved for legacy use via `npm run bot`.
2.  **Multi-User Session Management**:
    *   Sessions are stored in `/sessions/{userId}/` instead of a global `session/` folder.
    *   Each user has a dedicated Baileys instance running in-memory within a `Map`.
3.  **Persistence**: 
    *   MongoDB is used to track active users.
    *   Baileys credentials remain on the filesystem for `useMultiFileAuthState` compatibility.
4.  **REST API**:
    *   `POST /link/qr`: Initiates connection and returns a QR code JSON.
    *   `POST /link/code`: Initiates connection and returns a pairing code for a phone number.
    *   `GET /status`: Checks connection state.
    *   `POST /send`: Send messages programmatically.
    *   `POST /disconnect`: Log out and clean up data.
5.  **Real-time Updates**: Socket.io is integrated for emitting status changes to a frontend.

## Folder Structure
```
KnightBot-Mini-main/
├── sessions/             # Unique user session folders
│   ├── user1/
│   └── user2/
├── server.js             # New API Server & Instance Manager
├── index.js              # Legacy Single-Bot Entry (Original)
├── handler.js            # Shared Command Logic
├── config.js             # Bot Settings
└── ...
```
