const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// In-memory chat histories to hold context. Key: channelId (or userId for DMs)
const chatHistories = {};
const HISTORY_LIMIT = 15; // Keep last 15 messages

// Helper to read companion config dynamically
function readCompanionConfig() {
    const configPath = path.join(__dirname, '..', 'data', 'companion-config.json');
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading companion config:', error);
    }
    return {
        enabled: true,
        companionChannelId: null,
        personality: "sage",
        customInstructions: "",
        modelName: "gemini-2.0-flash",
        strictProjectScope: true
    };
}

// Fetch the last 3 announcements from the announcements channel
async function getLatestAnnouncements(client) {
    let announcementChannel = null;
    
    // 1. Try welcome-config ID
    try {
        const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');
        if (fs.existsSync(welcomeConfigPath)) {
            const welcomeConfig = JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf8'));
            if (welcomeConfig.announcementChannelId) {
                announcementChannel = client.channels.cache.get(welcomeConfig.announcementChannelId);
            }
        }
    } catch (e) {
        console.error('Error reading welcome-config for announcements:', e);
    }
    
    // 2. Fallback to searching by name
    if (!announcementChannel) {
        announcementChannel = client.channels.cache.find(c => 
            c.name === 'announcements' || c.name === 'announcement' || c.name === 'updates'
        );
    }
    
    if (!announcementChannel) return "No recent announcements posted yet.";
    
    try {
        // Fetch last 3 messages from the announcements channel
        const messages = await announcementChannel.messages.fetch({ limit: 3 });
        if (messages.size === 0) return "No recent announcements posted yet.";
        
        return messages.map(msg => {
            const author = msg.author.username;
            const content = msg.content;
            const date = new Date(msg.createdTimestamp).toLocaleDateString();
            return `[Announcement on ${date} by ${author}]:\n${content}`;
        }).reverse().join('\n\n---\n\n');
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return "Could not fetch recent announcements due to permissions.";
    }
}

// Build the project knowledge base context
function getProjectContext() {
    const configPath = path.join(__dirname, '..', 'config.json');
    const collectionConfigPath = path.join(__dirname, '..', 'data', 'collection-config.json');
    const chatConfigPath = path.join(__dirname, '..', 'data', 'chat2earn-config.json');
    const projectInfoPath = path.join(__dirname, '..', 'data', 'project-info.json');
    
    let config = {};
    let collection = {};
    let chat = {};
    let projectInfo = {};
    
    try { if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e){}
    try { if (fs.existsSync(collectionConfigPath)) collection = JSON.parse(fs.readFileSync(collectionConfigPath, 'utf8')); } catch(e){}
    try { if (fs.existsSync(chatConfigPath)) chat = JSON.parse(fs.readFileSync(chatConfigPath, 'utf8')); } catch(e){}
    try { if (fs.existsSync(projectInfoPath)) projectInfo = JSON.parse(fs.readFileSync(projectInfoPath, 'utf8')); } catch(e){}
    
    const links = config.links || {};
    
    return `
GEKURA PROJECT LINKS & SOCIALS:
- Official Website: ${links.website || 'https://geckura.app/'}
- Mystery Box Portal: ${links.mysteryBox || 'https://mysterybox.geckura.app/'}
- Twitter/X: ${links.twitter || 'https://x.com/Geckura'}
- Discord Invite: ${links.discord || 'https://discord.gg/yChGaA6HmJ'}
- Mint Website: ${links.mintSite || 'https://mint.geckura.com'}
- Magic Eden Secondary Market (Elixir): ${links.elixirMarket || 'https://magiceden.io/marketplace/geckura_elixir'}

GEKURA OFFICIAL KNOWLEDGE BASE & FAQS (STRICTLY USE THESE FACTS FOR PROJECT QUESTIONS):
${JSON.stringify(projectInfo, null, 2)}

CHAT-TO-EARN SYSTEM RULES:
- Chatting in the server earns $GECKURA tokens!
- Every message (min length ${chat.general?.minMessageLength || 5} characters) earns tokens.
- Base tokens per message: ${chat.levels?.baseTokens || 2} $GECKURA (increased by ${Math.round((chat.levels?.levelMultiplier - 1)*100)}% each level).
- Level up every ${chat.levels?.baseExperience || 25} messages.
- Level Up bonus: ${chat.rewards?.levelUpBonus || 20} $GECKURA.
- Daily rewards: Claim via /daily command to get ${chat.rewards?.dailyBonus || 10} $GECKURA (plus streak bonuses).
`;
}

