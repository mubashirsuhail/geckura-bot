const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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
        .setName('check-wallet')
        .setDescription('Check wallet submission by username (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check wallet for')
                .setRequired(true)),

    async execute(interaction) {
        // Get the user from the command options
        const user = interaction.options.getUser('user');

        // Defer reply as this might take a moment
        await interaction.deferReply({ ephemeral: true });

        // Read wallets data
        const wallets = readWallets();

        // Find the user in whitelist
        const wlEntry = wallets.whitelist.find(entry => entry.discordId === user.id);

        // Find the user in OG
        const ogEntry = wallets.og.find(entry => entry.discordId === user.id);

        // Create the response embed
        const embed = new EmbedBuilder()
            .setTitle('💼 Wallet Submission Check')
            .setThumbnail(user.displayAvatarURL())
            .setColor('#00FF99')
            .setFooter({ text: 'GeckAura — Where Innovation Meets Utility!', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Check if user has any wallet submissions
        if (!wlEntry && !ogEntry) {
            embed.setDescription(`No wallet submissions found for **${user.tag}**.`)
                .setColor('#FF9900');
        } else {
            // Add whitelist info if available
            if (wlEntry) {
                embed.addFields({
                    name: '🔑 Whitelist Wallet',
                    value: `**Address:** \`${wlEntry.walletAddress}\`
**Submitted:** ${new Date(wlEntry.timestamp).toLocaleString()}`,
                    inline: false
                });
            }

            // Add OG info if available
            if (ogEntry) {
                embed.addFields({
                    name: '👑 OG Wallet',
                    value: `**Address:** \`${ogEntry.walletAddress}\`
**Submitted:** ${new Date(ogEntry.timestamp).toLocaleString()}`,
                    inline: false
                });
            }
        }

        // Send the response
        await interaction.editReply({ embeds: [embed] });
    }
};
