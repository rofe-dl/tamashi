import { REST, Routes } from 'discord.js';
import { clientId, guildId, token, NODE_ENV } from 'config.json';
import logger from 'utils/logger';

const rest = new REST().setToken(token);

if (NODE_ENV === 'production') {
  rest
    .put(Routes.applicationCommands(clientId), { body: [] })
    .then(() => logger.info('Successfully deleted all application commands.'))
    .catch(logger.error);
} else {
  if (!guildId) throw new Error('Guild ID not found in config file');

  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
    .then(() => logger.info('Successfully deleted all guild commands.'))
    .catch(logger.error);
}
