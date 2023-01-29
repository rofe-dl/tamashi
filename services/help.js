const fs = require('fs');
const path = require('node:path');

module.exports.printCommands = async (message, client) => {
  let str =
    'You can use a command using either the prefix `>>` or a forward slash `/` to start a command.\n\n';
  const commandFiles = fs
    .readdirSync(path.join(__dirname, '..', 'commands'))
    .filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(__dirname, '..', 'commands', `${file}`));
    let commandName = command.data.name,
      commandDesc = command.data.description;

    if (file === 'play.js') {
      commandDesc +=
        '\n-sp for Spotify, -yt for YouTube, -sc for Soundcloud e.g /play -sp keshi drunk\nSpotify, Deezer, Apple Music and YouTube links are valid.';
    }
    str += `Command: \`/${commandName}\`, \nDescription: \`${commandDesc}\` \n\n`;
  }

  return message.reply({
    content: str,
  });
};
