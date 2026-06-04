const ws = new WebSocket("wss://144.172.95.199:3000");

// 🔐 Anonymous cryptographic ID
const userId = crypto.randomUUID();

let selectedUser = null;

// 🔐 Key system
let keyPair;
let sharedKey;
let lastSender = null;

// ========== TIMER VARIABLES ==========
let currentTTL = 5000;
let burnAfterReadMode = false;

// ========== NEW OPSEC VARIABLES ==========
let messageHistory = [];
let stealthMode = true;
const STORAGE_KEY = "chat_storage_v1";

// ========== BURN COUNTER VARIABLES ==========
let burnCount = {};
let burnWarnings = {};

// ========== SCREENSHOT DETECTION VARIABLES ==========
let screenshotDetected = false;
let recordingDetected = false;

// ========== COVER MESSAGE VARIABLES ==========
let coverMode = false;
const COVER_PASSWORD = "opsec2024";

// ========== PFS VARIABLES ==========
let ephemeralKeyInterval;
let currentEphemeralKeyPair;

// ========== DEAD MAN SWITCH VARIABLES ==========
let deadManInterval;
let lastHeartbeat = Date.now();
let lastSentHeartbeat = Date.now();
const HEARTBEAT_TIMEOUT = 60000;
const HEARTBEAT_INTERVAL = 15000;

// ========== TYPING INDICATOR VARIABLES ==========
let typingTimeout = null;
let isTyping = false;

// 🕒 Format time
function getTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 🔐 Generate key pair
async function generateKeys() {
    keyPair = await crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256"
        },
        true,
        ["deriveKey"]
    );
}

// 🔐 Fingerprint (identity verification)
async function getFingerprint(key) {
    const raw = await crypto.subtle.exportKey("raw", key);
    const hash = await crypto.subtle.digest("SHA-256", raw);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// 💾 Encrypted Local Storage
async function saveToEncryptedStorage(messages) {
    if (!sharedKey) return;
    try {
        const storageData = {
            peerId: selectedUser,
            messages: messages,
            timestamp: Date.now()
        };
        const jsonString = JSON.stringify(storageData);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            sharedKey,
            new TextEncoder().encode(jsonString)
        );
        const saveObject = {
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
        localStorage.setItem(STORAGE_KEY + "_" + selectedUser, JSON.stringify(saveObject));
    } catch (e) {}
}

async function loadFromEncryptedStorage() {
    if (!sharedKey || !selectedUser) return null;
    try {
        const saved = localStorage.getItem(STORAGE_KEY + "_" + selectedUser);
        if (!saved) return null;
        const savedObj = JSON.parse(saved);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(savedObj.iv) },
            sharedKey,
            new Uint8Array(savedObj.data)
        );
        const storageData = JSON.parse(new TextDecoder().decode(decrypted));
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (storageData.timestamp > oneHourAgo) {
            return storageData.messages;
        } else {
            localStorage.removeItem(STORAGE_KEY + "_" + selectedUser);
            return null;
        }
    } catch (e) {
        return null;
    }
}

// 🧠 Anti-Forensics: Wipe all traces
async function wipeAllTraces() {
    if (!confirm("⚠️ This will wipe ALL chat history, keys, and stored data. Continue?")) {
        return;
    }
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEY)) {
            localStorage.removeItem(key);
        }
    });
    sessionStorage.clear();
    sharedKey = null;
    keyPair = null;
    lastSender = null;
    messageHistory = [];
    document.getElementById("chat").innerHTML = "";
    document.getElementById("fingerprintBox").innerText = "🔑 Fingerprint: Not established";
    try {
        const randomData = crypto.getRandomValues(new Uint8Array(1024));
        sessionStorage.setItem("_wipe", btoa(String.fromCharCode(...randomData)));
        sessionStorage.removeItem("_wipe");
    } catch(e) {}
    alert("All traces wiped. Refresh to restart session.");
}

