const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();
const config = require('./config.json');

// Load chat2earn handler
const { handleMessage } = require('./utils/chat2earn-handler');

// Load link filter
const { execute: handleLinkFilter } = require('./utils/link-filter');

// Load companion handler
const { handleCompanionMessage, readCompanionConfig } = require('./utils/companion-handler');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

// Cache to hold invite usage counts. Key: guildId, Value: Map of invite code -> uses
const guildInvites = new Map();

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
}

// Load whitelist data
let whitelistData;
try {
    whitelistData = require('./whitelist.json');
} catch (error) {
    whitelistData = { whitelisted: [] };
    fs.writeFileSync('./whitelist.json', JSON.stringify(whitelistData, null, 2));
}

// Load whitelist monitoring system
const { startMonitoring } = require('./utils/wl-monitor');

// Load OG monitoring system
const { startMonitoring: startOGMonitoring } = require('./utils/og-monitor');

// Load welcome handler
const { sendWelcomeMessage } = require('./utils/welcome-handler');

// Load role upgrade handler
const { handleRoleUpgrade } = require('./utils/role-upgrade-handler');

// Event: Bot is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('GeckAura — Where Innovation Meets Utility!', { type: 'WATCHING' });
    
    // Start whitelist monitoring
    startMonitoring(client, config);
    console.log('Whitelist monitoring system started.');

    // Start OG monitoring
    startOGMonitoring(client, config);
    console.log('OG monitoring system started.');

    // Cache invites for all guilds the bot is in
    client.guilds.cache.forEach(async guild => {
        try {
            if (guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
                const invites = await guild.invites.fetch();
                const codeUses = new Map();
                invites.forEach(inv => codeUses.set(inv.code, inv.uses));
                guildInvites.set(guild.id, codeUses);
                console.log(`Cached ${invites.size} invites for guild: ${guild.name}`);
            } else {
                console.log(`Lacking ManageGuild permission to cache invites in: ${guild.name}`);
            }
        } catch (error) {
            console.error(`Error caching invites for guild ${guild.name}:`, error);
        }
    });

    // Start 2-hour Safety Reminder interval (2 * 60 * 60 * 1000 ms)
    setInterval(async () => {
        let generalChannel = null;
        if (config.channels && config.channels.general) {
            generalChannel = client.channels.cache.get(config.channels.general) || 
                             client.channels.cache.find(c => c.name === config.channels.general || c.id === config.channels.general);
        }
        if (!generalChannel) {
            generalChannel = client.channels.cache.find(c => 
                c.name === 'general' || c.name === 'general-chat' || c.name === 'chat' || c.name === 'lounge'
            );
        }
        if (generalChannel) {
            try {
                const safetyEmbed = {
                    title: '🛡️ GECKURA OFFICIAL SAFETY REMINDER 🦎',
                    description: 'Please read carefully to keep your assets secure:',
                    color: 0x9D4EDD,
                    fields: [
                        {
                            name: '🚫 No Direct Messages',
                            value: 'Team members and founders will **NEVER** DM you first. If someone DMs you claiming to be support, staff, or a bot, it is a scam. Report them immediately.',
                            inline: false
                        },
                        {
                            name: '🌐 Official Links Only',
                            value: '• Website: https://geckura.app/\n• Mystery Box: https://mysterybox.geckura.app/\n• Magic Eden: https://magiceden.io/marketplace/geckura_elixir',
                            inline: false
                        },
                        {
                            name: '🔒 Guard Your Seeds',
                            value: 'Never enter your recovery phrase or private keys on any site. Our official portals will only ask you to connect your Solana wallet.',
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Geckura Safety System — Turning Chaos into Flow',
                        icon_url: client.user.displayAvatarURL()
                    }
                };
                await generalChannel.send({ embeds: [safetyEmbed] });
                console.log(`Safety reminder posted in ${generalChannel.name} channel.`);
            } catch (error) {
                console.error('Error posting safety reminder:', error);
            }
        }
    }, 2 * 60 * 60 * 1000);
    console.log('Safety reminder interval system active (every 2 hours).');
});

