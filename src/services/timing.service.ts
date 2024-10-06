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
    private readonly desyncWindow   = 5;
    private desyncHistory: number[] = [];
    private resyncReq: boolean      = false;
    private buffer: number[]        = [];
    private readonly bufferlength   = 3;
    private debug                   = false;
    private syncLock                = false;
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
    public async logPlayerTime() {
        if (this.player) {
            let position = this.player.position;
            const lavaLinkRTT = this.player.ping;
            //console.log("LavalinkRtt =", lavaLinkRTT);
            this.measurements.set("player", { timestamp: performance.now(), position: position });
        }
        const desync = this.calculateDesync();
        await this.resync(5000, desync)
        if (desync) this.updateDesyncHistory(desync);
        console.log(desync, this.desyncHistory);
    }
    public calculateDesync(): number | undefined {
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
        return undefined;
    }
    private updateDesyncHistory(desync: number) {
        if(!this.syncLock) {
            this.desyncHistory.push(desync);
            if (this.desyncHistory.length > this.desyncWindow) {
                this.desyncHistory.shift();
            }
        }
    }
    /**
     * Logging interval should be close to spotify sync interval
     */
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
    public async resync(tolerance: number, lastPing?: number) {
        if (this.player && this.desyncHistory.length>2) {
            const average = this.desyncHistory.slice(-3).reduce((acc, val) => acc + val, 0) / 3; 
            // My main goal is to sync the player with the spotify lmao
            // my sub goal is to somehow differentiate between wether the desync is because
            // of the user skipping or the player lagging forward or backwards.
            // need to create a buffer. check if the new desync measurement is close to the 
            // average of the desyncHistory or the buffer. if its closer to the buffer. add it to the buffer.
            // otherwise add it to the desycHistory.
            if (Math.abs(average) > tolerance) {
                const position = this.player.position;
                let newPosition = 0;
                if (lastPing!= null && Math.abs(lastPing) > Math.abs(average)) {
                    newPosition = Math.floor(position - lastPing);
                } else newPosition = Math.floor(position - average);
                console.log(this.measurements.get("spotify"));
                console.log("Current player position:" , position);
                console.log("Resyncing to new position:", newPosition);
                // prolly need to add a buffer to weed out anomalies;
                this.desyncHistory.length = 0;
                this.syncLock = true;
                const start = performance.now();
                await this.player.seekTo(newPosition) 
                const end = performance.now();
                console.log("seek time: ", end - start);
                this.syncLock = false;
            }
        }
    }
}
export const timingService = new TimingService(false);
