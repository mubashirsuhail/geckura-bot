const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pfp')
        .setDescription('Display Geckura PFP Collection information'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🎨 GECKURA PFP COLLECTION')
            .setColor('#9D4EDD')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Add PFP collection details
        embed.addFields({
            name: '🎨 About the Collection',
            value: 'The Geckura PFP Collection represents the core identity of our ecosystem. Each NFT is crafted with narrative, utility, and long-term value at the center.',
            inline: false
        });

        // Add holder benefits
        embed.addFields({
            name: '🎁 Holder Benefits',
            value: '✅ Free access for Geckura Elixir holders\n✅ Priority distribution for early supporters\n✅ Exclusive holder-only allocation\n✅ 30% royalty revenue share\n✅ DAO membership and voting rights',
            inline: false
        });

        // Add collection details
        embed.addFields({
            name: '📋 Collection Details',
            value: 'Supply: 1111 unique Geckura NFTs\nBlockchain: Solana\nMint Price: Free for Elixir holders\nMint Date: Coming Soon',
            inline: false
        });

        // Add rarity information
        embed.addFields({
            name: '💎 Rarity Tiers',
            value: 'Common: 60%\nUncommon: 25%\nRare: 10%\nEpic: 4%\nLegendary: 1%',
            inline: false
        });

        // Add utility information
        embed.addFields({
            name: '⚙️ Utility & Use Cases',
            value: 'Staking for $GECKURA tokens\nGovernance participation\nAccess to exclusive features\nFuture ecosystem utilities',
            inline: false
        });

        // Add roadmap connection
        embed.addFields({
            name: '🗺️ Roadmap Connection',
            value: 'The PFP Collection is Phase 5 of our roadmap, following the Elixir Launch and Secondary Market phases. It works in tandem with our $GECKURA token campaign.',
            inline: false
        });

        // Add closing message
        embed.addFields({
            name: '🚀 The Evolution Begins Here',
            value: 'The Geckura PFP Collection is not just art — it\'s your key to the ecosystem. Hold the PFP. Claim the rewards. Shape the future.',
            inline: false
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};