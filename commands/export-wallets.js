const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
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
        .setName('export-wallets')
        .setDescription('Export Whitelist and OG wallets to a JSON file (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Export Whitelist wallets'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('og')
                .setDescription('Export OG wallets'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Export all wallets')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Acknowledge the command immediately
        await interaction.deferReply({ ephemeral: true });

        // Read wallets from file
        const wallets = readWallets();

        // Get the appropriate wallet list
        let exportData;
        let filename;

        switch (subcommand) {
            case 'whitelist':
                exportData = { 
                    type: 'whitelist',
                    count: wallets.whitelist.length,
                    wallets: wallets.whitelist
                };
                filename = `whitelist_wallets_${new Date().toISOString().slice(0, 10)}.json`;
                break;
            case 'og':
                exportData = { 
                    type: 'og',
                    count: wallets.og.length,
                    wallets: wallets.og
                };
                filename = `og_wallets_${new Date().toISOString().slice(0, 10)}.json`;
                break;
            case 'all':
                exportData = wallets;
                filename = `all_wallets_${new Date().toISOString().slice(0, 10)}.json`;
                break;
        }

        // Create a temporary file
        const tempPath = path.join(dataPath, filename);
        fs.writeFileSync(tempPath, JSON.stringify(exportData, null, 2));

        // Create attachment
        const attachment = new AttachmentBuilder(tempPath, { name: filename });

        // Send the file
        await interaction.editReply({
            content: `Here's the exported wallet data:`,
            files: [attachment]
        });

        // Clean up the temporary file
        setTimeout(() => {
            try {
                fs.unlinkSync(tempPath);
            } catch (error) {
                console.error('Error cleaning up temporary file:', error);
            }
        }, 5000); // Delete after 5 seconds
    }
};
