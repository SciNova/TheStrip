import { Shape } from './Shape.js';
import { Alignment } from './Alignment.js';

export class Shape2D extends Shape {
	constructor(game, size, alignment = Alignment.CENTER) {
		super(game, size, alignment);
		this.z = 0.0;
		this.x = 0.0;
	}

	collides(z, x) {
		const radius = this.pixels.length / 2.0;
		let dx = this.x - x;
		let dz = this.z - z;
		const world = this.game.world;
		if (world.wrapsZ) {
			const halfZ = world.width * this.game.resolution / 2.0;
			dz = (((dz + halfZ) % (2 * halfZ)) + (2 * halfZ)) % (2 * halfZ) - halfZ;
		}
		if (world.wrapsX) {
			const halfX = world.depth * this.game.resolution / 2.0;
			dx = (((dx + halfX) % (2 * halfX)) + (2 * halfX)) % (2 * halfX) - halfX;
		}
		return (dx * dx + dz * dz) < (radius * radius);
	}
}