// 💣 Emergency Nuke
function nukeSelfDestruct() {
    if (confirm("💣 EMERGENCY NUKE: This will wipe ALL data and reload the page. Continue?")) {
        localStorage.clear();
        sessionStorage.clear();
        for(let i = 0; i < 10; i++) {
            try {
                localStorage.setItem("_overwrite_" + i, crypto.randomUUID());
            } catch(e) {}
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
        setTimeout(() => {
            location.reload();
        }, 100);
    }
}

// Stealth mode
if (stealthMode && !window.DEBUG_MODE) {
    console.log = function() {};
    console.info = function() {};
    console.debug = function() {};
}

// ========== SCREENSHOT DETECTION FUNCTIONS (FIXED) ==========
function notifyScreenshotAttempt() {
    if (!selectedUser) return;
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: "alert",
            to: selectedUser,
            alert: "📸 SCREENSHOT ATTEMPT DETECTED!"
        }));
    }
    const chat = document.getElementById("chat");
    if (chat) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-message';
        alertDiv.innerHTML = '⚠️ SECURITY: Screenshot/Recording detected! ⚠️';
        chat.appendChild(alertDiv);
        chat.scrollTop = chat.scrollHeight;
        setTimeout(() => alertDiv.remove(), 3000);
    }
}

function enableScreenshotProtection() {
    // Method 1: Detect PrintScreen key
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            notifyScreenshotAttempt();
        }
    });
    
    // Method 2: Detect via visibility change + performance (screen recording)
    let lastCaptureTime = Date.now();
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            const startTime = performance.now();
            // Force a style recalculation - recording software causes measurable delay
            document.body.getBoundingClientRect();
            const endTime = performance.now();
            
            // If significant delay, possible recording
            if (endTime - startTime > 30 && Date.now() - lastCaptureTime > 5000) {
                lastCaptureTime = Date.now();
                if (!recordingDetected) {
                    recordingDetected = true;
                    notifyScreenshotAttempt();
                }
            }
        } else {
            recordingDetected = false;
        }
    }, 1000);
    
    // Method 3: Disable right-click on chat area
    const chatArea = document.getElementById("chat");
    if (chatArea) {
        chatArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            notifyScreenshotAttempt();
            return false;
        });
    }
    
    // Method 4: Disable common screenshot keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Windows: Win + Shift + S (Snipping Tool)
        // Mac: Cmd + Shift + 3/4
        if ((e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
            (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))) {
            e.preventDefault();
            notifyScreenshotAttempt();
        }
    });
    
    // Method 5: Detect when page becomes invisible (possible screenshot tool)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            setTimeout(() => {
                if (!document.hidden) {
                    notifyScreenshotAttempt();
                }
            }, 500);
        }
    });
    
    console.log("🛡️ Screenshot protection enabled");
}

// ========== COVER MESSAGE FUNCTIONS ==========
function enableCoverMode() {
    coverMode = true;
    const indicator = document.getElementById("coverModeIndicator");
    if (indicator) indicator.style.display = "block";
}

function disableCoverMode() {
    coverMode = false;
    const indicator = document.getElementById("coverModeIndicator");
    if (indicator) indicator.style.display = "none";
}

function toggleCoverMode() {
    if (coverMode) {
        disableCoverMode();
    } else {
        enableCoverMode();
    }
}

// ========== PERFECT FORWARD SECRECY FUNCTIONS ==========
async function rotateEphemeralKey() {
    if (!selectedUser || !sharedKey) return;
    console.log("🔄 Rotating ephemeral keys (PFS)");
    currentEphemeralKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
    );
    const newPublicKey = await crypto.subtle.exportKey("jwk", currentEphemeralKeyPair.publicKey);
    ws.send(JSON.stringify({
        type: "key_rotation",
        to: selectedUser,
        publicKey: newPublicKey
    }));
}

function enablePFS() {
    if (ephemeralKeyInterval) clearInterval(ephemeralKeyInterval);
    ephemeralKeyInterval = setInterval(rotateEphemeralKey, 5 * 60 * 1000);
}

// ========== DEAD MAN SWITCH FUNCTIONS ==========
let heartbeatAckReceived = true;

