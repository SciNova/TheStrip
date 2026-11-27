import { BaseWorld } from './BaseWorld.js';

export class World extends BaseWorld {
	constructor(size, wraps) {
		super();
		this.size = size;
		this.wraps = wraps;
	}
}
