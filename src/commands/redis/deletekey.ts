import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import RedisClient from 'utils/redis';

export default {
  data: new SlashCommandBuilder()
    .setName('delkey')
    .addStringOption((option) =>
      option
        .setName('key')
        .setDescription('Key whose value you want to delete')
        .setRequired(true),
    )
    .setDescription(
      'Deletes a redis entry. This is temporary for testing purposes.',
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const key = interaction.options.getString('key') || null;
    await RedisClient.getInstance().delete(key);

    await interaction.reply('Deleted key: ' + `\`${key}\``);
  },
};
