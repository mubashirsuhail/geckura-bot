const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();
const config = require('./config.json');

// Load chat2earn handler
const { handleMessage } = require('./utils/chat2earn-handler');

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
                await message.member.timeout(48 * 60 * 60 * 1000, 'Posting links without admin permission');
                
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
            await command.execute(interaction, client, config, whitelistData);

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
            const command = client.commands.get('whitelist');
            if (command && command.handleButton) {
                try {
                    await command.handleButton(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({
                        content: 'There was an error handling this button!',
                        ephemeral: true
                    });
                }
            }
        }
    }
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
        // Check if this is a whitelist-related modal
        if (interaction.customId.includes('wallet_modal_')) {
            const command = client.commands.get('whitelist');
            if (command && command.handleModal) {
                try {
                    await command.handleModal(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({
                        content: 'There was an error submitting your wallet!',
                        ephemeral: true
                    });
                }
            }
        }
    }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
