const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('links')
        .setDescription('Display official Gekura social links'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🦎✨ Geckura Official Links')
            .setDescription('Unlock the realm. Follow the glow. Join the tribe.')
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Add social links
        embed.addFields(
            {
                name: '🌿 Discord Lair',
                value: '[Join our community](https://discord.gg/yChGaA6HmJ)',
                inline: false
            },
            {
                name: '🌐 Sacred Web Portal',
                value: 'Forging in the shadows…',
                inline: false
            },
            {
                name: '🌀 X Transmission Hub',
                value: '[@Geckura](https://x.com/Geckura)',
                inline: false
            }
        );

        // Add footer tagline
        embed.addFields(
            {
                name: '🌟🧪',
                value: 'Stay close to the aura — the evolution never stops.',
                inline: false
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};