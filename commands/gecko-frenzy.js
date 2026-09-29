const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { frenzyManager } = require('../utils/gecko-frenzy-engine');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gecko-frenzy')
        .setDescription('Create and host a Gecko Frenzy multiplayer battle game')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Required role to join the frenzy (optional)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('Join lobby duration in minutes (default: 3)')
                .setMinValue(1)
                .setMaxValue(30)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reward_token')
                .setDescription('Reward token symbol (default: $GECKURA)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('reward_amount')
                .setDescription('Reward payout amount (default: 1000)')
                .setMinValue(1)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('max_players')
                .setDescription('Maximum player capacity (default: 20)')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to post the Frenzy lobby in (optional)')
                .setRequired(false)),

    async execute(interaction, client, config) {
        // Admin / Moderator Permission check
        const isAuthorized = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
                             interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
                             interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

        if (!isAuthorized) {
            return await interaction.reply({
                content: '🚫 **Access Denied:** Only administrators and server moderators can create a Gecko Frenzy.',
                ephemeral: true
            });
        }

        const requiredRole = interaction.options.getRole('role');
        const joinTimeMinutes = interaction.options.getInteger('time') || 3;
        const rewardToken = interaction.options.getString('reward_token') || '$GECKURA';
        const rewardAmount = interaction.options.getInteger('reward_amount') || 1000;
        const maxPlayers = interaction.options.getInteger('max_players') || 20;
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        // Create Frenzy object
        const frenzy = frenzyManager.createFrenzy({
            guildId: interaction.guildId,
            channelId: targetChannel.id,
            creatorId: interaction.user.id,
            requiredRole,
            joinTimeMinutes,
            rewardToken,
            rewardAmount,
            maxPlayers
        });

        const lobbyEmbed = frenzyManager.buildLobbyEmbed(frenzy);
        const lobbyButtons = frenzyManager.buildLobbyButtons(frenzy);

        let postedMessage;
        try {
            postedMessage = await targetChannel.send({
                embeds: [lobbyEmbed],
                components: [lobbyButtons]
            });
            frenzy.messageId = postedMessage.id;
        } catch (err) {
            return await interaction.reply({
                content: `⚠️ Failed to post Frenzy lobby to ${targetChannel}: ${err.message}`,
                ephemeral: true
            });
        }

        // Confirm to admin
        if (targetChannel.id !== interaction.channelId) {
            await interaction.reply({
                content: `✅ **Gecko Frenzy Initialized!** Posted lobby to ${targetChannel}.`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `✅ **Gecko Frenzy Initialized!** Players have **${joinTimeMinutes} minute(s)** to join.`,
                ephemeral: true
            });
        }

        // Interval to update timer on lobby message every 10 seconds
        const updateInterval = setInterval(async () => {
            const currentFrenzy = frenzyManager.getFrenzy(frenzy.id);
            if (!currentFrenzy || currentFrenzy.status !== 'JOINING') {
                clearInterval(updateInterval);
                return;
            }

            const updatedEmbed = frenzyManager.buildLobbyEmbed(currentFrenzy);
            const updatedButtons = frenzyManager.buildLobbyButtons(currentFrenzy);

            try {
                await postedMessage.edit({ embeds: [updatedEmbed], components: [updatedButtons] });
            } catch (e) {}
        }, 10000);

        // Auto-start when join timer expires
        setTimeout(async () => {
            clearInterval(updateInterval);
            const currentFrenzy = frenzyManager.getFrenzy(frenzy.id);
            if (currentFrenzy && currentFrenzy.status === 'JOINING') {
                await frenzyManager.startFrenzyLoop(client, frenzy.id);
            }
        }, joinTimeMinutes * 60 * 1000);
    }
};
