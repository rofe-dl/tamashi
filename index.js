const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

require('dotenv').config({ path: 'config.env' });
BOT_TOKEN = process.env.BOT_TOKEN;
PREFIX = `>>`;

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', () => {
  console.log('spoti-bot is online!');

  // TODO doesn't work, look into it
  client.user.setActivity('Inbox ">>help" to take a look at all my commands.', {
    type: 'playing',
  });
});

client.on('messageCreate', (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  // gets the words in the command, uses regex to ignore all whitespaces
  const messageArray = message.content.trim().slice(PREFIX.length).split(/ +/);
  const command = messageArray[0].toLowerCase();

  message.channel.send('hey there!');
});

client.login(BOT_TOKEN);
