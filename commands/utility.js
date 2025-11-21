const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('utility')
        .setDescription('Display information about GeckAura utilities'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🦎 GeckAura – The Ultimate Utility Hub')
            .setDescription('⚡ Welcome to GeckAura – Where Innovation Meets Utility!\n\nStep into the future of Solana-powered utility! GeckAura is not just a project — it\'s an ecosystem built for action, rewards, and growth.')
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Add utility information
        embed.addFields(
            {
                name: '🤖 AI Assistant Buddy',
                value: 'Your personal AI companion analyzes the market, guides trades, and helps you make smarter moves in real-time.',
                inline: false
            },
            {
                name: '💰 40% Royalty RevShare',
                value: 'Earn from the official GeckAura collection — community rewards like you\'ve never seen before.',
                inline: false
            },
            {
                name: '🪙 Staking',
                value: 'Stake your assets and watch your influence and rewards grow while supporting the ecosystem.',
                inline: false
            },
            {
                name: '🎮 Games & Challenges',
                value: 'Compete, win, and climb leaderboards. Your activity = rewards.',
                inline: false
            },
            {
                name: '🤝 Collabs & Raids',
                value: 'Participate in collaborations, community raids, and special events — earn while you play.',
                inline: false
            },
            {
                name: '🎁 Special Surprises',
                value: 'Big announcements are coming… and some surprises will change the game forever.',
                inline: false
            }
        );

        // Add a call to action
        embed.addFields(
            {
                name: '✨ The GeckAura Experience',
                value: 'The GeckAura experience is live — explore utilities, engage in events, and prepare for the unexpected. Your aura is just beginning to glow.',
                inline: false
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};