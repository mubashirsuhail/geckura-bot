const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const { getUserData, saveUserData } = require('../utils/chat2earn-handler');
const { verifyWalletNFTs, assignHolderRoles, getHashlistConfig } = require('../utils/nft-verifier');

// Helper to construct Matrica-style verification embed
function buildVerificationEmbed(config, client) {
    const primaryColor = parseInt(config?.colors?.primary?.replace('#', '') || '00FF99', 16);

    return new EmbedBuilder()
        .setTitle('🦎 GECKURA HOLDER VERIFICATION')
        .setColor(primaryColor)
        .setDescription(
            `Welcome to the official **Geckura Holder Verification Portal**!\n\n` +
            `Connect your Solana wallet to verify your **Geckura NFTs** and automatically unlock your exclusive holder roles and Discord perks.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎭 **QUANTITY-BASED HOLDER TIERS**\n` +
            `• 🎟️ **1 – 3 NFTs:** \`Geckura Holder\`\n` +
            `• 👑 **4 – 9 NFTs:** \`Geckura Collector\`\n` +
            `• 🐋 **10 – 30+ NFTs:** \`Geckura Whale\`\n` +
            `• 💎 **1-of-1 NFTs:** \`Geckura 1-of-1 Holder\`\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `👇 **Click the button below to paste your Solana wallet and get verified instantly!**`
        )
        .addFields(
            {
                name: '🔒 Security Note',
                value: '• We **NEVER** ask for your seed phrase or private keys.\n• Only public wallet addresses are submitted for on-chain verification.',
                inline: false
            }
        )
        .setFooter({ text: 'Geckura Automated Solana Holder Verification', iconURL: client?.user?.displayAvatarURL() })
        .setTimestamp();
}

// Helper to construct verification action buttons
function buildVerificationButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('verify_modal_btn')
            .setLabel('💳 Paste Wallet & Verify')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('verify_refresh_btn')
            .setLabel('🔄 Re-verify Roles')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('verify_view_btn')
            .setLabel('📊 View Profile')
            .setStyle(ButtonStyle.Secondary)
    );
}

module.exports = {
    buildVerificationEmbed,
    buildVerificationButtons,

    data: new SlashCommandBuilder()
        .setName('verification-panel')
        .setDescription('Deploy the interactive Solana Holder Verification embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, config) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ **Access Denied:** Administrator permissions required to deploy the verification panel.',
                ephemeral: true
            });
        }

        const embed = buildVerificationEmbed(config, client);
        const row = buildVerificationButtons();

        await interaction.reply({
            content: '✅ **Verification Panel Deployed Below:**',
            ephemeral: true
        });

        return await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
};
