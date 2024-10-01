import { REST, Routes } from 'discord.js';
import { clientId, token, guildId, NODE_ENV } from 'config.json';
import path from 'node:path';
import fs from 'node:fs';
import logger from 'utils/logger';
import { ICommand } from 'types/command.type';

const commands = [];

// This bit is similar to the loader code to load commands into the client
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.ts'));

  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command: ICommand = require(filePath).default;

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      logger.error(
        new Error(
          `The command at ${filePath} is missing a required "data" or "execute" property.`,
        ),
      );

      process.exit(1);
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(commands);
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    let data: any;

    if (NODE_ENV === 'production' || guildId?.length === 0) {
      data = await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
    } else {
      if (!guildId) throw new Error('Guild ID not found in config file');

      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
    }

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    logger.error(error);
  }
})();
