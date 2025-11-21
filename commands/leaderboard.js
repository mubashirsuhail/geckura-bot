
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top token earners'),

    async execute(interaction, client) {
        const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
        const allUserData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

        // Convert to array and sort by tokens
        const sortedUsers = Object.values(allUserData)
            .sort((a, b) => b.tokens - a.tokens)
            .slice(0, 10); // Top 10

        const embed = new EmbedBuilder()
            .setTitle('$GECKURA Token Leaderboard')
            .setColor('#FFD700')
            .setDescription('Top token earners in the server:')
            .setTimestamp()
            .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

        // Add top users to embed
        let leaderboardText = '';
        for (let i = 0; i < sortedUsers.length; i++) {
            const user = sortedUsers[i];
            let medal = '';

            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `${i + 1}.`;

            try {
                const discordUser = await client.users.fetch(user.userId);
                leaderboardText += `${medal} **${discordUser.username}** - ${user.tokens} $GECKURA
`;
            } catch (error) {
                leaderboardText += `${medal} Unknown User - ${user.tokens} $GECKURA
`;
            }
        }

        embed.addFields({ name: 'Top Earners', value: leaderboardText });

        await interaction.reply({ embeds: [embed] });
    }
};
