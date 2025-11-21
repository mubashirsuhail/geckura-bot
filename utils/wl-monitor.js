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
    const whitelistRole = guild.roles.cache.find(role => role.name === 'Whitelist');
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

    // Example for level checking (replace with actual implementation)
    if (settings.criteria.level5) {
        // Get users who have reached level 5
        const level5Users = []; // Replace with actual logic to get level 5 users

        for (const userId of level5Users) {
            if (!hasWhitelistAssignment(assignments, userId, 'level', 5)) {
                try {
                    const member = await guild.members.fetch(userId);
                    if (!member.roles.cache.has(whitelistRole.id)) {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: userId,
                            userTag: member.user.tag,
                            type: 'level',
                            value: 5,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for reaching level 5`);
                    }
                } catch (error) {
                    console.error(`Error assigning whitelist to user ${userId}:`, error);
                }
            }
        }
    }

    // Example for level 10 checking (replace with actual implementation)
    if (settings.criteria.level10) {
        // Get users who have reached level 10
        const level10Users = []; // Replace with actual logic to get level 10 users

        for (const userId of level10Users) {
            if (!hasWhitelistAssignment(assignments, userId, 'level', 10)) {
                try {
                    const member = await guild.members.fetch(userId);
                    if (!member.roles.cache.has(whitelistRole.id)) {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: userId,
                            userTag: member.user.tag,
                            type: 'level',
                            value: 10,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for reaching level 10`);
                    }
                } catch (error) {
                    console.error(`Error assigning whitelist to user ${userId}:`, error);
                }
            }
        }
    }

    // Example for invite checking (replace with actual implementation)
    if (settings.criteria.invites5) {
        // Get users who have invited 5 members
        const invite5Users = []; // Replace with actual logic to get users with 5 invites

        for (const userId of invite5Users) {
            if (!hasWhitelistAssignment(assignments, userId, 'invites', 5)) {
                try {
                    const member = await guild.members.fetch(userId);
                    if (!member.roles.cache.has(whitelistRole.id)) {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: userId,
                            userTag: member.user.tag,
                            type: 'invites',
                            value: 5,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for inviting 5 members`);
                    }
                } catch (error) {
                    console.error(`Error assigning whitelist to user ${userId}:`, error);
                }
            }
        }
    }

    // Example for invite checking (replace with actual implementation)
    if (settings.criteria.invites10) {
        // Get users who have invited 10 members
        const invite10Users = []; // Replace with actual logic to get users with 10 invites

        for (const userId of invite10Users) {
            if (!hasWhitelistAssignment(assignments, userId, 'invites', 10)) {
                try {
                    const member = await guild.members.fetch(userId);
                    if (!member.roles.cache.has(whitelistRole.id)) {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: userId,
                            userTag: member.user.tag,
                            type: 'invites',
                            value: 10,
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for inviting 10 members`);
                    }
                } catch (error) {
                    console.error(`Error assigning whitelist to user ${userId}:`, error);
                }
            }
        }
    }

    // Example for game winners (replace with actual implementation)
    if (settings.criteria.games) {
        // Get recent game winners
        const gameWinners = []; // Replace with actual logic to get game winners

        for (const winner of gameWinners) {
            if (!hasWhitelistAssignment(assignments, winner.userId, 'game', 'winner')) {
                try {
                    const member = await guild.members.fetch(winner.userId);
                    if (!member.roles.cache.has(whitelistRole.id)) {
                        await member.roles.add(whitelistRole);

                        // Add to assignments log
                        assignments.assignments.push({
                            userId: winner.userId,
                            userTag: member.user.tag,
                            type: 'game',
                            value: 'winner',
                            timestamp: new Date().toISOString()
                        });

                        // Add to games log
                        assignments.games.push({
                            gameId: winner.gameId,
                            winners: [{
                                userId: winner.userId,
                                userTag: member.user.tag,
                                timestamp: new Date().toISOString()
                            }],
                            timestamp: new Date().toISOString()
                        });

                        console.log(`Assigned whitelist to ${member.user.tag} for winning a game`);
                    }
                } catch (error) {
                    console.error(`Error assigning whitelist to user ${winner.userId}:`, error);
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
