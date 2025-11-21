
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your current level and rewards'),

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

    // Calculate experience needed for next level
    experienceForNextLevel(level) {
        // Reverse of the level formula: experience = ((level - 1) * 10)²
        return Math.pow((level - 1) * 10, 2);
    },

    // Calculate tokens earned per message based on level
    calculateTokensEarned(level) {
        // Base tokens: 10
        // Each level increases reward by 25%
        const baseTokens = 10;
        const levelBonus = Math.pow(1.25, level - 1);
        return Math.floor(baseTokens * levelBonus);
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = this.getUserData(userId);

        const nextLevelExp = this.experienceForNextLevel(userData.level + 1);
        const currentLevelExp = this.experienceForNextLevel(userData.level);
        const progress = userData.experience - currentLevelExp;
        const needed = nextLevelExp - currentLevelExp;
        const progressPercent = Math.floor((progress / needed) * 100);

        // Create progress bar
        const progressBar = '█'.repeat(Math.floor(progressPercent / 10)) + '░'.repeat(10 - Math.floor(progressPercent / 10));

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Rank & Rewards`)
            .setColor('#9D4EDD')
            .setDescription(`You are currently **Level ${userData.level}**`)
            .addFields(
                {
                    name: 'Experience Progress',
                    value: `${progressBar} ${progressPercent}%
${progress}/${needed} XP to next level`,
                    inline: false
                },
                {
                    name: 'Current Rewards',
                    value: `You earn **${this.calculateTokensEarned(userData.level)} $GECKURA** per message`,
                    inline: true
                },
                {
                    name: 'Next Level Rewards',
                    value: `You'll earn **${this.calculateTokensEarned(userData.level + 1)} $GECKURA** per message`,
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
