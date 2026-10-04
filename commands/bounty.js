const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildBountyEmbed, buildBountyButtons, getBountyData, saveBountyData } = require('../utils/bounty-handler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bounty')
        .setDescription('Display and manage the official Geckura Mint Bounty (30 Left Promos)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Target channel to post the Mint Bounty embed to (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Optional ping (e.g. everyone, or role name)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('remaining')
                .setDescription('Update remaining supply of mint bounty NFTs (admin override)')
                .setRequired(false)),

    async execute(interaction, client, config) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const pingRole = interaction.options.getString('ping');
        const remainingOption = interaction.options.getInteger('remaining');

        if (remainingOption !== null) {
            // Check if user has admin/alchemist permissions to update supply
            const member = interaction.member;
            const hasRole = member.roles.cache.some(role => 
                role.name === config.roles.admin || role.name === config.roles.alchemist
            ) || member.permissions.has(PermissionFlagsBits.Administrator);

            if (!hasRole) {
                return await interaction.reply({
                    content: '⚠️ You do not have permission to update the remaining supply.',
                    ephemeral: true
                });
            }

            const data = getBountyData();
            data.remainingSupply = Math.max(0, remainingOption);
            saveBountyData(data);
        }

        const embed = buildBountyEmbed(client, config);
        const rows = buildBountyButtons(config);

        let pingContent = '';
        if (pingRole && interaction.guild) {
            if (pingRole.toLowerCase() === 'everyone') {
                pingContent = '@everyone';
            } else {
                const role = interaction.guild.roles.cache.find(r => r.name === pingRole);
                pingContent = role ? `<@&${role.id}>` : pingRole;
            }
        }

        if (interaction.options.getChannel('channel')) {
            try {
                await targetChannel.send({
                    content: pingContent.length > 0 ? pingContent : undefined,
                    embeds: [embed],
                    components: rows
                });
                await interaction.reply({
                    content: `✅ Mint Bounty embed posted successfully to ${targetChannel}!`,
                    ephemeral: true
                });
            } catch (err) {
                await interaction.reply({
                    content: `⚠️ Failed to post embed to ${targetChannel}: ${err.message}`,
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                content: pingContent.length > 0 ? pingContent : undefined,
                embeds: [embed],
                components: rows
            });
        }
    }
};
