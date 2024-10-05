import { Player } from 'shoukaku';


class TimingService{
   private player?: Player;
   private measurements: Map<string, { timestamp: number; position: number }>;
   private playerIntervalId?: NodeJS.Timeout;
   private serviceIntervalId?: NodeJS.Timeout;
   constructor() {
       this.measurements = new Map();
       this.logPlayerTime = this.logPlayerTime.bind(this);
   }
   public setPlayer(player: Player) {
       this.player = player;
       this.startPlayerLogging(1000);
   }
   public logSpotifyTime(timestamp: number, position: number) {
       // remember to account for network RTT
       this.measurements.set("spotify", { timestamp: timestamp, position: position });
   }
   public logPlayerTime() {
       if(this.player) {
           const position = this.player.position;
           this.measurements.set("player", { timestamp: performance.now(), position: position });
       }
       const desync = this.calculateDesync();
       console.log("logging desync:", desync);
   }
   public calculateDesync(): number {
       if(this.measurements.has("spotify") && this.measurements.has("player")) {
           const playerPos  = this.measurements.get("player"); 
           const spotifyPos = this.measurements.get("spotify"); 
           // need to truncate the timestamp to a whole number
           if(playerPos && spotifyPos) {
               // account for difference between when the measurements where taken
               const sourceTimeDiff = Math.round(playerPos.timestamp - spotifyPos.timestamp);
               console.log("printing source time diff", sourceTimeDiff);
               const desync = playerPos.position - spotifyPos.position - sourceTimeDiff;
               this.measurements.clear();
               return desync;
           } 
       } 
       return 0;
   }
   public startPlayerLogging(interval: number) {
       this.serviceIntervalId = setInterval(this.logPlayerTime, interval);
   }
}
export const timingService = new TimingService();
