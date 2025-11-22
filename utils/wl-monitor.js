const fs = require('fs');
const path = require('path');

// Path to data files
const dataPath = path.join(__dirname, '..', 'data');
const autoWLPath = path.join(dataPath, 'auto-whitelist.json');
const whitelistAssignmentsPath = path.join(dataPath, 'whitelist-assignments.json');

// Function to read auto-whitelist settings
function readAutoWLSettings() {
    try {
        return JSON.parse(fs.readFileSync(autoWLPath, 'utf8'));
    } catch (error) {
        console.error('Error reading auto-wl settings:', error);
        return { enabled: false, criteria: {} };
    }
}

// Function to read whitelist assignments
function readWhitelistAssignments() {
    try {
        return JSON.parse(fs.readFileSync(whitelistAssignmentsPath, 'utf8'));
    } catch (error) {
        console.error('Error reading whitelist assignments:', error);
        return { assignments: [], games: [] };
    }
}

// Function to write whitelist assignments
function writeWhitelistAssignments(assignments) {
    try {
        fs.writeFileSync(whitelistAssignmentsPath, JSON.stringify(assignments, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing whitelist assignments:', error);
        return false;
    }
}

// Function to check if user already has whitelist assignment
function hasWhitelistAssignment(assignments, userId, type, value) {
    return assignments.assignments.some(a => 
        a.userId === userId && a.type === type && a.value === value
    );
}

// Main function to monitor and assign whitelist
async function monitorAndAssignWL(client, config) {
    // Check if auto-whitelist is enabled
    const settings = readAutoWLSettings();
    if (!settings.enabled) return;

    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
        console.error('Guild not found in config');
        return;
    }

    // Get the whitelist role
    const whitelistRoleId = '1438228532546240614';
    const whitelistRole = guild.roles.cache.get(whitelistRoleId);
    if (!whitelistRole) {
        console.error('Whitelist role not found');
        return;
    }

    // Get current assignments
    const assignments = readWhitelistAssignments();

    // In a real implementation, you would:
    // 1. Check user levels and assign whitelist to those reaching level 5 or 10
    // 2. Check user invites and assign whitelist to those with 5 or 10 invites
    // 3. Check game winners and assign whitelist to them

    // Placeholder implementation - replace with actual logic
    // This is where you would integrate with your leveling system, invite tracking, and game management

    // Level 5 checking
    if (settings.criteria.level5) {
        // Get all members with level 5 role
        const level5RoleId = '1438228652579094679'; // Replace with actual Level 5 role ID
        const level5Role = guild.roles.cache.get(level5RoleId);
        if (level5Role) {
            const level5Members = guild.members.cache.filter(member => 
                member.roles.cache.has(level5Role.id) && 
                !member.roles.cache.has(whitelistRole.id)
            );

            for (const [_, member] of level5Members) {
                if (!hasWhitelistAssignment(assignments, member.id, 'level', 5)) {
                    try {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: member.id,
                            userTag: member.user.tag,
                            type: 'level',
                            value: 5,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for reaching level 5`);

                        // Notify user
                        try {
                            await member.send({
                                embeds: [{
                                    title: '🔑 Congratulations! You\'ve earned Whitelist status!',
                                    description: 'You\'ve been awarded Whitelist status for reaching Level 5 in the Geckura community. You can now submit your wallet address using the `/whitelist` command.',
                                    color: 0x00FF99,
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: 'Geckura — Turning Chaos into Flow',
                                        icon_url: client.user.displayAvatarURL()
                                    }
                                }]
                            });
                        } catch (dmError) {
                            console.error(`Could not send DM to ${member.user.tag}:`, dmError);
                        }
                    } catch (error) {
                        console.error(`Error assigning whitelist to user ${member.id}:`, error);
                    }
                }
            }
        }
    }

    // Level 10 checking
    if (settings.criteria.level10) {
        // Get all members with level 10 role
        const level10RoleId = '1438228652579094679'; // Replace with actual Level 10 role ID
        const level10Role = guild.roles.cache.get(level10RoleId);
        if (level10Role) {
            const level10Members = guild.members.cache.filter(member => 
                member.roles.cache.has(level10Role.id) && 
                !member.roles.cache.has(whitelistRole.id)
            );

            for (const [_, member] of level10Members) {
                if (!hasWhitelistAssignment(assignments, member.id, 'level', 10)) {
                    try {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: member.id,
                            userTag: member.user.tag,
                            type: 'level',
                            value: 10,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for reaching level 10`);

                        // Notify user
                        try {
                            await member.send({
                                embeds: [{
                                    title: '🔑 Congratulations! You\'ve earned Whitelist status!',
                                    description: 'You\'ve been awarded Whitelist status for reaching Level 10 in the Geckura community. You can now submit your wallet address using the `/whitelist` command.',
                                    color: 0x00FF99,
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: 'Geckura — Turning Chaos into Flow',
                                        icon_url: client.user.displayAvatarURL()
                                    }
                                }]
                            });
                        } catch (dmError) {
                            console.error(`Could not send DM to ${member.user.tag}:`, dmError);
                        }
                    } catch (error) {
                        console.error(`Error assigning whitelist to user ${member.id}:`, error);
                    }
                }
            }
        }
    }

    // Invite 5 checking
    if (settings.criteria.invites5) {
        // Get all members with inviter role
        const inviter5RoleId = '1438228652579094679'; // Replace with actual Inviter 5 role ID
        const inviter5Role = guild.roles.cache.get(inviter5RoleId);
        if (inviter5Role) {
            const inviter5Members = guild.members.cache.filter(member => 
                member.roles.cache.has(inviter5Role.id) && 
                !member.roles.cache.has(whitelistRole.id)
            );

            for (const [_, member] of inviter5Members) {
                if (!hasWhitelistAssignment(assignments, member.id, 'invites', 5)) {
                    try {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: member.id,
                            userTag: member.user.tag,
                            type: 'invites',
                            value: 5,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for inviting 5 members`);

                        // Notify user
                        try {
                            await member.send({
                                embeds: [{
                                    title: '🔑 Congratulations! You\'ve earned Whitelist status!',
                                    description: 'You\'ve been awarded Whitelist status for inviting 5 members to the Geckura community. You can now submit your wallet address using the `/whitelist` command.',
                                    color: 0x00FF99,
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: 'Geckura — Turning Chaos into Flow',
                                        icon_url: client.user.displayAvatarURL()
                                    }
                                }]
                            });
                        } catch (dmError) {
                            console.error(`Could not send DM to ${member.user.tag}:`, dmError);
                        }
                    } catch (error) {
                        console.error(`Error assigning whitelist to user ${member.id}:`, error);
                    }
                }
            }
        }
    }

    // Invite 10 checking
    if (settings.criteria.invites10) {
        // Get all members with inviter role
        const inviter10RoleId = '1438228652579094679'; // Replace with actual Inviter 10 role ID
        const inviter10Role = guild.roles.cache.get(inviter10RoleId);
        if (inviter10Role) {
            const inviter10Members = guild.members.cache.filter(member => 
                member.roles.cache.has(inviter10Role.id) && 
                !member.roles.cache.has(whitelistRole.id)
            );

            for (const [_, member] of inviter10Members) {
                if (!hasWhitelistAssignment(assignments, member.id, 'invites', 10)) {
                    try {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: member.id,
                            userTag: member.user.tag,
                            type: 'invites',
                            value: 10,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for inviting 10 members`);

                        // Notify user
                        try {
                            await member.send({
                                embeds: [{
                                    title: '🔑 Congratulations! You\'ve earned Whitelist status!',
                                    description: 'You\'ve been awarded Whitelist status for inviting 10 members to the Geckura community. You can now submit your wallet address using the `/whitelist` command.',
                                    color: 0x00FF99,
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: 'Geckura — Turning Chaos into Flow',
                                        icon_url: client.user.displayAvatarURL()
                                    }
                                }]
                            });
                        } catch (dmError) {
                            console.error(`Could not send DM to ${member.user.tag}:`, dmError);
                        }
                    } catch (error) {
                        console.error(`Error assigning whitelist to user ${member.id}:`, error);
                    }
                }
            }
        }
    }

    // Game winners checking
    if (settings.criteria.games) {
        // Get all members with game winner role
        const gameWinnerRole = guild.roles.cache.find(role => role.name === 'Game Winner');
        if (gameWinnerRole) {
            const gameWinnerMembers = guild.members.cache.filter(member => 
                member.roles.cache.has(gameWinnerRole.id) && 
                !member.roles.cache.has(whitelistRole.id)
            );

            for (const [_, member] of gameWinnerMembers) {
                if (!hasWhitelistAssignment(assignments, member.id, 'game', 'winner')) {
                    try {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: member.id,
                            userTag: member.user.tag,
                            type: 'game',
                            value: 'winner',
                            timestamp: new Date().toISOString()
                        });

                        // Add to games log
                        const gameIndex = assignments.games.findIndex(g => g.gameId === 'default');
                        if (gameIndex >= 0) {
                            // Check if user is already in winners list
                            const alreadyWinner = assignments.games[gameIndex].winners.some(
                                w => w.userId === member.id
                            );

                            if (!alreadyWinner) {
                                assignments.games[gameIndex].winners.push({
                                    userId: member.id,
                                    userTag: member.user.tag,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        } else {
                            // Create new game entry
                            assignments.games.push({
                                gameId: 'default',
                                winners: [{
                                    userId: member.id,
                                    userTag: member.user.tag,
                                    timestamp: new Date().toISOString()
                                }],
                                timestamp: new Date().toISOString()
                            });
                        }

                        console.log(`Assigned whitelist to ${member.user.tag} for winning a game`);

                        // Notify user
                        try {
                            await member.send({
                                embeds: [{
                                    title: '🔑 Congratulations! You\'ve earned Whitelist status!',
                                    description: 'You\'ve been awarded Whitelist status for winning a game in the Geckura community. You can now submit your wallet address using the `/whitelist` command.',
                                    color: 0x00FF99,
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                        text: 'Geckura — Turning Chaos into Flow',
                                        icon_url: client.user.displayAvatarURL()
                                    }
                                }]
                            });
                        } catch (dmError) {
                            console.error(`Could not send DM to ${member.user.tag}:`, dmError);
                        }
                    } catch (error) {
                        console.error(`Error assigning whitelist to user ${member.id}:`, error);
                    }
                }
            }
        }
    }

    // Save assignments
    writeWhitelistAssignments(assignments);
}

// Set up monitoring interval (run every hour)
function startMonitoring(client, config) {
    // Run immediately on start
    monitorAndAssignWL(client, config);

    // Then run every hour
    setInterval(() => {
        monitorAndAssignWL(client, config);
    }, 60 * 60 * 1000); // 1 hour in milliseconds
}

module.exports = {
    startMonitoring,
    monitorAndAssignWL
};
