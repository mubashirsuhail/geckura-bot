const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the data file
const dataPath = path.join(__dirname, '..', 'data');
const welcomePath = path.join(dataPath, 'welcome-config.json');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

// Initialize welcome config file if it doesn't exist
if (!fs.existsSync(welcomePath)) {
    fs.writeFileSync(welcomePath, JSON.stringify({
        enabled: true,
        welcomeChannelId: null,
        welcomeMessage: "Welcome to our server! We're glad to have you here. 🎉",
        showChannels: true,
        announcementChannelId: null,
        utilityChannelId: null,
        roadmapChannelId: null,
        linksChannelId: null,
        welcomeRoleId: null
    }, null, 2));
}

// Function to read welcome config
function readWelcomeConfig() {
    try {
        return JSON.parse(fs.readFileSync(welcomePath, 'utf8'));
    } catch (error) {
        console.error('Error reading welcome config:', error);
        return {
            enabled: true,
            welcomeChannelId: null,
            welcomeMessage: "Welcome to our server! We're glad to have you here. 🎉",
            showChannels: true,
            announcementChannelId: null,
            utilityChannelId: null,
            roadmapChannelId: null,
            linksChannelId: null,
            welcomeRoleId: null
        };
    }
}

// Function to write welcome config
function writeWelcomeConfig(config) {
    try {
        fs.writeFileSync(welcomePath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing welcome config:', error);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-setup')
        .setDescription('Set up the welcome system for new verified users (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('configure')
                .setDescription('Configure the welcome system')
                .addChannelOption(option =>
                    option.setName('welcome-channel')
                        .setDescription('The channel where welcome messages will be sent')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('welcome-message')
                        .setDescription('The custom welcome message')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('show-channels')
                        .setDescription('Whether to show important channels in the welcome message')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('announcement-channel')
                        .setDescription('The announcement channel to highlight')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('utility-channel')
                        .setDescription('The utility channel to highlight')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('roadmap-channel')
                        .setDescription('The roadmap channel to highlight')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('links-channel')
                        .setDescription('The links channel to highlight')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('welcome-role')
                        .setDescription('The role to assign to new members')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable the welcome system'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable the welcome system'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check the current welcome system settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview the welcome message')),

    async execute(interaction, client, config) {
        const subcommand = interaction.options.getSubcommand();
        const welcomeConfig = readWelcomeConfig();

        try {
            switch (subcommand) {
                case 'configure':
                    await handleConfigure(interaction, welcomeConfig);
                    break;
                case 'enable':
                    welcomeConfig.enabled = true;
                    writeWelcomeConfig(welcomeConfig);
                    await interaction.reply({
                        content: '✅ Welcome system has been enabled.',
                        ephemeral: true
                    });
                    break;

                case 'disable':
                    welcomeConfig.enabled = false;
                    writeWelcomeConfig(welcomeConfig);
                    await interaction.reply({
                        content: '❌ Welcome system has been disabled.',
                        ephemeral: true
                    });
                    break;

                case 'status':
                    await handleStatus(interaction, welcomeConfig);
                    break;

                case 'preview':
                    await handlePreview(interaction, welcomeConfig, client);
                    break;
            }
        } catch (error) {
            console.error('Error in welcome-setup command:', error);
            await interaction.reply({
                content: 'There was an error processing this command. Please try again.',
                ephemeral: true
            });
        }
    }
};

// Handle configuration of the welcome system
async function handleConfigure(interaction, welcomeConfig) {
    const welcomeChannel = interaction.options.getChannel('welcome-channel');
    const welcomeMessage = interaction.options.getString('welcome-message');
    const showChannels = interaction.options.getBoolean('show-channels');
    const announcementChannel = interaction.options.getChannel('announcement-channel');
    const utilityChannel = interaction.options.getChannel('utility-channel');
    const roadmapChannel = interaction.options.getChannel('roadmap-channel');
    const linksChannel = interaction.options.getChannel('links-channel');
    const welcomeRole = interaction.options.getRole('welcome-role');

    if (welcomeChannel) welcomeConfig.welcomeChannelId = welcomeChannel.id;
    if (welcomeMessage) welcomeConfig.welcomeMessage = welcomeMessage;
    if (showChannels !== null) welcomeConfig.showChannels = showChannels;
    if (announcementChannel) welcomeConfig.announcementChannelId = announcementChannel.id;
    if (utilityChannel) welcomeConfig.utilityChannelId = utilityChannel.id;
    if (roadmapChannel) welcomeConfig.roadmapChannelId = roadmapChannel.id;
    if (linksChannel) welcomeConfig.linksChannelId = linksChannel.id;
    if (welcomeRole) welcomeConfig.welcomeRoleId = welcomeRole.id;

    writeWelcomeConfig(welcomeConfig);

    await interaction.reply({
        content: '✅ Welcome system has been configured.',
        ephemeral: true
    });
}

// Handle status display
async function handleStatus(interaction, welcomeConfig) {
    const { EmbedBuilder } = require('discord.js');

    const embed = new EmbedBuilder()
        .setTitle('🔧 Welcome System Settings')
        .setColor(welcomeConfig.enabled ? '#00FF99' : '#FF5555')
        .addFields(
            { name: 'Status', value: welcomeConfig.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Show Channels', value: welcomeConfig.showChannels ? '✅ Yes' : '❌ No', inline: true },
            { name: 'Welcome Role', value: welcomeConfig.welcomeRoleId ? `<@&${welcomeConfig.welcomeRoleId}>` : 'Not set', inline: false }
        )
        .setFooter({ 
            text: 'Geckura — Turning Chaos into Flow', 
            iconURL: interaction.client.user.displayAvatarURL() 
        })
        .setTimestamp();

    if (welcomeConfig.welcomeChannelId) {
        const channel = interaction.guild.channels.cache.get(welcomeConfig.welcomeChannelId);
        if (channel) {
            embed.addFields({ name: 'Welcome Channel', value: `<#${channel.id}>`, inline: true });
        }
    }

    if (welcomeConfig.announcementChannelId) {
        const channel = interaction.guild.channels.cache.get(welcomeConfig.announcementChannelId);
        if (channel) {
            embed.addFields({ name: 'Announcement Channel', value: `<#${channel.id}>`, inline: true });
        }
    }

    if (welcomeConfig.utilityChannelId) {
        const channel = interaction.guild.channels.cache.get(welcomeConfig.utilityChannelId);
        if (channel) {
            embed.addFields({ name: 'Utility Channel', value: `<#${channel.id}>`, inline: true });
        }
    }

    if (welcomeConfig.roadmapChannelId) {
        const channel = interaction.guild.channels.cache.get(welcomeConfig.roadmapChannelId);
        if (channel) {
            embed.addFields({ name: 'Roadmap Channel', value: `<#${channel.id}>`, inline: true });
        }
    }

    if (welcomeConfig.linksChannelId) {
        const channel = interaction.guild.channels.cache.get(welcomeConfig.linksChannelId);
        if (channel) {
            embed.addFields({ name: 'Links Channel', value: `<#${channel.id}>`, inline: true });
        }
    }

    if (welcomeConfig.welcomeMessage) {
        embed.addFields({ 
            name: 'Welcome Message', 
            value: welcomeConfig.welcomeMessage.length > 100 
                ? welcomeConfig.welcomeMessage.substring(0, 100) + '...' 
                : welcomeConfig.welcomeMessage,
            inline: false 
        });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Handle preview of welcome message
async function handlePreview(interaction, welcomeConfig, client) {
    // Create a mock member object for preview
    const mockMember = {
        user: interaction.user,
        guild: interaction.guild
    };

    // Generate the welcome embed
    const welcomeEmbed = generateWelcomeEmbed(mockMember, welcomeConfig, client);

    await interaction.reply({
        content: 'Here is a preview of the welcome message:',
        embeds: [welcomeEmbed],
        ephemeral: true
    });
}

// Function to generate welcome embed
function generateWelcomeEmbed(member, welcomeConfig, client) {
    const embed = new EmbedBuilder()
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription(welcomeConfig.welcomeMessage)
        .setColor('#00FF99')
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ 
            text: 'Geckura — Turning Chaos into Flow', 
            iconURL: client.user.displayAvatarURL() 
        })
        .setTimestamp();

    // Add important channels if enabled
    if (welcomeConfig.showChannels) {
        const channels = [];

        if (welcomeConfig.announcementChannelId) {
            channels.push(`📢 **Announcements**: <#${welcomeConfig.announcementChannelId}>`);
        }

        if (welcomeConfig.utilityChannelId) {
            channels.push(`🛠️ **Utilities**: <#${welcomeConfig.utilityChannelId}>`);
        }

        if (welcomeConfig.roadmapChannelId) {
            channels.push(`🗺️ **Roadmap**: <#${welcomeConfig.roadmapChannelId}>`);
        }

        if (welcomeConfig.linksChannelId) {
            channels.push(`🔗 **Important Links**: <#${welcomeConfig.linksChannelId}>`);
        }

        if (channels.length > 0) {
            embed.addFields({
                name: '📍 Important Channels',
                value: channels.join('\n'),
                inline: false
            });
        }
    }

    return embed;
}

// Export the generateWelcomeEmbed function for use in other files
module.exports.generateWelcomeEmbed = generateWelcomeEmbed;
module.exports.readWelcomeConfig = readWelcomeConfig;
