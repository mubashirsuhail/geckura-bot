const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tweet')
        .setDescription('Submit a tweet or post an admin tweet')
        .addSubcommand(subcommand =>
            subcommand
                .setName('submit')
                .setDescription('Submit a tweet to earn $GECKURA tokens')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('URL of your tweet')
                        .setRequired(true))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to assign when tweet is approved')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('post')
                .setDescription('Post an official tweet as an admin')
                .addStringOption(option =>
                    option
                        .setName('link')
                        .setDescription('Link to the actual tweet')
                        .setRequired(true))
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to notify about this tweet')
                        .setRequired(false))
        ),

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
                achievements: [],
                tweetsCount: 0
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

    // Get tweet rewards configuration
    getTweetRewards() {
        const configPath = path.join(__dirname, '..', 'data', 'tweet-rewards.json');

        // Create default config if it doesn't exist
        if (!fs.existsSync(configPath)) {
            const defaultConfig = {
                enabled: true,
                tokensPerTweet: 100,
                cooldownHours: 12,
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
    },

    // Check if URL is a valid tweet URL
    isValidTweetUrl(url) {
        return url.includes('twitter.com/') || url.includes('x.com/');
    },

    // Extract tweet ID from URL
    getTweetIdFromUrl(url) {
        const regex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },

    // Fetch tweet data using Twitter API or alternative method
    async fetchTweetData(tweetId) {
        try {
            // Using Twitter's oEmbed API as a fallback
            const oEmbedUrl = `https://publish.twitter.com/oembed?url=https://twitter.com/i/web/status/${tweetId}`;
            const oEmbedResponse = await fetch(oEmbedUrl);
            
            // Check if response is OK
            if (!oEmbedResponse.ok) {
                throw new Error(`Twitter API returned status: ${oEmbedResponse.status}`);
            }
            
            // Check content type to ensure we get JSON
            const contentType = oEmbedResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If not JSON, try to get text instead
                const textContent = await oEmbedResponse.text();
                // Extract tweet text from HTML if possible
                const textMatch = textContent.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/);
                const tweetText = textMatch ? textMatch[1].replace(/<[^>]*>/g, '').trim() : 'Tweet content could not be fetched';
                // Remove any remaining HTML entities
                const cleanText = tweetText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                
                return {
                    text: tweetText,
                    authorName: '@geckura',
                    imageUrl: null,
                    likes: 0,
                    retweets: 0
                };
            }
            
            const oEmbedData = await oEmbedResponse.json();

            // Extract the HTML content and clean it
            const htmlContent = oEmbedData.html;

            // Create a simple DOM parser to extract text
            const textMatch = htmlContent.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/);
            const tweetText = textMatch ? textMatch[1].replace(/<[^>]*>/g, '').trim() : 'Tweet content could not be fetched';

            // Extract author name if available
            const authorMatch = htmlContent.match(/data-screen-name="([^"]*)"/);
            const authorName = authorMatch ? authorMatch[1] : '@geckura';

            // Try to get additional tweet data using the public API
            try {
                const tweetApiUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
                const tweetApiResponse = await fetch(tweetApiUrl);

                if (tweetApiResponse.ok) {
                    // Check content type to ensure we get JSON
                    const contentType = tweetApiResponse.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        // If not JSON, try to get text instead
                        const textContent = await tweetApiResponse.text();
                        // Extract tweet text from HTML if possible
                        const textMatch = textContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
                        const tweetText = textMatch ? textMatch[1].replace(/<[^>]*>/g, '').trim() : 'Tweet content could not be fetched';
                        
                        return {
                            text: tweetText,
                            authorName: '@geckura',
                            imageUrl: null,
                            likes: 0,
                            retweets: 0
                        };
                    }
                    const tweetApiData = await tweetApiResponse.json();

                    // Extract the full text
                    const fullText = tweetApiData.text || tweetText;

                    // Extract media if available
                    let imageUrl = null;
                    if (tweetApiData.mediaDetails && tweetApiData.mediaDetails.length > 0) {
                        // Get the first image
                        imageUrl = tweetApiData.mediaDetails[0].media_url_https;
                    }

                    return {
                        text: fullText,
                        authorName: authorName,
                        imageUrl: imageUrl,
                        likes: tweetApiData.favorite_count || 0,
                        retweets: tweetApiData.retweet_count || 0
                    };
                }
            } catch (apiError) {
                console.warn('Could not fetch extended tweet data:', apiError.message);
            }

            // Fallback to oEmbed data
            return {
                text: tweetText,
                authorName: authorName,
                imageUrl: null,
                likes: 0,
                retweets: 0
            };
        } catch (error) {
            console.error('Error fetching tweet data:', error);
            // Return a fallback instead of throwing an error
            return {
                text: 'Tweet content could not be fetched',
                authorName: '@geckura',
                imageUrl: null,
                likes: 0,
                retweets: 0
            };
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Handle admin tweet posting
        if (subcommand === 'post') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: "❌ You don't have permission to use this command.",
                    ephemeral: true
                });
            }

            const tweetLink = interaction.options.getString('link').trim();
            const role = interaction.options.getRole('role');

            if (!this.isValidTweetUrl(tweetLink)) {
                return await interaction.reply({
                    content: '❌ Please provide a valid Twitter/X URL.',
                    ephemeral: true
                });
            }

            const { postRaidAlert } = require('../utils/raid-handler');
            return await postRaidAlert(interaction, interaction.client, tweetLink, 100, role);
        }

        // Handle tweet submission
        const tweetUrl = interaction.options.getString('url');
        const role = interaction.options.getRole('role');
        const userId = interaction.user.id;
        const userData = this.getUserData(userId);
        const rewardsConfig = this.getTweetRewards();

        // Check if tweet rewards are enabled
        if (!rewardsConfig.enabled) {
            return await interaction.reply({
                content: 'Tweet rewards are currently disabled.',
                ephemeral: true
            });
        }

        // Validate tweet URL
        if (!this.isValidTweetUrl(tweetUrl)) {
            return await interaction.reply({
                content: 'Please provide a valid Twitter/X URL.',
                ephemeral: true
            });
        }

        // Extract tweet ID
        const tweetId = this.getTweetIdFromUrl(tweetUrl);
        if (!tweetId) {
            return await interaction.reply({
                content: 'Could not extract tweet ID from the URL. Please check the URL and try again.',
                ephemeral: true
            });
        }

        // Create a pending submission
        const pendingPath = path.join(__dirname, '..', 'data', 'pending-tweets.json');
        let pendingTweets = [];

        if (fs.existsSync(pendingPath)) {
            pendingTweets = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
        }

        // Check if this tweet was already submitted
        if (pendingTweets.some(t => t.tweetId === tweetId)) {
            return await interaction.reply({
                content: 'This tweet has already been submitted for review.',
                ephemeral: true
            });
        }

        // Add to pending tweets
        const submission = {
            id: Date.now().toString(),
            userId: userId,
            username: interaction.user.username,
            tweetId: tweetId,
            tweetUrl: tweetUrl,
            submissionTime: new Date().toISOString(),
            status: 'pending',
            role: role ? role.id : null
        };

        pendingTweets.push(submission);
        fs.writeFileSync(pendingPath, JSON.stringify(pendingTweets, null, 2));

        // Create confirmation embed
        const embed = new EmbedBuilder()
            .setTitle('✅ Tweet Submitted for Review')
            .setColor('#00FF00')
            .setDescription("Your tweet has been submitted for review. You will receive $GECKURA tokens once it's approved.")
            .addFields(
                { name: 'Tweet URL', value: `[View Tweet](${tweetUrl})`, inline: false },
                { name: 'Status', value: '⏳ Pending Review', inline: true },
                { name: 'Potential Reward', value: `${rewardsConfig.tokensPerTweet} $GECKURA`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Geckura Bot' });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

        // Notify admins about the new submission
        const adminChannelId = config.adminChannelId;
        if (adminChannelId) {
            try {
                const adminChannel = await interaction.client.channels.fetch(adminChannelId);
                if (adminChannel) {
                    const adminEmbed = new EmbedBuilder()
                        .setTitle('📋 New Tweet Submission')
                        .setColor('#FFFF00')
                        .setDescription('A new tweet has been submitted for review.')
                        .addFields(
                            { name: 'Submitted By', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                            { name: 'Tweet URL', value: `[View Tweet](${tweetUrl})`, inline: false },
                            { name: 'Submission Time', value: new Date().toLocaleString(), inline: true },
                            { name: 'Actions', value: 'Use `/review-tweets` to approve or reject this submission.', inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'Geckura Bot' });

                    await adminChannel.send({ embeds: [adminEmbed] });
                }
            } catch (error) {
                console.error('Error notifying admins:', error);
            }
        }
    }
};
