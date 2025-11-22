
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, '..', 'data', 'chat2earn-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Get user data or create a new entry
function getUserData(userId) {
    const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
    let userData = {};

    try {
        userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    } catch (error) {
        userData = {};
        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
    }

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
        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
    }

    return userData[userId];
}

// Save user data
function saveUserData(userId, data) {
    const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
    let userData = {};

    try {
        userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
    } catch (error) {
        userData = {};
    }

    userData[userId] = data;
    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
}

// Calculate level based on experience
function calculateLevel(experience) {
    // Formula: level = floor(experience / baseExperience)
    return Math.floor(experience / config.levels.baseExperience) + 1;
}

// Calculate experience needed for next level
function experienceForNextLevel(level) {
    // Using the config baseExperience value (2000) multiplied by level
    return level * config.levels.baseExperience;
}

// Calculate tokens earned per message based on level
function calculateTokensEarned(level) {
    // Base tokens: 10
    // Each level increases reward by 25%
    const baseTokens = config.levels.baseTokens;
    const levelMultiplier = config.levels.levelMultiplier;
    return Math.floor(baseTokens * Math.pow(levelMultiplier, level - 1));
}

// Handle message creation for chat-to-earn
async function handleMessage(message, client) {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if user is blacklisted
    if (config.general.blacklistedUsers.includes(message.author.id)) return;

    // Check if channel is blacklisted
    if (config.general.blacklistedChannels.includes(message.channel.id)) return;

    // If whitelisted channels are specified, check if this channel is whitelisted
    if (config.general.whitelistedChannels.length > 0 && 
        !config.general.whitelistedChannels.includes(message.channel.id)) return;

    // Check message length
    if (message.content.length < config.general.minMessageLength) return;

    // Get user data
    const userId = message.author.id;
    const userData = getUserData(userId);

    // Check cooldown
    const now = Date.now();
    const cooldownMs = config.general.cooldownMinutes * 60 * 1000;

    if (now - userData.lastMessageTime < cooldownMs) return;

    // Calculate tokens earned
    const tokensEarned = calculateTokensEarned(userData.level);

    // Check max tokens per minute
    const minuteMs = 60 * 1000;
    const tokensThisMinute = userData.recentTokens ? 
        userData.recentTokens.filter(t => now - t.time < minuteMs).reduce((sum, t) => sum + t.amount, 0) : 0;

    if (tokensThisMinute + tokensEarned > config.general.maxTokensPerMinute) return;

    // Update user data
    userData.lastMessageTime = now;
    userData.messagesCount++;
    userData.experience += 20;
    userData.tokens += tokensEarned;
    userData.totalTokensEarned += tokensEarned;

    // Track recent tokens
    if (!userData.recentTokens) userData.recentTokens = [];
    userData.recentTokens.push({ time: now, amount: tokensEarned });
    userData.recentTokens = userData.recentTokens.filter(t => now - t.time < minuteMs);

    // Check for level up
    const newLevel = calculateLevel(userData.experience);
    if (newLevel > userData.level) {
        userData.level = newLevel;
        userData.tokens += config.rewards.levelUpBonus;
        userData.totalTokensEarned += config.rewards.levelUpBonus;

        // Send level up message to user only
        try {
            const levelUpEmbed = {
                title: '🎉 Level Up!',
                description: `Congratulations! You've reached **Level ${newLevel}**!`,
                color: 0x00FF99,
                fields: [
                    {
                        name: 'Rewards',
                        value: `You've received **${config.rewards.levelUpBonus} $GECKURA** bonus tokens!`,
                        inline: false
                    },
                    {
                        name: 'New Token Rate',
                        value: `You now earn **${calculateTokensEarned(newLevel)} $GECKURA** per message!`,
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Geckura — Where Innovation Meets Utility!',
                    icon_url: client.user.displayAvatarURL()
                }
            };

            await message.author.send({ embeds: [levelUpEmbed] });
        } catch (error) {
            console.error('Error sending level up message:', error);
        }
    }

    // Save updated user data
    saveUserData(userId, userData);

    // Check for achievements (simplified) - DISABLED
    // checkAchievements(message, userData, client);
}

// Check and award achievements
function checkAchievements(message, userData, client) {
    const achievements = [];

    // First message achievement
    if (userData.messagesCount === 1 && !userData.achievements.includes('first_message')) {
        userData.achievements.push('first_message');
        achievements.push({
            name: 'First Steps',
            description: 'Sent your first message',
            reward: 50
        });
    }

    // Level 5 achievement
    if (userData.level >= 5 && !userData.achievements.includes('level_5')) {
        userData.achievements.push('level_5');
        achievements.push({
            name: 'Rising Star',
            description: 'Reached Level 5',
            reward: 200
        });
    }

    // Level 10 achievement
    if (userData.level >= 10 && !userData.achievements.includes('level_10')) {
        userData.achievements.push('level_10');
        achievements.push({
            name: 'Token Master',
            description: 'Reached Level 10',
            reward: 500
        });
    }

    // 100 messages achievement
    if (userData.messagesCount >= 100 && !userData.achievements.includes('message_100')) {
        userData.achievements.push('message_100');
        achievements.push({
            name: 'Chatterbox',
            description: 'Sent 100 messages',
            reward: 250
        });
    }

    // Award achievements and notify user
    if (achievements.length > 0) {
        let totalReward = 0;
        achievements.forEach(a => totalReward += a.reward);

        userData.tokens += totalReward;
        userData.totalTokensEarned += totalReward;
        saveUserData(userData.userId, userData);

        // Send achievement notification
        try {
            const achievementEmbed = {
                title: '🏆 Achievement Unlocked!',
                description: `Congratulations ${message.author.username}! You've unlocked new achievements:`,
                color: 0xFFD700,
                fields: achievements.map(a => ({
                    name: a.name,
                    value: `${a.description}
Reward: **${a.reward} $GECKURA**`,
                    inline: true
                })),
                footer: {
                    text: `Total reward: ${totalReward} $GECKURA`,
                    icon_url: client.user.displayAvatarURL()
                },
                timestamp: new Date().toISOString()
            };

            message.author.send({ embeds: [achievementEmbed] });
        } catch (error) {
            console.error('Error sending achievement message:', error);
        }
    }
}

// Process daily rewards
async function processDailyRewards(interaction, client) {
    const userId = interaction.user.id;
    const userData = getUserData(userId);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Check if user can claim daily reward
    if (now - userData.lastDailyClaim < dayMs) {
        const nextClaimTime = userData.lastDailyClaim + dayMs;
        const hoursUntilNext = Math.floor((nextClaimTime - now) / (60 * 60 * 1000));
        const minutesUntilNext = Math.floor(((nextClaimTime - now) % (60 * 60 * 1000)) / (60 * 1000));

        await interaction.reply({
            content: `You've already claimed your daily reward! You can claim again in **${hoursUntilNext}h ${minutesUntilNext}m**.`,
            ephemeral: true
        });
        return;
    }

    // Calculate streak bonus
    let streakBonus = 0;
    if (userData.lastDailyClaim > 0 && now - userData.lastDailyClaim < 2 * dayMs) {
        userData.dailyStreak++;
        streakBonus = Math.min(userData.dailyStreak * 10, 100); // Max 100 bonus
    } else {
        userData.dailyStreak = 1;
    }

    // Award daily reward
    const reward = config.rewards.dailyBonus + streakBonus;
    userData.tokens += reward;
    userData.totalTokensEarned += reward;
    userData.lastDailyClaim = now;
    saveUserData(userId, userData);

    // Send reward message
    const dailyEmbed = {
        title: '🎁 Daily Reward Claimed!',
        description: `You've claimed your daily reward of **${reward} $GECKURA**!`,
        color: 0x00FF99,
        fields: [
            {
                name: 'Base Reward',
                value: `${config.rewards.dailyBonus} $GECKURA`,
                inline: true
            },
            {
                name: 'Streak Bonus',
                value: `${streakBonus} $GECKURA (Day ${userData.dailyStreak})`,
                inline: true
            },
            {
                name: 'Current Balance',
                value: `${userData.tokens} $GECKURA`,
                inline: false
            }
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Geckura — Where Innovation Meets Utility!',
            icon_url: client.user.displayAvatarURL()
        }
    };

    await interaction.reply({ embeds: [dailyEmbed] });
}

module.exports = {
    handleMessage,
    processDailyRewards,
    getUserData,
    saveUserData
};
