import { BasePlayer } from './BasePlayer.js';

export class BasePlayer2D extends BasePlayer {
	constructor(game) {
		super(game);
		this.z = 0.0;
		this.x = 0.0;
		this.rotation = 0.0;
	}

	distance(z, x) {
		const world = this.game.world;
		let dx = this.x - x;
		let dz = this.z - z;
		if (world.wrapsZ) {
			const halfZ = world.width * this.game.resolution / 2.0;
			dz = (((dz + halfZ) % (2 * halfZ)) + (2 * halfZ)) % (2 * halfZ) - halfZ;
		}
		if (world.wrapsX) {
			const halfX = world.depth * this.game.resolution / 2.0;
			dx = (((dx + halfX) % (2 * halfX)) + (2 * halfX)) % (2 * halfX) - halfX;
		}
		return Math.sqrt(dx * dx + dz * dz);
	}

	direction(z, x) {
		const dx = x - this.x;
		const dz = z - this.z;
		const angle = Math.atan2(dz, dx);
		return ((angle / (2 * Math.PI) + 1) % 1 + 1) % 1;
	}
}
