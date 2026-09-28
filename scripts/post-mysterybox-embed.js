const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();
const config = require('../config.json');

const args = process.argv.slice(2);
const channelId = args[0] || config.channels?.general || '1436744195145597169';
const embedType = (args[1] || 'mysterybox').toLowerCase();

if (!process.env.DISCORD_TOKEN) {
    console.error('Error: DISCORD_TOKEN is missing in .env file.');
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.error(`Could not find channel with ID: ${channelId}`);
            process.exit(1);
        }

        if (embedType === 'ecosystem') {
            const embed = new EmbedBuilder()
                .setTitle('🦎 GECKURA ECOSYSTEM — Power, Rewards & Real Solana Utility')
                .setDescription(
                    'Welcome to **Geckura** — the premier high-utility ecosystem on Solana. ' +
                    'Driven by innovation, gamified utilities, automated revenue sharing, and AI co-pilots.'
                )
                .setColor(parseInt(config.colors?.primary?.replace('#', '') || '00FF99', 16))
                .setThumbnail(client.user.displayAvatarURL())
                .setImage(config.links?.banner || 'https://i.imgur.com/GeckuraBanner.png')
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

            const row = new ActionRowBuilder().addComponents(
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

            await channel.send({ embeds: [embed], components: [row] });
            console.log(`✅ Geckura Ecosystem embed posted successfully in channel: ${channel.name}`);
        } else {
            const embed = new EmbedBuilder()
                .setTitle('🎁 GECKURA MYSTERY BOX UTILITY — Solana Integration for Projects')
                .setDescription(
                    '**Supercharge your project ecosystem with fully automated, gamified Solana Mystery Boxes!**\n\n' +
                    'Provide real utility to your holders, sink native tokens, drive marketplace volume, and automate reward distribution with zero code needed on your end.'
                )
                .setColor(parseInt(config.colors?.primary?.replace('#', '') || '00FF99', 16))
                .setThumbnail('https://i.imgur.com/GeckuraBanner.png')
                .setImage(config.links?.banner || 'https://i.imgur.com/GeckuraBanner.png')
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

            await channel.send({ embeds: [embed], components: [row] });
            console.log(`✅ Mystery Box sales embed posted successfully in channel: ${channel.name}`);
        }

        setTimeout(() => client.destroy(), 1000);
    } catch (err) {
        console.error('Error posting embed:', err);
        process.exit(1);
    }
});

client.login(process.env.DISCORD_TOKEN);
