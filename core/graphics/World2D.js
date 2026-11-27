import { BaseWorld } from './BaseWorld.js';

export class World2D extends BaseWorld {
	constructor(width, depth, wrapsX, wrapsZ) {
		super();
		this.width = width;
		this.depth = depth;
		this.wrapsX = wrapsX;
		this.wrapsZ = wrapsZ;
	}
}
