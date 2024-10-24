import { Player } from 'shoukaku';

export class ShoukakuQueue {
    private queue: string[] = [];
    private player: Player | undefined;
    private preloadPlayer: Player | undefined;

    public setPlayer(player: Player) {
        this.player = player;
    }

    public setPreloadPlayer(player: Player) {
        this.preloadPlayer = player;
    }

    // Method to add track URLs to the queue
    public addTrack(url: string): void {
        this.queue.push(url);
    }

    // Method to retrieve the current queue
    public getQueue(): string[] {
        return this.queue;
    }

    // Method to get the main player
    public getPlayer(): Player | undefined {
        return this.player;
    }

    // Method to get the preload player
    public getPreloadPlayer(): Player | undefined{
        return this.preloadPlayer;
    }

    private preload() {
        // load the next song in the preload player and pause;
    }

    // Additional methods as needed...
}
