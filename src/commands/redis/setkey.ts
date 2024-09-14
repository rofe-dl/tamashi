import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import RedisClient from 'utils/redis';

export default {
  data: new SlashCommandBuilder()
    .setName('setkey')
    .addStringOption((option) =>
      option
        .setName('key')
        .setDescription('Key whose value you want to set')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('value')
        .setDescription('Value that you want to set')
        .setRequired(true),
    )
    .setDescription(
      'Gets a value from a redis key. This is temporary for testing purposes.',
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const key = interaction.options.getString('key');
    const value = interaction.options.getString('value');
    await RedisClient.getInstance().set(key, value);

    await interaction.reply(`Successfully set: \`${key}\` as \`${value}\`!`);
  },
};
