import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { IRedisValue } from 'types/redis.type';
import logger from 'utils/logger';
import RedisClient from 'utils/redis';

export default {
  data: new SlashCommandBuilder()
    .setName('followwho')
    .setDescription('Mentions the person who is being followed'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const redisValue = await RedisClient.getInstance().get(interaction.guildId);

    if (!redisValue) {
      await interaction.reply({
        content: 'I am a lonely bot. I have no master.',
      });

      return;
    }

    const data = JSON.parse(redisValue) as IRedisValue;

    await interaction.reply(`<@${data.userId}> has the AUX at the moment`);
  },
};
