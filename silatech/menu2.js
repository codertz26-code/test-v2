const { cmd } = require('../momy');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// Command Menu2 - With buttons
cmd({
    pattern: "menu2",
    alias: ["help2", "commands2", "menu"],
    desc: "Show bot menu with buttons",
    category: "general",
    react: "📋"
},
async(conn, mek, m, { from, quoted, sender, pushname, isOwner, reply, myquoted }) => {
    try {
        const name = pushname || 'User';
        const ownerNumber = config.OWNER_NUMBER || '255789661031';
        
        // Create the four buttons
        const buttons = [
            {
                buttonId: 'list',
                buttonText: { displayText: '📋 LIST' },
                type: 1
            },
            {
                buttonId: 'repo',
                buttonText: { displayText: '📂 REPO' },
                type: 1
            },
            {
                buttonId: 'owner',
                buttonText: { displayText: '👑 OWNER' },
                type: 1
            },
            {
                buttonId: 'pair',
                buttonText: { displayText: '🔐 PAIR' },
                type: 1
            }
        ];

        // Create button message
        const buttonMessage = {
            image: { url: 'https://files.catbox.moe/hjyysd.jpg' }, // Replace with your image URL
            caption: `╭━━【 𝙼𝙾𝙼𝚈-𝙺𝙸𝙳𝚈 𝙱𝙾𝚃 】━━━━━━━━╮
│ *welcome ${name}*
│ *prefix:* ${config.PREFIX}
│ *status:* active
│ *version:* 2.0.0
╰━━━━━━━━━━━━━━━━━━━━╯

*📌 select a button below*

${config.BOT_FOOTER || '> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡'}`,
            footer: 'Mommy-Kidy Bot',
            buttons: buttons,
            headerType: 4 // Image header
        };

        // Send the button message
        const sentMsg = await conn.sendMessage(from, buttonMessage, { quoted: myquoted });

        // Handle button responses
        conn.ev.on('messages.upsert', async (update) => {
            try {
                const msg = update.messages[0];
                if (!msg.message?.buttonsResponseMessage) return;

                const buttonResponse = msg.message.buttonsResponseMessage;
                const selectedButtonId = buttonResponse.selectedButtonId;
                
                // Check if this response is for our menu message
                const contextInfo = msg.message?.buttonsResponseMessage?.contextInfo;
                if (contextInfo?.stanzaId !== sentMsg.key.id) return;

                // React to the button press
                await conn.sendMessage(msg.key.remoteJid, {
                    react: { text: '⚡', key: msg.key }
                });

                // Handle each button
                switch(selectedButtonId) {
                    case 'list':
                        // Show command list
                        const commands = await getAllCommands();
                        const listMessage = `╭━━【 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙻𝙸𝚂𝚃 】━━━━━━━━╮
│
${commands.map(cmd => `│ *${config.PREFIX}${cmd}*`).join('\n')}
│
╰━━━━━━━━━━━━━━━━━━━━╯

${config.BOT_FOOTER}`;

                        await conn.sendMessage(msg.key.remoteJid, {
                            text: listMessage
                        }, { quoted: msg });
                        break;

                    case 'repo':
                        // Show repository info
                        await conn.sendMessage(msg.key.remoteJid, {
                            text: `╭━━【 𝚁𝙴𝙿𝙾𝚂𝙸𝚃𝙾𝚁𝚈 】━━━━━━━━╮
│ *github:* ${config.GITHUB_LINK || 'https://github.com/yourrepo'}
│ *branch:* main
│ *version:* 2.0.0
╰━━━━━━━━━━━━━━━━━━━━╯

${config.BOT_FOOTER}`
                        }, { quoted: msg });
                        break;

                    case 'owner':
                        // Show owner info
                        await conn.sendMessage(msg.key.remoteJid, {
                            text: `╭━━【 𝙾𝚆𝙽𝙴𝚁 𝙸𝙽𝙵𝙾 】━━━━━━━━╮
│ *name:* ${config.OWNER_NAME || 'Sila Tech'}
│ *number:* wa.me/${ownerNumber}
│ *status:* online
╰━━━━━━━━━━━━━━━━━━━━╯

${config.BOT_FOOTER}`
                        }, { quoted: msg });
                        break;

                    case 'pair':
                        // Handle pair command
                        const pairCode = generatePairCode();
                        await conn.sendMessage(msg.key.remoteJid, {
                            text: `╭━━【 𝙿𝙰𝙸𝚁 𝙲𝙾𝙳𝙴 】━━━━━━━━╮
│ *code:* ${pairCode}
│ *expires:* 5 minutes
│ *use:* .pair ${pairCode}
╰━━━━━━━━━━━━━━━━━━━━╯

${config.BOT_FOOTER}`
                        }, { quoted: msg });
                        break;
                }

                // Final reaction
                await conn.sendMessage(msg.key.remoteJid, {
                    react: { text: '✅', key: msg.key }
                });

            } catch (e) {
                console.error('Button handler error:', e);
            }
        });

    } catch (e) {
        console.error('Menu2 Command Error:', e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

// Helper function to get all commands from commands folder
async function getAllCommands() {
    try {
        const commandsPath = path.join(__dirname, '../commands');
        const files = fs.readdirSync(commandsPath);
        
        // Get command names from files (remove .js extension)
        const commands = files
            .filter(file => file.endsWith('.js'))
            .map(file => file.replace('.js', ''));
        
        return commands.slice(0, 15); // Limit to 15 commands for display
    } catch (error) {
        console.error('Error reading commands folder:', error);
        return ['ping', 'alive', 'menu', 'help', 'song', 'fb', 'ig', 'tiktok', 'beauty', 'tostatus'];
    }
}

// Helper function to generate pair code
function generatePairCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
