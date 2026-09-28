const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roadmap')
        .setDescription('Display the Geckura roadmap & achieved milestones'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🧭 GECKURA ROADMAP & MILESTONES')
            .setColor(parseInt(config.colors?.secondary?.replace('#', '') || '9D4EDD', 16))
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription('From vision to reality — tracking the evolution and growth of the Geckura ecosystem.')
            .setFooter({ text: config.footer || 'Geckura — Turning Chaos into Flow', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Achieved Phase 1
        embed.addFields({
            name: '✅ Phase 1 — Launch & Socials (ACHIEVED)',
            value: '• Official Geckura Website & Social Media launch\n• Brand positioning & community hub setup\n• Strategic Web3 collabs & partner growth',
            inline: false
        });

        // Achieved Phase 2
        embed.addFields({
            name: '✅ Phase 2 — Core Utilities Launch (ACHIEVED)',
            value: '• Solana Mystery Box utility portal launch\n• Chat2Earn & gamified token distribution\n• White-label utility architecture initialized',
            inline: false
        });

        // Live Mint Phase
        embed.addFields({
            name: '🔥 Phase 3 — Geckura Mint (LIVE NOW)',
            value: '• **Official Geckura Mint is LIVE!**\n• Mint Portal: [launchpad.tribexlabs.xyz/geckura](https://launchpad.tribexlabs.xyz/geckura)',
            inline: false
        });

        // Achieved Phase 4
        embed.addFields({
            name: '✅ Phase 4 — Staking Rewards & Trait Shop (ACHIEVED)',
            value: '• NFT Staking & Aura Level reward systems active\n• Trait Shop (Aura Mods) customization live\n• 40% Secondary royalty revenue share model',
            inline: false
        });

        // Next Phase 5
        embed.addFields({
            name: '⏳ Phase 5 — LP Token Mining & Web3 Games (NEXT)',
            value: '• Geckura LP Token liquidity mining & yield farming\n• Interactive Web3 mini-games & quest rewards\n• Ecosystem token sinks & expanded utility mechanics',
            inline: false
        });

        // Future Phase 6
        embed.addFields({
            name: '🚀 Phase 6 — Ecosystem Expansion (COMING SOON)',
            value: '• B2B White-Label suite scaling for partner projects\n• Alpha DAO & trading tools optimization\n• Continuous utility drops & ecosystem innovations',
            inline: false
        });

        // Journey Forward
        embed.addFields({
            name: '🧬 THE JOURNEY FORWARD',
            value: 'Geckura is not just a drop — it\'s a living Solana ecosystem. Built with holders. Grown by community. Powered by real utility. 🚀',
            inline: false
        });

        // Action Row with Mint Link Button
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
                .setLabel('🎁 Mystery Boxes')
                .setStyle(ButtonStyle.Link)
                .setURL(config.links?.mysteryBox || 'https://mysterybox.geckura.app/')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};