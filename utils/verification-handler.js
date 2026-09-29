const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, saveUserData } = require('./chat2earn-handler');
const { verifyWalletNFTs, assignHolderRoles, getHashlistConfig } = require('./nft-verifier');

/**
 * Handle Matrica-style verification button clicks
 */
async function handleVerificationButton(interaction, client) {
    const customId = interaction.customId;
    const userId = interaction.user.id;

    // 1. Open Wallet Input Modal
    if (customId === 'verify_modal_btn') {
        const modal = new ModalBuilder()
            .setCustomId('verify_wallet_modal_submit')
            .setTitle('💳 Geckura Holder Verification');

        const walletInput = new TextInputBuilder()
            .setCustomId('wallet_address_input')
            .setLabel('Paste your Solana Wallet Address')
            .setPlaceholder('e.g. 7Xw3... (Phantom, Solflare, Backpack)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(32)
            .setMaxLength(44)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(walletInput);
        modal.addComponents(row);

        return await interaction.showModal(modal);
    }

    // 2. Re-verify Holder Roles
    if (customId === 'verify_refresh_btn') {
        await interaction.deferReply({ ephemeral: true });

        const userData = getUserData(userId);
        const linkedWallet = userData.solanaWallet;

        if (!linkedWallet) {
            return await interaction.editReply({
                content: '⚠️ **No Wallet Linked:** You have not linked a Solana wallet yet. Click **💳 Paste Wallet & Verify** to get started!'
            });
        }

        try {
            const verifResult = await verifyWalletNFTs(linkedWallet);
            const assignedRoles = await assignHolderRoles(interaction.member, verifResult);
            const roleList = Array.isArray(assignedRoles) ? assignedRoles : (assignedRoles.assigned || []);
            const nftCount = verifResult.count ?? verifResult.holderCount ?? 0;

            const refreshEmbed = new EmbedBuilder()
                .setTitle('🔄 Holder Roles Re-verified!')
                .setColor(verifResult.isHolder ? 0x00FF99 : 0xFF9900)
                .setDescription(
                    `📍 **Linked Wallet:** \`${linkedWallet}\`\n\n` +
                    `🎨 **Geckura NFTs Detected:** **${nftCount}**\n` +
                    `👑 **Holder Status:** ${verifResult.isHolder ? '✅ **VERIFIED HOLDER**' : '❌ **NO GECKURA NFTs FOUND**'}\n\n` +
                    `🎭 **Assigned Roles:**\n` +
                    (roleList.length > 0 ? roleList.map(r => `• <@&${r}>`).join('\n') : '• No active holder roles assigned.')
                )
                .setFooter({ text: 'Geckura Automated Holder Verification', iconURL: client.user?.displayAvatarURL() })
                .setTimestamp();

            return await interaction.editReply({ embeds: [refreshEmbed] });

        } catch (err) {
            console.error('Error re-verifying roles:', err);
            return await interaction.editReply({ content: `❌ Error verifying wallet: ${err.message}` });
        }
    }

    // 3. View Linked Profile
    if (customId === 'verify_view_btn') {
        const userData = getUserData(userId);
        const linkedWallet = userData.solanaWallet || 'None linked';
        const tokens = userData.tokens || 0;

        const profileEmbed = new EmbedBuilder()
            .setTitle('📊 Your Geckura Linked Profile')
            .setColor(0x9D4EDD)
            .setDescription(
                `👤 **Discord User:** <@${userId}>\n` +
                `📍 **Linked Solana Wallet:** \`${linkedWallet}\`\n` +
                `💰 **Chat2Earn Tokens:** \`${tokens.toLocaleString()} $GAURA\`\n\n` +
                `💡 *Need to update your wallet? Click **💳 Paste Wallet & Verify** anytime!*`
            )
            .setFooter({ text: 'Geckura Profile Portal', iconURL: client.user?.displayAvatarURL() })
            .setTimestamp();

        return await interaction.reply({ embeds: [profileEmbed], ephemeral: true });
    }
}

/**
 * Handle Matrica-style wallet paste modal submission
 */
async function handleVerificationModalSubmit(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const submittedWallet = interaction.fields.getTextInputValue('wallet_address_input').trim();

    // Base58 Solana address basic validation
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solanaRegex.test(submittedWallet)) {
        return await interaction.editReply({
            content: '❌ **Invalid Solana Wallet Address:** Please enter a valid base58 Solana public key (e.g. Phantom, Solflare).'
        });
    }

    try {
        // Save wallet to user profile
        const userData = getUserData(userId);
        userData.solanaWallet = submittedWallet;
        saveUserData(userId, userData);

        // Perform instant Metaplex Core & DAS on-chain verification
        const verifResult = await verifyWalletNFTs(submittedWallet);
        const assignedRoles = await assignHolderRoles(interaction.member, verifResult);
        const roleList = Array.isArray(assignedRoles) ? assignedRoles : (assignedRoles.assigned || []);
        const nftCount = verifResult.count ?? verifResult.holderCount ?? 0;

        const successEmbed = new EmbedBuilder()
            .setTitle(verifResult.isHolder ? '🎉 GECKURA HOLDER VERIFIED!' : '⚡ WALLET LINKED & VERIFIED')
            .setColor(verifResult.isHolder ? 0x00FF99 : 0x00BFFF)
            .setDescription(
                `Your Solana wallet has been linked and checked against the Geckura NFT collection on-chain!\n\n` +
                `📍 **Linked Wallet:** \`${submittedWallet}\`\n` +
                `🎨 **Geckura NFTs Found:** **${nftCount}**\n\n` +
                `🎭 **DISCORD ROLES GRANTED:**\n` +
                (roleList.length > 0 
                    ? roleList.map(r => `• <@&${r}>`).join('\n')
                    : '• No NFTs found in this wallet. (Holder role requires 1+ Geckura NFTs).') + '\n\n' +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `💡 *If you purchase more Geckura NFTs, click **🔄 Re-verify Roles** anytime to update your perks!*`
            )
            .setFooter({ text: 'Matrica-Style Instant Holder Verification', iconURL: client.user?.displayAvatarURL() })
            .setTimestamp();

        return await interaction.editReply({ embeds: [successEmbed] });

    } catch (err) {
        console.error('Error during wallet verification modal submission:', err);
        return await interaction.editReply({
            content: `❌ **Verification Error:** ${err.message || 'Failed to query Solana blockchain.'}`
        });
    }
}

module.exports = {
    handleVerificationButton,
    handleVerificationModalSubmit
};
