const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Shows how to earn Whitelist (WL) and OG roles'),

    async execute(interaction) {
        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle('Whitelist & OG Roles')
            .setDescription("Earn prestigious roles in the Geckura community through participation and contribution.")
            .setColor('#00FF99')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🔑 Whitelist (FCFS)',
                    value: 'Secure your spot on a first-come, first-served basis by:\n' +
                        '• Reaching Level 5 or Level 10\n' +
                        '• Inviting members\n' +
                        '• Participating in games, collaborations, and raids\n' +
                        '• Winning special contests',
                    inline: false
                },
                {
                    name: 'Benefits:',
                    value: '• Guaranteed mint spots\n' +
                        '• Early access to new features\n' +
                        '• Exclusive community channels',
                    inline: false
                },
                {
                    name: '👑 OG Status',
                    value: 'Reserved for top contributors:\n' +
                        '• Early members\n' +
                        '• Server boosters\n' +
                        '• Project partners\n' +
                        '• Special contest winners',
                    inline: false
                },
                {
                    name: 'Benefits:',
                    value: '• All Whitelist perks\n' +
                        '• Special recognition\n' +
                        '• Additional rewards',
                    inline: false
                },
                {
                    name: 'How to Submit Your Wallet',
                    value: 'Use the `/wallet submit` command to submit your wallet address for Whitelist or OG status.\n\nYou can check your submitted wallets with `/wallet check`.',
                    inline: false
                }
            )
            .setFooter({ text: 'Geckura — Turning Chaos into Flow', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Send the embed
        await interaction.reply({ embeds: [embed] });
    }
};