// Main handler for incoming messages
async function handleCompanionMessage(message, client) {
    const companionConfig = readCompanionConfig();
    if (!companionConfig.enabled) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Only notify if bot was explicitly mentioned or in DMs, to avoid spam
        if (!message.guild || message.mentions.has(client.user)) {
            await message.reply("⚠️ **Configuration Error:** The AI Companion is enabled, but no `GEMINI_API_KEY` was found in the server `.env` configuration. Please notify an administrator.");
        }
        return;
    }

    // Determine history ID (use channel ID for server, user ID for DMs)
    const historyId = message.guild ? message.channel.id : message.author.id;

    // Initialize history if it doesn't exist
    if (!chatHistories[historyId]) {
        chatHistories[historyId] = [];
    }

    // Clean user query content (remove bot ping)
    const botPing = `<@${client.user.id}>`;
    const botPingNickname = `<@!${client.user.id}>`;
    let userQuery = message.content
        .replace(botPing, '')
        .replace(botPingNickname, '')
        .trim();

    if (userQuery.length === 0) {
        await message.reply("🌿 *The gecko stares at you, waiting for your question...* (Try asking about the roadmap, upcoming collection, secondary links, or how to earn tokens!)");
        return;
    }

    // Add user message to history
    chatHistories[historyId].push({
        role: 'user',
        parts: [{ text: `${message.author.username}: ${userQuery}` }]
    });

    // Enforce history limit
    if (chatHistories[historyId].length > HISTORY_LIMIT * 2) {
        chatHistories[historyId] = chatHistories[historyId].slice(-HISTORY_LIMIT * 2);
    }

    // Indicate typing while query runs
    try {
        await message.channel.sendTyping();
    } catch (e) {
        console.error('Failed to send typing indicator:', e);
    }

    try {
        // Fetch project context and live updates
        const projectContext = getProjectContext();
        const liveUpdates = await getLatestAnnouncements(client);

        // Define system instruction depending on personality
        let tonePrompt = "";
        if (companionConfig.personality === 'sage') {
            tonePrompt = "Speak in a wise, encouraging, helpful, and natural tone. Act as a guardian or sage who welcomes visitors to the Geckura sanctuary. Keep your language clear, welcoming, and moderately mystical without being overly verbose.";
        } else if (companionConfig.personality === 'hype') {
            tonePrompt = "Speak in a highly energetic, excited, natural, and community-focused tone. Use crypto slang, server emotes (like 🦎, 🚀, 💎, 🔥, ⚡), and celebrate the community. Act like a project moderator who hypes up the community.";
        } else {
            tonePrompt = "Speak in a standard, polite, professional, natural, and friendly assistant tone. Focus on being highly informative, accurate, and direct.";
        }

        // Add strict scope instructions if enabled
        let scopePrompt = "";
        if (companionConfig.strictProjectScope) {
            scopePrompt = `
STRICT TOPIC LIMITATIONS (CRITICAL):
- You are a dedicated companion and moderator *exclusively* for the Geckura project.
- You MUST ONLY discuss the Geckura project, its upcoming PFP collection, $GECKURA tokens, Elixir NFTs, team announcements, links, server rules, and chat-to-earn mechanics.
- If the user asks about ANYTHING outside this scope (e.g. coding help, writing essays, math problems, general trivia, politics, other companies, other blockchain networks unrelated to Solana, or requests like "tell me a joke about dogs"), you MUST politely decline to answer.
- Example refusal: "I'm sorry, but my aura is locked to the Geckura network! I can only guide you on our project roadmap, upcoming PFP collection, socials, and tokenomics. How can I help you with Geckura today?"
- Never answer general knowledge questions. If they ask "Who is the President of the US?" or "What is 2+2?", refuse politely and stay on-topic.
`;
        }

        const systemPrompt = `
You are the official AI Discord Companion for the Geckura Web3 NFT project. Your primary goal is to welcome new members, answer questions, moderate general discussion, and guide users through our ecosystem.

${tonePrompt}

${scopePrompt}

${projectContext}

 LATEST SERVER ANNOUNCEMENTS & UPDATES:
${liveUpdates}

ADDITIONAL SERVER GUIDELINES:
- CRITICAL: Keep your responses extremely short, simple, and direct. Typically write 1 to 3 sentences maximum. Avoid long explanations, wordy greetings, or unnecessary details to save tokens and speed up response times.
- Format replies cleanly using Discord markdown.
- If users ask about technical wallet problems, transaction failures, or lost assets, politely direct them to open a support ticket in the server or ask an Admin, stating that you cannot access private transaction details for security.
- Address the user as their name if appropriate, but do not write the "Username: " prefix in your final response. Just respond naturally.
- User custom instructions: ${companionConfig.customInstructions || 'None'}
`;

        const model = companionConfig.modelName || "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Prepare conversation list
        const requestBody = {
            contents: chatHistories[historyId],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 150
            }
        };

        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!apiResponse.ok) {
            const errText = await apiResponse.text();
            throw new Error(`Gemini API error: ${apiResponse.status} - ${errText}`);
        }

        const data = await apiResponse.json();
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            throw new Error("No response content returned from Gemini API.");
        }

        const rawReply = data.candidates[0].content.parts[0].text;
        
        // Add model reply to history
        chatHistories[historyId].push({
            role: 'model',
            parts: [{ text: rawReply }]
        });

        // Split responses exceeding Discord's 2000 character limit
        if (rawReply.length <= 2000) {
            await message.reply(rawReply);
        } else {
            const chunks = chunkText(rawReply, 1950);
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        }

    } catch (error) {
        console.error('Error in AI companion query:', error);
        // Remove the failed user query from history so history doesn't get corrupted
        chatHistories[historyId].pop();
        await message.reply("⚠️ *The gecko seems to have lost connection to the aura...* (An error occurred while processing the AI response. Please try again in a moment.)");
    }
}

// Utility to split long strings
function chunkText(str, size) {
    const chunks = [];
    let currentIdx = 0;
    while (currentIdx < str.length) {
        chunks.push(str.substring(currentIdx, currentIdx + size));
        currentIdx += size;
    }
    return chunks;
}

module.exports = {
    handleCompanionMessage,
    readCompanionConfig
};
