import { Track, Node, Player } from 'shoukaku';

export class CustomPlayer extends Player {
  private trackInfo: Track | null = null;

  constructor(guildId: string, node: Node) {
    super(guildId, node);
  }

  setTrackInfo(track: Track): void {
    this.trackInfo = track;
  }

  getTrackInfo(): Track | null {
    return this.trackInfo;
  }
}
