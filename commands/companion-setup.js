const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Path to configuration
const configPath = path.join(__dirname, '..', 'data', 'companion-config.json');

// Helper to read companion config
function readCompanionConfig() {
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading companion config:', error);
    }
    return {
        enabled: true,
        companionChannelId: null,
        allowedRoleId: null,
        personality: "sage",
        customInstructions: "",
        modelName: "gemini-flash-latest",
        strictProjectScope: true
    };
}

// Helper to write companion config
function writeCompanionConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing companion config:', error);
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('companion-setup')
        .setDescription('Set up the Gemini AI Companion (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('configure')
                .setDescription('Configure companion settings')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable the AI companion'))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Dedicated channel where companion answers all messages without pings'))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Required role to interact with the companion (leave empty for everyone)'))
                .addStringOption(option =>
                    option.setName('personality')
                        .setDescription('The AI companion personality style')
                        .addChoices(
                            { name: 'Sage Gecko (Wise, mystical, welcoming)', value: 'sage' },
                            { name: 'Hype Gecko (Energetic, slang, emoji-heavy)', value: 'hype' },
                            { name: 'Standard Helper (Informative, direct, polite)', value: 'helper' }
                        ))
                .addBooleanOption(option =>
                    option.setName('strict-scope')
                        .setDescription('Restricts responses strictly to the Geckura project only'))
                .addStringOption(option =>
                    option.setName('instructions')
                        .setDescription('Add custom instructions (e.g. key details, temporary announcements)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check current AI companion settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Perform diagnostic API test to check Gemini connection')),

    async execute(interaction, client, config) {
        const subcommand = interaction.options.getSubcommand();
        const companionConfig = readCompanionConfig();

        try {
            if (subcommand === 'configure') {
                const enabled = interaction.options.getBoolean('enabled');
                const channel = interaction.options.getChannel('channel');
                const role = interaction.options.getRole('role');
                const personality = interaction.options.getString('personality');
                const strictScope = interaction.options.getBoolean('strict-scope');
                const instructions = interaction.options.getString('instructions');

                let changes = [];

                if (enabled !== null) {
                    companionConfig.enabled = enabled;
                    changes.push(`Enabled: **${enabled ? 'Yes' : 'No'}**`);
                }
                if (channel !== null) {
                    companionConfig.companionChannelId = channel ? channel.id : null;
                    changes.push(`Channel: ${channel ? `<#${channel.id}>` : '**None** (Pings only)'}`);
                }
                if (interaction.options.get('role') !== null) {
                    companionConfig.allowedRoleId = role ? role.id : null;
                    changes.push(`Required Role: ${role ? `<@&${role.id}>` : '**Everyone (No Role Required)**'}`);
                }
                if (personality !== null) {
                    companionConfig.personality = personality;
                    changes.push(`Personality: **${personality.toUpperCase()}**`);
                }
                if (strictScope !== null) {
                    companionConfig.strictProjectScope = strictScope;
                    changes.push(`Strict Scope: **${strictScope ? 'Yes' : 'No'}**`);
                }
                if (instructions !== null) {
                    companionConfig.customInstructions = instructions;
                    changes.push(`Custom Instructions updated`);
                }

                if (changes.length === 0) {
                    return await interaction.reply({
                        content: '⚠️ No configuration changes were specified. Use the options to change settings.',
                        ephemeral: true
                    });
                }

                writeCompanionConfig(companionConfig);

                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Companion Configuration Updated')
                    .setColor(parseInt(config.colors.primary.replace('#', ''), 16))
                    .setDescription(`The following settings have been updated:\n\n${changes.map(c => `• ${c}`).join('\n')}`)
                    .setFooter({ text: config.footer, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'status') {
                const embed = new EmbedBuilder()
                    .setTitle('🦎 AI Companion Settings Status')
                    .setColor(companionConfig.enabled ? 0x00FF99 : 0xFF5555)
                    .setThumbnail(client.user.displayAvatarURL())
                    .addFields(
                        { name: 'Status', value: companionConfig.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Personality', value: `\`${companionConfig.personality.toUpperCase()}\``, inline: true },
                        { name: 'Strict Project Scope', value: companionConfig.strictProjectScope ? '🔒 Strict' : '🌐 Open', inline: true },
                        { name: 'Dedicated Channel', value: companionConfig.companionChannelId ? `<#${companionConfig.companionChannelId}>` : 'None (Responds only to pings/mentions)', inline: false },
                        { name: 'Required Role', value: companionConfig.allowedRoleId ? `<@&${companionConfig.allowedRoleId}>` : 'Everyone (No Role Required)', inline: true },
                        { name: 'Model Name', value: `\`${companionConfig.modelName || 'gemini-flash-latest'}\``, inline: true },
                        { name: 'Gemini API Key Loaded', value: process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing from .env', inline: true },
                        { name: 'Custom Instructions', value: companionConfig.customInstructions || '*None*', inline: false }
                    )
                    .setFooter({ text: config.footer, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'test') {
                await interaction.deferReply({ ephemeral: true });

                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                    return await interaction.editReply({
                        content: '❌ **API Test Failed:** No `GEMINI_API_KEY` was found in your `.env` file.'
                    });
                }

                const model = companionConfig.modelName || 'gemini-flash-latest';
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: 'Respond with the word "AURAACTIVE" only.' }] }]
                        })
                    });

                    if (!response.ok) {
                        const err = await response.text();
                        return await interaction.editReply({
                            content: `❌ **API Test Failed:** Gemini returned an error status **${response.status}**:\n\`\`\`json\n${err}\n\`\`\``
                        });
                    }

                    const data = await response.json();
                    const reply = data.candidates[0].content.parts[0].text.trim();

                    const embed = new EmbedBuilder()
                        .setTitle('✅ AI Companion Connection Success')
                        .setColor(0x00FF99)
                        .setDescription(`Connection to Google Gemini API is **active and verified**!`)
                        .addFields(
                            { name: 'Active Model', value: `\`${model}\``, inline: true },
                            { name: 'Test Response Received', value: `\`${reply}\``, inline: true }
                        )
                        .setFooter({ text: config.footer, iconURL: client.user.displayAvatarURL() })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });

                } catch (err) {
                    console.error('Test API error:', err);
                    await interaction.editReply({
                        content: `❌ **API Test Failed:** A network error occurred while contacting Gemini:\n\`${err.message}\``
                    });
                }
            }
        } catch (error) {
            console.error('Error in companion-setup execution:', error);
            await interaction.reply({
                content: '⚠️ An error occurred while executing the setup subcommand. Please try again.',
                ephemeral: true
            });
        }
    }
};
