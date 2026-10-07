const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mysterybox-sales')
        .setDescription('Post the Mystery Box Utility B2B sales & integration embed for prospective projects')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the Mystery Box utility embed to (default: current channel)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Optional ping (e.g. everyone, or role name)')
                .setRequired(false)),

    async execute(interaction, client, config) {
        // Check if user has admin or alchemist role
        const member = interaction.member;
        const hasRole = member.roles.cache.some(role => 
            role.name === config.roles.admin || role.name === config.roles.alchemist
        ) || member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasRole) {
            return await interaction.reply({
                content: ' You don\'t have permission to run this command. Only Admins can execute it.',
                ephemeral: true
            });
        }

        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const pingRole = interaction.options.getString('ping');

        const embed = new EmbedBuilder()
            .setTitle('🎁 GECKURA MYSTERY BOX UTILITY — Solana Integration for Projects')
            .setDescription(
                '**Supercharge your project ecosystem with fully automated, gamified Solana Mystery Boxes!**\n\n' +
                'Provide real utility to your holders, sink native tokens, drive marketplace volume, and automate reward distribution with zero code needed on your end.'
            )
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setThumbnail('https://geckura.app/logo.png')
            .setImage(config.links?.banner || 'https://geckura.app/logo.png')
            .addFields(
                {
                    name: '⚡ Custom Token & SOL Payments',
                    value: '• Support **SOL** or **your native SPL Token**\n• Automatic SPL token sink to reduce supply\n• On-chain signature verification & ATA balance checking',
                    inline: false
                },
                {
                    name: '🎯 Verifiable On-Chain Fair Odds',
                    value: '• Provably fair randomness for every prize roll\n• Instant prize claiming & wallet transfers\n• Supports NFTs, SPL Tokens, Whitelist Spots, & Custom Rewards',
                    inline: false
                },
                {
                    name: '🎨 White-Label UI & Dedicated Branding',
                    value: '• Custom branded landing page with your project logo & color scheme\n• Dedicated project URL (e.g. `mysterybox.geckura.app/yourproject`)\n• Mobile & desktop responsive web app interface',
                    inline: false
                },
                {
                    name: '🔔 Discord Webhook & Live Bot Alerts',
                    value: '• Automated live draw feed into your project Discord\n• Instant win announcements & winner mentions\n• Automatic role assignment for mystery box openers',
                    inline: false
                },
                {
                    name: '📊 Real-Time Admin Portal & Analytics',
                    value: '• Live dashboard to set odds, adjust box tiers, and view revenue\n• Full audit logging of all opens, transactions, and user wallets\n• Direct treasury payout configuration',
                    inline: false
                },
                {
                    name: '🤝 Ready to Boost Your Project Utility?',
                    value: 'Get your custom Mystery Box deployed in **under 24 hours**. Click the buttons below to explore live demos or open a purchase ticket!',
                    inline: false
                }
            )
            .setFooter({ text: 'Geckura Mystery Box Services — Elevate Your Ecosystem' })
            .setTimestamp();

        // Action buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🌐 View Live Demo')
                .setStyle(ButtonStyle.Link)
                .setURL(config.links?.mysteryBox || 'https://mysterybox.geckura.app/'),

            new ButtonBuilder()
                .setCustomId('mb_inquire')
                .setLabel('📩 Order / Buy Mystery Box')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💎'),

            new ButtonBuilder()
                .setCustomId('mb_specs')
                .setLabel('📜 Specs & Packages')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📊')
        );

        let pingContent = '';
        if (pingRole) {
            if (pingRole.toLowerCase() === 'everyone') {
                pingContent = '@everyone';
            } else {
                const role = interaction.guild.roles.cache.find(r => r.name === pingRole);
                pingContent = role ? `<@&${role.id}>` : pingRole;
            }
        }

        try {
            await targetChannel.send({
                content: pingContent.length > 0 ? pingContent : undefined,
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: `✅ Mystery Box B2B sales embed posted successfully in ${targetChannel}!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error posting mystery box sales embed:', error);
            await interaction.reply({
                content: `⚠️ Failed to post embed to target channel: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
