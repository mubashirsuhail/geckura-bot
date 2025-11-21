const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        .setName('my-wallet')
        .setDescription('Check your submitted wallet addresses'),

    async execute(interaction) {
        // Get the user ID
        const userId = interaction.user.id;

        // Read wallets data
        const wallets = readWallets();

        // Find the user in whitelist
        const wlEntry = wallets.whitelist.find(entry => entry.discordId === userId);

        // Find the user in OG
        const ogEntry = wallets.og.find(entry => entry.discordId === userId);

        // Create the response embed
        const embed = new EmbedBuilder()
            .setTitle('💼 Your Wallet Submissions')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor('#00FF99')
            .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Check if user has any wallet submissions
        if (!wlEntry && !ogEntry) {
            embed.setDescription(`You haven't submitted any wallet addresses yet. Use the \`/whitelist\` command to submit your wallet.`)
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

        // Add instructions to update wallet
        embed.addFields({
            name: '🔄 Need to Update Your Wallet?',
            value: 'If you need to update your wallet address, simply use the `/whitelist` command again with your new wallet address.',
            inline: false
        });

        // Send the response
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};