function sendHeartbeat() {
    if (!selectedUser || ws.readyState !== WebSocket.OPEN) return;
    
    if (Date.now() - lastSentHeartbeat > HEARTBEAT_INTERVAL) {
        lastSentHeartbeat = Date.now();
        ws.send(JSON.stringify({
            type: "heartbeat",
            to: selectedUser,
            timestamp: Date.now()
        }));
        setTimeout(() => {
            if (!heartbeatAckReceived && Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT) {
                console.warn("⚠️ Heartbeat timeout - peer may be disconnected");
                document.getElementById("statusBox").innerText = "⚠️ Connection unstable";
                document.getElementById("headerStatus").innerText = "⚠️ Unstable";
                heartbeatAckReceived = true;
                lastHeartbeat = Date.now();
                setTimeout(() => {
                    document.getElementById("statusBox").innerText = "🟢 Connected";
                    document.getElementById("headerStatus").innerText = "🟢 Online";
                }, 3000);
            }
        }, HEARTBEAT_TIMEOUT);
    }
}

function checkDeadManSwitch() {
    if (Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT * 2) {
        console.warn("⚠️ Peer connection appears dead");
        document.getElementById("statusBox").innerText = "⚠️ Peer disconnected";
        document.getElementById("headerStatus").innerText = "⚠️ Disconnected";
    }
}

function enableDeadManSwitch() {
    heartbeatAckReceived = true;
    lastHeartbeat = Date.now();
    lastSentHeartbeat = Date.now();
    setInterval(sendHeartbeat, 20000);
    setInterval(checkDeadManSwitch, 30000);
}

function updateHeartbeat() {
    lastHeartbeat = Date.now();
    heartbeatAckReceived = true;
    if (selectedUser) {
        document.getElementById("statusBox").innerText = "🟢 Connected";
        document.getElementById("headerStatus").innerText = "🟢 Online";
    }
}

// ========== TYPING INDICATOR FUNCTIONS (FIXED) ==========
function sendTypingIndicator() {
    if (!selectedUser || ws.readyState !== WebSocket.OPEN) return;
    if (!isTyping) {
        isTyping = true;
        ws.send(JSON.stringify({
            type: "typing",
            to: selectedUser
        }));
        // Reset typing flag after 2 seconds
        setTimeout(() => {
            isTyping = false;
        }, 2000);
    }
}

function showTypingIndicator(fromUser) {
    const el = document.getElementById("typingIndicator");
    if (!el) return;
    
    // Clear existing timeout
    if (window.typingClearTimeout) {
        clearTimeout(window.typingClearTimeout);
    }
    
    // Show typing indicator
    el.style.display = "block";
    el.innerHTML = `👤 User-${fromUser.slice(0, 6)} is typing...`;
    
    // Hide after 2 seconds of no typing
    window.typingClearTimeout = setTimeout(() => {
        el.style.display = "none";
        el.innerHTML = "typing...";
    }, 2000);
}

// 🔐 Encrypt
async function encryptMessage(message) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        sharedKey,
        new TextEncoder().encode(message)
    );
    return {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
    };
}

// 🔐 Decrypt
async function decryptMessage(obj) {
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(obj.iv) },
        sharedKey,
        new Uint8Array(obj.data)
    );
    return new TextDecoder().decode(decrypted);
}

