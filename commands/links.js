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
                value: `[Join our community](${config.links.discord || 'https://discord.gg/yChGaA6HmJ'})`,
                inline: false
            },
            {
                name: '🌐 Sacred Web Portal',
                value: config.links.website || 'https://geckura.app/',
                inline: false
            },
            {
                name: '🎁 Mystery Box Portal',
                value: config.links.mysteryBox || 'https://mysterybox.geckura.app/',
                inline: false
            },
            {
                name: '🎁 Geckura Mystery Box',
                value: `[Open Geckura Mystery Box](${config.links.geckuraMysteryBox || 'https://mysterybox.geckura.app/geckura'})`,
                inline: false
            },
            {
                name: '🪂 Airdrop Portal',
                value: `[Claim Your Airdrop](${config.links.airdrop || 'http://airdrop.geckura.app/'})`,
                inline: false
            },
            {
                name: '🖼️ Mint',
                value: '🔜 **Coming Soon** — Stay tuned for the official mint announcement!',
                inline: false
            },
            {
                name: '🌀 X Transmission Hub',
                value: `[@Geckura](${config.links.twitter || 'https://x.com/Geckura'})`,
                inline: false
            },
            {
                name: '🧪 Geckura Elixir',
                value: config.links.elixirMarket || 'https://magiceden.io/marketplace/geckura_elixir',
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