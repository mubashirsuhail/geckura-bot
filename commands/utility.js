const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('utility')
        .setDescription('Display information about GeckAura utilities'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🦎 GeckAura – The Ultimate Utility Hub on Solana')
            .setDescription('Welcome to GeckAura — an expanding ecosystem designed for power, rewards, and real utility.')
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Add utility information
        embed.addFields(
            {
                name: '🤖 AI Assistant Buddy',
                value: 'Your own AI co-pilot. Predictive insights, market analysis, trade guidance — all in real-time.',
                inline: false
            },
            {
                name: '💰 40% Royalty Revenue Share',
                value: 'Holders earn from the official Geckura collection. A community-driven reward system like no other.',
                inline: false
            },
            {
                name: '🪙 $GAURA Staking',
                value: 'Stake your $GAURA to unlock:\n• Passive earnings\n• Daily reward boosts\n• Higher TraitShop tier access\n• DAO voting weight\n• Hidden perks for top stakers\n\nYour stake = your aura level.',
                inline: false
            },
            {
                name: '🧬 TraitShop (Aura Mods)',
                value: 'Customize and evolve your Geckura experience:\n• Upgrade traits\n• Unlock seasonal skins\n• Buy boosters with staking rewards\n• Aura rarity enhancements\n• Limited-time cosmetic drops\n\nA dynamic system built for creativity + utility.',
                inline: false
            },
            {
                name: '🧠 Alpha DAO Access',
                value: 'Elite community for serious builders & traders:\n• Private alpha calls\n• Early project access\n• Market breakdowns\n• Tools, bots, and exclusive dashboards\n\nAccess is based on staked Geckura + Aura level.',
                inline: false
            },
            {
                name: '🎮 Games & Challenges',
                value: 'Earn while having fun:\n• Daily & weekly challenges\n• XP leaderboards\n• Mystery box rewards\n• Mini-games with on-chain prizes\n\nYour activity = your rewards.',
                inline: false
            },
            {
                name: '🤝 Collabs, Raids & Community Events',
                value: 'Partner raids, seasonal missions, cross-project utilities, whitelist rewards — always live, always rewarding.',
                inline: false
            },
            {
                name: '🔗 Official Links & Portals',
                value: `• 🔥 [Mint Live on TribeX](${config.links?.mintSite || 'https://launchpad.tribexlabs.xyz/geckura'})\n` +
                       `• 🎁 [Mystery Box Portal](${config.links?.mysteryBox || 'https://mysterybox.geckura.app/'})\n` +
                       `• 🌐 [Official Website](${config.links?.website || 'https://geckura.app/'})\n` +
                       `• 🛒 [Magic Eden](${config.links?.elixirMarket || 'https://magiceden.io/marketplace/geckura_elixir'})\n` +
                       `• 🐦 [Twitter / X](${config.links?.twitter || 'https://x.com/Geckura'})`,
                inline: false
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};