export interface IRedisValue {
  userId: string;
  refreshToken: string;
  accessToken: string;
  trackURL?: string | null;
  isPlaying: boolean;
  voiceChannelId: string;
  textChannelId: string;
  subscription: string;
}
