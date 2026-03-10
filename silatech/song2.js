const { cmd } = require('../momy');
const config = require('../config');
const axios = require('axios');
const yts = require('yt-search');

// ===================== SONG2 COMMAND =====================
cmd({
    pattern: "song2",
    alias: ["mp32", "play2", "ytmp3"],
    react: "🎵",
    desc: "Download song from YouTube (Anabot API)",
    category: "download"
},
async(conn, mek, m, { from, q, reply, quoted, myquoted }) => {
    try {
        if (!q) {
            return reply(`❌ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚜𝚘𝚗𝚐 𝚗𝚊𝚖𝚎 𝚘𝚛 𝚈𝚘𝚞𝚃𝚞𝚋𝚎 𝚕𝚒𝚗𝚔\n\n𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .𝚜𝚘𝚗𝚐𝟸 𝙻𝚘𝚟𝚎 𝚢𝚘𝚞𝚛𝚜𝚎𝚕𝚏\n𝙾𝚛: .𝚜𝚘𝚗𝚐𝟸 https://youtu.be/xyz`);
        }

        await conn.sendPresenceUpdate('composing', from);
        
        // React
        await conn.sendMessage(from, {
            react: { text: "🎵", key: mek.key }
        });

        let videoUrl = q;
        let videoTitle = '';

        // Check if it's a direct YouTube link
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            // Extract video info using yts
            const videoId = q.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
            if (videoId) {
                const search = await yts({ videoId });
                if (search) {
                    videoTitle = search.title;
                }
            }
        } else {
            // Search for the video
            const search = await yts(q);
            if (!search || !search.all || search.all.length === 0) {
                return reply(`❌ 𝙽𝚘 𝚛𝚎𝚜𝚞𝚕𝚝𝚜 𝚏𝚘𝚞𝚗𝚍 𝚏𝚘𝚛 "${q}"`);
            }
            videoUrl = search.all[0].url;
            videoTitle = search.all[0].title;
        }

        // Download using Anabot API
        const apiUrl = `https://anabot.my.id/api/download/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || !data.status) {
            throw new Error(data?.message || 'Failed to download');
        }

        const downloadUrl = data.result?.download?.url || data.result?.url;
        const title = data.result?.title || videoTitle || 'Unknown Title';
        const thumbnail = data.result?.thumbnail || data.result?.image;
        const duration = data.result?.duration || 'N/A';

        // Send thumbnail first (if available)
        if (thumbnail) {
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption: `━━━━━━━━━━━━━━━━━━━━━━\n    𝚂𝙾𝙽𝙶 𝙸𝙽𝙵𝙾    \n━━━━━━━━━━━━━━━━━━━━━━\n\n🎵 *𝚃𝚒𝚝𝚕𝚎:* ${title}\n⏱️ *𝙳𝚞𝚛𝚊𝚝𝚒𝚘𝚗:* ${duration}\n━━━━━━━━━━━━━━━━━━━━━━\n⬇️ *𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐...*`
            }, { quoted: myquoted });
        }

        // Send audio
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`
        }, { quoted: myquoted });

        // Final reaction
        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (e) {
        console.error('Song2 Error:', e);
        reply(`❌ 𝙴𝚛𝚛𝚘𝚛: ${e.message}`);
    }
});

// ===================== FUNCTION VERSION (kama ulivyotuma) =====================
/*
async function youtubeMp3(url, apikey) {
  try {
    const response = await fetch(`https://anabot.my.id/api/download/ytmp3?url=${encodeURIComponent(url)}&apikey=${encodeURIComponent(apikey)}`, {
      method: 'GET'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return error;
  }
}

// Matumizi:
// youtubeMp3('https://youtu.be/t00JmxGWq4I?si=W2jlT6cYeL8oUSbA', 'freeApikey').then(console.log).catch(console.log);
*/
