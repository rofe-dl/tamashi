const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
const { Shoukaku, Connectors } = require('shoukaku');
const Errors = require('./utils/enums/errors');
const { logError } = require('./utils/errorlogger');
const { SpotifyBotAPI } = require('./api/spotify/botAPI');
const mongoose = require('mongoose');
const redis = require('redis');

require('dotenv').config({ path: 'config.env' });
BOT_TOKEN = process.env.BOT_TOKEN;
PREFIX = `>>`;

function initShoukaku(client) {
  process.stdout.write('Connecting to the Lavalink server...');
  // lavalink setup
  const Nodes = [
    {
      name: 'Lavalink Server',
      url: process.env.LAVALINK_URL,
      auth: process.env.LAVALINK_PASSWORD,
    },
  ];

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);

  shoukaku.on('error', (_, error) => logError(error));
  client.shoukaku = shoukaku;
  console.log('Connected!');
}

function initCommands(client) {
  console.log('Initializing all commands...');

  /* SETS THE LIST OF ALL COMMANDS FROM THE 'commands' FOLDER AS A LIST OF KEY-VALUE PAIRS*/
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
  /*****************/

  // for slash commands
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logError(
        `${interaction.commandName}: ${Errors.COMMAND_NOT_FOUND}`,
        false
      );

      await interaction.reply({
        content: Errors.COMMAND_NOT_FOUND,
        ephemeral: true,
      });

      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logError(error);
      await interaction.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
    }
  });

  // for commands that use the prefix instead of the slash commands
  client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    // gets the words in the command, uses regex to ignore all whitespaces
    const messageArray = message.content
      .trim()
      .slice(PREFIX.length)
      .trim()
      .split(/ +/);

    const commandName = messageArray[0].toLowerCase();
    const args = messageArray.slice(1).join(' ');

    const command = client.commands.get(commandName);

    if (!command) {
      logError(`${commandName}: ${Errors.COMMAND_NOT_FOUND}`, false);
      await message.reply({
        content: Errors.COMMAND_NOT_FOUND,
        ephemeral: true,
      });

      return;
    }

    try {
      await command.executedFromPrefix(message, client, args);
    } catch (error) {
      logError(error);
      await message.reply({
        content: Errors.FRIENDLY_ERROR_MESSAGE,
      });
    }
  });
}

async function initServer() {
  require('./server/index');
}

async function initRedis() {
  const redisClient = redis.createClient({
    url: 'redis://' + process.env.REDIS_URL,
  });

  redisClient.on('error', (err) => logError(err));

  process.stdout.write('Connecting to the Redis server...');
  await redisClient.connect();
  await redisClient.flushAll();

  console.log('Connected & Flushed!');

  return redisClient;
}

async function initDatabase() {
  process.stdout.write('Connecting to MongoDB...');
  mongoose.set('strictQuery', true); // to suppress warning
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected!');
  } catch {
    logError('Could not connect to database!');
  }
}

async function initClient(client) {
  console.log('Initializing the client...');
  client.on('ready', () => {
    // TODO activity setting doesn't work, look into it
    client.user.setActivity(
      'Inbox "/help" to take a look at all my commands.',
      {
        type: 'playing',
      }
    );

    console.log('\nTamashi is ONLINE!');
  });

  initCommands(client);
  initShoukaku(client);
  await initDatabase();
  client.redis = await initRedis();
  await initServer();

  // todo uncomment before deploy
  // await SpotifyBotAPI.generateToken();

  client.login(BOT_TOKEN);
}

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

(async () => {
  await initClient(client);
})();