// Event: Guild member add (for welcome messages, impersonation protection, and invite tracking)
client.on('guildMemberAdd', async member => {
    // Impersonation check
    await checkImpersonation(member);

    // Track invite usage to award tokens
    try {
        const guild = member.guild;
        if (guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
            const currentInvites = await guild.invites.fetch();
            const cachedInvites = guildInvites.get(guild.id) || new Map();
            
            // Find which invite's usage count increased
            const usedInvite = currentInvites.find(inv => {
                const cachedUses = cachedInvites.get(inv.code) || 0;
                return inv.uses > cachedUses;
            });

            if (usedInvite && usedInvite.inviter) {
                const inviter = usedInvite.inviter;
                
                // Exclude self-invites and bot inviters
                if (inviter.id !== member.id && !inviter.bot) {
                    const { getUserData, saveUserData } = require('./utils/chat2earn-handler');
                    
                    // Reward the inviter with 250 $GECKURA
                    const inviterData = getUserData(inviter.id);
                    inviterData.tokens += 250;
                    inviterData.totalTokensEarned += 250;
                    saveUserData(inviter.id, inviterData);
                    
                    console.log(`🎉 Invite Tracker: ${inviter.tag} invited ${member.user.tag} using code ${usedInvite.code}. Rewarded 250 $GECKURA.`);
                    
                    // Save invite mapping to track if they leave later
                    try {
                        const mappingPath = path.join(__dirname, 'data', 'invited-members.json');
                        let mapping = {};
                        if (fs.existsSync(mappingPath)) {
                            mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
                        }
                        mapping[member.id] = inviter.id;
                        fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
                    } catch (mapErr) {
                        console.error('Error saving invite mapping:', mapErr);
                    }
                    
                    // DM the inviter about their reward
                    try {
                        const rewardEmbed = {
                            title: '🎉 Invite Reward Received!',
                            description: `Thank you for inviting **${member.user.username}** to our community!`,
                            color: 0x00FF99,
                            fields: [
                                { name: 'Reward Amount', value: '**250 $GECKURA** tokens', inline: true },
                                { name: 'New Balance', value: `\`${inviterData.tokens} $GECKURA\``, inline: true }
                            ],
                            timestamp: new Date().toISOString(),
                            footer: {
                                text: 'Geckura — Turning Chaos into Flow',
                                icon_url: client.user.displayAvatarURL()
                            }
                        };
                        await inviter.send({ embeds: [rewardEmbed] });
                    } catch (dmErr) {
                        console.log(`Could not DM invite reward info to ${inviter.tag}`);
                    }
                }
            }

            // Update cached invites for the guild
            const updatedCache = new Map();
            currentInvites.forEach(inv => updatedCache.set(inv.code, inv.uses));
            guildInvites.set(guild.id, updatedCache);
        }
    } catch (inviteError) {
        console.error('Error tracking invite on guildMemberAdd:', inviteError);
    }
});

// Event: Invite created
client.on('inviteCreate', async invite => {
    try {
        const guildId = invite.guild.id;
        if (!guildInvites.has(guildId)) {
            guildInvites.set(guildId, new Map());
        }
        guildInvites.get(guildId).set(invite.code, invite.uses);
        console.log(`Cached new invite code ${invite.code} created for guild ${invite.guild.name}`);
    } catch (e) {
        console.error('Error in inviteCreate:', e);
    }
});

// Event: Invite deleted
client.on('inviteDelete', invite => {
    try {
        const guildId = invite.guild.id;
        if (guildInvites.has(guildId)) {
            guildInvites.get(guildId).delete(invite.code);
            console.log(`Removed deleted invite code ${invite.code} from cache of guild ${invite.guild.name}`);
        }
    } catch (e) {
        console.error('Error in inviteDelete:', e);
    }
});

