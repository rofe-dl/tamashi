import { Player, Node, Rest, Track, Connection } from "shoukaku";
import { CustomRest } from "./custom.rest";

export class PlayerManager {
    private player: Player | null;
    private qPlayer: Player | null;
    private activePlayer: number | null;
    private node: Node | null;
    private guildId: string;
    private connection: Connection | undefined;
    // might need to add a current track identifier

    constructor( guildId: string, connection?: Connection, node?: Node,) {
        this.player = null;
        this.qPlayer = null;
        this.activePlayer = 0;
        this.node = node ?? null;
        this.guildId = guildId;
        this.connection = connection;
    }

    public playTrack(track: Track) {
        if (this.activePlayer === 0) {
            this.player?.playTrack({ track: { encoded: track.encoded } });

            this.player?.on('end', async () => {
                this.player?.clean();

                if (this.node?.rest instanceof CustomRest) {
                    // Have the new player establish connection to the voice gateway as well
                    console.log("sent voice details to player2");

                    const voiceData = this.connection?.serverUpdate;
                    const sessionId = this.connection?.sessionId ?? "false";

                    if (voiceData) {
                        const voice = { 
                            token: voiceData.token, 
                            endpoint: voiceData.endpoint, 
                            sessionId: sessionId 
                        };

                        this.node.rest.updateQPlayer({ 
                            guildId: this.guildId, 
                            playerOptions: { 
                                voice: voice, 
                                paused: false 
                            } 
                        });
                    }
                }
            });
        }
        if (this.activePlayer === 1) {
            if ( this.node?.rest instanceof CustomRest ) {
                this.node?.rest.updateQPlayer({ guildId: this.guildId, playerOptions: 
                                              { track: { encoded: track.encoded} } })
            }

            this.player?.on('end', async () => {
                //TODO: have to figure out how to manage event messages for qPlayer
                this.player?.clean();

                if (this.node?.rest instanceof CustomRest) {
                    // Have the new player establish connection to the voice gateway as well
                    console.log("sent voice details to player2");

                    const voiceData = this.connection?.serverUpdate;
                    const sessionId = this.connection?.sessionId ?? "false";

                    if (voiceData) {
                        const voice = { 
                            token: voiceData.token, 
                            endpoint: voiceData.endpoint, 
                            sessionId: sessionId 
                        };

                        this.node.rest.updatePlayer({ 
                            guildId: this.guildId, 
                            playerOptions: { 
                                voice: voice, 
                                paused: false 
                            } 
                        });
                    }
                }
            });
        }
    }

    public queueTrack(track: Track) {
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
