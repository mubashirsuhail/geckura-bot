const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tools')
        .setDescription('Explore Geckura B2B Utilities & Mystery Box as a Service (MaaS) for Web3 projects')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the tools embed to (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Optional ping (e.g. everyone or role name)')
                .setRequired(false)),

    async execute(interaction, client, config) {
        const targetChannel = interaction.options?.getChannel('channel') || interaction.channel;
        const pingRole = interaction.options?.getString('ping');

        const primaryColor = parseInt(config?.colors?.primary?.replace('#', '') || '00FF99', 16);

        const embed = new EmbedBuilder()
            .setTitle('🛠️ GECKURA B2B TOOLS & MYSTERY BOX AS A SERVICE (MaaS)')
            .setDescription(
                'Power your Web3 project with **Geckura B2B Utility Infrastructure**! ' +
                'We provide complete **Mystery Box as a Service (MaaS)** to help partner collections drive engagement, ' +
                'create token sinks, and reward their communities with provably fair on-chain mechanics.\n\n' +
                '🎫 **Open a Support Ticket** in our server or contact founding team (`@Mubi`) for more info & custom orders.'
            )
            .setColor(primaryColor)
            .setThumbnail(client.user?.displayAvatarURL())
            .setImage(config?.links?.banner || 'https://i.imgur.com/GeckuraBanner.png')
            .addFields(
                {
                    name: '🎁 Mystery Box as a Service (MaaS)',
                    value: '• High-converting gamified mystery box portal for Solana & Web3 projects\n• Provably fair on-chain odds & instant reward distribution\n• Proven utility driver for NFT collections, DAOs & token communities\n🌐 **Live Portal Demo:** [mysterybox.geckura.app](https://mysterybox.geckura.app/)',
                    inline: false
                },
                {
                    name: '🎨 Fully Customizable Integration Packages',
                    value: '• **Custom URL Slug:** Dedicated web link (`mysterybox.geckura.app/yourproject`)\n• **Custom Branding & Theme:** Tailored color palette, logos, banners & visual FX\n• **Token Support:** Accept your native SPL Token, SOL, or $GECKURA as payment\n• **Token Sinks:** Burn project tokens or route payments to treasury wallets',
                    inline: false
                },
                {
                    name: '🎰 Dynamic Prize Pools & Odds Control',
                    value: '• Flexible reward pools: NFTs, SPL Tokens, Whitelist slots & Discord roles\n• Real-time probability configuration & inventory management\n• Anti-sybil security & automated winner verification',
                    inline: false
                },
                {
                    name: '🤖 Real-Time Discord Webhook Automation',
                    value: '• Instant live Discord announcement feeds when users open mystery boxes\n• Rich embedded win posts, role mentions & hype notifications\n• Integrated community engagement tracking',
                    inline: false
                },
                {
                    name: '⚡ 24-Hour Express Deployment',
                    value: '• Turnkey implementation: go live with your project mystery boxes in under 24 hours\n• Dedicated dev support & seamless onboarding for partner teams',
                    inline: false
                }
            )
            .setFooter({ text: config?.footer || 'Geckura B2B Utility Services — Elevating Solana Projects', iconURL: client.user?.displayAvatarURL() })
            .setTimestamp();

        let pingContent = '';
        if (pingRole && interaction.guild) {
            if (pingRole.toLowerCase() === 'everyone') {
                pingContent = '@everyone';
            } else {
                const role = interaction.guild.roles.cache.find(r => r.name === pingRole);
                pingContent = role ? `<@&${role.id}>` : pingRole;
            }
        }

        if (interaction.options?.getChannel('channel')) {
            try {
                await targetChannel.send({
                    content: pingContent.length > 0 ? pingContent : undefined,
                    embeds: [embed]
                });
                await interaction.reply({
                    content: `✅ Geckura Tools & MaaS embed sent to ${targetChannel}!`,
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
                embeds: [embed]
            });
        }
    }
};