// Event: Guild member leave (charge back invite points if they leave)
client.on('guildMemberRemove', async member => {
    try {
        const mappingPath = path.join(__dirname, 'data', 'invited-members.json');
        if (fs.existsSync(mappingPath)) {
            const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
            const inviterId = mapping[member.id];
            
            if (inviterId) {
                const { getUserData, saveUserData } = require('./utils/chat2earn-handler');
                
                // Deduct 250 $GECKURA from the inviter
                const inviterData = getUserData(inviterId);
                inviterData.tokens = Math.max(0, inviterData.tokens - 250);
                saveUserData(inviterId, inviterData);
                
                console.log(`📉 Invite Chargeback: ${member.user.tag} left the server. Deducted 250 $GECKURA from inviter ${inviterId}.`);
                
                // Try to notify the inviter about the chargeback
                try {
                    const inviterUser = await client.users.fetch(inviterId);
                    if (inviterUser) {
                        const chargebackEmbed = {
                            title: '📉 Invite Reward Reversed',
                            description: `The member you invited, **${member.user.username}**, has left the server. As a result, the reward points have been reversed.`,
                            color: 0xFF5555,
                            fields: [
                                { name: 'Deducted Amount', value: '**-250 $GECKURA** tokens', inline: true },
                                { name: 'Remaining Balance', value: `\`${inviterData.tokens} $GECKURA\``, inline: true }
                            ],
                            timestamp: new Date().toISOString(),
                            footer: {
                                text: 'Geckura — Turning Chaos into Flow',
                                icon_url: client.user.displayAvatarURL()
                            }
                        };
                        await inviterUser.send({ embeds: [chargebackEmbed] });
                    }
                } catch (dmErr) {
                    console.log(`Could not send chargeback notice DM to inviter: ${inviterId}`);
                }

                // Delete member from mapping and save
                delete mapping[member.id];
                fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
            }
        }
    } catch (error) {
        console.error('Error handling guildMemberRemove invite chargeback:', error);
    }
});

// Event: Guild member update (for role upgrades and impersonation check)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Impersonation check
    await checkImpersonation(newMember);

    // Check if member gained the welcome role
    const welcomeRoleId = config.roles?.welcome || '1438176728651534356';
    
    if (!oldMember.roles.cache.has(welcomeRoleId) && newMember.roles.cache.has(welcomeRoleId)) {
        // Member was just verified, send welcome message
        sendWelcomeMessage(newMember, client);
    }

    // Handle role upgrades
    await handleRoleUpgrade(oldMember, newMember, client, config);
});

// Event: Message created (for auto-link deletion and chat2earn)
client.on('messageCreate', async message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Handle Direct Messages (DMs) separately
    if (!message.guild) {
        const companionConfig = readCompanionConfig();
        if (companionConfig.enabled) {
            if (companionConfig.allowedRoleId) {
                try {
                    const guild = client.guilds.cache.get(process.env.GUILD_ID || config.guildId);
                    if (guild) {
                        const member = await guild.members.fetch(message.author.id).catch(() => null);
                        if (!member || !member.roles.cache.has(companionConfig.allowedRoleId)) {
                            return; // Ignore if not in guild or doesn't have the role
                        }
                    } else {
                        return;
                    }
                } catch (e) {
                    console.error('Error checking user roles in DM:', e);
                    return;
                }
            }
            handleCompanionMessage(message, client);
        }
        return;
    }

    // Spam check (applies only to server messages from non-admins/non-moderators)
    const bypassSpamCheck = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                            message.member.permissions.has(PermissionFlagsBits.ManageMessages);
    
    if (!bypassSpamCheck && isSpamming(message.author.id)) {
        try {
            await message.delete();
            const spamWarning = await message.channel.send(`⚠️ ${message.author}, **please avoid spamming!** Slow down your messages to keep the server clean.`);
            setTimeout(() => spamWarning.delete().catch(() => {}), 5000);
        } catch (e) {
            console.error('Error handling spam message deletion:', e);
        }
        return;
    }

    // Process chat2earn rewards
    handleMessage(message, client);
    
    // Check if user has admin/moderator permissions to bypass link filters
    const bypassLinkFilter = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                             message.member.permissions.has(PermissionFlagsBits.ManageMessages);
    
    // If user cannot bypass, check for links
    if (!bypassLinkFilter) {
        // Regular expression to detect URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const containsUrl = urlRegex.test(message.content);
        
        // If message contains a URL, delete it
        if (containsUrl) {
            try {
                // Check if bot has permission to delete messages
                if (!message.channel.permissionsFor(client.user).has('MANAGE_MESSAGES')) {
                    console.error(`Bot doesn't have permission to delete messages in channel ${message.channel.name}`);
                    return;
                }
                await message.delete();
                
                // Create an alert embed
                const alertEmbed = {
                    title: '⚠️ Link Posting Violation',
                    description: `User ${message.author.tag} (${message.author.id}) has posted a link in violation of server rules.`,
                    color: 0xFF0000,
                    fields: [
                        {
                            name: 'Action Taken',
                            value: '• Message deleted\n• User timed out for 48 hours',
                            inline: false
                        },
                        {
                            name: 'Reason',
                            value: 'Posting links without admin permission',
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: 'Geckura — Turning Chaos into Flow',
                        icon_url: client.user.displayAvatarURL()
                    }
                };
                
                // Send alert to the channel
                await message.channel.send({ embeds: [alertEmbed] });
                
                // Timeout the user for 48 hours (48 * 60 * 60 * 1000 milliseconds)
                // Check if bot has permission to timeout members and member is moderatable
                if (!message.guild.members.me.permissions.has('MODERATE_MEMBERS')) {
                    console.error(`Bot doesn't have permission to timeout members in server ${message.guild.name}`);
                } else if (!message.member.moderatable) {
                    console.log(`Cannot timeout ${message.author.tag} due to role hierarchy/permissions.`);
                } else {
                    await message.member.timeout(48 * 60 * 60 * 1000, 'Posting links without admin permission');
                }
                
                // Send a DM to the user explaining the timeout
                try {
                    await message.author.send({
                        embeds: [{
                            title: '⚠️ You have been timed out',
                            description: `You have been timed out from the **${message.guild.name}** server for 48 hours.`,
                            color: 0xFF0000,
                            fields: [
                                {
                                    name: 'Reason',
                                    value: 'Posting links without admin permission',
                                    inline: false
                                },
                                {
                                    name: 'Duration',
                                    value: '48 hours',
                                    inline: false
                                },
                                {
                                    name: 'Server Rules',
                                    value: 'Please review the server rules. Only administrators are allowed to post links in the server.',
                                    inline: false
                                }
                            ],
                            timestamp: new Date().toISOString(),
                            footer: {
                                text: 'Geckura — Turning Chaos into Flow',
                                icon_url: client.user.displayAvatarURL()
                            }
                        }]
                    });
                } catch (dmError) {
                    console.error('Could not send DM to user:', dmError);
                }
            } catch (error) {
                console.error('Error handling link violation:', error);
            }
        }
    }

    // AI Companion check for server channels
    const companionConfig = readCompanionConfig();
    if (companionConfig.enabled) {
        const isInCompanionChannel = companionConfig.companionChannelId && message.channel.id === companionConfig.companionChannelId;
        const isBotMentioned = message.mentions.has(client.user) && !message.mentions.everyone;
        
        if (isInCompanionChannel || isBotMentioned) {
            if (companionConfig.allowedRoleId) {
                const hasRole = message.member && message.member.roles.cache.has(companionConfig.allowedRoleId);
                if (!hasRole) return; // Ignore if they don't have the role
            }
            handleCompanionMessage(message, client);
        }
    }
});

