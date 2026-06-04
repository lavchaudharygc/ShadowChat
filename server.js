const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();

// Serve frontend
app.use(express.static(path.join(__dirname, '../client')));

// HTTPS server
const server = https.createServer({
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem')
}, app);

const wss = new WebSocket.Server({ server });

// Store connected users
let clients = {};
let publicKeys = {};

wss.on('connection', (ws) => {
    console.log("New connection");

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Add this INSIDE ws.on('message', (message) => {
// Right after: const data = JSON.parse(message);

// 🔬 DEMONSTRATION LOGGING - Remove after presentation
if (data.type === "message") {
    console.log("\n🔵 ========== MESSAGE RECEIVED ==========");
    console.log("📨 From:", ws.userId);
    console.log("🎯 To:", data.to);
    console.log("📦 Payload (encrypted):", JSON.stringify(data.payload).substring(0, 100) + "...");
    console.log("🔐 Can server read it? NO - This is AES-GCM ciphertext");
    console.log("==========================================\n");
}

if (data.type === "file") {
    console.log("\n📎 ========== FILE RECEIVED ==========");
    console.log("📨 From:", ws.userId);
    console.log("🎯 To:", data.to);
    console.log("📁 File name:", data.name);
    console.log("📦 Payload size:", JSON.stringify(data.payload).length, "bytes of encrypted data");
    console.log("🔐 Can server see file? NO - Only encrypted Base64");
    console.log("=====================================\n");
}

if (data.type === "key") {
    console.log("\n🔑 ========== KEY EXCHANGE ==========");
    console.log("📨 From:", ws.userId);
    console.log("🔓 Public Key (safe to share):", JSON.stringify(data.publicKey).substring(0, 80) + "...");
    console.log("🔐 Private key? Server NEVER sees it");
    console.log("==================================\n");
}

        // 🔐 REGISTER USER
        if (data.type === "register") {
            ws.userId = data.userId;
            clients[data.userId] = ws;
        
            console.log("Registered:", data.userId);
        
            // Notify all users about new connection
            Object.values(clients).forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "peer_connected",
                        userId: data.userId
                    }));
                }
            });
        }

        // 🔐 KEY EXCHANGE
        if (data.type === "key") {
            publicKeys[ws.userId] = data.publicKey;

            // Send existing keys to this user
            Object.keys(publicKeys).forEach(user => {
                if (user !== ws.userId) {
                    ws.send(JSON.stringify({
                        type: "key",
                        from: user,
                        publicKey: publicKeys[user]
                    }));
                }
            });

            // Send this key to others
            Object.values(clients).forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "key",
                        from: ws.userId,
                        publicKey: data.publicKey
                    }));
                }
            });
        }

        // 📎 FILE TRANSFER - FIXED
        if (data.type === "file") {
            const target = clients[data.to];
        
            if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({
                    type: "file",
                    from: ws.userId,
                    name: data.name,
                    payload: data.payload,
                    ttl: data.ttl || 5000
                }));
            }
        }
        
        // 💬 PRIVATE MESSAGE - FIXED (now includes TTL)
        if (data.type === "message") {
            const target = clients[data.to];
        
            if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({
                    type: "message",
                    from: ws.userId,
                    payload: data.payload,  // FIXED: keep as payload
                    ttl: data.ttl || 5000   // FIXED: preserve TTL
                }));
            }
        }

        // ⌨️ TYPING INDICATOR - ADD THIS BLOCK
        if (data.type === "typing") {
            const target = clients[data.to];
        
            if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({
                    type: "typing",
                    from: ws.userId
                }));
            }
        }

                // 🚨 Forward security alerts
        if (data.type === "alert") {
            const target = clients[data.to];
            if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({
                    type: "alert",
                    from: ws.userId,
                    alert: data.alert
                }));
            }
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            delete clients[ws.userId];
            delete publicKeys[ws.userId];
        }
        console.log("Disconnected:", ws.userId);
    });
});

// Start server
server.listen(3000, () => {
    console.log("HTTPS + WSS running on https://144.172.95.199:3000");
});
