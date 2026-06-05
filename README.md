# 🔐 SHADOWCHAT

## Secure End-to-End Encrypted Messenger

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-WS-orange.svg)](https://github.com/websockets/ws)
[![Security Rating](https://img.shields.io/badge/Security-A%2B-brightgreen)]()
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-blue)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)]()

> **"No one—not even the server—can read your messages."**

ShadowChat is a real-time, end-to-end encrypted messaging application with military-grade OPSEC features. Unlike WhatsApp, Telegram, or Signal, ShadowChat ensures that even the server operator cannot access user messages.

---

## 📺 Watch the Demo

[![ShadowChat Demo](https://img.youtube.com/vi/XQLC_594Nws/0.jpg)](https://youtu.be/XQLC_594Nws)

**Click the image above to watch the full demonstration on YouTube**

### 🎯 Some Key Timestamps:

| Timestamp | Topic |
|-----------|-------|
| [00:30](https://youtu.be/XQLC_594Nws?t=30) | How ECDH + AES-256-GCM encryption works |
| [11:00](https://youtu.be/XQLC_594Nws?t=660) | Dashboard and connection process |
| [16:00](https://youtu.be/XQLC_594Nws?t=960) | Screenshot detection in action |

---

## 📸 Application Preview

### Dashboard Interface

![ShadowChat Dashboard](https://i.ibb.co/pvmQgxPs/dashboard.png)

*Clean, professional Telegram-style interface with dark theme*

---

## 👨‍💻 About the Author

**Lav Chaudhary** | Cyber Security Researcher | Cyber Crime Investigator | Security Engineer

🔐 Building secure communication tools for law enforcement and OPSEC professionals

📡 Focus: End-to-End Encryption, Anti-Forensics, Surveillance Detection

🔧 Expertise: Cryptography, Web Security, Network Security, Digital Forensics

[![GitHub](https://img.shields.io/badge/GitHub-lavchaudharygc-181717?style=flat&logo=github)](https://github.com/lavchaudharygc)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/lav-chaudhary-833b48262/)
[![YouTube](https://img.shields.io/badge/YouTube-Subscribe-FF0000?style=flat&logo=youtube)](https://www.youtube.com/@lavchaudharygc)

---

## 🎯 Key Features

| Category | Features |
|----------|----------|
| **Encryption** | ECDH P-256 + AES-256-GCM, Perfect Forward Secrecy |
| **Privacy** | No phone/email required, Anonymous UUID |
| **Self-Destruct** | 5s/10s/30s/60s timers, Burn after reading |
| **Anti-Forensics** | No database, No logs, Wipe traces, Nuke button |
| **Anti-Surveillance** | Screenshot detection, Right-click block |
| **File Transfer** | Encrypted images & documents |

---

## 🏗️ Architecture

```
User A ←→ Server (Dumb Relay) ←→ User B
   ↓              ↓                   ↓
 Encrypt      CANNOT READ        Decrypt
```

---

## 🔧 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Web Crypto API)
- **Backend:** Node.js, Express, WebSocket (ws library)
- **Transport:** WSS (TLS 1.2+)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- OpenSSL (for certificates)

### Installation

```bash
# Clone repository
git clone https://github.com/lavchaudharygc/ShadowChat.git
cd ShadowChat

# Install dependencies
npm install

# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Start server
node server.js
```

### Access Application
Open `https://localhost:3000` in your browser

---

## 📱 Usage Guide

1. Open two browser tabs
2. Copy User ID from Tab B to Tab A
3. Click Connect
4. Verify fingerprints match
5. Start secure communication!

---

## 🔐 Encryption Details

| Parameter | Specification |
|-----------|---------------|
| Key Exchange | ECDH P-256 (NIST SP 800-56A) |
| Encryption | AES-256-GCM (NIST SP 800-38D) |
| Key Size | 256 bits |
| Hash Function | SHA-256 |
| PFS | Keys rotate every 5 minutes |

---

## 🛡️ Attacks Prevented

- ✅ Man-in-the-Middle (MITM)
- ✅ Server Compromise
- ✅ Replay Attacks
- ✅ Brute Force
- ✅ Quantum Attacks (with PFS)
- ✅ Screenshot/Recording

---

## 👥 Who Should Use

- Law Enforcement (undercover operations)
- Journalists & Whistleblowers
- Legal Professionals
- Healthcare Providers
- Activists & HR Defenders
- Corporate Security Teams

---

## ⚠️ Limitations

- 1-to-1 chat only (no group chat)
- No message history on server
- Session resets on refresh
- No multi-device sync

---

## 📂 Project Structure

```
ShadowChat/
├── public/
│   ├── index.html      # UI
│   └── app.js          # Client logic & crypto
├── server.js           # WebSocket server
├── package.json        # Dependencies
├── cert.pem            # SSL certificate
├── key.pem             # SSL key
└── README.md           # Documentation
```

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- Security features are maintained
- Documentation is updated

---

## ⚠️ Disclaimer

This tool is for **legal and ethical use only**. Users are responsible for compliance with applicable laws.

---

## 📞 Connect With Me

[![GitHub](https://img.shields.io/badge/GitHub-lavchaudharygc-181717?style=for-the-badge&logo=github)](https://github.com/lavchaudharygc)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Lav_Chaudhary-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/lav-chaudhary-833b48262/)
[![YouTube](https://img.shields.io/badge/YouTube-@lavchaudharygc-FF0000?style=for-the-badge&logo=youtube)](https://www.youtube.com/@lavchaudharygc)

---

**⭐ Star this repository if you find it useful!**
