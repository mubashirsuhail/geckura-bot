const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-ranks')
        .setDescription('Reset all user levels to 1 (Admin only)'),

    async execute(interaction) {
        // Check if user is an admin
        if (!interaction.member.permissions.has('Administrator')) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Access Denied')
                .setDescription('You do not have permission to use this command. Only administrators can reset ranks.');

            return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        try {
            // Get the user data file
            const userDataPath = path.join(__dirname, '..', 'data', 'chat2earn-users.json');
            let userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

            let resetCount = 0;

            // Reset all user levels to 1
            for (const userId in userData) {
                if (userData[userId].level > 1) {
                    userData[userId].level = 1;
                    userData[userId].experience = 0;
                    resetCount++;
                }
            }

            // Save the updated data
            fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));

            const successEmbed = new EmbedBuilder()
                .setColor('#9D4EDD')
                .setTitle('✅ Ranks Reset Successfully')
                .setDescription(`Successfully reset ${resetCount} users to level 1.`)
                .setTimestamp()
                .setFooter({ text: 'Geckura — Turning Chaos into Flow' });

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (error) {
            console.error('Error resetting ranks:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription('An error occurred while resetting ranks. Please check the console for details.');

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};
