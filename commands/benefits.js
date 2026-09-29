const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildBenefitsEmbed(category, client, config) {
    const primaryColor = parseInt(config?.colors?.primary?.replace('#', '') || '00FF99', 16);
    const secondaryColor = parseInt(config?.colors?.secondary?.replace('#', '') || '9D4EDD', 16);

    const embed = new EmbedBuilder()
        .setThumbnail(client.user?.displayAvatarURL())
        .setImage(config?.links?.banner || 'https://i.imgur.com/GeckuraBanner.png')
        .setFooter({ text: config?.footer || 'Geckura — Where Innovation Meets Utility!', iconURL: client.user?.displayAvatarURL() })
        .setTimestamp();

    if (category === '1-1') {
        embed
            .setTitle('👑 GECKURA 1-of-1 NFT HOLDER BENEFITS')
            .setColor(secondaryColor)
            .setDescription(
                '**Geckura 1-of-1 Masterpieces** represent the apex of utility, reward power, and governance in our ecosystem. ' +
                'Holders enjoy unmatched revenue sharing, boosted staking yields, and exclusive perks.'
            )
            .addFields(
                {
                    name: '💰 Rev Share from Mystery Boxes',
                    value: '• Direct revenue sharing from Mystery Box platform sales\n• Automated yield distribution directly into verified 1-of-1 holder wallets\n• Real protocol revenue backing your 1-of-1 NFT',
                    inline: false
                },
                {
                    name: '🚀 2.5x Staking $GAURA Yield Multiplier',
                    value: '• Massive **2.5x multiplier boost** on all $GAURA token staking rewards\n• Accelerated Aura Level progression & maximum TraitShop discounts\n• Top-tier daily emission rates for long-term passive yield',
                    inline: false
                },
                {
                    name: '🎟️ Guaranteed Mystery Box Tickets',
                    value: '• Recurring free & bonus Mystery Box tickets allocated directly to holders\n• Priority entry for high-rarity box drops & exclusive prize pools\n• Zero-cost access to grand prize mystery draws',
                    inline: false
                },
                {
                    name: '👑 Exclusive VIP Perks & Governance',
                    value: '• Access to the private 1-of-1 Alpha Lounge & advisory council\n• Guaranteed top-tier whitelist slots for all partner white-label drops\n• Direct voice in key Geckura DAO ecosystem decisions',
                    inline: false
                }
            );
    } else if (category === 'collection') {
        embed
            .setTitle('🦎 GECKURA COLLECTION HOLDER BENEFITS')
            .setColor(primaryColor)
            .setDescription(
                'Holding a **Geckura NFT** unlocks full access to our expanding suite of Solana utilities, reward mechanics, ' +
                'and gamified Web3 features.'
            )
            .addFields(
                {
                    name: '🎁 Solana Mystery Boxes',
                    value: '• Full access to the official Geckura Solana Mystery Box platform\n• Unlock boxes containing $GAURA, Free Mints, NFTs & Solana prizes\n• Special holder discounts & exclusive Mystery Box key access',
                    inline: false
                },
                {
                    name: '🪙 Staking $GAURA',
                    value: '• Stake your Geckura NFTs to earn passive $GAURA utility tokens daily\n• Boost your Aura rank to unlock higher TraitShop tier access\n• Custom on-chain NFT trait evolution & cosmetic customization',
                    inline: false
                },
                {
                    name: '🎟️ Mystery Box Tickets',
                    value: '• Claim free Mystery Box tickets via staking milestones & Chat2Earn\n• Redeem Discord XP & chat participation directly for ticket keys\n• Seasonal ticket giveaways for active server holders',
                    inline: false
                },
                {
                    name: '🎟️ Holder-Only Raffles',
                    value: '• Exclusive access to holder raffles with provably fair draws\n• Win blue-chip Solana NFTs, $GAURA token prize pools & SOL rewards\n• Guaranteed partner project whitelist allocations',
                    inline: false
                },
                {
                    name: '🎮 Geckura Mining Game',
                    value: '• Early access & enhanced yield boosts in the upcoming Geckura Web3 Mining Game\n• LP Token liquidity mining & gamified yield farming mechanics\n• Multi-token reward sinks & gamified Web3 challenges',
                    inline: false
                }
            );
    } else {
        // Category 'all'
        embed
            .setTitle('🦎 GECKURA HOLDER BENEFITS & UTILITY HUB')
            .setColor(primaryColor)
            .setDescription(
                'Welcome to the official **Geckura Benefits Breakdown**. Explore the powerful utilities reserved for ' +
                '**Geckura Collection Holders** and **1-of-1 NFT Masterpiece Holders**.'
            )
            .addFields(
                {
                    name: '👑 GECKURA 1-of-1 HOLDER BENEFITS (1-1 EXCLUSIVE)',
                    value: '• 💰 **Mystery Box Rev Share:** Direct revenue share from Mystery Box platform sales\n• 🚀 **2.5x Staking $GAURA:** 2.5x boosted yield multiplier on $GAURA staking emissions\n• 🎟️ **Mystery Box Tickets:** Guaranteed recurring free Mystery Box ticket allocations\n• 👑 **VIP Perks & Governance:** Private advisory council access & guaranteed top-tier whitelists',
                    inline: false
                },
                {
                    name: '🦎 GECKURA COLLECTION HOLDER BENEFITS',
                    value: '• 🎁 **Mystery Boxes:** Access to gamified Solana Mystery Box platform & prize drops\n• 🪙 **Staking $GAURA:** Earn passive $GAURA tokens, boost Aura level & TraitShop access\n• 🎟️ **Mystery Box Tickets:** Earn ticket keys via staking, Chat2Earn & Discord activity\n• 🎟️ **Exclusive Raffles:** Entry into holder raffles for Solana NFTs, tokens & SOL prizes\n• 🎮 **Geckura Mining Game:** Early access & yield multipliers in the Geckura LP Mining Game',
                    inline: false
                }
            );
    }

    return embed;
}

