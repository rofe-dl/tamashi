import { Player, Node, Rest, Track, Connection } from "shoukaku";
import { CustomRest } from "./custom.rest";

export class PlayerManager {
    private player: Player | null;
    private qPlayer: Player | null;
    private activePlayer: number;
    private node: Node | null;
    private guildId: string;
    private connection: Connection | undefined;
    private queuedTrack: Track | null;
    public  currentTrackURL: string | null;
    public  queuedTrackURL: string | null;
    // might need to add a current track identifier

    constructor( guildId: string, node: Node, connection?: Connection, ) {
        this.player = null;
        this.currentTrackURL = null;
        this.queuedTrackURL = null;
        this.queuedTrack = null;
        this.qPlayer = new Player(guildId+"0", node);
        this.activePlayer = 0;
        this.node = node ?? null;
        this.guildId = guildId;
        this.connection = connection;
    }
    
    public setConnection(connection: Connection) {
        this.connection = connection;
    }

    public async playTrack(track: Track) {
        if (this.activePlayer === 0) {
            await this.player?.playTrack({ track: { encoded: track.encoded } });
            this.sendVoiceData(0);

            this.player?.on('end', async () => {
                this.player?.clean();
                this.sendVoiceData(1);
                this.switchActivePlayer();
                this.currentTrackURL = this.queuedTrackURL;
                this.queuedTrackURL = null;
                    })
                }
        if (this.activePlayer === 1) {
            if ( this.node?.rest instanceof CustomRest ) {
                this.node?.rest.updateQPlayer({ guildId: this.guildId, playerOptions: 
                                              { track: { encoded: track.encoded} } })
                this.sendVoiceData(1);
            }

            this.player?.on('end', async () => {
                //TODO: have to figure out how to manage event messages for qPlayer
                this.player?.clean();
                // send voice data to the other player to connection
                // which also disconnects the current player
                this.sendVoiceData(0);
                this.switchActivePlayer();
                this.currentTrackURL = this.queuedTrackURL;
                this.queuedTrackURL = null;
                    })
        }
    }
    public refreshQueue() {
    // function to call to keep the lavalink backend from removing tracks from idle players
        if (this.queuedTrack) {
            this.queueTrack(this.queuedTrack);
        }
    }

    public queueTrack(track: Track) {
        this.queuedTrack = track;
        if (this.activePlayer === 1) {
            this.player?.playTrack({ track: { encoded: track.encoded } })
        } else {
            if ( this.node?.rest instanceof CustomRest ) {
                this.node?.rest.updateQPlayer({ guildId: this.guildId, playerOptions: 
                                         { track: { encoded: track.encoded} } })
            }
        }
    }
    public switchActivePlayer(){
        if (this.activePlayer === 0) {
            this.activePlayer = 1;
        } else this.activePlayer = 0;
    }
    public playNext() {
        if (this.queuedTrack) {
            this.switchActivePlayer();
            this.currentTrackURL = this.queuedTrackURL;
            this.queuedTrackURL = null;
            this.playTrack(this.queuedTrack);
            this.sendVoiceData(this.activePlayer);
        }
    }

    private sendVoiceData(player: number) {
        if (this.node?.rest instanceof CustomRest) {
            // Have the new player establish connection to the voice gateway as well
            console.log("sent voice details to player");

            const voiceData = this.connection?.serverUpdate;
            const sessionId = this.connection?.sessionId ?? "false";

            if (voiceData) {
                const voice = { 
                    token: voiceData.token, 
                    endpoint: voiceData.endpoint, 
                    sessionId: sessionId 
                };
                if (player === 0) {
                    this.node.rest.updatePlayer({ 
                        guildId: this.guildId, 
                        playerOptions: { 
                            voice: voice, 
                            //paused: false
                        } 
                    });
                } else {
                    this.node.rest.updateQPlayer({ 
                        guildId: this.guildId, 
                        playerOptions: { 
                            voice: voice, 
                            //paused: false 
                        } 
                    });
                }

            }
        }
    }

    public setActivePlayer(number: number) {
        this.activePlayer = number;
    }

    public setPlayer(player: Player) {
        this.player = player;
    }

    public setQPlayer(player: Player) {
        this.qPlayer = player;
    }
}
