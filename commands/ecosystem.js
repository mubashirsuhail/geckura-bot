const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ecosystem')
        .setDescription('Display the full Geckura Ecosystem breakdown & utility hub')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the ecosystem embed to (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Optional ping (e.g. everyone or role name)')
                .setRequired(false)),

    async execute(interaction, client, config) {
        const targetChannel = interaction.options?.getChannel('channel') || interaction.channel;
        const pingRole = interaction.options?.getString('ping');

        const embed = new EmbedBuilder()
            .setTitle('🦎 GECKURA ECOSYSTEM — Power, Rewards & Real Solana Utility')
            .setDescription(
                'Welcome to **Geckura** — the premier high-utility ecosystem on Solana. ' +
                'Driven by innovation, gamified utilities, automated revenue sharing, and AI co-pilots.'
            )
            .setColor(parseInt(config.colors?.primary?.replace('#', '') || '00FF99', 16))
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🎁 Solana Mystery Box Platform',
                    value: '• Gamified prize openings with provably fair on-chain odds\n• Supports SOL & native SPL Token payment sinks\n• Available as B2B utility for partner projects\n🌐 **Portal:** [mysterybox.geckura.app](https://mysterybox.geckura.app/)',
                    inline: false
                },
                {
                    name: '🤖 AI Assistant Buddy',
                    value: '• Your 24/7 personal AI co-pilot in Discord\n• Market analysis, sentiment tracking, and trade guidance\n• Predictive insights powered by Geckura AI models',
                    inline: false
                },
                {
                    name: '💰 40% Royalty Revenue Share',
                    value: '• 40% of marketplace secondary royalties distributed to holders\n• Automated reward distribution directly to verified holder wallets\n• Real yield backed by collection activity',
                    inline: false
                },
                {
                    name: '🪙 $GEKURA Staking & Aura Levels',
                    value: '• Stake $GEKURA & Elixirs to boost your Aura Level\n• Multiplier boosts for daily rewards & Chat2Earn\n• Unlock higher TraitShop tiers & DAO voting weight',
                    inline: false
                },
                {
                    name: '🧬 TraitShop (Aura Mods)',
                    value: '• Evolve & upgrade your NFT traits directly on-chain\n• Exclusive seasonal skins, cosmetic drops & rarity boosts\n• Powered by staking rewards & $GEKURA token utility',
                    inline: false
                },
                {
                    name: '🧠 Alpha DAO & Insider Trading Suite',
                    value: '• Private alpha calls, early project presales & whitelist allocations\n• Exclusive trading dashboards, bot access & market breakdowns\n• Gated by holder status and staked Aura levels',
                    inline: false
                },
                {
                    name: '🎮 Chat2Earn & Interactive Rewards',
                    value: '• Earn $GEKURA tokens simply by chatting and engaging in Discord\n• Weekly XP leaderboards, invite rewards & mini-games\n• Instant token redemption for raffles & mystery box keys',
                    inline: false
                }
            )
            .setFooter({ text: config.footer || 'Geckura — Where Innovation Meets Utility!' })
            .setTimestamp();

        // Action Buttons Row
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🔥 Mint Live on TribeX')
                .setStyle(ButtonStyle.Link)
                .setURL(config.links?.mintSite || 'https://launchpad.tribexlabs.xyz/geckura'),

            new ButtonBuilder()
                .setLabel('🌐 Official Website')
                .setStyle(ButtonStyle.Link)
                .setURL(config.links?.website || 'https://geckura.app/'),

            new ButtonBuilder()
                .setLabel('🎁 Mystery Box Portal')
                .setStyle(ButtonStyle.Link)
                .setURL(config.links?.mysteryBox || 'https://mysterybox.geckura.app/'),

            new ButtonBuilder()
                .setLabel('🛒 Magic Eden')
                .setStyle(ButtonStyle.Link)
                .setURL(config.links?.elixirMarket || 'https://magiceden.io/marketplace/geckura_elixir'),

            new ButtonBuilder()
                .setLabel('🐦 Twitter / X')
                .setStyle(ButtonStyle.Link)
                .setURL(config.links?.twitter || 'https://x.com/Geckura')
        );

        let pingContent = '';
        if (pingRole && interaction.guild) {
            if (pingRole.toLowerCase() === 'everyone') {
                pingContent = '@everyone';
            } else {
                const role = interaction.guild.roles.cache.find(r => r.name === pingRole);
                pingContent = role ? `<@&${role.id}>` : pingRole;
            }
        }

        // Check if posting to channel or responding directly
        if (interaction.options?.getChannel('channel')) {
            try {
                await targetChannel.send({
                    content: pingContent.length > 0 ? pingContent : undefined,
                    embeds: [embed],
                    components: [row]
                });
                await interaction.reply({
                    content: `✅ Geckura Ecosystem embed sent to ${targetChannel}!`,
                    ephemeral: true
                });
            } catch (err) {
                await interaction.reply({
                    content: `⚠️ Failed to send embed to ${targetChannel}: ${err.message}`,
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                content: pingContent.length > 0 ? pingContent : undefined,
                embeds: [embed],
                components: [row]
            });
        }
    }
};
