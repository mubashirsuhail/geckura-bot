const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Create a styled announcement embed')
        .setDefaultMemberPermissions(require('discord.js').PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('title')
                .setDescription('The title of the announcement')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The main announcement message')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('image')
                .setDescription('Image URL for announcement')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('Upload an image for announcement')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('ping')
                .setDescription('Ping a role (use role name or @everyone)')
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
        const message = interaction.options.getString('message');
        const imageUrl = interaction.options.getString('image');
        const attachment = interaction.options.getAttachment('attachment');
        const pingRole = interaction.options.getString('ping');

        // Create the announcement embed
        const embed = new EmbedBuilder()
            .setTitle(`📢 ${title}`)
            .setDescription(message)
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Add image if provided, prioritize attachment over URL
        if (attachment) {
            embed.setImage(attachment.url);
            console.log(`Using attachment: ${attachment.url}`);
        } else if (imageUrl) {
            embed.setImage(imageUrl);
            console.log(`Image URL set: ${imageUrl}`);
        } else {
            embed.setImage(config.links.banner);
            console.log(`Using default banner: ${config.links.banner}`);
        }

        // Add author with bot info
        embed.setAuthor({
            name: 'Geckura Sensei',
            iconURL: client.user.displayAvatarURL()
        });

        // Add announcement banner
        embed.addFields({
            name: '🦎',
            value: '*Geckura — Turning Chaos into Flow*',
            inline: false
        });

        // Prepare the message content with ping if needed
        let content = '';
        if (pingRole) {
            if (pingRole.toLowerCase() === 'everyone') {
                content = '@everyone';
            } else {
                // Try to find the role by name
                const role = interaction.guild.roles.cache.find(r => r.name === pingRole);
                if (role) {
                    content = `<@&${role.id}>`;
                } else {
                    content = pingRole; // Use as-is if role not found
                }
            }
        }

        await interaction.reply({ 
            content: content, 
            embeds: [embed] 
        });
    }
};