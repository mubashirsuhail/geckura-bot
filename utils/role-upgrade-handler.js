const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Handles congratulating users when they get WL or OG roles and prompts them to submit their wallet
 * @param {Object} oldMember - The member before the role update
 * @param {Object} newMember - The member after the role update
 * @param {Object} client - The Discord client
 * @param {Object} config - The bot configuration
 */
async function handleRoleUpgrade(oldMember, newMember, client, config) {
    // Get the roles that were added
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

    // Check if any of the added roles are WL or OG
    const wlRole = addedRoles.find(role => role.name.toLowerCase() === 'whitelist');
    const ogRole = addedRoles.find(role => role.name.toLowerCase() === 'og');

    // If neither WL nor OG role was added, do nothing
    if (!wlRole && !ogRole) return;

    // Determine which role was added
    const roleType = wlRole ? 'Whitelist' : 'OG';
    const roleEmoji = wlRole ? '🔑' : '👑';
    const customId = wlRole ? 'submit_whitelist_wallet' : 'submit_og_wallet';
    const buttonLabel = wlRole ? '🔑 Submit Whitelist Wallet' : '👑 Submit OG Wallet';
    const buttonStyle = wlRole ? ButtonStyle.Primary : ButtonStyle.Secondary;

    try {
        // Create the congratulatory embed
        const embed = new EmbedBuilder()
            .setTitle(`${roleEmoji} Congratulations!`)
            .setDescription(`You've been granted the **${roleType}** role! 🎉`)
            .setColor('#00FF99')
            .setThumbnail(newMember.user.displayAvatarURL())
            .addFields(
                {
                    name: `What's Next?`,
                    value: `To ensure you receive all the benefits of your ${roleType} status, please submit your Solana wallet address. This will allow us to verify your eligibility and grant you access to exclusive features.`,
                    inline: false
                },
                {
                    name: `${roleType} Benefits`,
                    value: wlRole ? 
                        '• Guaranteed mint spots\n• Early access to new features\n• Exclusive community channels' :
                        '• All Whitelist benefits\n• Special recognition\n• Additional perks & rewards',
                    inline: false
                }
            )
            .setFooter({ text: 'GeckAura — Where Innovation Meets Utility!', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Create the wallet submission button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(customId)
                    .setLabel(buttonLabel)
                    .setStyle(buttonStyle)
                    .setEmoji(roleEmoji)
            );

        // Always post in the general channel instead of DM
        // Find the general channel by name
        const channel = newMember.guild.channels.cache.find(
            ch => ch.name === "general"
        );
        if (channel) {
            // Create a public congratulatory message
            await channel.send({
                content: `🎉 Congratulations ${newMember.toString()} on receiving the **${roleType}** role! 🎉\n\nDon't forget to submit your wallet address using the button below!`,
                embeds: [embed],
                components: [row]
            });
        }
    } catch (error) {
        console.error(`Error handling role upgrade for user ${newMember.user.tag}:`, error);
    }
}

module.exports = { handleRoleUpgrade };
