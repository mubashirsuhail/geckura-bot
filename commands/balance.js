
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your $GECKURA token balance'),

    // Get user data or create a new entry
    getUserData(userId) {
        const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
        let userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

        if (!userData[userId]) {
            userData[userId] = {
                userId: userId,
                tokens: 0,
                level: 1,
                experience: 0,
                messagesCount: 0,
                lastMessageTime: 0,
                totalTokensEarned: 0,
                achievements: []
            };
            fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
        }

        return userData[userId];
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = this.getUserData(userId);

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s $GECKURA Balance`)
            .setColor('#00FF99')
            .setDescription(`You currently have **${userData.tokens} $GECKURA** tokens!`)
            .addFields(
                { name: 'Total Earned', value: `${userData.totalTokensEarned} $GECKURA`, inline: true },
                { name: 'Current Level', value: `Level ${userData.level}`, inline: true },
                { name: 'Messages Sent', value: `${userData.messagesCount}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
