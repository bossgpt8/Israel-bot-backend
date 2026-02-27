## Packages
react-qr-code | To display the WhatsApp pairing QR code
framer-motion | For cyberpunk animations and page transitions
clsx | For conditional class names
tailwind-merge | For merging tailwind classes intelligently

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["'Orbitron'", "sans-serif"],
  body: ["'Rajdhani'", "sans-serif"],
  mono: ["'JetBrains Mono'", "monospace"],
}

API Integration:
- Poll /api/bot/status every 2 seconds for QR code updates
- Poll /api/bot/logs every 2 seconds for terminal output
