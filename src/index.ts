import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { token, port, lavalink } from './config.json';
import logger from 'utils/logger';
import { loadCommands } from 'utils/loader';
import RedisClient from 'utils/redis';
import authApp from './auth.server';
import { connectDB } from 'db';

import { Connectors, Shoukaku } from 'shoukaku';

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

    await Promise.all([
      redisInstance.flush(),
      connectDB(),
      new Promise((resolve, reject) => {
        authApp.listen(port, () => {
          resolve(logger.info(`Auth server running on port ${port}`));
        });
      }),
    ]);

    // Connect to Lavalink with Shoukaku
    const nodes = [
      {
        name: 'Lavalink Server',
        url: `${process.env.LAVALINK_DOCKER_HOST || lavalink.host}:${lavalink.port}`,
        auth: lavalink.password,
      },
    ];

    client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes);
    client.shoukaku.on('error', (_, err) => logger.error('Shoukaku Error: ', err));
    logger.info('Lavalink connected successfully');

    // triggers client.once(ClientReady)
    client.login(token);
  } catch (error) {
    logger.error(error);
  }
})();

loadCommands(client);

// sets the callback for when a slash command event is triggered
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(
        new Error(`No command matching ${interaction.commandName} was found.`),
      );

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
      if (interaction.deferred) {
        await interaction.editReply({
          content: 'I might have made an oopsies...',
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          content: 'I might have made an oopsies...',
        });
      } else {
        await interaction.reply({
          content: 'I might have made an oopsies...',
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    // TODO: Implement buttons later
  }
});

// when the client is ready, this callback is run only once
client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});
