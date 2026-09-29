
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserData } = require('../utils/chat2earn-handler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your $GAURA token balance'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = getUserData(userId);
        const tokens = userData.tokens || 0;
        const totalEarned = userData.totalTokensEarned || tokens;

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s $GAURA Balance`)
            .setColor('#00FF99')
            .setDescription(`You currently have **${tokens.toLocaleString()} $GAURA** tokens!`)
            .addFields(
                { name: 'Total Earned', value: `${totalEarned.toLocaleString()} $GAURA`, inline: true },
                { name: 'Current Level', value: `Level ${userData.level || 1}`, inline: true },
                { name: 'Messages Sent', value: `${userData.messagesCount || 0}`, inline: true },
                { name: '📍 Solana Wallet', value: userData.solanaWallet ? `\`${userData.solanaWallet}\`` : '⚠️ *Not linked (Use `/wallet set`)*', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
