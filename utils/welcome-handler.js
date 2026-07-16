const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// Path to the data file
const dataPath = path.join(__dirname, '..', 'data');
const welcomePath = path.join(dataPath, 'welcome-config.json');

// Function to read welcome config
function readWelcomeConfig() {
    try {
        return JSON.parse(fs.readFileSync(welcomePath, 'utf8'));
    } catch (error) {
        console.error('Error reading welcome config:', error);
        return {
            enabled: false,
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

        // Removed utilities channel from welcome message

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
        
        // Add sneak peek with channel information
        embed.addFields({
            name: '🔍 Sneak Peek',
            value: `Check out our <#${welcomeConfig.announcementChannelId}> for the latest updates!`,
            inline: false
        });
        
        // Add airdrop information
        embed.addFields({
            name: '🪂 Geckura Airdrop',
            value: `Don\'t miss out on our upcoming airdrop! Check <#${welcomeConfig.announcementChannelId}> for eligibility requirements and sneak peeks!`,
            inline: false
        });
    }

    return embed;
}

// Function to send welcome message
async function sendWelcomeMessage(member, client) {
    // Read welcome config
    const welcomeConfig = readWelcomeConfig();

    // Check if welcome system is enabled
    if (!welcomeConfig.enabled) return;

    // Assign roles after verification
    const welcomeRoleId = welcomeConfig.welcomeRoleId || '1438176728651534356';
    const adminRoleId = '1040680172472516729';
    
    try {
        await member.roles.add(welcomeRoleId);
        console.log(`Assigned welcome role to ${member.user.tag}`);
    } catch (error) {
        console.error('Error assigning welcome role:', error);
    }

    // Check if user is admin
    if (member.roles.cache.has(adminRoleId)) {
        try {
            await member.roles.add(welcomeRoleId);
            console.log(`Assigned welcome role to admin ${member.user.tag}`);
        } catch (error) {
            console.error('Error assigning welcome role to admin:', error);
        }
    }

    // Check if welcome channel is set
    if (!welcomeConfig.welcomeChannelId) return;

    try {
        // Get the welcome channel
        const welcomeChannel = member.guild.channels.cache.get(welcomeConfig.welcomeChannelId);
        if (!welcomeChannel) {
            console.error(`Welcome channel with ID ${welcomeConfig.welcomeChannelId} not found`);
            return;
        }

        // Generate welcome embed
        const welcomeEmbed = generateWelcomeEmbed(member, welcomeConfig, client);

        // Send welcome message with ping
        await welcomeChannel.send({
            content: `Welcome to the server, <@!${member.id}>!`,
            embeds: [welcomeEmbed],
            allowedMentions: {
                users: [member.id],
                parse: []
            }
        });

        console.log(`Sent welcome message to ${member.user.tag}`);
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}

module.exports = {
    sendWelcomeMessage,
    generateWelcomeEmbed
};
