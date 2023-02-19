const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ActivityType,
} = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
const { Shoukaku, Connectors } = require('shoukaku');
const Errors = require('./utils/enums/errors');
const { logError } = require('./utils/logger');
const {
  startScheduledSpotifyCalls,
  unfollow,
} = require('./services/followService');
const mongoose = require('mongoose');
const redis = require('redis');
const RedisCache = require('./utils/redisCache');

require('dotenv').config({ path: 'config.env' });
BOT_TOKEN = process.env.BOT_TOKEN;
PREFIX = `>>`;

function initShoukaku(client) {
  process.stdout.write('Connecting to the Lavalink server...');
  const LAVALINK_HOST =
    process.env.LAVALINK_DOCKER_HOST ?? process.env.LAVALINK_HOST;
  // lavalink setup
  const Nodes = [
    {
      name: 'Lavalink Server',
      url: LAVALINK_HOST + ':' + process.env.LAVALINK_PORT,
      auth: process.env.LAVALINK_PASSWORD,
    },
  ];

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), Nodes);

  shoukaku.on('error', (_, error) => logError(error));
  client.shoukaku = shoukaku;
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
  const REDIS_HOST = process.env.REDIS_DOCKER_HOST ?? process.env.REDIS_HOST;
  const redisClient = redis.createClient({
    url: 'redis://' + REDIS_HOST + ':' + process.env.REDIS_PORT,
    socket: {
      reconnectStrategy: false,
    },
  });

  redisClient.on('error', (err) => logError(err));

  process.stdout.write('Connecting to the Redis server...');
  await redisClient.connect();
  await redisClient.flushAll();

  console.log('Redis Connected & Flushed!');

  return redisClient;
}

async function initDatabase() {
  process.stdout.write('Connecting to MongoDB...');
  mongoose.set('strictQuery', true); // to suppress warning
  await mongoose.connect(process.env.MONGODB_URL);
  console.log('MongoDB Connected!');
}

async function initClient(client) {
  console.log('Initializing the client...');

  initCommands(client);
  initShoukaku(client);

  // gives some for lavalink server to start and download plugins if necessary in 'prod' environment
  await new Promise((resolve) =>
    setTimeout(resolve, process.env.NODE_ENV === 'dev' ? 2 * 1000 : 20 * 1000)
  );

  // triggers client.on('ready') and client.shoukaku.on('ready')
  client.login(BOT_TOKEN);

  // start the other services if Lavalink connected successfully
  client.shoukaku.on('ready', async () => {
    try {
      console.log('Lavalink Connected!');
      await initDatabase();
      client.redis = new RedisCache(await initRedis());
      await initServer();
      startScheduledSpotifyCalls(client);

      console.log('\nTamashi is ONLINE!');
    } catch (error) {
      logError(error);
    }
  });

  client.on('ready', () => {
    client.user.setActivity(
      'Type ">>help" to take a look at all my commands.',
      {
        type: ActivityType.Listening,
      }
    );
  });

  client.on('voiceStateUpdate', async (oldState, newState) => {
    // on forced disconnect, unfollow the currently following user
    if (oldState.channelId && !newState.channelId) {
      if (newState.id === client.user?.id)
        await unfollow(null, client, oldState.guild.id);
    }
  });
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
  try {
    await initClient(client);
  } catch (error) {
    logError(error, false);
  }
})();
