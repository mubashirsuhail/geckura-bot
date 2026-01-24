const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('elixir')
        .setDescription('Display Geckura Elixir holder benefits'),

    async execute(interaction, client, config, whitelistData) {
        const embed = new EmbedBuilder()
            .setTitle('🐊 Max, Own & Hold Your Geckura Elixirs! 🐊')
            .setDescription('Level up your Geckura journey—owning Elixirs isn\'t just collecting, it\'s unlocking juicy rewards:')
            .setColor('#9D4EDD')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Add revenue share benefit
        embed.addFields({
            name: '💰 Revenue Share',
            value: 'Earn a cut from the PFP collection. Passive income that scales with the success of Geckura.',
            inline: false
        });

        // Add exclusive utilities benefit
        embed.addFields({
            name: '🛠️ Exclusive Utilities',
            value: 'Unlock perks only for Elixir holders. Get special access to features, tools and experiences.',
            inline: false
        });

        // Add staking benefit
        embed.addFields({
            name: '📈 Geckura Staking',
            value: 'Stake Elixirs and grow your passive income. Watch your assets work for you while you hold.',
            inline: false
        });

        // Add airdrop bonuses benefit
        embed.addFields({
            name: '🎁 Airdrop Bonuses',
            value: 'Get surprise Geckura drops just for holding. Exclusive NFTs and tokens delivered to your wallet.',
            inline: false
        });

        // Add DAO access benefit
        embed.addFields({
            name: '🗳️ DAO Access',
            value: 'Shape the future of Geckura with your vote. Participate in governance decisions and ecosystem development.',
            inline: false
        });

        // Add free PFP collection benefit
        embed.addFields({
            name: '🎨 Free Geckura PFP Collection Mint',
            value: 'Claim your exclusive Geckura PFPs at no cost. Stand out with unique profile pictures from our collection.',
            inline: false
        });

        // Add closing message with call to action
        embed.addFields({
            name: '🔥 Ready to Max Out?',
            value: 'Buy Geckura Elixirs now and enjoy juicy revshare + passive income! 👉 Get yours on [Magic Eden](https://magiceden.io/marketplace/geckura_elixir)',
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    }
};
