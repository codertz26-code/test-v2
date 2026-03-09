const { cmd, commands } = require('../momy');

// Define combined fakevCard 
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© 𝐒𝐈𝐋𝐀-𝐌𝐃",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:𝐒𝐈𝐋𝐀 𝐌𝐃 𝐁𝐎𝐓\nORG:𝐒𝐈𝐋𝐀-𝐌𝐃;\nTEL;type=CELL;type=VOICE;waid=255789661031:+255789661031\nEND:VCARD`
    }
  }
};

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '© 𝐒𝐈𝐋𝐀 𝐌𝐃',
            serverMessageId: 143,
        },
    };
};

// Stylized characters for reaction
const stylizedChars = {
    a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖',
    h: '🅗', i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝',
    o: '🅞', p: '🅟', q: '🅠', r: '🅡', s: '🅢', t: '🅣', u: '🅤',
    v: '🅥', w: '🅦', x: '🅧', y: '🅨', z: '🅩',
    '0': '⓿', '1': '➊', '2': '➋', '3': '➌', '4': '➍',
    '5': '➎', '6': '➏', '7': '➐', '8': '➑', '9': '➒'
};

cmd({
    pattern: "ch",
    alias: ["channel", "chreact", "newsletter"],
    react: "📢",
    desc: "React to channel messages with stylized text",
    category: "owner",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    // Owner check
    if (!isOwner) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    if (!q) {
        return await conn.sendMessage(from, {
            text: `┏━❑ 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 𝐑𝐄𝐀𝐂𝐓𝐈𝐎𝐍 ━━━━━━━━
┃ 📢 𝚁𝚎𝚊𝚌𝚝 𝚝𝚘 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚖𝚎𝚜𝚜𝚊𝚐𝚎𝚜
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 𝐔𝐬𝐚𝐠𝐞:
┃ • ${prefix}ch <channel-link> <text>
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 𝙴𝚡𝚊𝚖𝚙𝚕𝚎:
┃ • ${prefix}ch https://whatsapp.com/channel/1234567890 hello
┃ • ${prefix}ch https://whatsapp.com/channel/1234567890 sila
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    const [link, ...textParts] = q.split(' ');
    
    // Validate channel link
    if (!link.includes("whatsapp.com/channel/")) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚕𝚒𝚗𝚔 𝚏𝚘𝚛𝚖𝚊𝚝\n\n𝙻𝚒𝚗𝚔 𝚖𝚞𝚜𝚝 𝚌𝚘𝚗𝚝𝚊𝚒𝚗: 𝚠𝚑𝚊𝚝𝚜𝚊𝚙𝚙.𝚌𝚘𝚖/𝚌𝚑𝚊𝚗𝚗𝚎𝚕/`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    // Validate text
    const inputText = textParts.join(' ').toLowerCase();
    if (!inputText) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚝𝚎𝚡𝚝 𝚝𝚘 𝚌𝚘𝚗𝚟𝚎𝚛𝚝 𝚝𝚘 𝚛𝚎𝚊𝚌𝚝𝚒𝚘𝚗`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    // Convert text to stylized emoji
    const emoji = inputText
        .split('')
        .map(char => {
            if (char === ' ') return '―';
            if (char === '.') return '•';
            if (char === '!') return '❗';
            if (char === '?') return '❓';
            return stylizedChars[char] || char;
        })
        .join('');
    
    try {
        // Extract channel ID and message ID from link
        const linkParts = link.split('/');
        const channelId = linkParts[4];
        const messageId = linkParts[5];
        
        if (!channelId || !messageId) {
            return await conn.sendMessage(from, {
                text: `❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚕𝚒𝚗𝚔 - 𝚖𝚒𝚜𝚜𝚒𝚗𝚐 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚘𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝙸𝙳`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }
        
        // Get channel metadata
        const channelMeta = await conn.newsletterMetadata("invite", channelId);
        
        // Send reaction
        await conn.newsletterReactMessage(channelMeta.id, messageId, emoji);
        
        // Success message
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 𝐑𝐄𝐀𝐂𝐓𝐈𝐎𝐍 ━━━━━━━━
┃ ✅ 𝚁𝚎𝚊𝚌𝚝𝚒𝚘𝚗 𝚜𝚎𝚗𝚝 𝚜𝚞𝚌𝚌𝚎𝚜𝚜𝚏𝚞𝚕𝚕𝚢!
┃ ━━━━━━━━━━━━━━━━━━━━━━
┃ 📢 𝙲𝚑𝚊𝚗𝚗𝚎𝚕: ${channelMeta.name || 'Unknown'}
┃ 🔤 𝚃𝚎𝚡𝚝: ${inputText}
┃ ✨ 𝚁𝚎𝚊𝚌𝚝𝚒𝚘𝚗: ${emoji}
┃ 🆔 𝙲𝚑𝚊𝚗𝚗𝚎𝚕 𝙸𝙳: ${channelId}
┃ 📝 𝙼𝚎𝚜𝚜𝚊𝚐𝚎 𝙸𝙳: ${messageId}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
    } catch (e) {
        if (e.message.includes('not found') || e.message.includes('404')) {
            await conn.sendMessage(from, {
                text: `❌ 𝙲𝚑𝚊𝚗𝚗𝚎𝚕 𝚘𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚗𝚘𝚝 𝚏𝚘𝚞𝚗𝚍\n\n𝙿𝚕𝚎𝚊𝚜𝚎 𝚌𝚑𝚎𝚌𝚔 𝚝𝚑𝚎 𝚕𝚒𝚗𝚔 𝚊𝚗𝚍 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        } else if (e.message.includes('permission') || e.message.includes('access')) {
            await conn.sendMessage(from, {
                text: `❌ 𝙽𝚘 𝚙𝚎𝚛𝚖𝚒𝚜𝚜𝚒𝚘𝚗 𝚝𝚘 𝚛𝚎𝚊𝚌𝚝\n\n𝙱𝚘𝚝 𝚗𝚎𝚎𝚍𝚜 𝚝𝚘 𝚋𝚎 𝚊 𝚖𝚎𝚖𝚋𝚎𝚛 𝚘𝚏 𝚝𝚑𝚎 𝚌𝚑𝚊𝚗𝚗𝚎𝚕`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        } else {
            await conn.sendMessage(from, {
                text: `❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚜𝚎𝚗𝚍 𝚛𝚎𝚊𝚌𝚝𝚒𝚘𝚗\n\n𝙴𝚛𝚛𝚘𝚛: ${e.message}`,
                contextInfo: getContextInfo({ sender: sender })
            }, { quoted: fakevCard });
        }
        l(e);
    }
    
} catch (e) {
    await conn.sendMessage(from, {
        text: `❌ 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝚏𝚊𝚒𝚕𝚎𝚍`,
        contextInfo: getContextInfo({ sender: sender })
    }, { quoted: fakevCard });
    l(e);
}
});

// Additional command for channel info
cmd({
    pattern: "channelinfo",
    alias: ["cinfo", "channel"],
    react: "📋",
    desc: "Get channel information",
    category: "owner",
    filename: __filename
},
async(conn, mek, m, {from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isOwner) {
        return await conn.sendMessage(from, {
            text: `❌ 𝚃𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚒𝚜 𝚘𝚗𝚕𝚢 𝚏𝚘𝚛 𝚋𝚘𝚝 𝚘𝚠𝚗𝚎𝚛`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    if (!q) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚕𝚒𝚗𝚔\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: ${prefix}channelinfo https://whatsapp.com/channel/1234567890`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    if (!q.includes("whatsapp.com/channel/")) {
        return await conn.sendMessage(from, {
            text: `❌ 𝙸𝚗𝚟𝚊𝚕𝚒𝚍 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚕𝚒𝚗𝚔`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
    }
    
    try {
        const channelId = q.split('/')[4];
        const channelMeta = await conn.newsletterMetadata("invite", channelId);
        
        await conn.sendMessage(from, {
            text: `┏━❑ 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 𝐈𝐍𝐅𝐎 ━━━━━━━━━━━━━━━
┃ 📢 𝙽𝚊𝚖𝚎: ${channelMeta.name || 'Unknown'}
┃ 🆔 𝙸𝙳: ${channelMeta.id || channelId}
┃ 📝 𝙳𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗: ${channelMeta.description || 'No description'}
┃ 👥 𝚂𝚞𝚋𝚜𝚌𝚛𝚒𝚋𝚎𝚛𝚜: ${channelMeta.subscribers || 'Unknown'}
┃ 👑 𝙾𝚠𝚗𝚎𝚛: ${channelMeta.owner || 'Unknown'}
┃ 📅 𝙲𝚛𝚎𝚊𝚝𝚎𝚍: ${channelMeta.creation || 'Unknown'}
┃ 🔗 𝙻𝚒𝚗𝚔: ${q}
┗━━━━━━━━━━━━━━━━━━━━━━━━`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        
    } catch (e) {
        await conn.sendMessage(from, {
            text: `❌ 𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚏𝚎𝚝𝚌𝚑 𝚌𝚑𝚊𝚗𝚗𝚎𝚕 𝚒𝚗𝚏𝚘\n\n𝙴𝚛𝚛𝚘𝚛: ${e.message}`,
            contextInfo: getContextInfo({ sender: sender })
        }, { quoted: fakevCard });
        l(e);
    }
});
