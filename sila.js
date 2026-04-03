const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
    DisconnectReason,
    jidDecode,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    downloadContentFromMessage,
    getContentType
} = require('@whiskeysockets/baileys');

const config = require('./config');
const events = require('./momy');
const { sms } = require('./lib/msg');
const { 
    connectdb,
    saveSessionToMongoDB,
    getSessionFromMongoDB,
    deleteSessionFromMongoDB,
    getUserConfigFromMongoDB,
    updateUserConfigInMongoDB,
    addNumberToMongoDB,
    removeNumberFromMongoDB,
    getAllNumbersFromMongoDB,
    saveOTPToMongoDB,
    verifyOTPFromMongoDB,
    incrementStats,
    getStatsForNumber
} = require('./lib/database');
const { handleAntidelete } = require('./lib/antidelete');
const { handleAntilink } = require('./lib/antilink');

const express = require('express');
const fs = require('fs-extra');
const pino = require('pino');
const crypto = require('crypto');
const FileType = require('file-type');
const axios = require('axios');
const bodyparser = require('body-parser');
const moment = require('moment-timezone');

const prefix = config.PREFIX;
const mode = config.MODE;
const router = express.Router();

const path = require('path');

// ==============================================================================
// 1. INITIALIZATION & DATABASE
// ==============================================================================

connectdb();

const activeSockets = new Map();
const socketCreationTime = new Map();

// Manual store implementation
const store = {
    bind: (ev) => {
        console.log('📦 𝚂𝚝𝚘𝚛𝚎 𝚋𝚘𝚞𝚗𝚍');
    },
    loadMessage: async (jid, id) => {
        return undefined;
    }
};

const createSerial = (size) => {
    return crypto.randomBytes(size).toString('hex').slice(0, size);
}

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        if (i.admin == null) continue;
        admins.push(i.id);
    }
    return admins;
}

// ==============================================================================
// ANTILINK FUNCTIONS (PER-GROUP)
// ==============================================================================

// Get antilink settings for a group
const getGroupAntilinkSetting = (groupId) => {
    try {
        const antilinkPath = path.join(__dirname, 'database', 'antilink_groups.json');
        if (fs.existsSync(antilinkPath)) {
            const settings = JSON.parse(fs.readFileSync(antilinkPath, 'utf8'));
            return settings[groupId] === true;
        }
        return false;
    } catch (err) {
        return false;
    }
};

