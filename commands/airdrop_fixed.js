const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('airdrop')
        .setDescription('Display Geckura airdrop eligibility and maximization guide'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🪂 GECKURA AIRDROP — ELIGIBILITY & MAXIMIZATION GUIDE 🦎')
            .setColor('#9D4EDD')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Geckura — Built for movers, rewarded by the system', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Core Eligibility
        embed.addFields({
            name: '🔑 Core Eligibility',
            value: 'Hold Geckura Elixir → Required for airdrop eligibility → Grants RevShare, bonus rewards, and more → Geckura Elixir holders receive a FREE mint in the Geckura PFP collection\n\nSecondary Market (Elixir): 🔗https://magiceden.io/marketplace/geckura_elixir',
            inline: false
        });

        // PFP Minting
        embed.addFields({
            name: '🖼 Geckura PFP Minting Soon',
            value: 'Mint & Hold a Geckura PFP NFT → Significantly increases airdrop allocation → Snapshot-based rewards',
            inline: false
        });

        // Level System
        embed.addFields({
            name: '⬆️ Level System',
            value: 'Level up to Level 20 → Higher levels = higher airdrop weight → Earn XP through activity and engagement',
            inline: false
        });

        // Community Tasks
        embed.addFields({
            name: '📣 Community Tasks',
            value: '• Raid all official Geckura tweets\n• Engage consistently (likes, reposts, replies)\n• Be active in Discord discussions\n• Participate in community games & events',
            inline: false
        });

        // Collabs & Partnerships
        embed.addFields({
            name: '🤝 Collabs & Partnerships',
            value: '• Bonus rewards from Solana project collaborations\n• Partner campaign participation increases eligibility',
            inline: false
        });

        // Twitter Selection
        embed.addFields({
            name: '🐦 Twitter Selection',
            value: '• Random and merit-based picks from Twitter raids & posts\n• Quality engagement matters — spam does not',
            inline: false
        });

        // Important Notes
        embed.addFields({
            name: '⚠️ Important Notes',
            value: '• Snapshots will be taken periodically\n• Sybil & low-effort farming will be filtered\n• Final airdrop weights are not disclosed',
            inline: false
        });

        // Summary
        embed.addFields({
            name: '✅ Summary',
            value: 'Hold. Mint. Level up. Engage. Raid. Those who contribute to the ecosystem are rewarded.',
            inline: false
        });

        // Send the embed as a reply
        await interaction.reply({ embeds: [embed] });
    }
};