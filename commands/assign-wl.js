const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to the data file
const dataPath = path.join(__dirname, '..', 'data');
const whitelistPath = path.join(dataPath, 'whitelist-assignments.json');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

// Initialize whitelist assignments file if it doesn't exist
if (!fs.existsSync(whitelistPath)) {
    fs.writeFileSync(whitelistPath, JSON.stringify({ 
        assignments: [],
        games: []
    }, null, 2));
}

// Function to read whitelist assignments
function readAssignments() {
    try {
        return JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
    } catch (error) {
        console.error('Error reading assignments file:', error);
        return { assignments: [], games: [] };
    }
}

// Function to write whitelist assignments
function writeAssignments(assignments) {
    try {
        fs.writeFileSync(whitelistPath, JSON.stringify(assignments, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing assignments file:', error);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assign-wl')
        .setDescription('Assign whitelist role to users who meet requirements (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('level')
                .setDescription('Assign WL to users who reached level 5 or 10')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('The level to check for (5 or 10)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Level 5', value: 5 },
                            { name: 'Level 10', value: 10 }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('invites')
                .setDescription('Assign WL to users who invited 5 or 10 members')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('The number of invites to check for (5 or 10)')
                        .setRequired(true)
                        .addChoices(
                            { name: '5 Invites', value: 5 },
                            { name: '10 Invites', value: 10 }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('game')
                .setDescription('Assign WL to game winners')
                .addStringOption(option =>
                    option.setName('winners')
                        .setDescription('List of winner user IDs separated by commas')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all current whitelist assignments')),

    async execute(interaction, client, config) {
        const subcommand = interaction.options.getSubcommand();
        const assignments = readAssignments();

        // Defer reply for operations that might take time
        if (subcommand !== 'list') {
            await interaction.deferReply({ ephemeral: true });
        }

        try {
            switch (subcommand) {
                case 'level':
                    await handleLevelAssignment(interaction, client, config, assignments);
                    break;
                case 'invites':
                    await handleInvitesAssignment(interaction, client, config, assignments);
                    break;
                case 'game':
                    await handleGameAssignment(interaction, client, config, assignments);
                    break;
                case 'list':
                    await handleListAssignments(interaction, client, config, assignments);
                    break;
            }
        } catch (error) {
            console.error('Error in assign-wl command:', error);
            await interaction.editReply({
                content: 'There was an error processing this command. Please try again.',
                ephemeral: true
            });
        }
    }
};

// Handle level-based whitelist assignment
async function handleLevelAssignment(interaction, client, config, assignments) {
    const level = interaction.options.getInteger('level');
    const guild = interaction.guild;

    // Get the whitelist role
    const whitelistRole = guild.roles.cache.find(role => role.name === 'Whitelist');
    if (!whitelistRole) {
        return await interaction.editReply({
            content: 'Could not find the "Whitelist" role. Please make sure it exists.',
            ephemeral: true
        });
    }

    // In a real implementation, you would fetch users who have reached the specified level
    // This is a placeholder implementation - replace with actual level checking logic
    const eligibleUsers = []; // Replace with actual logic to get users at specified level

    if (eligibleUsers.length === 0) {
        return await interaction.editReply({
            content: `No users found who have reached level ${level}.`,
            ephemeral: true
        });
    }

    // Assign whitelist role to eligible users
    let assignedCount = 0;
    for (const userId of eligibleUsers) {
        try {
            const member = await guild.members.fetch(userId);
            if (!member.roles.cache.has(whitelistRole.id)) {
                await member.roles.add(whitelistRole);
                assignedCount++;

                // Add to assignments log
                assignments.assignments.push({
                    userId: userId,
                    userTag: member.user.tag,
                    type: 'level',
                    value: level,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error(`Error assigning whitelist to user ${userId}:`, error);
        }
    }

    // Save assignments
    writeAssignments(assignments);

    await interaction.editReply({
        content: `Successfully assigned whitelist role to ${assignedCount} users who reached level ${level}.`,
        ephemeral: true
    });
}

// Handle invite-based whitelist assignment
async function handleInvitesAssignment(interaction, client, config, assignments) {
    const inviteCount = interaction.options.getInteger('count');
    const guild = interaction.guild;

    // Get the whitelist role
    const whitelistRole = guild.roles.cache.find(role => role.name === 'Whitelist');
    if (!whitelistRole) {
        return await interaction.editReply({
            content: 'Could not find the "Whitelist" role. Please make sure it exists.',
            ephemeral: true
        });
    }

    // In a real implementation, you would fetch users who have invited the specified number of members
    // This is a placeholder implementation - replace with actual invite checking logic
    const eligibleUsers = []; // Replace with actual logic to get users with specified invite count

    if (eligibleUsers.length === 0) {
        return await interaction.editReply({
            content: `No users found who have invited ${inviteCount} members.`,
            ephemeral: true
        });
    }

    // Assign whitelist role to eligible users
    let assignedCount = 0;
    for (const userId of eligibleUsers) {
        try {
            const member = await guild.members.fetch(userId);
            if (!member.roles.cache.has(whitelistRole.id)) {
                await member.roles.add(whitelistRole);
                assignedCount++;

                // Add to assignments log
                assignments.assignments.push({
                    userId: userId,
                    userTag: member.user.tag,
                    type: 'invites',
                    value: inviteCount,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error(`Error assigning whitelist to user ${userId}:`, error);
        }
    }

    // Save assignments
    writeAssignments(assignments);

    await interaction.editReply({
        content: `Successfully assigned whitelist role to ${assignedCount} users who invited ${inviteCount} members.`,
        ephemeral: true
    });
}

// Handle game-based whitelist assignment
async function handleGameAssignment(interaction, client, config, assignments) {
    const winnersInput = interaction.options.getString('winners');
    const guild = interaction.guild;

    // Get the whitelist role
    const whitelistRole = guild.roles.cache.find(role => role.name === 'Whitelist');
    if (!whitelistRole) {
        return await interaction.editReply({
            content: 'Could not find the "Whitelist" role. Please make sure it exists.',
            ephemeral: true
        });
    }

    // Parse the winner IDs
    const winnerIds = winnersInput.split(',').map(id => id.trim());

    // Assign whitelist role to winners
    let assignedCount = 0;
    const gameWinners = [];

    for (const userId of winnerIds) {
        try {
            const member = await guild.members.fetch(userId);
            if (!member.roles.cache.has(whitelistRole.id)) {
                await member.roles.add(whitelistRole);
                assignedCount++;
            }

            // Add to game winners log
            gameWinners.push({
                userId: userId,
                userTag: member.user.tag,
                timestamp: new Date().toISOString()
            });

            // Add to assignments log
            assignments.assignments.push({
                userId: userId,
                userTag: member.user.tag,
                type: 'game',
                value: 'winner',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Error assigning whitelist to user ${userId}:`, error);
        }
    }

    // Add to games log
    assignments.games.push({
        gameId: Date.now().toString(),
        winners: gameWinners,
        timestamp: new Date().toISOString()
    });

    // Save assignments
    writeAssignments(assignments);

    await interaction.editReply({
        content: `Successfully assigned whitelist role to ${assignedCount} game winners.`,
        ephemeral: true
    });
}

// Handle listing assignments
async function handleListAssignments(interaction, client, config, assignments) {
    const { EmbedBuilder } = require('discord.js');

    // Create embed for assignments
    const embed = new EmbedBuilder()
        .setTitle('🔑 Whitelist Assignments')
        .setColor('#00FF99')
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ 
            text: 'Geckura — Turning Chaos into Flow', 
            iconURL: client.user.displayAvatarURL() 
        })
        .setTimestamp();

    // Add level assignments
    const levelAssignments = assignments.assignments.filter(a => a.type === 'level');
    if (levelAssignments.length > 0) {
        embed.addFields({
            name: 'Level-Based Assignments',
            value: levelAssignments.slice(0, 10).map(a => `• ${a.userTag} (Level ${a.value})`).join('\n') + 
                  (levelAssignments.length > 10 ? `\n...and ${levelAssignments.length - 10} more` : ''),
            inline: false
        });
    }

    // Add invite assignments
    const inviteAssignments = assignments.assignments.filter(a => a.type === 'invites');
    if (inviteAssignments.length > 0) {
        embed.addFields({
            name: 'Invite-Based Assignments',
            value: inviteAssignments.slice(0, 10).map(a => `• ${a.userTag} (${a.value} invites)`).join('\n') + 
                  (inviteAssignments.length > 10 ? `\n...and ${inviteAssignments.length - 10} more` : ''),
            inline: false
        });
    }

    // Add game assignments
    const gameAssignments = assignments.assignments.filter(a => a.type === 'game');
    if (gameAssignments.length > 0) {
        embed.addFields({
            name: 'Game-Based Assignments',
            value: gameAssignments.slice(0, 10).map(a => `• ${a.userTag}`).join('\n') + 
                  (gameAssignments.length > 10 ? `\n...and ${gameAssignments.length - 10} more` : ''),
            inline: false
        });
    }

    // Add recent games
    if (assignments.games.length > 0) {
        const recentGames = assignments.games.slice(-3).reverse();
        embed.addFields({
            name: 'Recent Games',
            value: recentGames.map(g => {
                const date = new Date(g.timestamp).toLocaleDateString();
                return `• Game on ${date}: ${g.winners.length} winners`;
            }).join('\n'),
            inline: false
        });
    }

    // If no assignments
    if (assignments.assignments.length === 0) {
        embed.setDescription('No whitelist assignments have been made yet.');
    }

    // Add summary
    embed.addFields({
        name: 'Summary',
        value: `Total Whitelist Assignments: ${assignments.assignments.length}\n` +
              `Total Games Conducted: ${assignments.games.length}`,
        inline: false
    });

    await interaction.reply({ embeds: [embed] });
}
