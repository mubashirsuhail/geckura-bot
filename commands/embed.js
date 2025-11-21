const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a styled embed message')
        .setDefaultMemberPermissions(require('discord.js').PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('image')
                .setDescription('Image URL for the embed')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('footer')
                .setDescription('Footer text for the embed')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('color')
                .setDescription('Color for the embed (hex code)')
                .setRequired(false)),

    async execute(interaction, client, config, whitelistData) {
        // Check if user has admin or alchemist role
        const member = interaction.member;
        const hasRole = member.roles.cache.some(role => 
            role.name === config.roles.admin || role.name === config.roles.alchemist
        );

        if (!hasRole) {
            return await interaction.reply({
                content: 'You don\'t have permission to use this command. Only Admins and Alchemists can use it.',
                ephemeral: true
            });
        }

        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const imageUrl = interaction.options.getString('image');
        const footerText = interaction.options.getString('footer') || config.footer;
        let color = interaction.options.getString('color') || config.colors.primary;

        // Convert hex color to integer if provided
        if (color.startsWith('#')) {
            color = parseInt(color.replace('#', ''), 16);
        } else {
            color = parseInt(config.colors.primary.replace('#', ''), 16);
        }

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setFooter({ text: footerText })
            .setTimestamp();

        // Add image if provided
        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        // Add author with bot info
        embed.setAuthor({
            name: 'Geckura Sensei',
            iconURL: client.user.displayAvatarURL()
        });

        await interaction.reply({ embeds: [embed] });
    }
};