// Set antilink setting for a group
const setGroupAntilinkSetting = (groupId, enabled) => {
    const antilinkPath = path.join(__dirname, 'database', 'antilink_groups.json');
    const dir = path.dirname(antilinkPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    let settings = {};
    if (fs.existsSync(antilinkPath)) {
        settings = JSON.parse(fs.readFileSync(antilinkPath, 'utf8'));
    }
    
    if (enabled) {
        settings[groupId] = true;
    } else {
        delete settings[groupId];
    }
    
    fs.writeFileSync(antilinkPath, JSON.stringify(settings, null, 2));
    return true;
};

// ==============================================================================
// AUTO FOLLOW NEWSLETTERS
// ==============================================================================
async function autoFollowNewsletters(conn) {
    try {
        console.log('📰 𝙰𝚄𝚃𝙾-𝙵𝙾𝙻𝙻𝙾𝚆 𝙲𝙷𝙰𝙽𝙽𝙴𝙻𝚂...');

        const channelsToFollow = [
            {
                jid: "120363402325089913@newsletter",
                name: "𝙲𝚑𝚊𝚗𝚗𝚎𝚕 𝟷 (𝟷𝟹)"
            },
            {
                jid: "120363421404091643@newsletter",
                name: "𝙲𝚑𝚊𝚗𝚗𝚎𝚕 𝟸"
            },
            {
                jid: "120363407628683238@newsletter",
                name: "𝙲𝚑𝚊𝚗𝚗𝚎𝚕 𝟹"
            }
        ];

        for (const channel of channelsToFollow) {
            try {
                if (typeof conn.newsletterFollow === 'function') {
                    await conn.newsletterFollow(channel.jid);
                    console.log(`✅ 𝙵𝚘𝚕𝚕𝚘𝚠𝚎𝚍: ${channel.name}`);
                    await delay(1000);
                }
            } catch (error) {
                console.log(`⚠️ 𝙴𝚛𝚛𝚘𝚛 ${channel.name}: ${error.message}`);
            }
        }

        // Auto-join groups
        const joinGroup = async (groupLink, groupName) => {
            try {
                if (!groupLink || groupLink.trim() === '') return null;
                const inviteCode = groupLink.split('/').pop();
                if (!inviteCode) return null;
                const response = await conn.groupAcceptInvite(inviteCode);
                console.log(`✅ 𝙹𝚘𝚒𝚗𝚎𝚍: ${groupName}`);
                return response;
            } catch (error) {
                console.log(`❌ 𝙵𝚊𝚒𝚕𝚎𝚍 ${groupName}: ${error.message}`);
                return null;
            }
        };

        if (config.GROUP_LINK_1 && config.GROUP_LINK_1.trim() !== '') {
            await joinGroup(config.GROUP_LINK_1, "𝙶𝚛𝚘𝚞𝚙 𝟷");
            await delay(1000);
        }

        if (config.GROUP_LINK_2 && config.GROUP_LINK_2.trim() !== '') {
            await joinGroup(config.GROUP_LINK_2, "𝙶𝚛𝚘𝚞𝚙 𝟸");
            await delay(1000);
        }

    } catch (error) {
        console.error('❌ 𝙰𝚞𝚝𝚘-𝚏𝚘𝚕𝚕𝚘𝚠 𝚎𝚛𝚛𝚘𝚛:', error.message);
    }
}

// ==============================================================================
// AUTO UPDATE BIO FUNCTION
// ==============================================================================
async function autoUpdateBio(conn, number) {
    try {
        if (config.AUTO_BIO === 'true' && config.BIO_LIST && config.BIO_LIST.length > 0) {
            const bioList = config.BIO_LIST;
            let currentIndex = 0;

            const isConnectionActive = () => {
                const sanitizedNumber = number.replace(/[^0-9]/g, '');
                return activeSockets.has(sanitizedNumber) && conn.user && conn.user.id;
            };

            const updateBio = async () => {
                try {
                    if (!isConnectionActive()) return;
                    const bioText = bioList[currentIndex];
                    await conn.updateProfileStatus(bioText);
                    console.log(`📝 𝚄𝚙𝚍𝚊𝚝𝚎𝚍 𝚋𝚒𝚘 𝚏𝚘𝚛 ${number}: ${bioText}`);
                    currentIndex = (currentIndex + 1) % bioList.length;
                } catch (error) {
                    console.error(`❌ 𝙱𝚒𝚘 𝚎𝚛𝚛𝚘𝚛 ${number}:`, error.message);
                    currentIndex = (currentIndex + 1) % bioList.length;
                }
            };

            if (isConnectionActive()) await updateBio();

            const bioInterval = setInterval(() => {
                if (isConnectionActive()) updateBio();
                else clearInterval(bioInterval);
            }, 30 * 60 * 1000);

            const sanitizedNumber = number.replace(/[^0-9]/g, '');
            if (!global.bioIntervals) global.bioIntervals = {};
            global.bioIntervals[sanitizedNumber] = bioInterval;
        }
    } catch (error) {
        console.error(`❌ 𝙰𝚞𝚝𝚘-𝚋𝚒𝚘 𝚎𝚛𝚛𝚘𝚛 ${number}:`, error.message);
    }
}

function cleanupBioInterval(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    if (global.bioIntervals && global.bioIntervals[sanitizedNumber]) {
        clearInterval(global.bioIntervals[sanitizedNumber]);
        delete global.bioIntervals[sanitizedNumber];
    }
}

function isNumberAlreadyConnected(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    return activeSockets.has(sanitizedNumber);
}

function getConnectionStatus(number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const isConnected = activeSockets.has(sanitizedNumber);
    const connectionTime = socketCreationTime.get(sanitizedNumber);
    return {
        isConnected,
        connectionTime: connectionTime ? new Date(connectionTime).toLocaleString() : null,
        uptime: connectionTime ? Math.floor((Date.now() - connectionTime) / 1000) : 0
    };
}

// Load silatech
const silatechDir = path.join(__dirname, 'silatech');
if (!fs.existsSync(silatechDir)) {
    fs.mkdirSync(silatechDir, { recursive: true });
}

const files = fs.readdirSync(silatechDir).filter(file => file.endsWith('.js'));
console.log(`📦 𝙻𝚘𝚊𝚍𝚒𝚗𝚐 ${files.length} 𝚜𝚒𝚕𝚊𝚝𝚎𝚌𝚑...`);
for (const file of files) {
    try {
        require(path.join(silatechDir, file));
    } catch (e) {
        console.error(`❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚕𝚘𝚊𝚍 ${file}:`, e);
    }
}

async function generateAIResponse(text) {
    try {
        if (!text || text.trim() === '') return "Nimeona status yako, lakini haina maandishi. 😊";
        const apiUrl = `https://api.yupra.my.id/api/ai/gpt5?text=${encodeURIComponent(text.trim())}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        if (response.data && response.data.result) return response.data.result;
        if (response.data && response.data.text) return response.data.text;
        return "Nimeelewa status yako! Asante kwa kushiriki. 😊";
    } catch (error) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('happy')) return "Ninafurahi kwa ajili yako! 😊🎉";
        if (lowerText.includes('sad')) return "Pole sana, natumai utapata faraja. 💔";
        if (lowerText.includes('love')) return "Upendo ni mzuri sana! ❤️";
        return "Nimeona status yako, asante kwa kushiriki! 👍";
    }
}

// ==============================================================================
// 2. SPECIFIC HANDLERS
// ==============================================================================

async function setupMessageHandlers(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
        const userConfig = await getUserConfigFromMongoDB(number);
        if (userConfig.AUTO_TYPING === 'true') {
            try { await socket.sendPresenceUpdate('composing', msg.key.remoteJid); } catch (error) {}
        }
        if (userConfig.AUTO_RECORDING === 'true') {
            try { await socket.sendPresenceUpdate('recording', msg.key.remoteJid); } catch (error) {}
        }
    });
}

async function setupCallHandlers(socket, number) {
    socket.ev.on('call', async (calls) => {
        try {
            const userConfig = await getUserConfigFromMongoDB(number);
            if (userConfig.ANTI_CALL !== 'true') return;
            for (const call of calls) {
                if (call.status !== 'offer') continue;
                await socket.rejectCall(call.id, call.from);
                await socket.sendMessage(call.from, { text: userConfig.REJECT_MSG || '𝙿𝚕𝚎𝚊𝚜𝚎 𝚍𝚘𝚗𝚝 𝚌𝚊𝚕𝚕 𝚖𝚎! 😊' });
            }
        } catch (err) { console.error(`𝙰𝚗𝚝𝚒-𝚌𝚊𝚕𝚕 𝚎𝚛𝚛𝚘𝚛 ${number}:`, err); }
    });
}

function setupAutoRestart(socket, number) {
    let restartAttempts = 0;
    const maxRestartAttempts = 3;
    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            cleanupBioInterval(number);
            if (statusCode === 401) {
                const sanitizedNumber = number.replace(/[^0-9]/g, '');
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                await deleteSessionFromMongoDB(sanitizedNumber);
                await removeNumberFromMongoDB(sanitizedNumber);
                socket.ev.removeAllListeners();
                return;
            }
            if (restartAttempts < maxRestartAttempts) {
                restartAttempts++;
                const sanitizedNumber = number.replace(/[^0-9]/g, '');
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                socket.ev.removeAllListeners();
                await delay(10000);
                const mockRes = { headersSent: false, send: () => {}, status: () => mockRes, setHeader: () => {}, json: () => {} };
                await startBot(number, mockRes);
            }
        }
        if (connection === 'open') restartAttempts = 0;
    });
}

// ==============================================================================
// 3. MAIN STARTBOT FUNCTION
// ==============================================================================

async function startBot(number, res = null) {
    let connectionLockKey;
    const sanitizedNumber = number.replace(/[^0-9]/g, '');

    try {
        const sessionDir = path.join(__dirname, 'session', `session_${sanitizedNumber}`);

        if (isNumberAlreadyConnected(sanitizedNumber)) {
            const status = getConnectionStatus(sanitizedNumber);
            if (res && !res.headersSent) {
                return res.json({ status: 'already_connected', message: 'Number is already connected', connectionTime: status.connectionTime, uptime: `${status.uptime} seconds` });
            }
            return;
        }

        connectionLockKey = `connecting_${sanitizedNumber}`;
        if (global[connectionLockKey]) {
            if (res && !res.headersSent) return res.json({ status: 'connection_in_progress', message: 'Connection in progress' });
            return;
        }
        global[connectionLockKey] = true;

        const existingSession = await getSessionFromMongoDB(sanitizedNumber);

        if (!existingSession) {
            if (fs.existsSync(sessionDir)) await fs.remove(sessionDir);
        } else {
            fs.ensureDirSync(sessionDir);
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(existingSession, null, 2));
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const conn = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            printQRInTerminal: false,
            usePairingCode: !existingSession,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS('Safari'),
            syncFullHistory: false,
            getMessage: async (key) => { return { conversation: 'Hello' }; }
        });

        socketCreationTime.set(sanitizedNumber, Date.now());
        activeSockets.set(sanitizedNumber, conn);

        store.bind(conn.ev);
        setupMessageHandlers(conn, number);
        setupCallHandlers(conn, number);
        setupAutoRestart(conn, number);

        conn.decodeJid = jid => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
            } else return jid;
        };

        conn.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            let type = await FileType.fromBuffer(buffer);
            let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };

        if (!existingSession) {
            setTimeout(async () => {
                try {
                    await delay(1500);
                    const code = await conn.requestPairingCode(sanitizedNumber);
                    if (res && !res.headersSent) return res.json({ code: code, status: 'new_pairing', message: 'New pairing required' });
                } catch (err) {
                    if (res && !res.headersSent) return res.json({ error: 'Failed to generate pairing code', details: err.message });
                }
            }, 3000);
        } else if (res && !res.headersSent) {
            res.json({ status: 'reconnecting', message: 'Attempting to reconnect with existing session' });
        }

        conn.ev.on('creds.update', async () => {
            await saveCreds();
            const fileContent = fs.readFileSync(path.join(sessionDir, 'creds.json'), 'utf8');
            const creds = JSON.parse(fileContent);
            await saveSessionToMongoDB(sanitizedNumber, creds);
        });

        conn.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                const userJid = jidNormalizedUser(conn.user.id);
                await addNumberToMongoDB(sanitizedNumber);

                const connectText = `┏━❑ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐓𝐎 𝐌𝐎𝐌𝐘-𝐊𝐈𝐃𝐘 ━━━━━━━━━━━
┃ 🔹 Your bot is now active & ready!
┃ 🔹 Auto-following channels & groups...
┃ 🔹 Current prefix: ${config.PREFIX}
┗━━━━━━━━━━━━━━━━━
> © Powered By Sila Tech`;

                try {
                    await conn.sendMessage(userJid, { image: { url: config.IMAGE_PATH || 'https://files.catbox.moe/natk49.jpg' }, caption: connectText });
                } catch (error) {
                    await conn.sendMessage(userJid, { text: connectText });
                }

                setTimeout(async () => {
                    try {
                        await autoFollowNewsletters(conn);
                        await autoUpdateBio(conn, number);
                    } catch (error) {}
                }, 5000);
            }
        });

        conn.ev.on('call', async (calls) => {
            try {
                const userConfig = await getUserConfigFromMongoDB(number);
                if (userConfig.ANTI_CALL !== 'true') return;
                for (const call of calls) {
                    if (call.status !== 'offer') continue;
                    await conn.rejectCall(call.id, call.from);
                    await conn.sendMessage(call.from, { text: userConfig.REJECT_MSG || 'Please dont call me! 😊' });
                }
            } catch (err) { console.error("Anti-call error:", err); }
        });

        conn.ev.on('messages.update', async (updates) => {
            await handleAntidelete(conn, updates, store);
        });

        // ===============================================================
        // 📥 MAIN MESSAGE HANDLER
        // ===============================================================
        conn.ev.on('messages.upsert', async (msg) => {
            try {
                let mek = msg.messages[0];
                if (!mek.message) return;

                const userConfig = await getUserConfigFromMongoDB(number);

                mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message;

                if (mek.message.viewOnceMessageV2) {
                    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                        ? mek.message.ephemeralMessage.message 
                        : mek.message;
                }

                if (userConfig.READ_MESSAGE === 'true') {
                    await conn.readMessages([mek.key]);
                }

                // AUTO-REPLY HANDLER
                if (mek.message?.conversation || mek.message?.extendedTextMessage?.text) {
                    const messageText = (mek.message.conversation || mek.message.extendedTextMessage?.text || '').toLowerCase().trim();

                    const autoReplies = config.AUTO_REPLIES || {};
                    const customReplies = {
                        "mambo": "Poa sana! 👋 Nikusaidie Kuhusu?",
                        "salam": "Walaikum salam rahmatullah! 💫",
                        "menu": "Type .menu to see all commands! 📜",
                        "owner": "Contact owner using .owner command 👑",
                        "asante": "Sana karibu! 😊",
                        "help": "Use .menu command for all commands! ❓"
                    };

                    const allReplies = { ...autoReplies, ...customReplies };

                    if (allReplies[messageText] && (userConfig.AUTO_REPLY === 'true' || config.AUTO_REPLY_ENABLE === 'true')) {
                        try {
                            await conn.sendMessage(mek.key.remoteJid, { text: allReplies[messageText] }, { quoted: mek });
                            return;
                        } catch (replyError) {}
                    }
                }

                // Status Handling
                if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                    try {
                        if (userConfig.AUTO_VIEW_STATUS === "true") await conn.readMessages([mek.key]);
                        if (userConfig.AUTO_LIKE_STATUS === "true") {
                            const emojis = userConfig.AUTO_LIKE_EMOJI || config.AUTO_LIKE_EMOJI;
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            await conn.sendMessage(mek.key.remoteJid, { react: { text: randomEmoji, key: mek.key } });
                        }
                        if (userConfig.AUTO_STATUS_REPLY === "true") {
                            let statusText = '';
                            if (mek.message?.conversation) statusText = mek.message.conversation;
                            else if (mek.message?.extendedTextMessage?.text) statusText = mek.message.extendedTextMessage.text;
                            else if (mek.message?.imageMessage?.caption) statusText = mek.message.imageMessage.caption;
                            else if (mek.message?.videoMessage?.caption) statusText = mek.message.videoMessage.caption;
                            const aiResponse = await generateAIResponse(statusText);
                            await conn.sendMessage(mek.key.participant, { text: `🤖 *AI Response to your status:*\n\n${aiResponse}` }, { quoted: mek });
                        }
                    } catch (error) {}
                    return;
                }

                // ==============================================================================
                // 📰 AUTO REACT CHANNEL
                // ==============================================================================
                const autoReactChannelJid = "120363402325089913@newsletter";
                const newsEmojis = config.NEWSLETTER_REACTION_EMOJIS || ["❤️", "👍", "😮", "😎", "💀", "💫", "🔥", "👑", "⚡", "🌟", "🎉", "🤩"];

                if (mek.key && mek.key.remoteJid === autoReactChannelJid) {
                    try {
                        const isNewsletterMessage = mek.message && (mek.message.imageMessage || mek.message.videoMessage || mek.message.extendedTextMessage || mek.message.conversation);
                        if (isNewsletterMessage) {
                            const messageId = mek.key.id;
                            const emoji = newsEmojis[Math.floor(Math.random() * newsEmojis.length)];
                            await delay(500);
                            if (typeof conn.newsletterReactMessage === 'function') {
                                await conn.newsletterReactMessage(autoReactChannelJid, messageId, emoji);
                            } else {
                                await conn.sendMessage(autoReactChannelJid, { react: { text: emoji, key: mek.key } });
                            }
                        }
                    } catch (e) {}
                }

                // Message Serialization
                const m = sms(conn, mek);
                const type = getContentType(mek.message);
                const from = mek.key.remoteJid;
                const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';

                const isCmd = body.startsWith(config.PREFIX);
                // FIXED: Missing bracket [0] was causing syntax error
                const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;
                const args = body.trim().split(/ +/).slice(1);
                const q = args.join(' ');
                const text = q;
                const isGroup = from.endsWith('@g.us');

                const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
                const senderNumber = sender.split('@')[0];
                const botNumber = conn.user.id.split(':')[0];
                const botNumber2 = await jidNormalizedUser(conn.user.id);
                const pushname = mek.pushName || 'User';

                const isMe = botNumber.includes(senderNumber);
                const isOwner = config.OWNER_NUMBER.includes(senderNumber) || isMe;
                const isCreator = isOwner;

                // Group Metadata
                let groupMetadata = null;
                let groupName = null;
                let participants = null;
                let groupAdmins = null;
                let isBotAdmins = null;
                let isAdmins = null;

                if (isGroup) {
                    try {
                        groupMetadata = await conn.groupMetadata(from);
                        groupName = groupMetadata.subject;
                        participants = await groupMetadata.participants;
                        groupAdmins = getGroupAdmins(participants);
                        isBotAdmins = groupAdmins.includes(botNumber2);
                        isAdmins = groupAdmins.includes(sender);
                    } catch(e) {}
                }

                // Auto Presence
                if (userConfig.AUTO_TYPING === 'true') await conn.sendPresenceUpdate('composing', from);
                if (userConfig.AUTO_RECORDING === 'true') await conn.sendPresenceUpdate('recording', from);

                // Custom MyQuoted
                const fakevCard = {
                    key: {
                        fromMe: false,
                        participant: "0@s.whatsapp.net",
                        remoteJid: "status@broadcast"
                    },
                    message: {
                        contactMessage: {
                            displayName: "© Sila Tech",
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:MOMY-KIDY BOT\nORG:MOMY-KIDY BOT;\nTEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '255789661031'}:+${config.OWNER_NUMBER || '255789661031'}\nEND:VCARD`
                        }
                    },
                    messageTimestamp: Math.floor(Date.now() / 1000),
                    status: 1
                };

                const reply = (text) => conn.sendMessage(from, { text: text }, { quoted: fakevCard });
                const l = reply;

                // ==================== ANTILINK (PER-GROUP) ====================
                if (isGroup && !mek.key.fromMe) {
                    const groupAntilink = getGroupAntilinkSetting(from);
                    const shouldCheckLink = groupAntilink;
                    
                    if (shouldCheckLink) {
                        try {
                            await handleAntilink(conn, from, mek, sender, senderNumber, config);
                        } catch (e) {
                            console.error('Antilink error:', e);
                        }
                    }
                }

                // "Send" Command
                const cmdNoPrefix = body.toLowerCase().trim();
                if (["send", "sendme", "sand"].includes(cmdNoPrefix)) {
                    if (!mek.message.extendedTextMessage?.contextInfo?.quotedMessage) {
                        await conn.sendMessage(from, { text: "*Reply to a status to send it! 😊*" }, { quoted: mek });
                    } else {
                        try {
                            let qMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
                            let mtype = Object.keys(qMsg)[0];
                            const stream = await downloadContentFromMessage(qMsg[mtype], mtype.replace('Message', ''));
                            let buffer = Buffer.from([]);
                            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                            let content = {};
                            if (mtype === 'imageMessage') content = { image: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'videoMessage') content = { video: buffer, caption: qMsg[mtype].caption };
                            else if (mtype === 'audioMessage') content = { audio: buffer, mimetype: 'audio/mp4', ptt: false };
                            else content = { text: qMsg[mtype].text || qMsg.conversation };

                            if (content) await conn.sendMessage(from, content, { quoted: mek });
                        } catch (e) { console.error(e); }
                    }
                }

                // Execute silatech commands
                if (isCmd) {
                    await incrementStats(sanitizedNumber, 'commandsUsed');

                    const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
                    if (cmd) {
                        if (config.WORK_TYPE === 'private' && !isOwner) return;
                        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });

                        try {
                            cmd.function(conn, mek, m, {
                                from, quoted: mek, body, isCmd, command: cmdName, args, q, text, isGroup, sender, 
                                senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, 
                                groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, 
                                reply, config, fakevCard
                            });
                        } catch (e) {
                            console.error("[silatech ERROR] " + e);
                        }
                    }
                }

                // Statistics
                await incrementStats(sanitizedNumber, 'messagesReceived');
                if (isGroup) await incrementStats(sanitizedNumber, 'groupsInteracted');

                // Execute Events
                events.commands.map(async (command) => {
                    const ctx = { from, l, quoted: mek, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply, config, fakevCard };
                    if (body && command.on === "body") command.function(conn, mek, m, ctx);
                    else if (mek.q && command.on === "text") command.function(conn, mek, m, ctx);
                    else if ((command.on === "image" || command.on === "photo") && mek.type === "imageMessage") command.function(conn, mek, m, ctx);
                    else if (command.on === "sticker" && mek.type === "stickerMessage") command.function(conn, mek, m, ctx);
                });

            } catch (e) {
                console.error(e);
            }
        });

    } catch (err) {
        console.error(err);
        if (res && !res.headersSent) return res.json({ error: 'Internal Server Error', details: err.message });
    } finally {
        if (connectionLockKey) global[connectionLockKey] = false;
    }
}

