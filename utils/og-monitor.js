const fs = require('fs');
const path = require('path');

// Path to data files
const dataPath = path.join(__dirname, '..', 'data');
const walletsPath = path.join(dataPath, 'wallets.json');
const ogAssignmentsPath = path.join(dataPath, 'og-assignments.json');

// Function to read wallets from file
function readWallets() {
    try {
        return JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
    } catch (error) {
        console.error('Error reading wallets file:', error);
        return { whitelist: [], og: [] };
    }
}

// Function to read OG assignments
function readOGAssignments() {
    try {
        return JSON.parse(fs.readFileSync(ogAssignmentsPath, 'utf8'));
    } catch (error) {
        console.error('Error reading OG assignments:', error);
        return { assignments: [] };
    }
}

// Function to write OG assignments
function writeOGAssignments(assignments) {
    try {
        fs.writeFileSync(ogAssignmentsPath, JSON.stringify(assignments, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing OG assignments:', error);
        return false;
    }
}

// Function to check if user already has OG assignment
function hasOGAssignment(assignments, userId) {
    return assignments.assignments.some(a => a.userId === userId);
}

// Main function to verify and assign OG status
async function verifyAndAssignOG(client, config) {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
        console.error('Guild not found in config');
        return;
    }

    // Get the OG role
    const ogRoleId = '1438228652579094679';
    const ogRole = guild.roles.cache.get(ogRoleId);
    if (!ogRole) {
        console.error('OG role not found');
        return;
    }

    // Get the booster role
    const boosterRoleId = '1438228652579094679'; // Replace with actual Server Booster role ID
    const boosterRole = guild.roles.cache.get(boosterRoleId);

    // Get current OG assignments
    const assignments = readOGAssignments();

    // Get current wallet submissions
    const wallets = readWallets();

    // Process OG wallet submissions
    for (const submission of wallets.og) {
        if (hasOGAssignment(assignments, submission.discordId)) {
            continue; // Skip if already processed
        }

        try {
            const member = await guild.members.fetch(submission.discordId);
            if (!member) {
                console.log(`User ${submission.discordId} not found in server`);
                continue;
            }

            // Check if user qualifies for OG status
            let qualifies = false;
            let reason = '';

            // Check if user is a server booster
            if (boosterRole && member.roles.cache.has(boosterRole.id)) {
                qualifies = true;
                reason = 'Server Booster';
            }

            // Check if user is an early member (joined within first month of server creation)
            const joinDate = member.joinedAt;
            const serverCreationDate = guild.createdAt;
            const oneMonthAfterCreation = new Date(serverCreationDate);
            oneMonthAfterCreation.setMonth(oneMonthAfterCreation.getMonth() + 1);

            if (joinDate < oneMonthAfterCreation) {
                qualifies = true;
                reason = 'Early Member';
            }

            // Check if user has admin or moderator roles
            const adminRoleId = '1438228652579094679'; // Replace with actual Admin role ID
            const modRoleId = '1438228652579094679'; // Replace with actual Moderator role ID
            const adminRole = guild.roles.cache.get(adminRoleId);
            const modRole = guild.roles.cache.get(modRoleId);

            if ((adminRole && member.roles.cache.has(adminRole.id)) || 
                (modRole && member.roles.cache.has(modRole.id))) {
                qualifies = true;
                reason = 'Staff Member';
            }

            // Assign OG role if qualifies
            if (qualifies) {
                await member.roles.add(ogRole);

                // Add to assignments log
                assignments.assignments.push({
                    userId: submission.discordId,
                    userTag: submission.discordTag,
                    walletAddress: submission.walletAddress,
                    reason: reason,
                    timestamp: new Date().toISOString()
                });

                console.log(`Assigned OG status to ${member.user.tag} (${reason})`);

                // Notify user
                try {
                    await member.send({
                        embeds: [{
                            title: '👑 Congratulations! You\'ve earned OG status!',
                            description: `You\'ve been awarded OG status in the Geckura community for being a ${reason}! Your wallet submission has been verified and approved.`,
                            color: 0xFFD700,
                            fields: [
                                {
                                    name: 'Benefits',
                                    value: '• All Whitelist perks\n• Special recognition\n• Additional rewards\n• Exclusive OG channels',
                                    inline: false
                                }
                            ],
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
            } else {
                // User doesn't qualify for OG status
                console.log(`OG submission from ${member.user.tag} does not qualify for OG status`);

                // Notify user
                try {
                    await member.send({
                        embeds: [{
                            title: 'OG Status Verification',
                            description: 'Thank you for your interest in OG status. After reviewing your submission, we\'ve determined that you don\'t currently meet the criteria for OG status.',
                            color: 0xFF9900,
                            fields: [
                                {
                                    name: 'OG Status Criteria',
                                    value: '• Early members (joined within first month)\n• Server boosters\n• Project partners\n• Special contest winners\n• Staff members',
                                    inline: false
                                },
                                {
                                    name: 'Next Steps',
                                    value: 'You can still earn Whitelist status by reaching Level 5/10, inviting members, or participating in games and contests. Use the `/whitelist` command to learn more.',
                                    inline: false
                                }
                            ],
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
            }
        } catch (error) {
            console.error(`Error processing OG submission for user ${submission.discordId}:`, error);
        }
    }

    // Save assignments
    writeOGAssignments(assignments);
}

// Set up monitoring interval (run every hour)
function startMonitoring(client, config) {
    // Run immediately on start
    verifyAndAssignOG(client, config);

    // Then run every hour
    setInterval(() => {
        verifyAndAssignOG(client, config);
    }, 60 * 60 * 1000); // 1 hour in milliseconds
}

module.exports = {
    startMonitoring,
    verifyAndAssignOG
}
