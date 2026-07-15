const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Get clientId and guildId from environment variables
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const loadedNames = new Set();
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (loadedNames.has(command.data.name)) {
        console.log(`Skipping duplicate command name "${command.data.name}" from backup file ${file}`);
        continue;
    }
    loadedNames.add(command.data.name);
    console.log(`Loading command: ${command.data.name} from ${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        let data;
        if (guildId) {
            // Register commands for a specific guild (faster for testing)
            data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} guild application (/) commands.`);
        } else {
            // Register global commands (takes up to an hour to propagate)
            data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
            console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
            console.log("Note: Global commands may take up to an hour to propagate to all servers.");
        }
    } catch (error) {
        console.error('Error details:', error.rawError ? JSON.stringify(error.rawError.errors, null, 2) : 'No raw error details');
        console.error(error);
    }
})();
