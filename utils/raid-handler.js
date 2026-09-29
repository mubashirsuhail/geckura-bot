const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { getUserData, saveUserData } = require('./chat2earn-handler');

const raidsPath = path.join(__dirname, '..', 'data', 'raids.json');

// Helper to load raids
function getRaids() {
    try {
        if (!fs.existsSync(raidsPath)) {
            fs.writeFileSync(raidsPath, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(fs.readFileSync(raidsPath, 'utf8'));
    } catch (e) {
        return {};
    }
}

// Helper to save raids
function saveRaids(raids) {
    try {
        fs.writeFileSync(raidsPath, JSON.stringify(raids, null, 2));
    } catch (e) {
        console.error('Error saving raids.json:', e);
    }
}

// Extract tweet ID from URL
function getTweetIdFromUrl(url) {
    const regex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
    const match = url ? url.match(regex) : null;
    return match ? match[1] : null;
}

// Build standard Web3 Raid Alert Embed
function buildRaidAlertEmbed(raid, client) {
    const reward = raid.rewardAmount || 100;
    const totalRaiders = raid.claimedUsers ? raid.claimedUsers.length : 0;

    return new EmbedBuilder()
        .setTitle('⚔️ GECKURA OFFICIAL RAID ALERT')
        .setColor(0x00FF99)
        .setDescription(
            `🚀 **RAIDERS UNITE FOR $GAURA!**\n\n` +
            `A new official target has landed on X/Twitter! Like, Retweet, & Reply to boost Geckura visibility and claim your **${reward} $GAURA** token reward.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
        )
        .addFields(
            {
                name: '🎯 Raid Target',
                value: `[**Click Here to Open Tweet on X/Twitter**](${raid.tweetUrl})`,
                inline: false
            },
            {
                name: '💰 Raid Reward',
                value: `**${reward.toLocaleString()} $GAURA** per verified raider`,
                inline: true
            },
            {
                name: '👥 Total Raiders',
                value: `**${totalRaiders.toLocaleString()} Raiders**`,
                inline: true
            },
            {
                name: '📜 Instructions',
                value: '1️⃣ Click **🔗 View Tweet** below\n2️⃣ Like, Retweet & Reply with **$GAURA** on X\n3️⃣ Click **⚡ Claim Raid Reward** below to collect your tokens!',
                inline: false
            }
        )
        .setFooter({ text: 'Geckura Raid2Earn — Verified Automated Token Drops', iconURL: client?.user?.displayAvatarURL() })
        .setTimestamp(new Date(raid.createdAt || Date.now()));
}

// Build standard Raid Alert Buttons
function buildRaidAlertButtons(raidId, tweetUrl) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('🔗 View Tweet')
            .setStyle(ButtonStyle.Link)
            .setURL(tweetUrl),
        new ButtonBuilder()
            .setCustomId(`raid_claim_${raidId}`)
            .setLabel('⚡ Claim Raid Reward')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`raid_stats_${raidId}`)
            .setLabel('📊 Raid Stats')
            .setStyle(ButtonStyle.Secondary)
    );
}

/**
 * Create a new Raid Alert post
 */
async function postRaidAlert(interaction, client, tweetUrl, rewardAmount = 100, targetRole = null) {
    const raids = getRaids();
    const raidId = `raid_${Date.now()}`;

    const newRaid = {
        id: raidId,
        creatorId: interaction.user.id,
        tweetUrl: tweetUrl,
        rewardAmount: rewardAmount,
        targetRole: targetRole ? targetRole.id : null,
        claimedUsers: [],
        createdAt: Date.now()
    };

    raids[raidId] = newRaid;
    saveRaids(raids);

    const embed = buildRaidAlertEmbed(newRaid, client);
    const buttons = buildRaidAlertButtons(raidId, tweetUrl);

    let contentStr = '⚔️ **NEW RAID ALERT!** Raiders assemble to earn **$GAURA** tokens!';
    if (targetRole) {
        contentStr += ` <@&${targetRole.id}>`;
    } else {
        contentStr += ' @everyone';
    }

    await interaction.reply({
        content: `✅ **Raid Alert Created Successfully!** Posting to channel below...`,
        ephemeral: true
    });

    const raidMsg = await interaction.channel.send({
        content: contentStr,
        embeds: [embed],
        components: [buttons]
    });

    newRaid.messageId = raidMsg.id;
    newRaid.channelId = raidMsg.channel.id;
    raids[raidId] = newRaid;
    saveRaids(raids);

    return raidMsg;
}

/**
 * Handle user claim button interaction
 */
async function handleRaidClaim(interaction, client) {
    const customId = interaction.customId;
    const raidId = customId.replace('raid_claim_', '');
    const raids = getRaids();
    const raid = raids[raidId];

    if (!raid) {
        return await interaction.reply({
            content: '⚠️ **Raid Expired:** This raid target is no longer active or tracked.',
            ephemeral: true
        });
    }

    const userId = interaction.user.id;
    if (!raid.claimedUsers) raid.claimedUsers = [];

    // Check if user already claimed
    if (raid.claimedUsers.includes(userId)) {
        return await interaction.reply({
            content: `⚠️ **Already Claimed:** You have already claimed your **${raid.rewardAmount} $GAURA** reward for this raid!`,
            ephemeral: true
        });
    }

    // Record claim
    raid.claimedUsers.push(userId);
    saveRaids(raids);

    // Credit user $GAURA tokens & sync to Supabase
    const userData = getUserData(userId);
    userData.tokens = (userData.tokens || 0) + raid.rewardAmount;
    userData.totalTokensEarned = (userData.totalTokensEarned || 0) + raid.rewardAmount;
    userData.raidsCompleted = (userData.raidsCompleted || 0) + 1;
    saveUserData(userId, userData);

    // Ephemeral confirmation
    const claimEmbed = new EmbedBuilder()
        .setTitle('🎉 RAID REWARD CLAIMED!')
        .setColor(0x00FF99)
        .setDescription(
            `Awesome job, raider!\n\n` +
            `💰 **Tokens Earned:** \`+${raid.rewardAmount.toLocaleString()} $GAURA\`\n` +
            `💳 **New Balance:** \`${userData.tokens.toLocaleString()} $GAURA\`\n` +
            `⚔️ **Total Raids Completed:** \`${userData.raidsCompleted}\``
        )
        .setFooter({ text: 'Keep raiding to top the Geckura Leaderboards!', iconURL: client.user?.displayAvatarURL() })
        .setTimestamp();

    await interaction.reply({
        embeds: [claimEmbed],
        ephemeral: true
    });

    // Update public raid message embed live counter
    if (raid.messageId && raid.channelId) {
        try {
            const channel = await client.channels.fetch(raid.channelId);
            if (channel) {
                const msg = await channel.messages.fetch(raid.messageId);
                if (msg) {
                    const updatedEmbed = buildRaidAlertEmbed(raid, client);
                    const buttons = buildRaidAlertButtons(raidId, raid.tweetUrl);
                    await msg.edit({ embeds: [updatedEmbed], components: [buttons] });
                }
            }
        } catch (e) {
            console.error('Error updating live raid message:', e);
        }
    }
}

/**
 * Handle user raid stats button interaction
 */
async function handleRaidStats(interaction, client) {
    const customId = interaction.customId;
    const raidId = customId.replace('raid_stats_', '');
    const raids = getRaids();
    const raid = raids[raidId];

    if (!raid) {
        return await interaction.reply({
            content: '⚠️ **Raid Expired:** Could not find stats for this raid.',
            ephemeral: true
        });
    }

    const totalRaiders = raid.claimedUsers ? raid.claimedUsers.length : 0;
    const totalTokensDistributed = totalRaiders * (raid.rewardAmount || 100);

    const statsEmbed = new EmbedBuilder()
        .setTitle('📊 RAID STATS & IMPACT')
        .setColor(0x9D4EDD)
        .setDescription(
            `🎯 **Target Tweet:** [View Tweet](${raid.tweetUrl})\n\n` +
            `👥 **Total Verified Raiders:** \`${totalRaiders.toLocaleString()} Raiders\`\n` +
            `💰 **$GAURA Tokens Paid:** \`${totalTokensDistributed.toLocaleString()} $GAURA\`\n` +
            `⏱️ **Raid Started:** <t:${Math.floor(raid.createdAt / 1000)}:R>`
        )
        .setFooter({ text: 'Geckura Raid2Earn Metrics', iconURL: client.user?.displayAvatarURL() })
        .setTimestamp();

    return await interaction.reply({
        embeds: [statsEmbed],
        ephemeral: true
    });
}

module.exports = {
    getRaids,
    saveRaids,
    buildRaidAlertEmbed,
    buildRaidAlertButtons,
    postRaidAlert,
    handleRaidClaim,
    handleRaidStats
};