// Event: Interaction created
client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            // Special handling for the airdrop command
            if (interaction.commandName === 'airdrop') {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle('🪂 GECKURA AIRDROP — ELIGIBILITY & MAXIMIZATION GUIDE 🦎')
                    .setColor('#9D4EDD')
                    .setThumbnail(client.user.displayAvatarURL())
                    .setFooter({ text: 'Geckura — Built for movers, rewarded by the system', iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();

                // Core Eligibility
                embed.addFields({
                    name: '🔑 Core Eligibility',
                    value: 'Hold Geckura Elixir → Required for airdrop eligibility → Grants RevShare, bonus rewards, and more → Geckura Elixir holders receive a FREE mint in the Geckura PFP collection\n\nSecondary Market (Elixir): 🔗https://magiceden.io/marketplace/geckura_elixir',
                    inline: false
                });

                // PFP Minting
                embed.addFields({
                    name: '🖼 Geckura PFP Minting Soon',
                    value: 'Mint & Hold a Geckura PFP NFT → Significantly increases airdrop allocation → Snapshot-based rewards',
                    inline: false
                });

                // Level System
                embed.addFields({
                    name: '⬆️ Level System',
                    value: 'Level up to Level 20 → Higher levels = higher airdrop weight → Earn XP through activity and engagement',
                    inline: false
                });

                // Community Tasks
                embed.addFields({
                    name: '📣 Community Tasks',
                    value: '• Raid all official Geckura tweets\n• Engage consistently (likes, reposts, replies)\n• Be active in Discord discussions\n• Participate in community games & events',
                    inline: false
                });

                // Collabs & Partnerships
                embed.addFields({
                    name: '🤝 Collabs & Partnerships',
                    value: '• Bonus rewards from Solana project collaborations\n• Partner campaign participation increases eligibility',
                    inline: false
                });

                // Twitter Selection
                embed.addFields({
                    name: '🐦 Twitter Selection',
                    value: '• Random and merit-based picks from Twitter raids & posts\n• Quality engagement matters — spam does not',
                    inline: false
                });

                // Important Notes
                embed.addFields({
                    name: '⚠️ Important Notes',
                    value: '• Snapshots will be taken periodically\n• Sybil & low-effort farming will be filtered\n• Final airdrop weights are not disclosed',
                    inline: false
                });

                // Summary
                embed.addFields({
                    name: '✅ Summary',
                    value: 'Hold. Mint. Level up. Engage. Raid. Those who contribute to the ecosystem are rewarded.',
                    inline: false
                });

                await interaction.reply({ embeds: [embed] });
            } else {
                await command.execute(interaction, client, config, whitelistData);
            }

            // Save whitelist data if modified
            if (command.modifiesWhitelist) {
                fs.writeFileSync('./whitelist.json', JSON.stringify(whitelistData, null, 2));
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
        // Check if this is a tweet engagement button
        if (interaction.customId === 'tweet_engage') {
            try {
                const { EmbedBuilder } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setTitle('🐦 Thanks for your support!')
                    .setDescription('Thank you for engaging with our tweet! Your support helps us grow the Geckura community.')
                    .setColor('#1DA1F2')
                    .addFields(
                        { name: 'Don\'t forget to:', value: '• Like the tweet\n• Retweet with comment\n• Turn on notifications', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });
                
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error handling tweet engagement button:', error);
                await interaction.reply({
                    content: 'There was an error processing your request!',
                    ephemeral: true
                });
            }
        }
        // Check if this is a whitelist-related button
        else if (interaction.customId === 'submit_whitelist_wallet' || interaction.customId === 'submit_og_wallet') {
            try {
                const command = client.commands.get('wallet');
                if (command && command.handleButton) {
                    await command.handleButton(interaction);
                } else {
                    await interaction.reply({
                        content: '⚠️ **Error:** Could not find the wallet submission handler. Please try again later.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error handling wallet submission button:', error);
                await interaction.reply({
                    content: `⚠️ **Error:** ${error.message || 'There was an error processing your wallet submission. Please try again later.'}`,
                    ephemeral: true
                });
            }
        }
        // Check if this is a collection PFP button
        else if (interaction.customId.startsWith('pfp_')) {
            try {
                const command = client.commands.get('collection');
                if (command && command.handleButton) {
                    await command.handleButton(interaction, client, config);
                } else {
                    await interaction.reply({
                        content: '⚠️ **Error:** Could not find the collection button handler. Please try again later.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error handling collection button:', error);
                await interaction.reply({
                    content: '⚠️ **Error:** There was an error processing your selection. Please try again later.',
                    ephemeral: true
                });
            }
        }
    }
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
        // Check if this is a wallet-related modal
        if (interaction.customId.includes('wallet-submit-')) {
            try {
                const command = client.commands.get('wallet');
                if (command && command.handleModal) {
                    await command.handleModal(interaction);
                } else {
                    await interaction.reply({
                        content: '⚠️ **Error:** Could not find the wallet submission handler. Please try again later.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error handling wallet submission modal:', error);
                await interaction.reply({
                    content: '⚠️ **Error:** There was an error submitting your wallet. Please try again later.',
                    ephemeral: true
                });
            }
        }
    }
});

// Global error handlers to prevent full process crash
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log in to Discord with your client's token
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'YOUR_NEW_TOKEN_HERE') {
    console.error('FATAL: No valid DISCORD_TOKEN found in .env. Please set your bot token.');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to log in to Discord:', error.message);
    process.exit(1);
});

// ==========================================
// SECURITY & MODERATION HELPER FUNCTIONS
// ==========================================

// Impersonation Guard Helper
async function checkImpersonation(member) {
    if (!member || !member.guild || member.user.bot) return;
    
    try {
        const hasBypass = member.permissions.has(PermissionFlagsBits.Administrator) ||
                          member.roles.cache.some(r => r.name === config.roles.admin || r.name === config.roles.alchemist);
        if (hasBypass) return;

        const nickname = member.nickname || '';
        const username = member.user.username || '';
        const nameToCheck = `${nickname} ${username}`.toLowerCase();
        
        // Impersonation keywords (restricted founders, staff, mods, bots)
        const restrictedKeywords = ['faizan', 'geckura', 'gekura', 'founder', 'admin', 'moderator', 'support', 'staff', 'mod'];
        const matchesForbidden = restrictedKeywords.some(keyword => nameToCheck.includes(keyword));
        
        if (matchesForbidden) {
            console.log(`🛡️ Impersonation Guard: Impersonation detected for user ${member.user.tag} (Name contains restricted keywords).`);
            
            // Check if user is a new member (joined in the last 24 hours)
            const joinedAgeMs = Date.now() - member.joinedTimestamp;
            const isNewMember = joinedAgeMs < 24 * 60 * 60 * 1000; // 24 hours

            let banSuccess = false;
            let banErrorMsg = "";

            // Attempt to DM the user before banning them (banned users cannot be DMed by the bot)
            try {
                await member.send({
                    embeds: [{
                        title: '🛡️ Security Warning',
                        description: `You have been automatically banned from **${member.guild.name}** for attempting to impersonate server founders, team members, or official bots.`,
                        color: 0xFF0000,
                        timestamp: new Date().toISOString(),
                        footer: { text: 'Geckura Security System' }
                    }]
                });
            } catch (dmError) {
                console.log(`Could not send ban notification DM to ${member.user.tag}`);
            }

            // Perform direct ban
            if (member.bannable) {
                try {
                    await member.ban({ deleteMessageSeconds: 60 * 60 * 24, reason: '🛡️ Auto-Ban: Impersonating server founders, team, or official bots' });
                    banSuccess = true;
                    console.log(`🛡️ Impersonation Guard: Banned user ${member.user.tag} successfully.`);
                } catch (banErr) {
                    console.error('Error executing ban:', banErr);
                    banErrorMsg = banErr.message;
                }
            } else {
                console.log(`Lacking permission to ban ${member.user.tag} (role hierarchy).`);
                banErrorMsg = "Bot lacks permission to ban this member (role hierarchy or ownership).";
            }

            // Alert the moderators in the logging channel
            const alertChannel = member.guild.channels.cache.find(c => 
                c.name === 'mod-logs' || c.name === 'logs' || c.name === 'alerts' || c.name === 'staff-chat' || c.name === 'admin'
            );
            if (alertChannel) {
                try {
                    const alertEmbed = {
                        title: '🚨 SECURITY INCIDENT: IMPERSONATOR AUTO-BANNED',
                        description: `Impersonation Guard triggered for name: \`${nickname || username}\``,
                        color: 0xFF0000,
                        fields: [
                            { name: 'User Tag', value: `${member.user.tag}`, inline: true },
                            { name: 'User ID', value: `\`${member.user.id}\``, inline: true },
                            { name: 'Target Account', value: `${member}`, inline: true },
                            { name: 'Account Age', value: `Joined Server: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                            { name: 'Account Check', value: isNewMember ? '🚨 **NEW ACCOUNT (< 24 HOURS)**' : 'Standard Member', inline: true },
                            { name: 'Ban Status', value: banSuccess ? '✅ **User Banned successfully**' : `❌ **Ban Failed**: ${banErrorMsg}`, inline: false }
                        ],
                        timestamp: new Date().toISOString(),
                        footer: { text: 'Geckura Safety System' }
                    };
                    await alertChannel.send({ embeds: [alertEmbed] });
                } catch (e) {
                    console.error('Error sending alert to mod channel:', e);
                }
            }
        }
    } catch (error) {
        console.error('Error executing checkImpersonation helper:', error);
    }
}

// In-memory spam tracker
const messageHistory = new Map();

function isSpamming(userId) {
    const now = Date.now();
    if (!messageHistory.has(userId)) {
        messageHistory.set(userId, []);
    }
    
    const timestamps = messageHistory.get(userId);
    const recent = timestamps.filter(time => now - time < 6000);
    recent.push(now);
    messageHistory.set(userId, recent);
    
    return recent.length > 4;
}

// Periodic cleanup: purge stale spam tracker entries every 60 seconds to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamps] of messageHistory.entries()) {
        const recent = timestamps.filter(time => now - time < 6000);
        if (recent.length === 0) {
            messageHistory.delete(userId);
        } else {
            messageHistory.set(userId, recent);
        }
    }
}, 60 * 1000);
