const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mintinfo')
        .setDescription('Display mint information'),

    async execute(interaction, client, config, whitelistData) {
        const user = interaction.user;

        // Check if user is whitelisted
        const isWhitelisted = whitelistData.whitelisted.some(entry => entry.discordId === user.id);

        const embed = new EmbedBuilder()
            .setTitle('🦎 GeckAura Ecosystem — Collection Utilities Overview')
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Add collection I info
        embed.addFields(
            {
                name: 'COLLECTION I — Geckura Elixir (Genesis Utility Item)',
                value: 'A limited Genesis artifact that powers your PFP and unlocks exclusive ecosystem features.',
                inline: false
            }
        );

        // Add elixir utilities
        embed.addFields(
            {
                name: 'Elixir Utilities',
                value: '',
                inline: false
            },
            {
                name: '🤖 AI Agent Enhancement',
                value: 'Access advanced AI tools that provide:\n• Unlocks advanced AI features\n• Deeper analytics\n• Faster recommendations\n• Automated guidance',
                inline: false
            },
            {
                name: '💰 Staking Multiplier',
                value: 'Increase $GEKURA staking rewards and Aura Level progression.',
                inline: false
            },
            {
                name: '🧠 Alpha DAO Priority Access',
                value: 'Early entry with enhanced Voting influence.',
                inline: false
            },
            {
                name: '💎 Exclusive 40% Royalty Rev-Share',
                value: 'Distributed every 10 days from the Geckura PFP collection — reserved for Elixir holders.',
                inline: false
            },
            {
                name: '🎁 Seasonal Airdrops & Bonuses',
                value: 'Gain priority access to limited drops and premium ecosystem rewards.',
                inline: false
            }
        );

        // Add collection II info
        embed.addFields(
            {
                name: 'COLLECTION II — Geckura PFP (1111 Supply)',
                value: 'Your identity NFT within GeckAura, unlocking staking, progression, and AI-powered utilities.',
                inline: false
            }
        );

        // Add PFP utilities
        embed.addFields(
            {
                name: 'PFP Utilities',
                value: '',
                inline: false
            },
            {
                name: '🤖 AI Agent Integration',
                value: 'Each PFP interacts with the AI Buddy for actionable insights.',
                inline: false
            },
            {
                name: '🪙 $GEKURA Staking',
                value: 'Earn daily Passive Income and Aura Points.',
                inline: false
            },
            {
                name: '⭐ Aura Level Progression',
                value: 'Level up through staking, missions, and Elixir boosts.',
                inline: false
            },
            {
                name: '🧬 TraitShop Compatibility',
                value: 'Apply upgrades, mutations, and seasonal traits.',
                inline: false
            },
            {
                name: '🧠 Alpha DAO Access',
                value: 'Standard entry with voting rights.',
                inline: false
            },
            {
                name: '🎮 Games & Missions',
                value: 'Participate in quests, challenges, and leaderboards.',
                inline: false
            },
            {
                name: '🤝 Raids & Events',
                value: 'Access collabs, whitelist perks, and seasonal ecosystem events.',
                inline: false
            }
        );

        // Whitelist status removed

        // Mint site link removed

        await interaction.reply({ embeds: [embed] });
    }
};