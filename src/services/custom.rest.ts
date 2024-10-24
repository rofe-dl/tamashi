import { Rest }from "shoukaku"
import { LavalinkPlayer, UpdatePlayerInfo } from "shoukaku";

export class CustomRest extends Rest {
    /**
     * Updates a Lavalink player
     * @param data SessionId from Discord
     * @returns Promise that resolves to a Lavalink player
     */
	public updateQPlayer(data: UpdatePlayerInfo): Promise<LavalinkPlayer | undefined> {
		const options = {
			endpoint: `/sessions/${this.sessionId}/qplayers/${data.guildId}`,
			options: {
				method: 'PATCH',
				params: { noReplace: data.noReplace?.toString() ?? 'false' },
				headers: { 'Content-Type': 'application/json' },
				body: data.playerOptions as Record<string, unknown>
			}
		};
		return this.fetch<LavalinkPlayer>(options);
	}
}
