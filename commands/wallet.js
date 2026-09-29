const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserData, saveUserData } = require('../utils/chat2earn-handler');
const { verifyWalletNFTs, assignHolderRoles, getHashlistConfig, saveHashlistConfig } = require('../utils/nft-verifier');

// Solana base58 wallet address validation (32 to 44 characters)
function isValidSolanaAddress(address) {
    return typeof address === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim());
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('Connect, verify, or update your Solana wallet for Geckura NFT holder roles and payouts')
        .addSubcommand(sub =>
            sub.setName('set')
                .setDescription('Link your Solana wallet address and verify NFT holder roles')
                .addStringOption(option =>
                    option.setName('address')
                        .setDescription('Your Solana public wallet address (e.g. Phantom, Backpack, Solflare)')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('verify')
                .setDescription('Re-verify your linked Solana wallet for holder roles'))
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View your currently linked Solana wallet and rewards profile'))
        .addSubcommand(sub =>
            sub.setName('unlink')
                .setDescription('Remove your linked Solana wallet address')),

    async execute(interaction, client, config) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const userData = getUserData(userId);
        const primaryColor = parseInt(config?.colors?.primary?.replace('#', '') || '00FF99', 16);

        if (subcommand === 'set' || subcommand === 'verify') {
            let targetAddress = userData.solanaWallet;

            if (subcommand === 'set') {
                targetAddress = interaction.options.getString('address').trim();
                if (!isValidSolanaAddress(targetAddress)) {
                    return await interaction.reply({
                        content: '❌ **Invalid Solana Address:** Please enter a valid Solana public key (32-44 characters base58 string).',
                        ephemeral: true
                    });
                }
                userData.solanaWallet = targetAddress;
                userData.walletLinkedAt = Date.now();
                saveUserData(userId, userData);
            }

            if (!targetAddress) {
                return await interaction.reply({
                    content: '⚠️ You do not have a Solana wallet linked. Use `/wallet set <address>` first!',
                    ephemeral: true
                });
            }

            // Defer reply for async NFT RPC / Helius API verification
            await interaction.deferReply({ ephemeral: true });

            const verificationResult = await verifyWalletNFTs(targetAddress);
            let roleSummary = 'No holder roles assigned (No verified Geckura NFTs found in wallet).';

            if (interaction.member) {
                const assignedRoles = await assignHolderRoles(interaction.member, verificationResult);
                if (Array.isArray(assignedRoles) && assignedRoles.length > 0) {
                    roleSummary = `🎉 **Roles Granted / Verified:** ${assignedRoles.map(r => `\`${r}\``).join(', ')}`;
                } else if (verificationResult.isHolder) {
                    roleSummary = `✅ **Holder Verified!** (Current roles active)`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('💳 Solana Wallet Connected & Verified!')
                .setColor(verificationResult.isHolder ? 0x00FF99 : primaryColor)
                .setDescription(
                    `Your Solana wallet has been linked and verified.\n\n` +
                    `📍 **Wallet Address:** \`${targetAddress}\`\n` +
                    `🖼️ **Geckura NFTs Detected:** \`${verificationResult.holderCount}\`\n\n` +
                    `🎭 **Role Status:** ${roleSummary}`
                )
                .addFields(
                    {
                        name: '📊 Quantity Tiers',
                        value: '• **1 - 3 NFTs:** `Geckura Holder`\n• **4 - 9 NFTs:** `Geckura Collector`\n• **10 - 30+ NFTs:** `Geckura Whale`',
                        inline: false
                    }
                )
                .setFooter({ text: 'Geckura Automated Solana Wallet & Role Verifier', iconURL: client.user?.displayAvatarURL() })
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });
        }

        else if (subcommand === 'view') {
            const linkedWallet = userData.solanaWallet;

            const viewEmbed = new EmbedBuilder()
                .setTitle(`💳 ${interaction.user.username}'s Wallet & Profile`)
                .setColor(primaryColor)
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    {
                        name: '📍 Linked Solana Wallet',
                        value: linkedWallet ? `\`${linkedWallet}\`` : '⚠️ *No wallet connected yet. Use `/wallet set <address>` to link your Phantom / Solflare wallet!*',
                        inline: false
                    },
                    {
                        name: '💰 $GECKURA Token Balance',
                        value: `**${(userData.tokens || 0).toLocaleString()} $GECKURA**`,
                        inline: true
                    },
                    {
                        name: '📊 Chat2Earn Level',
                        value: `**Level ${userData.level || 1}**`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Use /wallet set <address> to link or /wallet verify to refresh roles.', iconURL: client.user?.displayAvatarURL() })
                .setTimestamp();

            return await interaction.reply({ embeds: [viewEmbed], ephemeral: true });
        }

        else if (subcommand === 'unlink') {
            if (!userData.solanaWallet) {
                return await interaction.reply({
                    content: '⚠️ You do not have a Solana wallet linked currently.',
                    ephemeral: true
                });
            }

            delete userData.solanaWallet;
            delete userData.walletLinkedAt;
            saveUserData(userId, userData);

            return await interaction.reply({
                content: '✅ **Wallet Unlinked:** Your Solana wallet address has been removed from your profile.',
                ephemeral: true
            });
        }
    }
};