// 🔗 On connect
ws.onopen = async () => {
    await generateKeys();
    document.getElementById("myId").innerText = userId;
    
    ws.send(JSON.stringify({
        type: "register",
        userId: userId
    }));
    
    const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    ws.send(JSON.stringify({
        type: "key",
        userId: userId,
        publicKey: publicKey
    }));
    
    console.log("Your ID:", userId);
    enableScreenshotProtection();
    enablePFS();
    enableDeadManSwitch();
};

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== TIMER FUNCTIONS ==========
function setMessageTimer(seconds) {
    currentTTL = seconds * 1000;
    burnAfterReadMode = false;
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#334155';
    });
    const activeBtn = document.querySelector(`.timer-btn[data-ttl="${currentTTL}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = '#22c55e';
    }
    const burnBtn = document.querySelector('.burn-btn');
    if (burnBtn) burnBtn.classList.remove('active');
}

function enableBurnAfterRead() {
    burnAfterReadMode = true;
    currentTTL = 0;
    document.querySelectorAll('.timer-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#334155';
    });
    const burnBtn = document.querySelector('.burn-btn');
    if (burnBtn) burnBtn.classList.add('active');
}

// 📤 Send message
async function sendMsg() {
    const msgInput = document.getElementById("msg");
    const msg = msgInput.value;
    if (!msg.trim()) return;
    if (!selectedUser) {
        alert("Select a user first!");
        return;
    }
    if (!sharedKey) {
        console.warn("⏳ Waiting for key exchange...");
        return;
    }
    const chat = document.getElementById("chat");
    const msgId = "msg_" + Date.now();
    const sender = userId;
    const isSameSender = lastSender && lastSender === sender;
    lastSender = sender;
    let senderTTL = burnAfterReadMode ? 1000 : currentTTL;
    
    chat.innerHTML += `
<div id="${msgId}" class="message-row self ${isSameSender ? 'grouped' : ''}">
    <div class="message self">
        <div>${escapeHtml(msg)}</div>
        <div class="time">${getTime()}</div>
    </div>
    ${!isSameSender ? `<div class="avatar small">🧑</div>` : `<div style="width:28px"></div>`}
</div>`;
    
    setTimeout(() => {
        const el = document.getElementById(msgId);
        if (el) el.remove();
    }, senderTTL);
    
    chat.scrollTop = chat.scrollHeight;
    messageHistory.push({
        type: 'sent',
        text: msg,
        time: Date.now(),
        sender: userId
    });
    if (messageHistory.length > 100) messageHistory.shift();
    await saveToEncryptedStorage(messageHistory);
    
    let finalMessage = msg;
    if (coverMode && burnAfterReadMode) {
        const coverText = prompt("Enter cover message (decoy text):", "Nothing important here...");
        if (coverText) {
            finalMessage = JSON.stringify({
                real: msg,
                cover: coverText,
                isCover: true
            });
        }
    }
    
    const encrypted = await encryptMessage(finalMessage);
    let messageTTL;
    let isBurnAfterRead = burnAfterReadMode;
    
    if (burnAfterReadMode) {
        messageTTL = 0;
        burnAfterReadMode = false;
        const burnBtn = document.querySelector('.burn-btn');
        if (burnBtn) burnBtn.classList.remove('active');
        currentTTL = 5000;
        const defaultBtn = document.querySelector('.timer-btn[data-ttl="5000"]');
        if (defaultBtn) {
            defaultBtn.classList.add('active');
            defaultBtn.style.background = '#22c55e';
        }
    } else {
        messageTTL = currentTTL;
    }
    
    ws.send(JSON.stringify({
        type: "message",
        to: selectedUser,
        payload: encrypted,
        ttl: messageTTL,
        burnAfterRead: isBurnAfterRead
    }));
    msgInput.value = "";
}

ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    updateHeartbeat();
    
    if (data.type === "peer_connected") {
        if (!selectedUser) {
            selectedUser = data.userId;
            updateHeartbeat();
            document.getElementById("statusBox").innerText = "🟢 Connected";
            document.getElementById("fingerprintBox").innerText = "🔗 Connected to: User-" + data.userId.slice(0, 6);
            document.getElementById("headerName").innerText = "User-" + data.userId.slice(0, 6);
            document.getElementById("headerStatus").innerText = "🟢 Online";
            lastSender = null;
        }
    }
    
    if (data.type === "key") {
        const importedKey = await crypto.subtle.importKey(
            "jwk",
            data.publicKey,
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        );
        const senderId = data.from;
        if (!senderId) return;
        if (selectedUser && senderId && senderId !== selectedUser) return;
        
        sharedKey = await crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: importedKey
            },
            keyPair.privateKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        
        if (!selectedUser && senderId) selectedUser = senderId;
        if (selectedUser === senderId) {
            document.getElementById("statusBox").innerText = "🟢 Connected";
            document.getElementById("headerName").innerText = "User-" + senderId.slice(0, 6);
            document.getElementById("headerStatus").innerText = "🟢 Online";
        }
        
        const fingerprint = await getFingerprint(sharedKey);
        document.getElementById("fingerprintBox").innerText = "🔑 Fingerprint: " + fingerprint;
        
        const savedMessages = await loadFromEncryptedStorage();
        if (savedMessages && savedMessages.length > 0) {
            messageHistory = savedMessages;
            const lastMessages = savedMessages.slice(-20);
            const chat = document.getElementById("chat");
            lastMessages.forEach(msg => {
                const isSelf = msg.sender === userId;
                chat.innerHTML += `
                <div class="message-row ${isSelf ? 'self' : 'other'}">
                    ${!isSelf ? `<div class="avatar small">👤</div>` : `<div style="width:28px"></div>`}
                    <div class="message ${isSelf ? 'self' : 'other'}">
                        <div>${escapeHtml(msg.text)}</div>
                        <div class="time">${new Date(msg.time).toLocaleTimeString()}</div>
                    </div>
                    ${isSelf ? `<div class="avatar small">🧑</div>` : `<div style="width:28px"></div>`}
                </div>`;
            });
            chat.scrollTop = chat.scrollHeight;
        }
    }
    
    if (data.type === "key_rotation") {
        const newImportedKey = await crypto.subtle.importKey(
            "jwk",
            data.publicKey,
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        );
        const newSharedKey = await crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: newImportedKey
            },
            keyPair.privateKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
        if (newSharedKey) {
            sharedKey = newSharedKey;
        }
    }
    
    if (data.type === "alert") {
        const chat = document.getElementById("chat");
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-message';
        alertDiv.innerHTML = `⚠️ ${data.alert} ⚠️`;
        chat.appendChild(alertDiv);
        chat.scrollTop = chat.scrollHeight;
        setTimeout(() => alertDiv.remove(), 3000);
    }
    
    // ⌨️ TYPING INDICATOR (FIXED)
    if (data.type === "typing") {
        const fromUser = data.from || selectedUser || "unknown";
        showTypingIndicator(fromUser);
    }
    
    if (data.type === "file") {
        const chat = document.getElementById("chat");
        const shortId = (data.from || selectedUser || "unknown").slice(0, 6);
        try {
            if (!data.payload) return;
            const decrypted = await decryptMessage(data.payload);
            let content = "";
            if (decrypted.startsWith("data:image")) {
                content = `<img src="${decrypted}" style="max-width:150px; border-radius:8px;" />`;
            } else {
                content = `<a href="${decrypted}" download="${data.name}">📎 ${data.name}</a>`;
            }
            const sender = data.from || selectedUser || "unknown";
            const isSameSender = lastSender && lastSender === sender;
            lastSender = sender;
            const msgId = "msg_" + Date.now();
            chat.innerHTML += `
<div id="${msgId}" class="message-row other ${isSameSender ? 'grouped' : ''}">
    <div class="avatar small">👤</div>
    <div class="message other">
        <div>User-${shortId}:</div>
        ${content}
        <div class="time">${getTime()}</div>
    </div>
</div>`;
            const ttl = data.ttl || 5000;
            const isBurnAfterReadFile = data.burnAfterRead || false;
            if (isBurnAfterReadFile && ttl === 0) {
                setTimeout(() => {
                    const el = document.getElementById(msgId);
                    if (el) el.remove();
                }, 1000);
            } else if (ttl > 0) {
                setTimeout(() => {
                    const el = document.getElementById(msgId);
                    if (el) el.remove();
                }, ttl);
            }
            chat.scrollTop = chat.scrollHeight;
        } catch (e) {
            console.error("File decrypt failed:", e);
            chat.innerHTML += `<div class="message other">⚠ Unable to decrypt file</div>`;
            chat.scrollTop = chat.scrollHeight;
        }
    }
    
    if (data.type === "message") {
        const chat = document.getElementById("chat");
        try {
            if (!data.payload) return;
            let decrypted;
            try {
                decrypted = await decryptMessage(data.payload);
                if (decrypted.includes('"isCover":true')) {
                    try {
                        const coverData = JSON.parse(decrypted);
                        const password = prompt("🔒 Encrypted message. Enter passphrase:");
                        if (password === COVER_PASSWORD) {
                            decrypted = coverData.real;
                        } else {
                            decrypted = coverData.cover;
                        }
                    } catch(e) {}
                }
            } catch (e) {
                return;
            }
            const shortId = (data.from || selectedUser || "unknown").slice(0, 6);
            const sender = data.from || selectedUser || "unknown";
            const isSameSender = lastSender && lastSender === sender;
            lastSender = sender;
            const msgId = "msg_" + Date.now();
            chat.innerHTML += `
<div id="${msgId}" class="message-row other ${isSameSender ? 'grouped' : ''}">
    ${!isSameSender ? `<div class="avatar small">👤</div>` : `<div style="width:28px"></div>`}
    <div class="message other">
        <div>${escapeHtml(decrypted)}</div>
        <div class="time">${getTime()}</div>
    </div>
</div>`;
            const ttl = data.ttl || 5000;
            const isBurnAfterRead = data.burnAfterRead || false;
            
            if (isBurnAfterRead && ttl === 0) {
                const msgElement = document.getElementById(msgId);
                if (msgElement) {
                    msgElement.classList.add('burn-message');
                    setTimeout(() => {
                        const el = document.getElementById(msgId);
                        if (el) el.remove();
                        const notif = document.createElement('div');
                        notif.style.cssText = 'text-align:center; font-size:11px; color:#ef4444; margin:5px 0;';
                        notif.innerText = '🔥 Message was burned after reading';
                        chat.appendChild(notif);
                        setTimeout(() => notif.remove(), 2000);
                    }, 1000);
                }
            } else if (ttl > 0) {
                setTimeout(() => {
                    const el = document.getElementById(msgId);
                    if (el) el.remove();
                }, ttl);
            }
            chat.scrollTop = chat.scrollHeight;
            messageHistory.push({
                type: 'received',
                text: decrypted,
                time: Date.now(),
                sender: sender
            });
            if (messageHistory.length > 100) messageHistory.shift();
            await saveToEncryptedStorage(messageHistory);
        } catch (e) {
            console.error("Decrypt error:", e);
        }
    }
    
    if (data.type === "heartbeat") {
        updateHeartbeat();
        ws.send(JSON.stringify({
            type: "heartbeat_ack",
            to: data.from
        }));
    }
    
    if (data.type === "heartbeat_ack") {
        updateHeartbeat();
        heartbeatAckReceived = true;
    }
};

function connectUser() {
    const input = document.getElementById("targetId").value;
    if (!input.trim()) {
        alert("Enter a valid ID");
        return;
    }
    selectedUser = input;
    updateHeartbeat();
    document.getElementById("statusBox").innerText = "🟢 Connected";
    const shortId = input.slice(0, 6);
    document.getElementById("fingerprintBox").innerText = "🔗 Connected to: User-" + shortId;
    document.getElementById("chat").innerHTML = "";
    document.getElementById("headerName").innerText = "User-" + shortId;
    document.getElementById("headerStatus").innerText = "🟢 Online";
    lastSender = null;
}

function generateInvite() {
    const invite = `${window.location.origin}?connect=${userId}`;
    if (!navigator.clipboard) {
        alert("Clipboard not supported");
        return;
    }
    navigator.clipboard.writeText(invite);
    alert("Invite link copied!\n\n" + invite);
}

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("connect");
    document.getElementById("statusBox").innerText = "⚫ Not connected";
    if (target) {
        selectedUser = target;
        document.getElementById("fingerprintBox").innerText = "🔗 Connecting to: User-" + target.slice(0, 6);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("msg");
    if (input) {
        input.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMsg();
            }
        });
        
        // FIXED: Typing indicator with proper debouncing
        let typingDebounceTimer;
        input.addEventListener("input", () => {
            if (!selectedUser) return;
            
            // Clear previous timer
            clearTimeout(typingDebounceTimer);
            
            // Send typing indicator
            sendTypingIndicator();
            
            // Reset after 2 seconds of no typing
            typingDebounceTimer = setTimeout(() => {
                isTyping = false;
            }, 2000);
        });
    }
    
    const timer5s = document.getElementById('timer5s');
    const timer10s = document.getElementById('timer10s');
    const timer30s = document.getElementById('timer30s');
    const timer60s = document.getElementById('timer60s');
    const burnBtn = document.getElementById('burnAfterRead');
    const coverBtn = document.getElementById('coverModeBtn');
    
    if (timer5s) timer5s.addEventListener('click', () => setMessageTimer(5));
    if (timer10s) timer10s.addEventListener('click', () => setMessageTimer(10));
    if (timer30s) timer30s.addEventListener('click', () => setMessageTimer(30));
    if (timer60s) timer60s.addEventListener('click', () => setMessageTimer(60));
    if (burnBtn) burnBtn.addEventListener('click', () => enableBurnAfterRead());
    if (coverBtn) coverBtn.addEventListener('click', () => toggleCoverMode());
});

setInterval(() => {
    const input = document.getElementById("msg");
    if (input) {
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("autocapitalize", "off");
    }
}, 1000);

ws.onclose = () => {
    document.getElementById("statusBox").innerText = "⚫ Disconnected";
    document.getElementById("headerStatus").innerText = "⚫ Offline";
};

// 📎 FILE SELECT HANDLER
document.getElementById("fileInput").addEventListener("change", async function() {
    const file = this.files[0];
    if (!file) return;
    if (!selectedUser) {
        alert("Select a user first!");
        return;
    }
    if (!sharedKey) {
        alert("Encryption key not ready!");
        return;
    }
    const reader = new FileReader();
    reader.onload = async function() {
        const base64 = reader.result;
        const encrypted = await encryptMessage(base64);
        
        let fileTTL;
        let isBurnAfterReadFile = burnAfterReadMode;
        
        if (burnAfterReadMode) {
            fileTTL = 0;
            burnAfterReadMode = false;
            const burnBtn = document.querySelector('.burn-btn');
            if (burnBtn) burnBtn.classList.remove('active');
            currentTTL = 5000;
            const defaultBtn = document.querySelector('.timer-btn[data-ttl="5000"]');
            if (defaultBtn) {
                defaultBtn.classList.add('active');
                defaultBtn.style.background = '#22c55e';
            }
        } else {
            fileTTL = currentTTL;
        }
        
        ws.send(JSON.stringify({
            type: "file",
            to: selectedUser,
            payload: encrypted,
            name: file.name,
            ttl: fileTTL,
            burnAfterRead: isBurnAfterReadFile
        }));
        
        const chat = document.getElementById("chat");
        const sender = userId;
        const isSameSender = lastSender && lastSender === sender;
        lastSender = sender;
        const msgId = "msg_" + Date.now();
        
        chat.innerHTML += `
<div id="${msgId}" class="message-row self ${isSameSender ? 'grouped' : ''}">
    <div class="message self">
        <div>📎 Sent (Encrypted): ${escapeHtml(file.name)}</div>
        <div class="time">${getTime()}</div>
    </div>
    ${!isSameSender ? `<div class="avatar small">🧑</div>` : `<div style="width:28px"></div>`}
</div>`;
        
        let senderFileTTL = isBurnAfterReadFile ? 1000 : fileTTL;
        setTimeout(() => {
            const el = document.getElementById(msgId);
            if (el) el.remove();
        }, senderFileTTL);
        
        chat.scrollTop = chat.scrollHeight;
        document.getElementById("fileInput").value = "";
    };
    reader.readAsDataURL(file);
});

function toggleEmoji() {
    const panel = document.getElementById("emojiPanel");
    if (panel) {
        panel.style.display = panel.style.display === "none" ? "block" : "none";
    }
}

function addEmoji(emoji) {
    const input = document.getElementById("msg");
    if (input) {
        input.value += emoji;
        input.focus();
        // Trigger typing indicator when emoji is added
        sendTypingIndicator();
    }
}