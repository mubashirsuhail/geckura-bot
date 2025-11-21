const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the data file
const dataPath = path.join(__dirname, '..', 'data');
const walletsPath = path.join(dataPath, 'wallets.json');

// Function to read wallets from file
function readWallets() {
    try {
        return JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
    } catch (error) {
        console.error('Error reading wallets file:', error);
        return { whitelist: [], og: [] };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallets')
        .setDescription('View all submitted Whitelist and OG wallets (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('View all Whitelist wallet submissions'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('og')
                .setDescription('View all OG wallet submissions')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Read wallets from file
        const wallets = readWallets();

        // Get the appropriate wallet list
        const walletList = subcommand === 'whitelist' ? wallets.whitelist : wallets.og;
        const roleType = subcommand === 'whitelist' ? 'Whitelist' : 'OG';
        const roleEmoji = subcommand === 'whitelist' ? '🔑' : '👑';

        // If no wallets submitted
        if (walletList.length === 0) {
            await interaction.reply({
                content: `No ${roleType} wallets have been submitted yet.`,
                ephemeral: true
            });
            return;
        }

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle(`${roleEmoji} ${roleType} Wallet Submissions`)
            .setDescription(`Total ${roleType} submissions: ${walletList.length}`)
            .setColor(roleType === 'whitelist' ? '#00FF99' : '#FFD700')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ 
                text: 'Geckura — Turning Chaos into Flow', 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        // Format wallet data for display
        let walletData = '';
        walletList.forEach((entry, index) => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            walletData += `**${index + 1}.** ${entry.discordTag}
`;
            walletData += `   Wallet: \`${entry.walletAddress}\`
`;
            walletData += `   Submitted: ${date}

`;
        });

        // Check if wallet data is too long for a single embed
        if (walletData.length > 4096) {
            // If too long, split into multiple embeds
            const chunks = walletData.match(/.{1,4096}/g) || [];

            await interaction.reply({ embeds: [embed.setDescription(embed.description + ` (Page 1/${chunks.length})`)] });

            for (let i = 1; i < chunks.length; i++) {
                const pageEmbed = new EmbedBuilder()
                    .setTitle(`${roleEmoji} ${roleType} Wallet Submissions (Page ${i+1}/${chunks.length})`)
                    .setDescription(chunks[i])
                    .setColor(roleType === 'whitelist' ? '#00FF99' : '#FFD700')
                    .setFooter({ 
                        text: 'Geckura — Turning Chaos into Flow', 
                        iconURL: interaction.client.user.displayAvatarURL() 
                    })
                    .setTimestamp();

                await interaction.followUp({ embeds: [pageEmbed] });
            }
        } else {
            // If fits in one embed
            embed.addFields({ name: 'Submissions', value: walletData });
            await interaction.reply({ embeds: [embed] });
        }
    }
};
