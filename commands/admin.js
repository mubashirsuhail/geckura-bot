
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for chat2earn')
        .addStringOption(option =>
            option
                .setName('action')
                .setDescription('Admin action to perform')
                .addChoices(
                    { name: 'Give tokens', value: 'give' },
                    { name: 'Remove tokens', value: 'remove' },
                    { name: 'Reset user', value: 'reset' },
                    { name: 'Add shop item', value: 'add-item' },
                    { name: 'Add shop role', value: 'add-role' },
                    { name: 'Approve tweet', value: 'tweet-approve' },
                    { name: 'Reject tweet', value: 'tweet-reject' },
                    { name: 'Configure tweet rewards', value: 'tweet-config' }
                )
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Target user')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of tokens'))
        .addStringOption(option =>
            option
                .setName('item-name')
                .setDescription('Name of the shop item/role'))
        .addStringOption(option =>
            option
                .setName('item-description')
                .setDescription('Description of the shop item/role'))
        .addIntegerOption(option =>
            option
                .setName('price')
                .setDescription('Price of the shop item/role'))
        .addIntegerOption(option =>
            option
                .setName('supply')
                .setDescription('Supply of the item (unlimited if not specified)'))
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('Discord role for shop items'))
        .addStringOption(option =>
            option
                .setName('submission-id')
                .setDescription('ID of the tweet submission to approve/reject'))
        .addStringOption(option =>
            option
                .setName('config-key')
                .setDescription('Configuration key for tweet rewards'))
        .addStringOption(option =>
            option
                .setName('config-value')
                .setDescription('Configuration value for tweet rewards')),

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

    // Save user data
    saveUserData(userId, data) {
        const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
        let userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        userData[userId] = data;
        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
    },
    
    // Add item to shop
    addShopItem(type, itemData) {
        const shopPath = path.join(__dirname, '..', 'data', 'chat2earn-shop.json');
        let shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
        
        if (!shopData[type]) {
            shopData[type] = [];
        }
        
        shopData[type].push(itemData);
        fs.writeFileSync(shopPath, JSON.stringify(shopData, null, 2));
    },

    async execute(interaction, client) {
        // Check if user has admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: "You don't have permission to use this command.",
                ephemeral: true
            });
        }

        const action = interaction.options.getString('action');
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const targetUserId = targetUser.id;

        // Get user data
        const userData = this.getUserData(targetUserId);

        // Create embed for response
        const embed = new EmbedBuilder()
            .setColor('#00FF99')
            .setTimestamp()
            .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });

        // Handle different actions
        switch (action) {
            case 'give':
                userData.tokens += amount;
                userData.totalTokensEarned += amount;
                this.saveUserData(targetUserId, userData);

                embed
                    .setTitle('Tokens Added')
                    .setDescription(`Added **${amount} $GECKURA** to ${targetUser.username}`)
                    .addFields(
                        { name: 'New Balance', value: `${userData.tokens} $GECKURA`, inline: true },
                        { name: 'Admin', value: interaction.user.username, inline: true }
                    );

                await interaction.reply({ embeds: [embed] });
                break;

            case 'remove':
                userData.tokens = Math.max(0, userData.tokens - amount);
                this.saveUserData(targetUserId, userData);

                embed
                    .setTitle('Tokens Removed')
                    .setDescription(`Removed **${amount} $GECKURA** from ${targetUser.username}`)
                    .addFields(
                        { name: 'New Balance', value: `${userData.tokens} $GECKURA`, inline: true },
                        { name: 'Admin', value: interaction.user.username, inline: true }
                    );

                await interaction.reply({ embeds: [embed] });
                break;

            case 'reset':
                userData.tokens = 0;
                userData.level = 1;
                userData.experience = 0;
                userData.messagesCount = 0;
                userData.lastMessageTime = 0;
                userData.totalTokensEarned = 0;
                userData.achievements = [];
                this.saveUserData(targetUserId, userData);

                embed
                    .setTitle('User Reset')
                    .setDescription(`Reset all data for ${targetUser.username}`)
                    .addFields(
                        { name: 'Admin', value: interaction.user.username, inline: true }
                    );

                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'add-item':
                const itemName = interaction.options.getString('item-name');
                const itemDescription = interaction.options.getString('item-description');
                const itemPrice = interaction.options.getInteger('price');
                const itemSupply = interaction.options.getInteger('supply');
                
                if (!itemName || !itemDescription || !itemPrice) {
                    return await interaction.reply({
                        content: "Missing required parameters: item-name, item-description, and price are required.",
                        ephemeral: true
                    });
                }
                
                this.addShopItem('item', {
                    name: itemName,
                    description: itemDescription,
                    price: itemPrice,
                    supply: itemSupply || null,
                    active: true,
                    id: Date.now().toString()
                });
                
                embed
                    .setTitle('Shop Item Added')
                    .setDescription(`Added **${itemName}** to the shop for **${itemPrice} $GECKURA**`)
                    .addFields(
                        { name: 'Admin', value: interaction.user.username, inline: true }
                    );
                
                if (itemSupply) {
                    embed.addFields({ name: 'Supply', value: `${itemSupply} units`, inline: true });
                } else {
                    embed.addFields({ name: 'Supply', value: 'Unlimited', inline: true });
                }
                
                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'add-role':
                const roleName = interaction.options.getString('item-name');
                const roleDescription = interaction.options.getString('item-description');
                const rolePrice = interaction.options.getInteger('price');
                const discordRole = interaction.options.getRole('role');
                
                if (!roleName || !roleDescription || !rolePrice || !discordRole) {
                    return await interaction.reply({
                        content: "Missing required parameters: item-name, item-description, price, and role are required.",
                        ephemeral: true
                    });
                }
                
                this.addShopItem('role', {
                    name: roleName,
                    description: roleDescription,
                    price: rolePrice,
                    roleId: discordRole.id,
                    active: true,
                    id: Date.now().toString()
                });
                
                embed
                    .setTitle('Shop Role Added')
                    .setDescription(`Added **${roleName}** role to the shop for **${rolePrice} $GECKURA**`)
                    .addFields(
                        { name: 'Admin', value: interaction.user.username, inline: true },
                        { name: 'Discord Role', value: `<@&${discordRole.id}>`, inline: true }
                    );
                
                await interaction.reply({ embeds: [embed] });
                break;
                
            case 'tweet-approve':
                const submissionId = interaction.options.getString('submission-id');
                
                if (!submissionId) {
                    return await interaction.reply({
                        content: "Missing required parameter: submission-id is required.",
                        ephemeral: true
                    });
                }
                
                const pendingPath = path.join(__dirname, '..', 'data', 'pending-tweets.json');
                let pendingTweets = [];
                
                if (fs.existsSync(pendingPath)) {
                    pendingTweets = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
                }
                
                const submission = pendingTweets.find(t => t.id === submissionId);
                
                if (!submission) {
                    return await interaction.reply({
                        content: `No submission found with ID: ${submissionId}`,
                        ephemeral: true
                    });
                }
                
                if (submission.status !== 'pending') {
                    return await interaction.reply({
                        content: `This submission has already been ${submission.status}.`,
                        ephemeral: true
                    });
                }
                
                // Update submission status
                submission.status = 'approved';
                submission.processedAt = Date.now();
                submission.processedBy = interaction.user.id;
                
                // Get tweet rewards config
                const rewardsConfig = this.getTweetRewardsConfig();
                
                // Update user data
                const tweetUserData = this.getUserData(submission.userId);
                tweetUserData.tokens += rewardsConfig.tokensPerTweet;
                tweetUserData.totalTokensEarned += rewardsConfig.tokensPerTweet;
                
                // Assign role if specified
                if (submission.roleId) {
                    try {
                        const member = await interaction.guild.members.fetch(submission.userId);
                        await member.roles.add(submission.roleId);
                    } catch (error) {
                        console.error('Error assigning role for approved tweet:', error);
                    }
                }

                // Handle raid tweet
                if (submission.isRaid) {
                    try {
                        const raidChannel = interaction.guild.channels.cache.find(c => c.name === 'raid' || c.name === 'raids');
                        if (raidChannel) {
                            const raidEmbed = new EmbedBuilder()
                                .setTitle('🚀 RAID ALERT!')
                                .setColor('#FF0000')
                                .setDescription(`Let's raid this tweet!`) 
                                .addFields(
                                    { name: 'Tweet URL', value: submission.tweetUrl, inline: false },
                                    { name: 'Submitted by', value: submission.username, inline: true }
                                )
                                .setTimestamp()
                                .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });
                            
                            await raidChannel.send({
                                content: `@here RAID TIME!`,
                                embeds: [raidEmbed]
                            });
                        }
                    } catch (error) {
                        console.error('Error posting raid tweet:', error);
                    }
                }
                
                this.saveUserData(submission.userId, tweetUserData);
                
                // Save updated submissions
                fs.writeFileSync(pendingPath, JSON.stringify(pendingTweets, null, 2));
                
                embed
                    .setTitle('Tweet Approved')
                    .setDescription(`Tweet from **${submission.username}** has been approved`)
                    .addFields(
                        { name: 'Tweet URL', value: submission.tweetUrl, inline: false },
                        { name: 'Reward Given', value: `${rewardsConfig.tokensPerTweet} $GECKURA`, inline: true },
                        { name: 'Role Assigned', value: submission.roleName || 'None', inline: true },
                        { name: 'Admin', value: interaction.user.username, inline: true }
                    );
                
                await interaction.reply({ embeds: [embed] });
                
                // Try to notify the user
                try {
                    const user = await interaction.client.users.fetch(submission.userId);
                    const userEmbed = new EmbedBuilder()
                        .setTitle('Tweet Approved!')
                        .setColor('#00FF99')
                        .setDescription(`Your tweet has been approved and you have received **${rewardsConfig.tokensPerTweet} $GECKURA**!`)
                        .addFields(
                            { name: 'Tweet URL', value: submission.tweetUrl, inline: false },
                            { name: 'Current Balance', value: `${tweetUserData.tokens} $GECKURA`, inline: true }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });
                    
                    await user.send({ embeds: [userEmbed] });
                } catch (error) {
                    console.error('Error notifying user about approved tweet:', error);
                }
                break;
                
            case 'tweet-reject':
                const rejectId = interaction.options.getString('submission-id');
                
                if (!rejectId) {
                    return await interaction.reply({
                        content: "Missing required parameter: submission-id is required.",
                        ephemeral: true
                    });
                }
                
                const rejectPath = path.join(__dirname, '..', 'data', 'pending-tweets.json');
                let rejectTweets = [];
                
                if (fs.existsSync(rejectPath)) {
                    rejectTweets = JSON.parse(fs.readFileSync(rejectPath, 'utf8'));
                }
                
                const rejectSubmission = rejectTweets.find(t => t.id === rejectId);
                
                if (!rejectSubmission) {
                    return await interaction.reply({
                        content: `No submission found with ID: ${rejectId}`,
                        ephemeral: true
                    });
                }
                
                if (rejectSubmission.status !== 'pending') {
                    return await interaction.reply({
                        content: `This submission has already been ${rejectSubmission.status}.`,
                        ephemeral: true
                    });
                }
                
                // Update submission status
                rejectSubmission.status = 'rejected';
                rejectSubmission.processedAt = Date.now();
                rejectSubmission.processedBy = interaction.user.id;
                
                // Save updated submissions
                fs.writeFileSync(rejectPath, JSON.stringify(rejectTweets, null, 2));
                
                embed
                    .setTitle('Tweet Rejected')
                    .setDescription(`Tweet from **${rejectSubmission.username}** has been rejected`)
                    .addFields(
                        { name: 'Tweet URL', value: rejectSubmission.tweetUrl, inline: false },
                        { name: 'Admin', value: interaction.user.username, inline: true }
                    );
                
                await interaction.reply({ embeds: [embed] });
                
                // Try to notify the user
                try {
                    const user = await interaction.client.users.fetch(rejectSubmission.userId);
                    const userEmbed = new EmbedBuilder()
                        .setTitle('Tweet Rejected')
                        .setColor('#FF5555')
                        .setDescription(`Your tweet has been rejected. Please review the requirements and try again.`)
                        .addFields(
                            { name: 'Tweet URL', value: rejectSubmission.tweetUrl, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Geckura — Where Innovation Meets Utility!' });
                    
                    await user.send({ embeds: [userEmbed] });
                } catch (error) {
                    console.error('Error notifying user about rejected tweet:', error);
                }
                break;
                
            case 'tweet-config':
                const configKey = interaction.options.getString('config-key');
                const configValue = interaction.options.getString('config-value');
                
                if (!configKey || !configValue) {
                    // Show current config if no parameters provided
                    const currentConfig = this.getTweetRewardsConfig();
                    
                    embed
                        .setTitle('Tweet Rewards Configuration')
                        .setDescription('Current configuration for tweet rewards')
                        .addFields(
                            { name: 'Enabled', value: currentConfig.enabled ? 'Yes' : 'No', inline: true },
                            { name: 'Tokens Per Tweet', value: currentConfig.tokensPerTweet.toString(), inline: true },
                            { name: 'Cooldown Hours', value: currentConfig.cooldownHours.toString(), inline: true }
                        )
                        .addFields(
                            { name: 'Required Hashtags', value: currentConfig.requiredHashtags.join(', '), inline: true },
                            { name: 'Required Mentions', value: currentConfig.requiredMentions.join(', '), inline: true },
                            { name: 'Minimum Retweets', value: currentConfig.minRetweets.toString(), inline: true }
                        )
                        .addFields(
                            { name: 'Minimum Likes', value: currentConfig.minLikes.toString(), inline: true },
                            { name: 'Minimum Followers', value: currentConfig.minFollowers.toString(), inline: true }
                        );
                    
                    return await interaction.reply({ embeds: [embed] });
                }
                
                // Update config
                const configPath = path.join(__dirname, '..', 'data', 'tweet-rewards.json');
                let config = this.getTweetRewardsConfig();
                
                // Handle different config keys
                switch (configKey) {
                    case 'enabled':
                        config.enabled = configValue.toLowerCase() === 'true';
                        break;
                    case 'tokensPerTweet':
                    case 'cooldownHours':
                    case 'minRetweets':
                    case 'minLikes':
                    case 'minFollowers':
                        config[configKey] = parseInt(configValue) || 0;
                        break;
                    case 'requiredHashtags':
                    case 'requiredMentions':
                        config[configKey] = configValue.split(',').map(s => s.trim());
                        break;
                    default:
                        return await interaction.reply({
                            content: `Unknown configuration key: ${configKey}`,
                            ephemeral: true
                        });
                }
                
                // Save updated config
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                embed
                    .setTitle('Configuration Updated')
                    .setDescription(`Updated ${configKey} to: ${configValue}`)
                    .addFields(
                        { name: 'Admin', value: interaction.user.username, inline: true }
                    );
                
                await interaction.reply({ embeds: [embed] });
                break;
        }
    },
    
    // Get tweet rewards config
    getTweetRewardsConfig() {
        const configPath = path.join(__dirname, '..', 'data', 'tweet-rewards.json');
        
        // Create default config if it doesn't exist
        if (!fs.existsSync(configPath)) {
            const defaultConfig = {
                enabled: true,
                tokensPerTweet: 50,
                cooldownHours: 24,
                requiredHashtags: ["#Geckura", "#NFT"],
                requiredMentions: ["@geckura"],
                minRetweets: 0,
                minLikes: 0,
                minFollowers: 0
            };
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
};
