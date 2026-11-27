import { BasePlayer } from './BasePlayer.js';

export class BasePlayer1D extends BasePlayer {
	constructor(game) {
		super(game);
		this.location = 0.0;
	}

	distance(location) {
		const world = this.game.world;
		let d = this.location - location;
		if (world.wraps) {
			const half = world.size * this.game.resolution / 2.0;
			d = (((d + half) % (2 * half)) + (2 * half)) % (2 * half) - half;
		}
		return Math.abs(d);
	}
}