function buildBenefitsButtons(currentCategory, config) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('benefits_filter_all')
            .setLabel('🌐 All Benefits')
            .setStyle(currentCategory === 'all' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('benefits_filter_1-1')
            .setLabel('👑 1-of-1 Benefits')
            .setStyle(currentCategory === '1-1' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('benefits_filter_collection')
            .setLabel('🦎 Collection Benefits')
            .setStyle(currentCategory === 'collection' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('🔥 Mint Live on TribeX')
            .setStyle(ButtonStyle.Link)
            .setURL(config?.links?.mintSite || 'https://launchpad.tribexlabs.xyz/geckura'),
        new ButtonBuilder()
            .setLabel('🎁 Mystery Box Portal')
            .setStyle(ButtonStyle.Link)
            .setURL(config?.links?.mysteryBox || 'https://mysterybox.geckura.app/'),
        new ButtonBuilder()
            .setLabel('🌐 Official Website')
            .setStyle(ButtonStyle.Link)
            .setURL(config?.links?.website || 'https://geckura.app/')
    );

    return [row1, row2];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('benefits')
        .setDescription('Display official Geckura Collection & 1-of-1 NFT Holder Benefits & Utilities')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Filter benefits by category')
                .setRequired(false)
                .addChoices(
                    { name: '🌐 All Benefits', value: 'all' },
                    { name: '👑 1-of-1 NFT Benefits', value: '1-1' },
                    { name: '🦎 Collection Benefits', value: 'collection' }
                ))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the benefits embed to (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping')
                .setDescription('Optional ping (e.g. everyone or role name)')
                .setRequired(false)),

    buildBenefitsEmbed,
    buildBenefitsButtons,

    async execute(interaction, client, config) {
        const categoryOption = interaction.options?.getString('category') || 'all';
        const targetChannel = interaction.options?.getChannel('channel') || interaction.channel;
        const pingRole = interaction.options?.getString('ping');

        const embed = buildBenefitsEmbed(categoryOption, client, config);
        const rows = buildBenefitsButtons(categoryOption, config);

        let pingContent = '';
        if (pingRole && interaction.guild) {
            if (pingRole.toLowerCase() === 'everyone') {
                pingContent = '@everyone';
            } else {
                const role = interaction.guild.roles.cache.find(r => r.name === pingRole);
                pingContent = role ? `<@&${role.id}>` : pingRole;
            }
        }

        // If channel option was provided, post directly to that channel
        if (interaction.options?.getChannel('channel')) {
            try {
                await targetChannel.send({
                    content: pingContent.length > 0 ? pingContent : undefined,
                    embeds: [embed],
                    components: rows
                });
                await interaction.reply({
                    content: `✅ Geckura Holder Benefits embed sent to ${targetChannel}!`,
                    ephemeral: true
                });
            } catch (err) {
                await interaction.reply({
                    content: `⚠️ Failed to send benefits embed to ${targetChannel}: ${err.message}`,
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                content: pingContent.length > 0 ? pingContent : undefined,
                embeds: [embed],
                components: rows
            });
        }
    }
};
