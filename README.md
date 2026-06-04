# 🔐 ShadowChat - Secure End-to-End Encrypted Messenger

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-WS-orange.svg)](https://github.com/websockets/ws)

> **"No one—not even the server—can read your messages."**

ShadowChat is a real-time, end-to-end encrypted messaging application with military-grade OPSEC features. Unlike WhatsApp, Telegram, or Signal, ShadowChat ensures that even the server operator cannot access user messages.

## 🎯 Key Features

| Category | Features |
|----------|----------|
| **Encryption** | ECDH P-256 + AES-256-GCM, Perfect Forward Secrecy |
| **Privacy** | No phone/email required, Anonymous UUID |
| **Self-Destruct** | 5s/10s/30s/60s timers, Burn after reading |
| **Anti-Forensics** | No database, No logs, Wipe traces, Nuke button |
| **Anti-Surveillance** | Screenshot detection, Right-click block |
| **File Transfer** | Encrypted images & documents |

## 🏗️ Architecture

User A ←→ Server (Dumb Relay) ←→ User B
↓ ↓ ↓
Encrypt CANNOT READ Decrypt


## 🔧 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Web Crypto API)
- **Backend:** Node.js, Express, WebSocket (ws library)
- **Transport:** WSS (TLS 1.2+)

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- OpenSSL (for certificates)

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ShadowChat.git
cd ShadowChat

# Install dependencies
npm install

# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Start server
node server.js

Access Application
Open https://localhost:3000 in your browser

📱 Usage
Open two browser tabs

Copy User ID from Tab B to Tab A

Click Connect

Verify fingerprints match

Start secure communication!

🔐 Encryption Details

Parameter	Specification
Key Exchange	ECDH P-256 (NIST SP 800-56A)
Encryption	AES-256-GCM (NIST SP 800-38D)
Key Size	256 bits
Hash Function	SHA-256
PFS	Keys rotate every 5 minutes

🛡️ Attacks Prevented
✅ Man-in-the-Middle (MITM)

✅ Server Compromise

✅ Replay Attacks

✅ Brute Force

✅ Quantum Attacks (with PFS)

✅ Screenshot/Recording

👥 Who Should Use
Law Enforcement (undercover operations)

Journalists & Whistleblowers

Legal Professionals

Healthcare Providers

Activists & HR Defenders

Corporate Security Teams

⚠️ Limitations
1-to-1 chat only (no group chat)

No message history on server

Session resets on refresh

No multi-device sync

📂 Project Structure
ShadowChat/
├── public/
│   ├── index.html      # UI
│   ├── app.js          # Client logic & crypto
│   └── style.css       # Styling
├── server.js           # WebSocket server
├── package.json        # Dependencies
├── cert.pem            # SSL certificate
├── key.pem             # SSL key
└── README.md           # Documentation

🤝 Contributing
Contributions are welcome! Please ensure:

Code follows existing style

Security features are maintained

Documentation is updated

📜 License
MIT License - See LICENSE file

📞 Contact
Author: Cyber Security Researcher & Investigator
GitHub: [Your GitHub Username]
LinkedIn: [Your LinkedIn URL]

⚠️ Disclaimer
This tool is for legal and ethical use only. Users are responsible for compliance with applicable laws.

Star ⭐ this repository if you find it useful!

