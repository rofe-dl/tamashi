import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import RedisClient from 'utils/redis';

export default {
  data: new SlashCommandBuilder()
    .setName('getkey')
    .addStringOption((option) =>
      option
        .setName('key')
        .setDescription('Key whose value you want to retrieve')
        .setRequired(true),
    )
    .setDescription(
      'Gets a value from a redis key. This is temporary for testing purposes.',
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const value = await RedisClient.getInstance().get(
      interaction.options.getString('key') || null,
    );

    if (!value) await interaction.reply("It don't exist fam :((");
    else await interaction.reply(`\`${value}\``);
  },
};
