const { cmd } = require('../momy');
const config = require('../config');
const axios = require('axios');

// ===================== ANIME POPULAR =====================
cmd({
    pattern: "animepopular",
    alias: ["anipop", "popularanime"],
    react: "🔥",
    desc: "Get popular anime list",
    category: "anime"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);
        
        const response = await axios.get('https://api.siputzx.my.id/api/anime/anichin-popular');
        
        if (!response.data?.status) throw new Error('Failed to fetch data');
        
        const data = response.data.data;
        
        let message = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `    𝙿𝙾𝙿𝚄𝙻𝙰𝚁 𝙰𝙽𝙸𝙼𝙴    \n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // Weekly
        message += `⭐ *𝚆𝙴𝙴𝙺𝙻𝚈*\n`;
        data.weekly.forEach((item, i) => {
            message += `${i+1}. ${item.title}\n`;
            message += `   𝙶𝚎𝚗𝚛𝚎𝚜: ${item.genres.join(', ')}\n`;
            if (item.rating) message += `   𝚁𝚊𝚝𝚒𝚗𝚐: ${item.rating}\n`;
            message += `\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `> 𝚄𝚜𝚎 .𝚊𝚗𝚒𝚖𝚎𝚍𝚎𝚝𝚊𝚒𝚕 <𝚞𝚛𝚕> 𝚏𝚘𝚛 𝚍𝚎𝚝𝚊𝚒𝚕𝚜`;
        
        reply(message);
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});

// ===================== ANIME DETAIL =====================
cmd({
    pattern: "animatedetail",
    alias: ["anidetail", "animeinfo"],
    react: "ℹ️",
    desc: "Get anime details from URL",
    category: "anime"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊𝚗 𝚊𝚗𝚒𝚖𝚎 𝚄𝚁𝙻\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚊𝚗𝚒𝚖𝚎𝚍𝚎𝚝𝚊𝚒𝚕 https://anichin.cafe/renegade-immortal-episode-69-subtitle-indonesia/`);

        await conn.sendPresenceUpdate('composing', from);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-detail?url=${encodeURIComponent(q)}`);
        
        if (!response.data?.status) throw new Error('Failed to fetch details');
        
        const data = response.data.data;
        
        let message = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `    𝙰𝙽𝙸𝙼𝙴 𝙳𝙴𝚃𝙰𝙸𝙻𝚂    \n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📺 *𝚃𝚒𝚝𝚕𝚎:* ${data.title}\n`;
        if (data.alternativeTitles) message += `📌 *𝙰𝚕𝚝:* ${data.alternativeTitles}\n`;
        if (data.rating) message += `⭐ *𝚁𝚊𝚝𝚒𝚗𝚐:* ${data.rating}\n`;
        if (data.status) message += `📊 *𝚂𝚝𝚊𝚝𝚞𝚜:* ${data.status}\n`;
        if (data.type) message += `🎬 *𝚃𝚢𝚙𝚎:* ${data.type}\n`;
        if (data.country) message += `🌍 *𝙲𝚘𝚞𝚗𝚝𝚛𝚢:* ${data.country}\n`;
        if (data.network) message += `📡 *𝙽𝚎𝚝𝚠𝚘𝚛𝚔:* ${data.network}\n`;
        if (data.studio) message += `🎨 *𝚂𝚝𝚞𝚍𝚒𝚘:* ${data.studio}\n`;
        if (data.released) message += `📅 *𝚁𝚎𝚕𝚎𝚊𝚜𝚎𝚍:* ${data.released}\n`;
        if (data.duration) message += `⏱️ *𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗:* ${data.duration}\n`;
        if (data.genres && data.genres.length) message += `🎭 *𝙶𝚎𝚗𝚛𝚎𝚜:* ${data.genres.join(', ')}\n`;
        if (data.synopsis) message += `\n📝 *𝚂𝚢𝚗𝚘𝚙𝚜𝚒𝚜:*\n${data.synopsis}\n`;
        
        message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `> 𝚄𝚛𝚕: ${q}`;
        
        reply(message);
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});

// ===================== ANIME EPISODES =====================
cmd({
    pattern: "episodes",
    alias: ["aniep", "animeepisodes"],
    react: "📺",
    desc: "Get anime episodes list",
    category: "anime"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊𝚗 𝚊𝚗𝚒𝚖𝚎 𝚄𝚁𝙻\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚎𝚙𝚒𝚜𝚘𝚍𝚎𝚜 https://anichin.cafe/renegade-immortal/`);

        await conn.sendPresenceUpdate('composing', from);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-episode?url=${encodeURIComponent(q)}`);
        
        if (!response.data?.status) throw new Error('Failed to fetch episodes');
        
        const episodes = response.data.data;
        
        let message = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `    𝙰𝙽𝙸𝙼𝙴 𝙴𝙿𝙸𝚂𝙾𝙳𝙴𝚂    \n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        episodes.slice(0, 20).forEach((ep, i) => {
            message += `${i+1}. ${ep.title || `Episode ${ep.episode}`}\n`;
        });
        
        if (episodes.length > 20) {
            message += `\n... 𝚊𝚗𝚍 ${episodes.length - 20} 𝚖𝚘𝚛𝚎 𝚎𝚙𝚒𝚜𝚘𝚍𝚎𝚜\n`;
        }
        
        message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `> 𝚄𝚜𝚎 .𝚊𝚗𝚒𝚖𝚎𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 <𝚎𝚙𝚒𝚜𝚘𝚍𝚎 𝚞𝚛𝚕>`;
        
        reply(message);
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});

