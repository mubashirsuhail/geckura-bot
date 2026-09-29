const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData, saveUserData } = require('../utils/chat2earn-handler');
const { sendTokenReward } = require('../utils/solana-payout');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw your earned $GECKURA tokens directly to your linked Solana wallet (Min 500 tokens)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of $GECKURA tokens to withdraw (Minimum: 500)')
                .setRequired(true)
                .setMinValue(500)),

    async execute(interaction, client, config) {
        const userId = interaction.user.id;
        const amount = interaction.options.getInteger('amount');
        const userData = getUserData(userId);
        const primaryColor = parseInt(config?.colors?.primary?.replace('#', '') || '00FF99', 16);

        // 1. Minimum withdrawal threshold check (500 tokens)
        if (amount < 500) {
            return await interaction.reply({
                content: '⚠️ **Minimum Withdrawal Threshold:** You must withdraw at least **500 $GECKURA** tokens per transaction.',
                ephemeral: true
            });
        }

        // 2. Solana Wallet Connection Check
        const recipientWallet = userData.solanaWallet;
        if (!recipientWallet) {
            return await interaction.reply({
                content: '⚠️ **No Solana Wallet Linked:** You must link a Solana wallet first using `/wallet set <address>` before requesting a withdrawal!',
                ephemeral: true
            });
        }

        // 3. User Balance Check
        const currentBalance = userData.tokens || 0;
        if (currentBalance < amount) {
            return await interaction.reply({
                content: `❌ **Insufficient Balance:** You currently have **${currentBalance.toLocaleString()} $GECKURA** tokens, but requested **${amount.toLocaleString()} $GECKURA**.`,
                ephemeral: true
            });
        }

        // Defer reply for async Solana blockchain payout transaction
        await interaction.deferReply({ ephemeral: true });

        // 4. Execute Solana On-Chain Payout
        const payoutResult = await sendTokenReward(
            recipientWallet,
            amount,
            process.env.GECKURA_TOKEN_MINT
        );

        // Handle Payout Success
        if (payoutResult.success) {
            // Deduct tokens from user's balance only after successful transaction confirmation
            userData.tokens = currentBalance - amount;
            userData.totalWithdrawn = (userData.totalWithdrawn || 0) + amount;
            userData.lastWithdrawalAt = Date.now();
            saveUserData(userId, userData);

            const successEmbed = new EmbedBuilder()
                .setTitle('💸 $GECKURA Withdrawal Complete!')
                .setColor(0x00FF99)
                .setDescription(
                    `🎉 **Your withdrawal transaction has been submitted and confirmed on Solana!**\n\n` +
                    `💰 **Amount Withdrawn:** \`${amount.toLocaleString()} $GECKURA\`\n` +
                    `📍 **Recipient Wallet:** \`${recipientWallet}\`\n` +
                    `💳 **Remaining Balance:** \`${userData.tokens.toLocaleString()} $GECKURA\`\n\n` +
                    `🔗 **ON-CHAIN SOLSCAN PROOF:**\n` +
                    `[View Transaction on Solscan](${payoutResult.explorerUrl})\n\`${payoutResult.txSignature}\``
                )
                .setFooter({ text: 'Geckura Chat2Earn Automated Solana Payouts', iconURL: client.user?.displayAvatarURL() })
                .setTimestamp();

            return await interaction.editReply({ embeds: [successEmbed] });
        }

        // Handle Payout Errors (No tokens deducted)
        let errorMsg = `❌ **Withdrawal Failed:** ${payoutResult.message || payoutResult.error}`;

        if (payoutResult.error === 'NO_ATA_FOUND' || payoutResult.error === 'INSUFFICIENT_ATA_BALANCE') {
            errorMsg = `⚠️ **Token Account (ATA) Required:** Your linked wallet (\`${recipientWallet}\`) must hold at least 1 token and have an active Token Account (ATA) initialized to receive automated transfers.\n\n*No tokens were deducted from your balance.*`;
        } else if (payoutResult.error === 'KEY_UNCONFIGURED') {
            errorMsg = `⚠️ **Automated Payout Pending Treasury Setup:** The bot treasury wallet is currently being initialized by server admins. Please try again shortly!\n\n*No tokens were deducted from your balance.*`;
        }

        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Withdrawal Error')
            .setColor(0xFF0000)
            .setDescription(errorMsg)
            .setFooter({ text: 'Contact admin support if you need assistance.', iconURL: client.user?.displayAvatarURL() })
            .setTimestamp();

        return await interaction.editReply({ embeds: [errorEmbed] });
    }
};
