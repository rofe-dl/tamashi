import { Collection } from 'discord.js';
import path from 'node:path';
import fs from 'node:fs';
import { ICommand } from 'types/command.type';
import logger from './logger';
import { Client } from 'discord.js';

/**
 * Loads the supported commands into the client by reading
 * the filenames and objects from the commands folder
 * @param client Discord client
 */
export function loadCommands(client: Client) {
  // like a HashMap
  client.commands = new Collection<string, ICommand>();

  const foldersPath = path.join(__dirname, '..', 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);

    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith('.ts'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command: ICommand = require(filePath).default;

      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        logger.error(
          new Error(
            `The command at ${filePath} is missing a required "data" or "execute" property.`,
          ),
        );
      }
    }
  }
}
