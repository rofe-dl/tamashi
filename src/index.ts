import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { token, port } from './config.json';
import logger from 'utils/logger';
import { loadCommands } from 'utils/loader';
import RedisClient from 'utils/redis';
import authApp from './auth.server';
import { connectDB } from 'db';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

/**
 * Program and all relevant services start here.
 */
(async () => {
  try {
    // Connect to Redis
    const redisInstance = RedisClient.getInstance();
    await redisInstance.connect();
    await redisInstance.flush();

    // Connect to DB
    await connectDB();

    // Start the server for Spotify authorization
    authApp.listen(port, () => {
      logger.info(`Auth server running on port ${port}`);
    });

    // triggers client.once(ClientReady)
    client.login(token);
  } catch (error) {
    logger.error(error);
  }
})();

loadCommands(client);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(new Error(`No command matching ${interaction.commandName} was found.`));

    return;
  }

  // In case any of the commands ever throw an uncaught error
  try {
    logger.debug(`Executing ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    logger.error(error);

    // if an interaction was already replied to but an error occurred afterwards, we follow up to that interaction
    // otherwise we just reply to it
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'I might have made an oopsies...',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'I might have made an oopsies...',
        ephemeral: true,
      });
    }
  }
});

// when the client is ready, this callback is run only once
client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});
