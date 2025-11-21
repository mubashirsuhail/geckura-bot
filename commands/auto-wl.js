const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the data file
const dataPath = path.join(__dirname, '..', 'data');
const autoWLPath = path.join(dataPath, 'auto-whitelist.json');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

// Initialize auto-whitelist settings file if it doesn't exist
if (!fs.existsSync(autoWLPath)) {
    fs.writeFileSync(autoWLPath, JSON.stringify({
        enabled: false,
        criteria: {
            level5: true,
            level10: true,
            invites5: true,
            invites10: true,
            games: true
        }
    }, null, 2));
}

// Function to read auto-whitelist settings
function readAutoWLSettings() {
    try {
        return JSON.parse(fs.readFileSync(autoWLPath, 'utf8'));
    } catch (error) {
        console.error('Error reading auto-wl settings:', error);
        return {
            enabled: false,
            criteria: {
                level5: true,
                level10: true,
                invites5: true,
                invites10: true,
                games: true
            }
        };
    }
}

// Function to write auto-whitelist settings
function writeAutoWLSettings(settings) {
    try {
        fs.writeFileSync(autoWLPath, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing auto-wl settings:', error);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auto-wl')
        .setDescription('Manage automatic whitelist assignment settings (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable automatic whitelist assignment'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable automatic whitelist assignment'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('configure')
                .setDescription('Configure which criteria should trigger automatic whitelist')
                .addBooleanOption(option =>
                    option.setName('level5')
                        .setDescription('Assign whitelist when users reach level 5')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('level10')
                        .setDescription('Assign whitelist when users reach level 10')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('invites5')
                        .setDescription('Assign whitelist when users invite 5 members')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('invites10')
                        .setDescription('Assign whitelist when users invite 10 members')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('games')
                        .setDescription('Assign whitelist to game winners')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check the current auto-whitelist settings')),

    async execute(interaction, client, config) {
        const subcommand = interaction.options.getSubcommand();
        const settings = readAutoWLSettings();

        try {
            switch (subcommand) {
                case 'enable':
                    settings.enabled = true;
                    writeAutoWLSettings(settings);
                    await interaction.reply({
                        content: '✅ Automatic whitelist assignment has been enabled.',
                        ephemeral: true
                    });
                    break;

                case 'disable':
                    settings.enabled = false;
                    writeAutoWLSettings(settings);
                    await interaction.reply({
                        content: '❌ Automatic whitelist assignment has been disabled.',
                        ephemeral: true
                    });
                    break;

                case 'configure':
                    const level5 = interaction.options.getBoolean('level5');
                    const level10 = interaction.options.getBoolean('level10');
                    const invites5 = interaction.options.getBoolean('invites5');
                    const invites10 = interaction.options.getBoolean('invites10');
                    const games = interaction.options.getBoolean('games');

                    if (level5 !== null) settings.criteria.level5 = level5;
                    if (level10 !== null) settings.criteria.level10 = level10;
                    if (invites5 !== null) settings.criteria.invites5 = invites5;
                    if (invites10 !== null) settings.criteria.invites10 = invites10;
                    if (games !== null) settings.criteria.games = games;

                    writeAutoWLSettings(settings);
                    await interaction.reply({
                        content: '✅ Auto-whitelist criteria have been updated.',
                        ephemeral: true
                    });
                    break;

                case 'status':
                    const { EmbedBuilder } = require('discord.js');
                    const embed = new EmbedBuilder()
                        .setTitle('🔧 Auto-Whitelist Settings')
                        .setColor(settings.enabled ? '#00FF99' : '#FF5555')
                        .setThumbnail(client.user.displayAvatarURL())
                        .addFields(
                            { name: 'Status', value: settings.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                            { name: 'Level 5', value: settings.criteria.level5 ? '✅ Enabled' : '❌ Disabled', inline: true },
                            { name: 'Level 10', value: settings.criteria.level10 ? '✅ Enabled' : '❌ Disabled', inline: true },
                            { name: '5 Invites', value: settings.criteria.invites5 ? '✅ Enabled' : '❌ Disabled', inline: true },
                            { name: '10 Invites', value: settings.criteria.invites10 ? '✅ Enabled' : '❌ Disabled', inline: true },
                            { name: 'Game Winners', value: settings.criteria.games ? '✅ Enabled' : '❌ Disabled', inline: true }
                        )
                        .setFooter({ 
                            text: 'Geckura — Turning Chaos into Flow', 
                            iconURL: client.user.displayAvatarURL() 
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
            }
        } catch (error) {
            console.error('Error in auto-wl command:', error);
            await interaction.reply({
                content: 'There was an error processing this command. Please try again.',
                ephemeral: true
            });
        }
    }
};
