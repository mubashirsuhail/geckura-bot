const { Events, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore messages from bots or DMs
        if (message.author.bot || !message.guild || !message.member) return;

        // Check if user has admin permissions
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        // If not admin and contains a link
        if (!isAdmin && containsLink(message.content)) {
            // Delete the message
            await message.delete();

            // Send warning to general chat
            const warningMessage = await message.channel.send({
                content: `⚠️ Warning: Links are not allowed in this chat. ${message.author}, please refrain from posting links.`
            });

            // Delete warning after 5 seconds
            setTimeout(() => warningMessage.delete(), 5000);
        }
    }
};

// Helper function to check if message contains a link
function containsLink(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
}