// ===================== ANIME SEARCH =====================
cmd({
    pattern: "animesearch",
    alias: ["anisearch", "searchanime"],
    react: "🔍",
    desc: "Search for anime",
    category: "anime"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚜𝚎𝚊𝚛𝚌𝚑 𝚚𝚞𝚎𝚛𝚢\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚊𝚗𝚒𝚖𝚎𝚜𝚎𝚊𝚛𝚌𝚑 𝚗𝚊𝚐𝚊`);

        await conn.sendPresenceUpdate('composing', from);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-search?query=${encodeURIComponent(q)}`);
        
        if (!response.data?.status) throw new Error('No results found');
        
        const results = response.data.data;
        
        let message = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `    𝚂𝙴𝙰𝚁𝙲𝙷: ${q.toUpperCase()}    \n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        results.slice(0, 10).forEach((item, i) => {
            message += `${i+1}. *${item.title}*\n`;
            message += `   𝚃𝚢𝚙𝚎: ${item.type} | 𝚂𝚝𝚊𝚝𝚞𝚜: ${item.status}\n`;
            message += `   𝙻𝚒𝚗𝚔: ${item.link}\n\n`;
        });
        
        if (results.length > 10) {
            message += `... 𝚊𝚗𝚍 ${results.length - 10} 𝚖𝚘𝚛𝚎 𝚛𝚎𝚜𝚞𝚕𝚝𝚜\n`;
        }
        
        message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `> 𝚄𝚜𝚎 .𝚊𝚗𝚒𝚖𝚎𝚍𝚎𝚝𝚊𝚒𝚕 <𝚞𝚛𝚕> 𝚏𝚘𝚛 𝚍𝚎𝚝𝚊𝚒𝚕𝚜`;
        
        reply(message);
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});

// ===================== ANIME DOWNLOAD =====================
cmd({
    pattern: "animatedownload",
    alias: ["anidownload", "anidl"],
    react: "⬇️",
    desc: "Get anime download links",
    category: "anime"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊𝚗 𝚎𝚙𝚒𝚜𝚘𝚍𝚎 𝚄𝚁𝙻\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚊𝚗𝚒𝚖𝚎𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 https://anichin.cafe/renegade-immortal-episode-69-subtitle-indonesia/`);

        await conn.sendPresenceUpdate('composing', from);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-download?url=${encodeURIComponent(q)}`);
        
        if (!response.data?.status) throw new Error('No download links found');
        
        const downloads = response.data.data;
        
        let message = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `    𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙻𝙸𝙽𝙺𝚂    \n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        downloads.forEach(item => {
            message += `📀 *${item.resolution}*\n`;
            item.links.forEach(link => {
                message += `   • ${link.host}: ${link.link}\n`;
            });
            message += `\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━━━`;
        
        reply(message);
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});

// ===================== ANIME QUOTES =====================
cmd({
    pattern: "animequotes",
    alias: ["aniquote", "quoteanime"],
    react: "💬",
    desc: "Get random anime quotes",
    category: "anime"
},
async(conn, mek, m, { from, q, reply }) => {
    try {
        const query = q || 'fate'; // Default query
        
        await conn.sendPresenceUpdate('composing', from);
        
        const response = await axios.get(`https://api.siputzx.my.id/api/s/animequotes?query=${encodeURIComponent(query)}`);
        
        if (!response.data?.status) throw new Error('No quotes found');
        
        const quotes = response.data.data;
        
        let message = `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `    𝙰𝙽𝙸𝙼𝙴 𝚀𝚄𝙾𝚃𝙴𝚂    \n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        quotes.slice(0, 5).forEach((quote, i) => {
            message += `"${quote.quotes}"\n`;
            message += `— *${quote.karakter}* (${quote.anime})\n`;
            if (quote.episode) message += `   📺 ${quote.episode}\n`;
            message += `\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `> 𝚄𝚜𝚎 .𝚊𝚗𝚒𝚖𝚎𝚚𝚞𝚘𝚝𝚎𝚜 <𝚊𝚗𝚒𝚖𝚎 𝚗𝚊𝚖𝚎>`;
        
        reply(message);
        
    } catch (e) {
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});
