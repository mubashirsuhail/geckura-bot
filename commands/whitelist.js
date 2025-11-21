const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the data file
const dataPath = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

// Path to wallets file
const walletsPath = path.join(dataPath, 'wallets.json');

// Initialize wallets file if it doesn't exist
if (!fs.existsSync(walletsPath)) {
    fs.writeFileSync(walletsPath, JSON.stringify({ whitelist: [], og: [] }, null, 2));
}

// Function to read wallets from file
function readWallets() {
    try {
        return JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
    } catch (error) {
        console.error('Error reading wallets file:', error);
        return { whitelist: [], og: [] };
    }
}

// Function to write wallets to file
function writeWallets(wallets) {
    try {
        fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing wallets file:', error);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Shows how to earn Whitelist (WL) and OG roles, and allows wallet submission'),
    async execute(interaction) {
        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle('🌟 Whitelist & OG Information')
            .setDescription("Learn how to earn prestigious **Whitelist** and **OG** roles in the Geckura community!")
            .setColor('#00FF99')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🔑 Whitelist Requirements',
                    value: '• Reach **Level 5** → Earn WL points\n' +
                        '• Reach **Level 10** → Earn WL points\n' +
                        '• Invite **5 members** → Earn WL points\n' +
                        '• Invite **10 members** → Earn WL points\n' +
                        '• Win **community games** → Earn WL points\n' +
                        '• Participate in **collaborations** → Earn WL points\n' +
                        '• Join **raid events** → Earn WL points\n' +
                        '• Win **special contests** → Earn WL points',
                    inline: true
                },
                {
                    name: '👑 OG Status Requirements',
                    value: '• **Early members** → Automatically eligible\n' +
                        '• **Server boosters** → Eligible\n' +
                        '• **Partners** → Eligible\n' +
                        '• **Special contest winners** → Eligible',
                    inline: true
                },
                {
                    name: '💎 Benefits',
                    value: '**Whitelist Role:**\n' +
                        '• Guaranteed mint spots\n' +
                        '• Early access to new features\n' +
                        '• Exclusive community channels\n\n' +
                        '**OG Role:**\n' +
                        '• All Whitelist benefits\n' +
                        '• Special recognition\n' +
                        '• Additional perks & rewards',
                    inline: false
                }
            )
            .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Create the buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('submit_whitelist_wallet')
                    .setLabel('🔑 Submit Whitelist Wallet')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔑'),
                new ButtonBuilder()
                    .setCustomId('submit_og_wallet')
                    .setLabel('👑 Submit OG Wallet')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👑')
            );

        // Send the embed with buttons
        await interaction.reply({ embeds: [embed], components: [row] });
    },
    async handleButton(interaction) {
        // Create a modal for wallet submission
        const modal = new ModalBuilder()
            .setCustomId(`wallet_modal_${interaction.customId}`)
            .setTitle('Submit Your Wallet');

        // Determine which type of wallet is being submitted
        const walletType = interaction.customId === 'submit_whitelist_wallet' ? 'Whitelist' : 'OG';

        // Create the text input for wallet address
        const walletInput = new TextInputBuilder()
            .setCustomId('wallet_address')
            .setLabel(`${walletType} Wallet Address`)
            .setPlaceholder(`Enter your Solana wallet address (32-44 characters)...\n\nExample: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`)
            .setStyle(TextInputStyle.Short)
            .setMinLength(32)
            .setMaxLength(44)
            .setRequired(true);

        // Add the input to the modal
        const firstActionRow = new ActionRowBuilder().addComponents(walletInput);
        modal.addComponents(firstActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
    async handleModal(interaction) {
        // Get the wallet type from the custom ID
        const walletType = interaction.customId.includes('whitelist') ? 'whitelist' : 'og';

        // Get the wallet address from the modal
        const walletAddress = interaction.fields.getTextInputValue('wallet_address');

        // Validate wallet address (basic validation for Solana addresses)
        if (walletAddress.length < 32 || walletAddress.length > 44) {
            await interaction.reply({
                content: '⚠️ **Invalid Wallet Address:** Please enter a valid Solana wallet address (32-44 characters).\n\nExample: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
                ephemeral: true
            });
            return;
        }

        // Read current wallets
        const wallets = readWallets();

        // Check if user already submitted a wallet
        const existingEntry = wallets[walletType].find(entry => entry.discordId === interaction.user.id);

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
            await interaction.reply({
                content: `${roleEmoji} **Success!** Your ${roleName} wallet has been successfully submitted!\n\nWe've recorded your submission and will verify your eligibility. Thank you for your participation in the Geckura community!`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '⚠️ **Error:** We encountered an issue while saving your wallet. Please try again later or contact a server administrator if the problem persists.',
                ephemeral: true
            });
        }
    }
};
