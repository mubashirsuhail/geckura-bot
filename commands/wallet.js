const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to data files
const dataPath = path.join(__dirname, '..', 'data');
const walletsPath = path.join(dataPath, 'wallets.json');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}

// Function to read wallets
function readWallets() {
    try {
        if (fs.existsSync(walletsPath)) {
            return JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
        } else {
            // Create default structure if file doesn't exist
            const defaultWallets = {
                whitelist: [],
                og: []
            };
            fs.writeFileSync(walletsPath, JSON.stringify(defaultWallets, null, 2));
            return defaultWallets;
        }
    } catch (error) {
        console.error('Error reading wallets:', error);
        return { whitelist: [], og: [] };
    }
}

// Function to write wallets
function writeWallets(wallets) {
    try {
        fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing wallets:', error);
        return false;
    }
}

// Create the command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Manage your wallet submissions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('submit')
                .setDescription('Submit your wallet address for Whitelist or OG status')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of wallet submission')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Whitelist', value: 'whitelist' },
                            { name: 'OG', value: 'og' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check your submitted wallet addresses')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'submit') {
            const walletType = interaction.options.getString('type');

            // Check if user has required role
            const requiredRoleId = walletType === 'whitelist' ? '1438228532546240614' : '1438228652579094679';
            const hasRole = interaction.member.roles.cache.has(requiredRoleId);

            if (!hasRole) {
                await interaction.reply({
                    content: `⚠️ **Access Denied:** You need the ${requiredRole} role to submit a wallet for this status type.\n\nIf you believe you should have this role, please contact a server administrator.`,
                    ephemeral: true
                });
                return;
            }

            // Create modal for wallet submission
            const modal = new ModalBuilder()
                .setCustomId(`wallet-submit-${walletType}`)
                .setTitle(`${walletType === 'whitelist' ? 'Whitelist' : 'OG'} Wallet Submission`);

            // Add text input for wallet address
            const walletInput = new TextInputBuilder()
                .setCustomId('walletAddress')
                .setLabel('Solana Wallet Address')
                .setPlaceholder('Enter your Solana wallet address (e.g., 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM)')
                .setStyle('Short')
                .setRequired(true)
                .setMinLength(32)
                .setMaxLength(44);

            // Add action row to modal
            const actionRow = new ActionRowBuilder().addComponents(walletInput);
            modal.addComponents(actionRow);

            // Show modal
            await interaction.showModal(modal);
        } else if (subcommand === 'check') {
            // Read current wallets
            const wallets = readWallets();

            // Check if user has submitted any wallets
            const wlEntry = wallets.whitelist.find(entry => entry.discordId === interaction.user.id);
            const ogEntry = wallets.og.find(entry => entry.discordId === interaction.user.id);

            if (!wlEntry && !ogEntry) {
                await interaction.reply({
                    content: 'You have not submitted any wallet addresses yet. Use `/wallet submit` to submit your wallet.',
                    ephemeral: true
                });
                return;
            }

            // Create embed to show wallet information
            const embed = new EmbedBuilder()
                .setTitle('Your Wallet Submissions')
                .setColor('#0099ff')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: interaction.client.user.displayAvatarURL() });

            // Add whitelist wallet if exists
            if (wlEntry) {
                embed.addFields({
                    name: '🔑 Whitelist Wallet',
                    value: `Address: \`${wlEntry.walletAddress}\`
Submitted: ${new Date(wlEntry.timestamp).toLocaleString()}`,
                    inline: false
                });
            }

            // Add OG wallet if exists
            if (ogEntry) {
                embed.addFields({
                    name: '👑 OG Wallet',
                    value: `Address: \`${ogEntry.walletAddress}\`
Submitted: ${new Date(ogEntry.timestamp).toLocaleString()}`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    // Handle modal submission
    async handleModal(interaction) {
        // Extract wallet type from custom ID
        const walletType = interaction.customId.replace('wallet-submit-', '');
        const walletAddress = interaction.fields.getTextInputValue('walletAddress').trim();

        // Validate wallet address (basic validation for Solana addresses)
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
            await interaction.reply({
                content: '⚠️ **Invalid Wallet Address:** Please enter a valid Solana wallet address. Solana addresses are 32-44 characters long and contain only base58 characters.',
                ephemeral: true
            });
            return;
        }

        try {
            // Read current wallets
            const wallets = readWallets();

            // Check if user already submitted a wallet
            const existingEntry = wallets[walletType].find(entry => entry.discordId === interaction.user.id);

            // Check if wallet address is already in use by another user
            const existingWallet = wallets[walletType].find(entry => 
                entry.walletAddress === walletAddress && entry.discordId !== interaction.user.id
            );

            if (existingWallet) {
                await interaction.reply({
                    content: '⚠️ **Wallet Already Registered:** This wallet address is already registered by another user. Each wallet address can only be registered once.\n\nIf you believe this is an error, please contact a server administrator.',
                    ephemeral: true
                });
                return;
            }

            if (existingEntry) {
                // Update existing entry
                existingEntry.walletAddress = walletAddress;
                existingEntry.timestamp = new Date().toISOString();
            } else {
                // Add new entry
                wallets[walletType].push({
                    discordId: interaction.user.id,
                    discordTag: interaction.user.tag,
                    walletAddress: walletAddress,
                    timestamp: new Date().toISOString()
                });
            }

            // Save wallets
            if (writeWallets(wallets)) {
                const roleEmoji = walletType === 'whitelist' ? '🔑' : '👑';
                const roleName = walletType === 'whitelist' ? 'Whitelist' : 'OG';

                // Create success embed
                const successEmbed = new EmbedBuilder()
                    .setTitle(`${roleEmoji} Wallet Submission Successful!`)
                    .setDescription(`Your ${roleName} wallet has been successfully submitted!`)
                    .setColor(walletType === 'whitelist' ? '#00FF99' : '#FFD700')
                    .addFields(
                        {
                            name: 'Wallet Address',
                            value: `\`${walletAddress}\``,
                            inline: false
                        },
                        {
                            name: 'Next Steps',
                            value: walletType === 'whitelist' 
                                ? 'If you qualify for Whitelist status, you will be automatically assigned the Whitelist role within the next hour. You will receive a DM notification when this happens.'
                                : 'Your OG status will be verified based on our criteria (early member, server booster, staff member, etc.). If approved, you will be assigned the OG role within the next hour and receive a DM notification.',
                            inline: false
                        }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: interaction.client.user.displayAvatarURL() });

                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            } else {
                await interaction.reply({
                    content: '⚠️ **Error:** We encountered an issue while saving your wallet. Please try again later or contact a server administrator if the problem persists.',
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in handleModal:', error);
            await interaction.reply({
                content: '⚠️ **Error:** There was an error processing your wallet submission. Please try again later.',
                ephemeral: true
            });
        }
    }
};
