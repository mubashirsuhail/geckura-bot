const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { postRaidAlert, getRaids } = require('../utils/raid-handler');
const { getUserData, saveUserData } = require('../utils/chat2earn-handler');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Web3 Standard Raid2Earn Platform — Post, raid, and earn $GAURA tokens')
        .addSubcommand(sub =>
            sub
                .setName('post')
                .setDescription('Post an official Raid Alert for the community (Admin Only)')
                .addStringOption(opt =>
                    opt.setName('url')
                        .setDescription('Twitter/X Tweet URL to raid')
                        .setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('reward')
                        .setDescription('Reward in $GAURA tokens per raider (Default: 100)')
                        .setRequired(false)
                        .setMinValue(10))
                .addRoleOption(opt =>
                    opt.setName('role')
                        .setDescription('Role to ping for this raid (Optional)')
                        .setRequired(false))
        )
        .addSubcommand(sub =>
            sub
                .setName('submit')
                .setDescription('Submit your tweet or quote tweet to earn $GAURA tokens')
                .addStringOption(opt =>
                    opt.setName('url')
                        .setDescription('URL of your tweet or quote tweet')
                        .setRequired(true))
        )
        .addSubcommand(sub =>
            sub
                .setName('stats')
                .setDescription('View your personal Raid2Earn statistics and total earnings')
        ),

    async execute(interaction, client, config) {
        const subcommand = interaction.options.getSubcommand();

        // 1. Post Raid Alert (Admin)
        if (subcommand === 'post') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ **Access Denied:** Administrator permissions required to post official raid alerts.',
                    ephemeral: true
                });
            }

            const url = interaction.options.getString('url').trim();
            const reward = interaction.options.getInteger('reward') || 100;
            const role = interaction.options.getRole('role');

            if (!url.includes('twitter.com/') && !url.includes('x.com/')) {
                return await interaction.reply({
                    content: '❌ **Invalid URL:** Please provide a valid Twitter/X URL (e.g. `https://x.com/geckura/status/...`).',
                    ephemeral: true
                });
            }

            try {
                return await postRaidAlert(interaction, client, url, reward, role);
            } catch (err) {
                console.error('Error posting raid alert:', err);
                return await interaction.reply({
                    content: `❌ **Failed to post raid alert:** ${err.message}`,
                    ephemeral: true
                });
            }
        }

        // 2. Submit User Tweet Proof
        if (subcommand === 'submit') {
            const url = interaction.options.getString('url').trim();
            const userId = interaction.user.id;

            if (!url.includes('twitter.com/') && !url.includes('x.com/')) {
                return await interaction.reply({
                    content: '❌ **Invalid URL:** Please provide a valid Twitter/X URL of your tweet.',
                    ephemeral: true
                });
            }

            // Save to pending submissions
            const pendingPath = path.join(__dirname, '..', 'data', 'pending-tweets.json');
            let pendingTweets = [];

            if (fs.existsSync(pendingPath)) {
                try { pendingTweets = JSON.parse(fs.readFileSync(pendingPath, 'utf8')); } catch (e) {}
            }

            const submission = {
                id: `sub_${Date.now()}`,
                userId: userId,
                username: interaction.user.username,
                tweetUrl: url,
                submissionTime: new Date().toISOString(),
                status: 'pending'
            };

            pendingTweets.push(submission);
            fs.writeFileSync(pendingPath, JSON.stringify(pendingTweets, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('⚡ Raid Submission Received!')
                .setColor(0x00FF99)
                .setDescription(
                    `Your tweet submission has been logged and queued for review!\n\n` +
                    `📍 **Tweet URL:** [View Tweet](${url})\n` +
                    `⏳ **Status:** \`Pending Admin Review\`\n` +
                    `💰 **Potential Reward:** \`100 $GAURA\``
                )
                .setFooter({ text: 'Geckura Raid2Earn Submission Portal', iconURL: client.user?.displayAvatarURL() })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // 3. User Raid Stats
        if (subcommand === 'stats') {
            const userId = interaction.user.id;
            const userData = getUserData(userId);

            const raidsCompleted = userData.raidsCompleted || 0;
            const totalTokens = userData.tokens || 0;
            const totalEarned = userData.totalTokensEarned || 0;

            const embed = new EmbedBuilder()
                .setTitle(`⚔️ ${interaction.user.username}'s Raid2Earn Profile`)
                .setColor(0x9D4EDD)
                .setDescription(`Here is your Geckura Raid2Earn activity summary:`)
                .addFields(
                    { name: '⚔️ Raids Completed', value: `\`${raidsCompleted} Raids\``, inline: true },
                    { name: '💰 $GAURA Balance', value: `\`${totalTokens.toLocaleString()} $GAURA\``, inline: true },
                    { name: '🏆 Lifetime Earnings', value: `\`${totalEarned.toLocaleString()} $GAURA\``, inline: true }
                )
                .setFooter({ text: 'Keep raiding to climb the Geckura Leaderboards!', iconURL: client.user?.displayAvatarURL() })
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
