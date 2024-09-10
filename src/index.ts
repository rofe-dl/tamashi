import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { token } from './config.json';
import logger from 'utils/logger';
import { loadCommands } from 'utils/loader';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

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
    logger.info(`Executing ${interaction.commandName}`)
    console.log(`Executing ${interaction.commandName}`)
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

// triggers client.once(ClientReady)
client.login(token);
