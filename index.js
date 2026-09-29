const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();
const config = require('./config.json');

// Load chat2earn handler
const { handleMessage } = require('./utils/chat2earn-handler');

// Load link filter
const { execute: handleLinkFilter } = require('./utils/link-filter');

// Load welcome and role upgrade handlers
const { sendWelcomeMessage } = require('./utils/welcome-handler');
const { handleRoleUpgrade } = require('./utils/role-upgrade-handler');


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

// Initialize client commands collection and load command modules
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command && command.data && command.data.name) {
            client.commands.set(command.data.name, command);
        }
    }
}

// Event: Bot is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('GeckAura — Where Innovation Meets Utility!', { type: 'WATCHING' });

    // Start background raffle auto checker (15s interval)
    try {
        const { startAutoRaffleChecker } = require('./commands/raffle');
        startAutoRaffleChecker(client);
        console.log('Raffle background auto-checker started.');
    } catch (err) {
        console.error('Error starting raffle auto checker:', err);
    }

    // Start 12-hour Safety Reminder interval (12 * 60 * 60 * 1000 ms)
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
    }, 12 * 60 * 60 * 1000);
    console.log('Safety reminder interval system active (every 12 hours).');
});

// Event: Guild member add (for welcome messages and impersonation protection)
client.on('guildMemberAdd', async member => {
    // Impersonation check
    await checkImpersonation(member);
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

    // Ignore all Direct Messages (DMs)
    if (!message.guild) return;

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
                if (!message.channel.permissionsFor(client.user).has(PermissionFlagsBits.ManageMessages)) {
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
                if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
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


});

// Event: Interaction created
client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client, config);
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
        // Check if this is a Geckura verification button
        if (interaction.customId.startsWith('verify_')) {
            try {
                const { handleVerificationButton } = require('./utils/verification-handler');
                return await handleVerificationButton(interaction, client);
            } catch (err) {
                console.error('Error handling verification button:', err);
                return await interaction.reply({ content: '⚠️ Error processing verification button.', ephemeral: true });
            }
        }
        // Check if this is a Gecko Frenzy Join button
        else if (interaction.customId.startsWith('gecko_frenzy_join_')) {
            try {
                const frenzyId = interaction.customId.replace('gecko_frenzy_join_', '');
                const { frenzyManager } = require('./utils/gecko-frenzy-engine');
                const frenzy = frenzyManager.getFrenzy(frenzyId);

                if (!frenzy) {
                    return await interaction.reply({ content: '⚠️ **Frenzy Expired:** This Gecko Frenzy is no longer active.', ephemeral: true });
                }

                const result = frenzyManager.addPlayer(frenzyId, interaction.user, interaction.member);

                if (!result.success) {
                    return await interaction.reply({ content: result.reason, ephemeral: true });
                }

                // Ephemeral confirmation
                await interaction.reply({
                    content: `✅ **You're in!**\n\n🦎 **${result.geckoName}**\n\n👥 Players: **${result.playerCount} / ${result.maxPlayers}**`,
                    ephemeral: true
                });

                // Instantly update public lobby embed
                if (frenzy.messageId) {
                    try {
                        const channel = await client.channels.fetch(frenzy.channelId);
                        if (channel) {
                            const msg = await channel.messages.fetch(frenzy.messageId);
                            if (msg) {
                                const updatedEmbed = frenzyManager.buildLobbyEmbed(frenzy);
                                const updatedButtons = frenzyManager.buildLobbyButtons(frenzy);
                                await msg.edit({ embeds: [updatedEmbed], components: [updatedButtons] });
                            }
                        }
                    } catch (e) {}
                }

                // Auto-start early if max capacity reached
                if (frenzy.players.length >= frenzy.maxPlayers && frenzy.status === 'JOINING') {
                    await frenzyManager.startFrenzyLoop(client, frenzy.id);
                }
            } catch (err) {
                console.error('Error handling gecko frenzy join button:', err);
                await interaction.reply({ content: '⚠️ Error processing join request.', ephemeral: true });
            }
        }
        // Check if this is a Benefits filter button
        else if (interaction.customId.startsWith('benefits_filter_')) {
            try {
                const category = interaction.customId.replace('benefits_filter_', '');
                const { buildBenefitsEmbed, buildBenefitsButtons } = require('./commands/benefits');
                const embed = buildBenefitsEmbed(category, client, config);
                const rows = buildBenefitsButtons(category, config);
                await interaction.update({ embeds: [embed], components: rows });
            } catch (err) {
                console.error('Error in benefits button interaction:', err);
                await interaction.reply({ content: '⚠️ Error updating benefits view.', ephemeral: true });
            }
        }
        // Check if this is a tweet engagement button
        else if (interaction.customId === 'tweet_engage') {
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
        // Check if this is a Mystery Box Inquiry button
        else if (interaction.customId === 'mb_inquire') {
            try {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle('📩 Open a Ticket for More Info & Orders')
                    .setDescription(
                        'Ready to launch **Mystery Box as a Service (MaaS)** for your project or need more info?\n\n' +
                        '🎫 **Open a Support Ticket** in our Discord server or DM the founding team (`@Mubi`) to discuss your custom project requirements.'
                    )
                    .setColor(0x00FF99)
                    .addFields(
                        {
                            name: '🎟️ How to Get Started',
                            value: '1. Head over to our **ticket channel** and open an Inquiry Ticket.\n2. Share your project details, logo, banner, custom token details, and prize pool idea.\n3. Our dev team will guide you through setup and deploy your custom Mystery Box portal!',
                            inline: false
                        },
                        {
                            name: '⚡ Fast Turnaround',
                            value: 'Full custom portal setup & Discord webhook integration delivered within 24 hours of onboarding!',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Geckura B2B Utility Services — Open a Ticket for More Info' })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (err) {
                console.error('Error in mb_inquire button:', err);
                await interaction.reply({ content: '⚠️ Error processing inquiry request.', ephemeral: true });
            }
        }
        // Check if this is a Mystery Box Specs button
        else if (interaction.customId === 'mb_specs') {
            try {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle('📜 Mystery Box Utility — Technical Specs & Packages')
                    .setDescription('Explore our flexible integration packages designed for Web3 & Solana projects of all sizes:')
                    .setColor(0x9D4EDD)
                    .addFields(
                        {
                            name: '🥉 STARTER TIER (Single Campaign)',
                            value: '• 1 Custom Mystery Box Setup\n• Supports SOL or $GECKURA payments\n• Standard Webhook win announcements\n• Ideal for 1-time holder drops or event raffles',
                            inline: false
                        },
                        {
                            name: '🥈 PRO TIER (Monthly Utility Subscription)',
                            value: '• Up to 3 Simultaneous Mystery Box Tiers (Common / Rare / Legendary)\n• Custom SPL Token Payment Sink (burn or treasury auto-transfer)\n• Dedicated Web App Subdomain (`mysterybox.geckura.app/yourproject`)\n• Live Discord Webhook feeds with role mentions',
                            inline: false
                        },
                        {
                            name: '🥇 ENTERPRISE TIER (White-Label Portal)',
                            value: '• Complete standalone custom web application under your custom domain\n• Full custom smart contract logic & dedicated high-speed Solana RPC\n• Real-time admin portal for live prize odds & inventory management\n• Priority 24/7 technical support & custom Discord bot integration',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'Geckura — Turning Chaos into Flow' })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } catch (err) {
                console.error('Error in mb_specs button:', err);
                await interaction.reply({ content: '⚠️ Error processing specs request.', ephemeral: true });
            }
        }
        // Check if this is a raffle entry button
        else if (interaction.customId.startsWith('raffle_enter_')) {
            try {
                const raffleId = interaction.customId.replace('raffle_enter_', '');
                const fs = require('fs');
                const path = require('path');
                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
                const rafflesPath = path.join(__dirname, 'data', 'raffles.json');
                
                if (fs.existsSync(rafflesPath)) {
                    const raffles = JSON.parse(fs.readFileSync(rafflesPath, 'utf8'));
                    const raffle = (raffles.active || []).find(r => r.id === raffleId);

                    if (!raffle || raffle.status !== 'active') {
                        return await interaction.reply({ content: '⚠️ **Raffle Ended:** This raffle is no longer active.', ephemeral: true });
                    }

                    if (Date.now() > raffle.endTime) {
                        return await interaction.reply({ content: '⚠️ **Raffle Expired:** Ticket sales for this raffle have concluded.', ephemeral: true });
                    }

                    if (raffle.maxTickets && (raffle.tickets || []).length >= raffle.maxTickets) {
                        return await interaction.reply({ content: '⚠️ **Sold Out:** Maximum ticket capacity reached!', ephemeral: true });
                    }

                    const userTicketCount = (raffle.tickets || []).filter(t => t.discordId === interaction.user.id).length;
                    if (raffle.maxPerUser && userTicketCount >= raffle.maxPerUser) {
                        return await interaction.reply({
                            content: `⚠️ **Per-User Limit Reached:** You have already bought **${userTicketCount} / ${raffle.maxPerUser}** allowed tickets for this raffle.`,
                            ephemeral: true
                        });
                    }

                    // Open modal for ticket purchase
                    const modal = new ModalBuilder()
                        .setCustomId(`raffle_modal_${raffle.id}`)
                        .setTitle(`🎟️ Buy Raffle Ticket (${raffle.ticketPrice} ${raffle.currency})`);

                    const txInput = new TextInputBuilder()
                        .setCustomId('tx_sig_input')
                        .setLabel(raffle.currency === 'GECKURA' ? 'Confirm Purchase (Type AGREE to confirm)' : `Solana TX Signature (${raffle.currency} Transfer)`)
                        .setPlaceholder(raffle.currency === 'GECKURA' ? 'Type AGREE' : `Paste TX hash sent to ${raffle.treasuryWallet.slice(0, 6)}...`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);

                    const firstRow = new ActionRowBuilder().addComponents(txInput);
                    modal.addComponents(firstRow);

                    await interaction.showModal(modal);
                }
            } catch (error) {
                console.error('Error handling raffle button modal:', error);
                await interaction.reply({ content: '⚠️ Error opening ticket purchase dialog.', ephemeral: true });
            }
        }
    }
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
        // Check if this is a Geckura verification modal submission
        if (interaction.customId === 'verify_wallet_modal_submit') {
            try {
                const { handleVerificationModalSubmit } = require('./utils/verification-handler');
                return await handleVerificationModalSubmit(interaction, client);
            } catch (err) {
                console.error('Error handling verification modal submit:', err);
                if (interaction.deferred || interaction.replied) {
                    return await interaction.editReply({ content: '⚠️ Error processing wallet verification.' });
                } else {
                    return await interaction.reply({ content: '⚠️ Error processing wallet verification.', ephemeral: true });
                }
            }
        }
        // Check if this is a raffle entry modal
        else if (interaction.customId.startsWith('raffle_modal_')) {
            try {
                await interaction.deferReply({ ephemeral: true });
                const raffleId = interaction.customId.replace('raffle_modal_', '');
                const fs = require('fs');
                const path = require('path');
                const { Connection } = require('@solana/web3.js');
                const { buildRaffleEmbed, executeDraw } = require('./commands/raffle');

                const rafflesPath = path.join(__dirname, 'data', 'raffles.json');
                const userBalancePath = path.join(__dirname, 'data', 'chat2earn-users.json');

                if (!fs.existsSync(rafflesPath)) return await interaction.editReply({ content: '⚠️ Raffle data error.' });
                
                const raffles = JSON.parse(fs.readFileSync(rafflesPath, 'utf8'));
                const raffle = (raffles.active || []).find(r => r.id === raffleId);

                if (!raffle || raffle.status !== 'active') {
                    return await interaction.editReply({ content: '⚠️ **Raffle Ended:** This raffle is no longer active.' });
                }

                const userTicketCount = (raffle.tickets || []).filter(t => t.discordId === interaction.user.id).length;
                if (raffle.maxPerUser && userTicketCount >= raffle.maxPerUser) {
                    return await interaction.editReply({
                        content: `⚠️ **Per-User Limit Reached:** You have already bought **${userTicketCount} / ${raffle.maxPerUser}** allowed tickets for this raffle.`
                    });
                }

                const submittedInput = interaction.fields.getTextInputValue('tx_sig_input').trim();

                // 1. $GECKURA Token Payment
                if (raffle.currency === 'GECKURA') {
                    let userData = {};
                    if (fs.existsSync(userBalancePath)) {
                        userData = JSON.parse(fs.readFileSync(userBalancePath, 'utf8'));
                    }
                    const userObj = userData[interaction.user.id] || { tokens: 0 };

                    if (userObj.tokens < raffle.ticketPrice) {
                        return await interaction.editReply({
                            content: `⚠️ **Insufficient Balance:** You have \`${userObj.tokens} $GECKURA\` but ticket costs \`${raffle.ticketPrice} $GECKURA\`.`
                        });
                    }

                    userObj.tokens -= raffle.ticketPrice;
                    userData[interaction.user.id] = userObj;
                    fs.writeFileSync(userBalancePath, JSON.stringify(userData, null, 2));

                    const ticketNum = (raffle.tickets || []).length + 1;
                    raffle.tickets.push({
                        ticketNumber: ticketNum,
                        discordId: interaction.user.id,
                        discordTag: interaction.user.tag,
                        timestamp: new Date().toISOString(),
                        txSignature: 'INTERNAL_TOKEN_PAYMENT'
                    });

                    fs.writeFileSync(rafflesPath, JSON.stringify(raffles, null, 2));

                    // Update channel message
                    if (raffle.messageId && raffle.channelId) {
                        try {
                            const channel = await client.channels.fetch(raffle.channelId);
                            if (channel) {
                                const originalMsg = await channel.messages.fetch(raffle.messageId);
                                if (originalMsg) {
                                    await originalMsg.edit({ embeds: [buildRaffleEmbed(raffle)] });
                                }
                            }
                        } catch (e) {}
                    }

                    await interaction.editReply({
                        content: `🎉 **Ticket Purchased!** Confirmed Ticket **#${ticketNum}** for \`${raffle.ticketPrice} $GECKURA\`! Good luck in the draw!`
                    });

                    // Check Instant Sell Out Auto-Draw
                    if (raffle.maxTickets && raffle.tickets.length >= raffle.maxTickets) {
                        await executeDraw(client, raffle);
                    }
                    return;
                }

                // 2. SOL / SPL On-Chain Payment
                if (!submittedInput || submittedInput.length < 32) {
                    return await interaction.editReply({ content: '⚠️ **Invalid Solana Transaction Hash:** Please submit a valid transaction signature.' });
                }

                // Check TX signature duplicate
                if ((raffle.tickets || []).some(t => t.txSignature === submittedInput)) {
                    return await interaction.editReply({ content: '⚠️ **Duplicate TX:** This transaction signature has already been submitted for a ticket.' });
                }

                // On-chain verification via RPC
                const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
                const connection = new Connection(SOLANA_RPC, 'confirmed');

                const tx = await connection.getParsedTransaction(submittedInput, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });

                if (!tx || !tx.meta) {
                    return await interaction.editReply({ content: '⚠️ **Transaction Not Found:** Signature not found on Solana mainnet. Please wait a few seconds and try again.' });
                }

                if (tx.meta.err) {
                    return await interaction.editReply({ content: '⚠️ **Transaction Failed:** Transaction failed on-chain.' });
                }

                const ticketNum = (raffle.tickets || []).length + 1;
                raffle.tickets.push({
                    ticketNumber: ticketNum,
                    discordId: interaction.user.id,
                    discordTag: interaction.user.tag,
                    timestamp: new Date().toISOString(),
                    txSignature: submittedInput
                });

                fs.writeFileSync(rafflesPath, JSON.stringify(raffles, null, 2));

                // Update channel message
                if (raffle.messageId && raffle.channelId) {
                    try {
                        const channel = await client.channels.fetch(raffle.channelId);
                        if (channel) {
                            const originalMsg = await channel.messages.fetch(raffle.messageId);
                            if (originalMsg) {
                                await originalMsg.edit({ embeds: [buildRaffleEmbed(raffle)] });
                            }
                        }
                    } catch (e) {}
                }

                await interaction.editReply({
                    content: `✅ **On-Chain Payment Verified!** Ticket **#${ticketNum}** confirmed for raffle **${raffle.title}**!\nTransaction: [View on Solscan](https://solscan.io/tx/${submittedInput})`
                });

                // Check Instant Sell Out Auto-Draw
                if (raffle.maxTickets && raffle.tickets.length >= raffle.maxTickets) {
                    await executeDraw(client, raffle);
                }

            } catch (error) {
                console.error('Error in raffle modal submission:', error);
                await interaction.editReply({ content: `⚠️ Error verifying ticket: ${error.message || 'Unknown error'}` });
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
