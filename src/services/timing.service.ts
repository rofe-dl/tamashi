import { Player } from 'shoukaku';

/**
 * Service to measure music player desync between the lavalink node and spotify. 
 * Used for logging and monitoring but can also resync the player.
 * @todo fix desync measurement sometimes varying more than 1-2 seconds. 
 * @todo handle edge cases for resync
 * @todo handle when lavalink track length does not match spotify player.
 * @class 
 */
class TimingService {
    private player?: Player;
    private measurements: Map<string, { timestamp: number; position: number }>;
    private playerIntervalId?: NodeJS.Timeout;
    private serviceIntervalId?: NodeJS.Timeout;
    private readonly desyncWindow = 5;
    private desyncHistory: number[] = [];
    private debug: boolean = false;
    private resyncReq: boolean = false;
    constructor(debug: boolean = false) {
        this.measurements = new Map();
        this.logPlayerTime = this.logPlayerTime.bind(this);
        this.debug = debug;
    }
    public setPlayer(player: Player) {
        this.player = player;
        this.startPlayerLogging(1000);
    }
    public logSpotifyTime(timestamp: number, progress: number, rtt: number) {
        // position is the position returned by the spotify api + RTT/2 
        const position = progress + rtt/2
        this.measurements.set("spotify", { timestamp: timestamp, position: position });
    }
    public logPlayerTime() {
        if (this.player) {
            let position = this.player.position;
            const lavaLinkRTT = this.player.ping;
            //console.log("LavalinkRtt =", lavaLinkRTT);
            this.measurements.set("player", { timestamp: performance.now(), position: position });
        }
        const desync = this.calculateDesync();
        if (desync) this.updateDesyncHistory(desync);
        this.resync(10000)
        console.log(desync, this.desyncHistory);
    }
    public calculateDesync(): number | null {
        if (this.measurements.has("spotify") && this.measurements.has("player")) {
            const playerPos = this.measurements.get("player");
            const spotifyPos = this.measurements.get("spotify");
            // need to truncate the timestamp to a whole number
            if (playerPos && spotifyPos) {
                // account for difference between when the measurements where taken
                const sourceTimeDiff = Math.round(playerPos.timestamp - spotifyPos.timestamp);
                const desync = playerPos.position - spotifyPos.position - sourceTimeDiff;

                if (this.debug) {
                    console.log("[Desync calculation]", {
                        playerPosition: playerPos.position,
                        spotifyPosition: spotifyPos.position,
                        sourceTimeDiff: sourceTimeDiff,
                        desync: desync,
                    });
                }
                this.measurements.clear();
                return desync;
            }
        }
        return null;
    }
    private updateDesyncHistory(desync: number) {
        this.desyncHistory.push(desync);
        if (this.desyncHistory.length > this.desyncWindow) {
            this.desyncHistory.shift();
        }
    }
    public startPlayerLogging(interval: number) {
        this.stopPlayerLogging();
        this.serviceIntervalId = setInterval(this.logPlayerTime, interval);
    }
    public stopPlayerLogging() {
        if(this.serviceIntervalId) clearInterval(this.serviceIntervalId)
    }
    /**
     * Moves the player forward by the average desync if the average of the 
     * last three desync measurements is above the tolerance threshold.
     */
    public async resync(tolerance: number) {
        if (this.player && this.desyncHistory.length>2) {
            const average = this.desyncHistory.slice(-3).reduce((acc, val) => acc + val, 0) / 3; 
            if (Math.abs(average) > tolerance) {
                const position = this.player.position;
                const newPosition = Math.floor(position - average);
                console.log("Current player position:" , position);
                console.log("Resyncing to new position:", newPosition);
                await this.player.seekTo(newPosition) 
            }
        }
    }
}
export const timingService = new TimingService(false);
