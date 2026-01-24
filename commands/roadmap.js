const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roadmap')
        .setDescription('Display the Geckura roadmap'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🧭 GECKURA ROADMAP')
            .setColor('#9D4EDD')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Phase 1
        embed.addFields({
            name: '🚀 Phase 1 — Foundation',
            value: 'Social media launch & community building\nOfficial Geckura website launch\nBrand positioning & ecosystem vision reveal',
            inline: false
        });

        // Phase 2
        embed.addFields({
            name: '🤝 Phase 2 — Collabs & Growth',
            value: 'Strategic collaborations & partnerships\nInfluencer, creator & community marketing\nEarly visibility across Web3 platforms',
            inline: false
        });

        // Phase 3
        embed.addFields({
            name: '🧪 Phase 3 — Elixir Launch',
            value: 'FREE Geckura Elixir NFT for early adopters\nWhitelist-based distribution\nEarly supporter recognition',
            inline: false
        });

        // Phase 4
        embed.addFields({
            name: '🔄 Phase 4 — Secondary Market',
            value: 'Geckura Elixir listed on secondary marketplaces\nOpen trading & liquidity\nHolder discovery & ecosystem expansion',
            inline: false
        });

        // Phase 5
        embed.addFields({
            name: '🎨 Phase 5 — PFP & Token Campaign',
            value: 'Geckura PFP Collection launch\n$GECKURA token airdrop campaign\nHolder rewards & ecosystem incentives',
            inline: false
        });

        // Phase 6
        embed.addFields({
            name: '🔒 Phase 6 — Staking & Rewards',
            value: 'NFT staking for Geckura holders\nOngoing airdrops & reward cycles\nLong-term holder incentives',
            inline: false
        });

        // Phase 7
        embed.addFields({
            name: '⚙️ Phase 7 — Ecosystem Utilities',
            value: 'Utility expansion across the Geckura ecosystem\nDAO tooling & governance activation\nContinuous feature & use-case additions',
            inline: false
        });

        // Journey Forward
        embed.addFields({
            name: '🧬 THE JOURNEY FORWARD',
            value: 'Geckura is not a one-time drop — it\'s a living ecosystem. Built with holders. Grown by community. Powered by long-term vision. 🚀',
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    }
};