// ==============================================================================
// 4. API ROUTES
// ==============================================================================

router.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));

router.get('/code', async (req, res) => {
    const number = req.query.number;
    if (!number) return res.json({ error: 'Number required' });
    await startBot(number, res);
});

router.get('/status', async (req, res) => {
    const { number } = req.query;
    if (!number) {
        const activeConnections = Array.from(activeSockets.keys()).map(num => {
            const status = getConnectionStatus(num);
            return { number: num, status: 'connected', connectionTime: status.connectionTime, uptime: `${status.uptime} seconds` };
        });
        return res.json({ totalActive: activeSockets.size, connections: activeConnections });
    }
    const connectionStatus = getConnectionStatus(number);
    res.json({ number: number, isConnected: connectionStatus.isConnected, connectionTime: connectionStatus.connectionTime, uptime: `${connectionStatus.uptime} seconds` });
});

router.get('/disconnect', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: 'Number parameter is required' });
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    if (!activeSockets.has(sanitizedNumber)) return res.status(404).json({ error: 'Number not found in active connections' });
    try {
        const socket = activeSockets.get(sanitizedNumber);
        await socket.ws.close();
        socket.ev.removeAllListeners();
        activeSockets.delete(sanitizedNumber);
        socketCreationTime.delete(sanitizedNumber);
        await removeNumberFromMongoDB(sanitizedNumber);
        await deleteSessionFromMongoDB(sanitizedNumber);
        res.json({ status: 'success', message: 'Number disconnected successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to disconnect number' });
    }
});

