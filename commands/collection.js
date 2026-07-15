const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Helper to read collection config dynamically
function readCollectionConfig() {
    const configPath = path.join(__dirname, '..', 'data', 'collection-config.json');
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error('Error reading collection config:', error);
        return {
            name: "Geckura PFP Collection",
            supply: "666",
            blockchain: "Solana",
            mintPrice: "FREE for Elixir holders",
            mintDate: "Coming Soon",
            banner: "https://i.imgur.com/GeckuraBanner.png",
            about: "The Geckura PFP Collection represents the core identity of our ecosystem.",
            benefits: [],
            roadmap: "",
            whitelistInfo: ""
        };
    }
}

// Generate the overview embed
function generateOverviewEmbed(client, config, collectionConfig) {
    return new EmbedBuilder()
        .setTitle(`🎨 ${collectionConfig.name.toUpperCase()}`)
        .setDescription(collectionConfig.about)
        .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
        .setThumbnail(client.user.displayAvatarURL())
        .setImage(collectionConfig.banner || config.links.banner)
        .addFields(
            { name: '📋 Supply', value: `\`${collectionConfig.supply}\` unique NFTs`, inline: true },
            { name: '⛓️ Blockchain', value: `\`${collectionConfig.blockchain}\``, inline: true },
            { name: '💰 Mint Price', value: `\`${collectionConfig.mintPrice}\``, inline: true },
            { name: '📅 Mint Date', value: `\`${collectionConfig.mintDate}\``, inline: true }
        )
        .setFooter({ text: config.footer, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
}

// Generate the benefits embed
function generateBenefitsEmbed(client, config, collectionConfig) {
    return new EmbedBuilder()
        .setTitle('🎁 HOLDER BENEFITS & UTILITY')
        .setDescription('Holding a Geckura PFP unlocks exclusive privileges across our ecosystem.')
        .setColor(parseInt(config.colors.secondary.replace('#', ''), 16))
        .setThumbnail(client.user.displayAvatarURL())
        .addFields({
            name: '✨ Core Perks',
            value: collectionConfig.benefits.length > 0 ? collectionConfig.benefits.join('\n') : '• Royalty distribution\n• DAO membership\n• Staking access',
            inline: false
        })
        .setFooter({ text: config.footer, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
}

// Generate the roadmap embed
function generateRoadmapEmbed(client, config, collectionConfig) {
    return new EmbedBuilder()
        .setTitle('🗺️ ROADMAP & TOKEN CAMPAIGN')
        .setDescription(collectionConfig.roadmap || 'The PFP Collection is Phase 5 of our roadmap.')
        .setColor(parseInt(config.colors.secondary.replace('#', ''), 16))
        .setThumbnail(client.user.displayAvatarURL())
        .addFields({
            name: '🪂 Airdrop Multiplier',
            value: 'Minting and holding a Geckura PFP NFT significantly weights your allocation for the upcoming **$GECKURA** airdrop. Snapshot cycles will follow the mint.',
            inline: false
        })
        .setFooter({ text: config.footer, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
}

// Generate the whitelist info embed
function generateWhitelistEmbed(client, config, collectionConfig) {
    return new EmbedBuilder()
        .setTitle('🧪 HOW TO GET WHITELIST')
        .setDescription(collectionConfig.whitelistInfo || 'Secure your spot by holding a Geckura Elixir.')
        .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
        .setThumbnail(client.user.displayAvatarURL())
        .addFields({
            name: '🔗 Free Mint Guarantee',
            value: 'Hold **Geckura Elixir** → Claim **FREE mint** in the PFP Collection. You can purchase Elixirs on secondary markets like Magic Eden.',
            inline: false
        })
        .setFooter({ text: config.footer, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
}

// Create action buttons for the embed
function createNavigationButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('pfp_overview')
            .setLabel('Overview')
            .setEmoji('🦎')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('pfp_benefits')
            .setLabel('Benefits')
            .setEmoji('🎁')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('pfp_roadmap')
            .setLabel('Roadmap')
            .setEmoji('🗺️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('pfp_whitelist')
            .setLabel('Whitelist')
            .setEmoji('🧪')
            .setStyle(ButtonStyle.Secondary)
    );
}

// Create links action row
function createLinkButtons(config) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Sacred Web Portal')
            .setURL(config.links.website || 'https://geckura.app')
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setLabel('Mystery Box')
            .setURL(config.links.mysteryBox || 'https://mysterybox.geckura.app/')
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setLabel('Magic Eden Elixir')
            .setURL(config.links.elixirMarket || 'https://magiceden.io/marketplace/geckura_elixir')
            .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
            .setLabel('Mint Site')
            .setURL(config.links.mintSite || 'https://mint.geckura.com')
            .setStyle(ButtonStyle.Link)
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collection')
        .setDescription('Display the Geckura PFP Collection breakdown & utility details'),

    async execute(interaction, client, config) {
        const collectionConfig = readCollectionConfig();
        const embed = generateOverviewEmbed(client, config, collectionConfig);
        const navRow = createNavigationButtons();
        const linkRow = createLinkButtons(config);

        await interaction.reply({
            embeds: [embed],
            components: [navRow, linkRow]
        });
    },

    // Handle interactive button tabs
    async handleButton(interaction, client, config) {
        const collectionConfig = readCollectionConfig();
        let embed;

        switch (interaction.customId) {
            case 'pfp_overview':
                embed = generateOverviewEmbed(client, config, collectionConfig);
                break;
            case 'pfp_benefits':
                embed = generateBenefitsEmbed(client, config, collectionConfig);
                break;
            case 'pfp_roadmap':
                embed = generateRoadmapEmbed(client, config, collectionConfig);
                break;
            case 'pfp_whitelist':
                embed = generateWhitelistEmbed(client, config, collectionConfig);
                break;
            default:
                return;
        }

        const navRow = createNavigationButtons();
        const linkRow = createLinkButtons(config);

        // Update the button styles to highlight the active tab
        navRow.components.forEach(button => {
            if (button.data.custom_id === interaction.customId) {
                button.setStyle(ButtonStyle.Success);
            } else {
                button.setStyle(button.data.custom_id === 'pfp_overview' ? ButtonStyle.Primary : ButtonStyle.Secondary);
            }
        });

        await interaction.update({
            embeds: [embed],
            components: [navRow, linkRow]
        });
    }
};
