import { Game, Command, Colors } from '../../core/system.js';

const PointerState = Object.freeze({ IDLE: 'IDLE', AIM_LEFT: 'AIM_LEFT', AIM_RIGHT: 'AIM_RIGHT' });

class Block {
	constructor(location, size, color) {
		this.location = location;
		this.size = size;
		this.color = color;
	}
}

class Pointer {
	static SPEED = 0.7;

	constructor(game) {
		this.game = game;
		this.location = game.resolution / 2.0;
		this.state = PointerState.IDLE;
		this.object = null;
		this.offset = 0;
	}

	_blockedRange(location, size, ignoring) {
		// Edges and every other block act as fixed obstacles; returns the
		// legal [min, max] range location can take so [location, location + size)
		// stays clear of all of them.
		let min = 0;
		let max = this.game.resolution - size;
		for (const block of this.game.blocks) {
			if (block === ignoring) {
				continue;
			}
			if (block.location + block.size <= location) {
				min = Math.max(min, block.location + block.size);
			} else if (block.location >= location + size) {
				max = Math.min(max, block.location - size);
			}
		}
		return [min, max];
	}

	grab() {
		const block = this.game.blocks.find((b) => this.location >= b.location && this.location < b.location + b.size);
		if (block) {
			this.object = block;
			this.offset = this.location - block.location;
		}
	}

	release() {
		this.object = null;
	}

	update() {
		const dt = this.game.system.clock.delta;
		const speed = Pointer.SPEED * this.game.resolution;
		let direction = 0;
		if (this.state === PointerState.AIM_LEFT) {
			direction = -1;
		} else if (this.state === PointerState.AIM_RIGHT) {
			direction = 1;
		}

		if (direction === 0) {
			this.render();
			return;
		}

		const candidatePointer = this.location + direction * speed * dt;

		if (this.object) {
			const candidateBlock = candidatePointer - this.offset;
			const [min, max] = this._blockedRange(this.object.location, this.object.size, this.object);
			this.object.location = Math.max(min, Math.min(max, candidateBlock));
			this.location = this.object.location + this.offset;
		} else {
			this.location = Math.max(0, Math.min(this.game.resolution - 1, candidatePointer));
		}

		this.render();
	}

	render() {
		this.game.pixels[Math.round(this.location)] = Colors.WHITE;
	}
}

export class Drag extends Game {
	constructor(system) {
		super('Drag', system);

		const colors = [Colors.CADET_BLUE, Colors.DARK_SEA_GREEN, Colors.INDIAN_RED, Colors.MEDIUM_PURPLE];
		const BLOCK_COUNT = 4;
		const cellSize = Math.floor(this.resolution / (2 * BLOCK_COUNT + 1));

		this.blocks = [];
		for (let i = 0; i < BLOCK_COUNT; i++) {
			const location = cellSize * (2 * i + 1);
			this.blocks.push(new Block(location, cellSize, colors[i]));
		}

		this.pointer = new Pointer(this);
	}

	loop() {
		super.loop();
		this.clear();
		for (const block of this.blocks) {
			const start = Math.round(block.location);
			const end = Math.round(block.location + block.size);
			for (let i = start; i < end; i++) {
				this.pixels[i] = block.color;
			}
		}
		this.pointer.update();
	}

	handleInput(padId, event) {
		switch (event.command) {
			case Command.FIRE_PRESS:
			case Command.FIRE2_PRESS:
				this.pointer.grab();
				break;

			case Command.FIRE_RELEASE:
			case Command.FIRE2_RELEASE:
				this.pointer.release();
				break;

			case Command.LEFT_PRESS:
			case Command.UP_PRESS:
				this.pointer.state = PointerState.AIM_LEFT;
				break;

			case Command.RIGHT_PRESS:
			case Command.DOWN_PRESS:
				this.pointer.state = PointerState.AIM_RIGHT;
				break;

			case Command.LEFT_RELEASE:
			case Command.UP_RELEASE:
				if (this.pointer.state === PointerState.AIM_LEFT) {
					this.pointer.state = PointerState.IDLE;
				}
				break;

			case Command.RIGHT_RELEASE:
			case Command.DOWN_RELEASE:
				if (this.pointer.state === PointerState.AIM_RIGHT) {
					this.pointer.state = PointerState.IDLE;
				}
				break;
		}
	}
}