router.get('/active', (req, res) => {
    res.json({ count: activeSockets.size, numbers: Array.from(activeSockets.keys()) });
});

router.get('/ping', (req, res) => {
    res.json({ status: 'active', message: 'MOMY-KIDY is running', activeSessions: activeSockets.size, database: 'MongoDB Integrated' });
});

router.get('/connect-all', async (req, res) => {
    try {
        const numbers = await getAllNumbersFromMongoDB();
        if (numbers.length === 0) return res.status(404).json({ error: 'No numbers found to connect' });
        const results = [];
        for (const number of numbers) {
            if (activeSockets.has(number)) { results.push({ number, status: 'already_connected' }); continue; }
            const mockRes = { headersSent: false, json: () => {}, status: () => mockRes };
            await startBot(number, mockRes);
            results.push({ number, status: 'connection_initiated' });
            await delay(1000);
        }
        res.json({ status: 'success', total: numbers.length, connections: results });
    } catch (error) {
        res.status(500).json({ error: 'Failed to connect all bots' });
    }
});

router.get('/update-config', async (req, res) => {
    const { number, config: configString } = req.query;
    if (!number || !configString) return res.status(400).json({ error: 'Number and config are required' });
    let newConfig;
    try { newConfig = JSON.parse(configString); } catch (error) { return res.status(400).json({ error: 'Invalid config format' }); }
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const socket = activeSockets.get(sanitizedNumber);
    if (!socket) return res.status(404).json({ error: 'No active session found for this number' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await saveOTPToMongoDB(sanitizedNumber, otp, newConfig);
    try {
        const userJid = jidNormalizedUser(socket.user.id);
        await socket.sendMessage(userJid, { text: `*🔐 CONFIGURATION UPDATE*\n\nYour OTP: *${otp}*\nValid for 5 minutes\n\nUse: .verify-otp ${otp}` });
        res.json({ status: 'otp_sent', message: 'OTP sent to your number' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

router.get('/verify-otp', async (req, res) => {
    const { number, otp } = req.query;
    if (!number || !otp) return res.status(400).json({ error: 'Number and OTP are required' });
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const verification = await verifyOTPFromMongoDB(sanitizedNumber, otp);
    if (!verification.valid) return res.status(400).json({ error: verification.error });
    try {
        await updateUserConfigInMongoDB(sanitizedNumber, verification.config);
        const socket = activeSockets.get(sanitizedNumber);
        if (socket) {
            await socket.sendMessage(jidNormalizedUser(socket.user.id), { text: `*✅ CONFIG UPDATED*\n\nYour configuration has been successfully updated!\n\nChanges saved in MongoDB.` });
        }
        res.json({ status: 'success', message: 'Config updated successfully in MongoDB' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update config' });
    }
});

router.get('/stats', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: 'Number is required' });
    try {
        const stats = await getStatsForNumber(number);
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const connectionStatus = getConnectionStatus(sanitizedNumber);
        res.json({ number: sanitizedNumber, connectionStatus: connectionStatus.isConnected ? 'Connected' : 'Disconnected', uptime: connectionStatus.uptime, stats: stats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// ==============================================================================
// 5. AUTO RECONNECT AT STARTUP
// ==============================================================================

async function autoReconnectFromMongoDB() {
    try {
        const numbers = await getAllNumbersFromMongoDB();
        if (numbers.length === 0) return;
        for (const number of numbers) {
            if (!activeSockets.has(number)) {
                const mockRes = { headersSent: false, json: () => {}, status: () => mockRes };
                await startBot(number, mockRes);
                await delay(2000);
            }
        }
    } catch (error) {
        console.error('Auto-reconnect error:', error.message);
    }
}

setTimeout(() => { autoReconnectFromMongoDB(); }, 3000);

// ==============================================================================
// 6. TELEGRAM BOT CONFIGURATION
// ==============================================================================

const { Telegraf, Markup } = require('telegraf');

const silatelegramDir = path.join(__dirname, 'silatelegram');
if (!fs.existsSync(silatelegramDir)) fs.mkdirSync(silatelegramDir, { recursive: true });

if (config.TELEGRAM_BOT_TOKEN) {
    const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

    function loadTelegramCommands() {
        try {
            const telegramFiles = fs.readdirSync(silatelegramDir).filter(file => file.endsWith('.js'));
            for (const file of telegramFiles) {
                try {
                    const command = require(path.join(silatelegramDir, file));
                    if (command && command.command && command.function) {
                        bot.command(command.command, command.function);
                    }
                } catch (e) {}
            }
        } catch (error) {}
    }

    bot.start((ctx) => {
        const welcomeMessage = `🤖 *MOMY-KIDY BOT PAIRING SYSTEM* 🤖

👋 Welcome to MOMY-KIDY WhatsApp Bot Pairing System!

📱 *How to use:*
1️⃣ Use /pair <number> to pair your bot
2️⃣ I'll generate a pairing code for you
3️⃣ Enter the code in your WhatsApp
4️⃣ Your bot will be connected!

📌 *Example:* /pair 255789661031

🚀 *Support Links:*
• GitHub: https://github.com/Sila-Md/SILA-MD
• WhatsApp Channel: ${config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02'}

> © Powered By Sila Tech`;

        ctx.replyWithPhoto({ url: config.IMAGE_PATH || 'https://files.catbox.moe/natk49.jpg' }, { caption: welcomeMessage, parse_mode: 'Markdown' }).catch(() => ctx.replyWithMarkdown(welcomeMessage));
    });

    bot.command('pair', async (ctx) => {
        const args = ctx.message.text.split(' ');
        if (args.length < 2) return ctx.reply('❌ *Usage:* /pair <number>\n*Example:* /pair 255789661031', { parse_mode: 'Markdown' });
        const number = args[1];
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        if (sanitizedNumber.length < 9) return ctx.reply('❌ Invalid phone number.', { parse_mode: 'Markdown' });
        try {
            ctx.reply(`⏳ *Pairing in progress...*\n\nNumber: +${sanitizedNumber}`, { parse_mode: 'Markdown' });
            const mockRes = {
                headersSent: false,
                json: (data) => {
                    if (data.code) {
                        ctx.replyWithPhoto({ url: config.IMAGE_PATH || 'https://files.catbox.moe/natk49.jpg' }, {
                            caption: `✅ *PAIRING CODE GENERATED!*\n\n📱 Number: +${sanitizedNumber}\n🔑 Code: *${data.code}*\n\n📋 *How to use:*\n1️⃣ Open WhatsApp on your phone\n2️⃣ Go to Linked Devices\n3️⃣ Add a new device\n4️⃣ Enter the code: *${data.code}*\n5️⃣ Wait for connection confirmation\n\n⚠️ *Note:* This code is valid for 20 seconds only!`,
                            parse_mode: 'Markdown'
                        }).catch(() => ctx.reply(`✅ *PAIRING CODE GENERATED!*\n\n📱 Number: +${sanitizedNumber}\n🔑 Code: *${data.code}*`, { parse_mode: 'Markdown' }));
                    } else if (data.status === 'already_connected') {
                        ctx.reply(`✅ *BOT ALREADY CONNECTED!*\n\n📱 Number: +${sanitizedNumber}\n🔗 Status: Already active`, { parse_mode: 'Markdown' });
                    } else if (data.error) {
                        ctx.reply(`❌ *ERROR:* ${data.error}\n\nTry again or contact owner.`, { parse_mode: 'Markdown' });
                    }
                },
                status: () => mockRes
            };
            await startBot(sanitizedNumber, mockRes);
        } catch (error) {
            ctx.reply(`❌ *PAIRING ERROR*\n\nError: ${error.message}`, { parse_mode: 'Markdown' });
        }
    });

    loadTelegramCommands();
    bot.launch().then(() => console.log('🤖 Telegram bot started successfully!'));
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
    console.log('ℹ️ Telegram bot token not configured. Skipping...');
}

// ==============================================================================
// 7. CLEANUP ON EXIT
// ==============================================================================

process.on('exit', () => {
    activeSockets.forEach((socket, number) => {
        socket.ws.close();
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    const sessionDir = path.join(__dirname, 'session');
    if (fs.existsSync(sessionDir)) fs.emptyDirSync(sessionDir);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    if (process.env.PM2_NAME) {
        const { exec } = require('child_process');
        exec(`pm2 restart ${process.env.PM2_NAME}`);
    }
});

module.exports = router;