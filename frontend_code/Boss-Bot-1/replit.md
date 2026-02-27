# Boss Bot - WhatsApp Bot Control Panel

## Overview

Boss Bot is a WhatsApp bot management application with a cyberpunk-themed web dashboard. The system provides a React-based control panel for managing a WhatsApp bot built on the Baileys library, featuring real-time status monitoring, QR code authentication, pairing code support, and comprehensive bot command management. The bot includes extensive functionality for group management, media downloading, AI integrations, and entertainment commands.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, with polling for real-time updates (2-second intervals)
- **Styling**: Tailwind CSS with custom cyberpunk theme (purple/blue gradients on deep black, glassmorphism effects)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Fonts**: Orbitron (display headings), Rajdhani (body text), JetBrains Mono (monospace/code)
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared, @assets/ for attached_assets)

### Backend Architecture
- **Framework**: Express.js with TypeScript (ES modules)
- **WhatsApp Integration**: @whiskeysockets/baileys library for WhatsApp Web API
- **Bot Management**: Singleton BotManager class handling connection lifecycle, QR code generation, pairing codes, and message routing
- **Command System**: Modular command handlers in server/commands/ directory (JavaScript files loaded dynamically)
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **Session Storage**: File-based auth state in ./session directory using Baileys' useMultiFileAuthState

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: shared/schema.ts
- **Tables**: 
  - `bot_settings` - Bot configuration (name, owner number, auto-read, public mode, etc.)
  - `logs` - Activity logs with level and message
  - `conversations` and `messages` - For AI chat integration
- **Migrations**: Managed via drizzle-kit with `db:push` command
- **Additional Storage**: JSON files in server/data/ for feature-specific configs (antilink, antidelete, chatbot, etc.)

### Key Design Patterns
- **Shared Types**: Schema and route definitions shared between frontend and backend via @shared/ alias
- **Type-Safe API**: Zod schemas for request/response validation
- **Polling Pattern**: Frontend polls /api/bot/status and /api/bot/logs every 2 seconds for real-time updates
- **Storage Abstraction**: DatabaseStorage class implements IStorage interface for data operations
- **Command Loading**: Dynamic command loading from server/commands/ directory at runtime

### API Structure
- `GET /api/bot/status` - Returns bot status, QR code, pairing code, and uptime
- `POST /api/bot/action` - Execute actions: start, stop, restart, logout (with optional phone number for pairing)
- `GET /api/bot/logs` - Retrieve activity logs
- `GET /api/settings` - Get bot configuration
- `PATCH /api/settings` - Update bot configuration
- AI integration routes registered via replit_integrations/chat and replit_integrations/image

### Bot Command Categories
The bot supports extensive commands organized into categories:
- **General**: help, menu, ping, alive, tts, weather, news, translate
- **Group Admin**: ban, kick, promote, demote, mute, unmute, antilink, antitag, antibadword
- **Media**: sticker, Instagram download, Facebook download, YouTube download
- **AI**: GPT, Gemini, image generation
- **Fun**: 8ball, dare, truth, flirt, compliment, hangman

## External Dependencies

### Core Services
- **PostgreSQL Database**: Required for storing bot settings, logs, and chat data (DATABASE_URL environment variable)
- **WhatsApp Web**: Connection via @whiskeysockets/baileys library for bot functionality

### Third-Party APIs
- **AI Services**: OpenRouter API with qwen 2.5-72b-instruct and llama 3.1-405b-instruct models (OPENROUTER_API_KEY)
- **Media APIs**: Various scraper APIs for Instagram, Facebook, YouTube content
- **Utility APIs**: Weather, news, translation, and other utility services

### Key NPM Packages
- `@whiskeysockets/baileys` - WhatsApp Web API
- `drizzle-orm` + `drizzle-zod` - Database ORM and validation
- `canvas` + `sharp` - Image processing for stickers
- `ffmpeg` (system dependency) - Video/audio processing
- `axios` + `node-fetch` - HTTP requests
- `pino` - Logging for Baileys