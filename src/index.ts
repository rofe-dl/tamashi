import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { token, redis } from './config.json';
import logger from 'utils/logger';
import { loadCommands } from 'utils/loader';
import RedisClient from 'utils/redis';


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const redisUrl = `redis://${redis.host}:${redis.port}`;
const redisInstance = RedisClient.getInstance(redisUrl);

(async () => {
  try {
    // Connect to Redis
    await redisInstance.connect();
    logger.info("Connected to Redis.");

    // triggers client.once(ClientReady)
    client.login(token);
  }
  catch (error) {
    logger.error(error);
  }
})();



loadCommands(client);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(
      new Error(`No command matching ${interaction.commandName} was found.`),
    );

    return;
  }

  try {
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