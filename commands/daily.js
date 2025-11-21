const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward'),

    async execute(interaction) {
        const userId = interaction.user.id;
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
                achievements: [],
                dailyStreak: 0,
                lastDailyClaim: 0,
                weeklyStreak: 0,
                lastWeeklyClaim: 0,
                monthlyStreak: 0,
                lastMonthlyClaim: 0
            };
        }

        const configPath = path.join(__dirname, '..', 'data', 'chat2earn-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        const now = Date.now();
        const lastClaim = userData[userId].lastDailyClaim;
        const msInDay = 24 * 60 * 60 * 1000;

        // Check if user can claim
        if (now - lastClaim < msInDay) {
            const timeLeft = Math.ceil((msInDay - (now - lastClaim)) / (60 * 60 * 1000));
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Daily Reward Claim Failed')
                .setDescription(`You have already claimed your daily reward!`)
                .addFields(
                    { name: 'Time Remaining', value: `${timeLeft} hours`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Calculate streak
        let streak = userData[userId].dailyStreak;
        if (lastClaim && (now - lastClaim) < msInDay * 2) {
            streak++;
        } else {
            streak = 1;
        }

        // Calculate reward with streak bonus
        const baseReward = config.rewards.dailyBonus;
        const streakBonus = Math.floor(baseReward * 0.1 * (streak - 1)); // 10% bonus per streak
        const totalReward = baseReward + streakBonus;

        // Update user data
        userData[userId].tokens += totalReward;
        userData[userId].totalTokensEarned += totalReward;
        userData[userId].dailyStreak = streak;
        userData[userId].lastDailyClaim = now;

        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF99')
            .setTitle('Daily Reward Claimed!')
            .setDescription(`You have claimed your daily reward!`)
            .addFields(
                { name: 'Base Reward', value: `${baseReward} $GECKURA`, inline: true },
                { name: 'Streak Bonus', value: `${streakBonus} $GECKURA`, inline: true },
                { name: 'Current Streak', value: `${streak} days`, inline: true }
            )
            .addFields(
                { name: 'Total Reward', value: `${totalReward} $GECKURA`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
};
