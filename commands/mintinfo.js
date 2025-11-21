const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mintinfo')
        .setDescription('Display mint information and whitelist status'),

    async execute(interaction, client, config, whitelistData) {
        const user = interaction.user;

        // Check if user is whitelisted
        const isWhitelisted = whitelistData.whitelisted.some(entry => entry.discordId === user.id);

        const embed = new EmbedBuilder()
            .setTitle('🧪 Gekura Elixir — The Essence of Innovation')
            .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Add mint details
        embed.addFields(
            {
                name: 'Blockchain',
                value: 'Solana',
                inline: true
            },
            {
                name: 'Total Supply',
                value: '444',
                inline: true
            },
            {
                name: 'Mint Price',
                value: 'Free',
                inline: true
            },
            {
                name: 'Launch Platform',
                value: 'TBA',
                inline: true
            }
        );

        // Add collection description
        embed.addFields(
            {
                name: 'The Elixir Collection',
                value: 'The Elixir Collection embodies the core energy of the Gekura universe — three elemental tiers, each unlocking unique paths of utility and power.',
                inline: false
            }
        );

        // Add elixir tiers
        embed.addFields(
            {
                name: '🌿 Forest Elixir — Mythic Tier (44)',
                value: 'Pure, forest-born energy that grants early AI Agent access and priority ecosystem benefits.',
                inline: false
            },
            {
                name: '☀️ Sun Elixir — Solar Tier',
                value: 'Forged from heat, light, and solar fire — providing early whitelist access, collab perks, and staking advantages.',
                inline: false
            },
            {
                name: '🌌 Space Elixir — Cosmic Tier',
                value: 'Cosmic, deep-space energy — unlocking staking access, exclusive rewards, and surprise drops.',
                inline: false
            }
        );

        // Add main collection info
        embed.addFields(
            {
                name: '🐸 Gekura Official Collection',
                value: 'Supply: 1111 Gekura\nA universe of collectibles, each crafted with lore, utility, and long-term value.',
                inline: false
            }
        );

        // Add whitelist status
        if (isWhitelisted) {
            const userEntry = whitelistData.whitelisted.find(entry => entry.discordId === user.id);
            embed.addFields(
                {
                    name: '✅ Your Whitelist Status',
                    value: 'You are whitelisted for the mint!',
                    inline: false
                },
                {
                    name: '💳 Registered Wallet',
                    value: `\`${userEntry.wallet.substring(0, 10)}...${userEntry.wallet.substring(userEntry.wallet.length - 10)}\``,
                    inline: false
                }
            );
        } else {
            embed.addFields(
                {
                    name: '❌ Your Whitelist Status',
                    value: 'You are not currently whitelisted for the mint.',
                    inline: false
                },
                {
                    name: '🎯 How to Get Whitelisted',
                    value: 'Participate in community events, contests, and giveaways to secure your whitelist spot!',
                    inline: false
                }
            );
        }

        // Add mint site link
        embed.addFields(
            {
                name: '🔗 Mint Site',
                value: `[Mint Site](${config.links.mintSite})`,
                inline: false
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};