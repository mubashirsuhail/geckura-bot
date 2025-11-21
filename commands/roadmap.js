const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roadmap')
        .setDescription('Display the GeckAura roadmap'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🚀 GeckAura Roadmap – The Journey Ahead')
            .setDescription('The adventure is just beginning. Here\'s what\'s next for the GeckAura ecosystem — powered by utility, rewards, and massive surprises.')
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Add roadmap milestones
        embed.addFields(
            {
                name: '🌐 Social Launch',
                value: 'Kickstarting the community. Spread the aura and prepare for what\'s coming.',
                inline: false
            },
            {
                name: '🤝 Collabs & Partnerships',
                value: 'Strategic alliances that expand reach, boost value, and unlock new opportunities for holders.',
                inline: false
            },
            {
                name: '💻 Website Launch',
                value: 'A complete portal to manage your profile, utilities, rewards, and the full GeckAura experience.',
                inline: false
            },
            {
                name: '🧪 Geckura Elixir Launch',
                value: 'Introducing our tiered Elixir system — powering access, perks, and future ecosystem mechanics.',
                inline: false
            },
            {
                name: '🎉 Big Surprise Launch',
                value: 'A major reveal is on the way — something ecosystem-shifting and game-changing.',
                inline: false
            },
            {
                name: '🐸 Gekura Official Collection Launch — 1111 Supply',
                value: 'The core identity of the ecosystem arrives. 1111 Gekura, crafted with narrative, utility, and long-term value at the center. New traits, deeper lore, exclusive holder benefits — the true evolution begins here.',
                inline: false
            },
            {
                name: '🪙 Staking Live',
                value: 'Stake your assets and earn passive rewards as the ecosystem grows.',
                inline: false
            },
            {
                name: '🤖 AI Agent Buddy Access',
                value: 'Early access for holders to your personal AI trading & utility assistant.',
                inline: false
            }
        );

        // Add footer note
        embed.addFields(
            {
                name: '✨ The Journey Continues',
                value: 'Every milestone is designed to empower, reward, and elevate our community. Stay active — the GeckAura evolution has only just begun.',
                inline: false
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};