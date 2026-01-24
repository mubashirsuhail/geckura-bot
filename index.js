const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();
console.log("Discord token loaded:", process.env.DISCORD_TOKEN ? "Yes" : "No");
const config = require('./config.json');

// Load chat2earn handler
const { handleMessage } = require('./utils/chat2earn-handler');

// Load link filter
const { execute: handleLinkFilter } = require('./utils/link-filter');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

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
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('GeckAura — Where Innovation Meets Utility!', { type: 'WATCHING' });
    
    // Start whitelist monitoring
    startMonitoring(client, config);
    console.log('Whitelist monitoring system started.');

    // Start OG monitoring
    startOGMonitoring(client, config);
    console.log('OG monitoring system started.');
});

// Event: Guild member add (for welcome messages)
client.on('guildMemberAdd', async member => {
    // Don't send welcome message immediately
});

// Event: Guild member update (for role upgrades)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Check if member gained the welcome role
    const welcomeRoleId = '1438176728651534356';
    
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
    
    // Process chat2earn rewards
    handleMessage(message, client);
    
    // Check if user has admin permissions
    const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
    
    // If user is not an admin, check for links
    if (!isAdmin) {
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
                // Check if bot has permission to timeout members
                if (!message.guild.members.me.permissions.has('MODERATE_MEMBERS')) {
                    console.error(`Bot doesn't have permission to timeout members in server ${message.guild.name}`);
                    // Still try to send the alert even if we can't timeout
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

// Log in to Discord with your client's token
console.log("Attempting to log in to Discord with token...");
console.log("Token (first 10 chars):", process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.substring(0, 10) + "..." : "undefined");
console.log("Token length:", process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : "undefined");

try {
    client.login(process.env.DISCORD_TOKEN);
} catch (error) {
    console.error("Error during login:", error.message);
}
