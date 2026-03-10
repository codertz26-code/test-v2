const { cmd } = require('../momy');
const config = require('../config');
const axios = require('axios');

const API_KEY = 'freepublic';
const BASE_URL = 'https://exsalapi.my.id/api';

// ===================== TXT2VID - Text to Video =====================
cmd({
    pattern: "veo3",
    alias: ["text2video", "txt2vid", "aivideo"],
    react: "🎥",
    desc: "Generate video from text description",
    category: "ai"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚝𝚎𝚡𝚝 𝚙𝚛𝚘𝚖𝚙𝚝\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚝𝚡𝚝𝟸𝚟𝚒𝚍 𝙲𝚊𝚝 𝚜𝚊𝚢𝚒𝚗𝚐 𝙷𝚎𝚕𝚕𝚘`);

        await conn.sendPresenceUpdate('composing', from);
        
        const apiUrl = `${BASE_URL}/ai/video/aritek/txt2vid?prompt=${encodeURIComponent(q)}&apikey=${API_KEY}`;
        
        // Try to fetch video
        const response = await axios.get(apiUrl, { 
            timeout: 60000,
            responseType: 'arraybuffer'
        });
        
        if (!response.data) throw new Error('No video generated');
        
        await conn.sendPresenceUpdate('paused', from);
        
        // Send as video
        await conn.sendMessage(from, {
            video: Buffer.from(response.data),
            caption: `━━━━━━━━━━━━━━━━━━━━━━\n    𝚃𝚇𝚃𝟸𝚅𝙸𝙳 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴𝙳    \n━━━━━━━━━━━━━━━━━━━━━━\n\n𝙿𝚛𝚘𝚖𝚙𝚝: ${q}\n━━━━━━━━━━━━━━━━━━━━━━`
        });
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}\n\n𝙽𝚘𝚝𝚎: 𝙰𝙿𝙸 𝚖𝚊𝚢 𝚋𝚎 𝚞𝚗𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎`);
    }
});

// ===================== IMAGEN-4 - Text to Image =====================
cmd({
    pattern: "imagen4",
    alias: ["imagen", "genimage", "aiimage", "text2img"],
    react: "🖼️",
    desc: "Generate image from text using Imagen-4",
    category: "ai"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚝𝚎𝚡𝚝 𝚙𝚛𝚘𝚖𝚙𝚝\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚒𝚖𝚊𝚐𝚎𝚗𝟺 𝙲𝚊𝚝 𝚜𝚊𝚢𝚒𝚗𝚐 𝚂𝙸𝙻𝙰 𝙼𝙳`);

        await conn.sendPresenceUpdate('composing', from);
        
        const apiUrl = `${BASE_URL}/ai/image/imagen-4?prompt=${encodeURIComponent(q)}&apikey=${API_KEY}`;
        
        const response = await axios.get(apiUrl, { 
            timeout: 30000,
            responseType: 'arraybuffer'
        });
        
        if (!response.data) throw new Error('No image generated');
        
        await conn.sendPresenceUpdate('paused', from);
        
        await conn.sendMessage(from, {
            image: Buffer.from(response.data),
            caption: `━━━━━━━━━━━━━━━━━━━━━━\n    𝙸𝙼𝙰𝙶𝙴𝙽-𝟺 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴𝙳    \n━━━━━━━━━━━━━━━━━━━━━━\n\n𝙿𝚛𝚘𝚖𝚙𝚝: ${q}\n━━━━━━━━━━━━━━━━━━━━━━`
        });
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}\n\n𝙽𝚘𝚝𝚎: 𝙰𝙿𝙸 𝚖𝚊𝚢 𝚋𝚎 𝚞𝚗𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎`);
    }
});

// ===================== IMG2PROMPT - Image to Prompt =====================
cmd({
    pattern: "img2prompt",
    alias: ["imagetoprompt", "img2pro", "imgdesc"],
    react: "🔍",
    desc: "Generate prompt description from image URL",
    category: "ai"
},
async(conn, mek, m, { from, q, reply, quoted }) => {
    try {
        // Get image URL from quoted message or direct input
        let imageUrl = q;
        
        if (!imageUrl && quoted) {
            // Try to get image from quoted message
            const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMsg?.imageMessage) {
                const media = await conn.downloadAndSaveMediaMessage(quoted);
                // Upload to temporary hosting or use direct URL approach
                reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚍𝚒𝚛𝚎𝚌𝚝 𝚒𝚖𝚊𝚐𝚎 𝚄𝚁𝙻 𝚏𝚘𝚛 𝚗𝚘𝚠`);
                return;
            }
        }
        
        if (!imageUrl) {
            return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊𝚗 𝚒𝚖𝚊𝚐𝚎 𝚄𝚁𝙻\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚒𝚖𝚐𝟸𝚙𝚛𝚘𝚖𝚙𝚝 https://files.catbox.moe/98k75b.jpeg`);
        }

        await conn.sendPresenceUpdate('composing', from);
        
        const apiUrl = `${BASE_URL}/ai/image/img2prompt?url=${encodeURIComponent(imageUrl)}&apikey=${API_KEY}`;
        
        const response = await axios.get(apiUrl);
        
        if (!response.data?.status) throw new Error('Failed to analyze image');
        
        const data = response.data.data;
        
        let message = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `    𝙸𝙼𝙰𝙶𝙴 𝙿𝚁𝙾𝙼𝙿𝚃    \n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `🖼️ *𝙾𝚛𝚒𝚐𝚒𝚗𝚊𝚕 𝚄𝚁𝙻:*\n${data.original_url}\n\n`;
        message += `📝 *𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚎𝚍 𝙿𝚛𝚘𝚖𝚙𝚝:*\n${data.prompt}\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `> 𝚄𝚜𝚎 𝚝𝚑𝚒𝚜 𝚙𝚛𝚘𝚖𝚙𝚝 𝚠𝚒𝚝𝚑 .𝚒𝚖𝚊𝚐𝚎𝚗𝟺`;
        
        reply(message);
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});

// ===================== IMAGEN HELP =====================
cmd({
    pattern: "aihelp",
    alias: ["exsalhelp"],
    react: "❓",
    desc: "Help for ExsalAI commands",
    category: "ai"
},
async(conn, mek, m, { from, reply }) => {
    const help = `━━━━━━━━━━━━━━━━━━━━━━
    𝚂𝙸𝙻𝙰 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂    
━━━━━━━━━━━━━━━━━━━━━━

🎥 *.txt2vid <prompt>*
   Generate video from text
   Ex: .txt2vid Cat dancing

🖼️ *.imagen4 <prompt>*
   Generate image from text
   Ex: .imagen4 Beautiful sunset

🔍 *.img2prompt <image_url>*
   Get prompt from image
   Ex: .img2prompt https://...

━━━━━━━━━━━━━━━━━━━━━━
> 𝙽𝚘𝚝𝚎: 𝙰𝙿𝙸 𝚜𝚎𝚛𝚟𝚒𝚌𝚎 𝚖𝚊𝚢 𝚋𝚎 𝚞𝚗𝚜𝚝𝚊𝚋𝚕𝚎
━━━━━━━━━━━━━━━━━━━━━━`;

    reply(help);
});
