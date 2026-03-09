const { cmd } = require('../momy');
const axios = require('axios');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

cmd({
    pattern: "pair",
    alias: ["paircode", "getcode"],
    desc: "get whatsapp pairing code",
    category: "tools",
    react: "🔐",
    filename: __filename
}, async (conn, mek, m, { from, reply, args, myquoted }) => {
    try {
        const text = args.join(" ");
        
        if (!text) {
            return reply("*Please provide WhatsApp number*\n*Example:* .pair 255123456789");
        }

        const numbers = text.split(',')
            .map(v => v.replace(/[^0-9]/g, ''))
            .filter(v => v.length > 5 && v.length < 20);

        if (numbers.length === 0) {
            return reply("*Invalid number❌ Please use correct format!*");
        }

        for (const number of numbers) {
            const whatsappID = number + '@s.whatsapp.net';
            const result = await conn.onWhatsApp(whatsappID);

            if (!result[0]?.exists) {
                return reply(`*${number} is not registered on WhatsApp❗*`);
            }

            await reply("*Wait a moment for the code*");

            try {
                const response = await axios.get(`https://momy-kidy-v2.onrender.com/code?number=${number}`);
                
                if (response.data && response.data.code) {
                    const code = response.data.code;
                    if (code === "Service Unavailable") {
                        throw new Error('Service Unavailable');
                    }
                    
                    await sleep(5000);
                    
                    await conn.sendMessage(from, {
                        text: `*Your pairing code: ${code}*`,
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363402325089913@newsletter',
                                newsletterName: 'SILA TECH',
                                serverMessageId: -1
                            }
                        }
                    }, { quoted: myquoted });
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (apiError) {
                console.error('API Error:', apiError);
                const errorMessage = apiError.message === 'Service Unavailable' 
                    ? "*Service is currently unavailable. Please try again later.*"
                    : "*Failed to generate pairing code. Please try again later.*";
                
                await reply(errorMessage);
            }
        }

        await m.react("✅");

    } catch (error) {
        console.error(error);
        reply("*An error occurred. Please try again later.*");
        await m.react("❌");
    }
});
