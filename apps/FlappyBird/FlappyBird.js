import { Game, Colors } from '../../core/system.js';
import { isGameCommand } from '../../core/system.js';

class Bird {
	constructor(position) {
		this.position = position;
		this.speed = 0.0;
	}
}

class Terrain {
	constructor() {
		this.height = 0.0;
		this.baseHeight = 0.0;
		this.fluctuation = 0.0;
		this.speed = 0.0;
	}
}

export class FlappyBird extends Game {
	constructor(system) {
		super('FlappyBird', system);

		const mid = this.resolution / 2.0;
		this.bird = new Bird(mid);

		this.topTerrain = new Terrain();
		this.bottomTerrain = new Terrain();

		this.gap = 0.5;
		this.gapPosition = 0.5;
		this.fluctuation = 0.1;
	}

	static _birdBoost(bird) {
		bird.speed = 20.0;
	}

	static _birdUpdate(bird, dt, maxPos) {
		bird.speed -= 20.0 * dt;
		bird.position += bird.speed * dt;
		if (bird.position < 0.0) {
			bird.position = 0.0;
		}
		if (bird.position > maxPos) {
			bird.position = maxPos;
		}
	}

	static _terrainUpdate(terrain, dt, resolution) {
		const maxChange = terrain.speed * resolution * dt;
		const step = (Math.random() * 2.0 - 1.0) * maxChange;
		terrain.height += step;

		const minH = terrain.baseHeight - terrain.fluctuation * resolution;
		const maxH = terrain.baseHeight + terrain.fluctuation * resolution;
		if (terrain.height < minH) {
			terrain.height = minH;
		}
		if (terrain.height > maxH) {
			terrain.height = maxH;
		}
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;
		let t = this.time / 60.0;
		if (t > 1.0) {
			t = 1.0;
		}

		this.gap = 0.5 - (0.5 - 0.2) * t;
		this.fluctuation = 0.0 + (0.3 - 0.0) * t;

		this.topTerrain.fluctuation = 0.0 + (0.15 - 0.0) * t;
		this.bottomTerrain.fluctuation = this.topTerrain.fluctuation;

		this.topTerrain.speed = 0.1 + (1.0 - 0.1) * t;
		this.bottomTerrain.speed = this.topTerrain.speed;

		const gapCenter = this.gapPosition * this.resolution;
		const gapSize = this.gap * this.resolution;

		this.topTerrain.baseHeight = this.resolution - (gapCenter + gapSize / 2.0);
		this.bottomTerrain.baseHeight = gapCenter - gapSize / 2.0;

		FlappyBird._terrainUpdate(this.topTerrain, dt, this.resolution);
		FlappyBird._terrainUpdate(this.bottomTerrain, dt, this.resolution);
		FlappyBird._birdUpdate(this.bird, dt, this.resolution - 1.0);

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x00007F;
		}

		const topHeight = Math.floor(this.topTerrain.height + 0.5);
		for (let i = 0; i < topHeight; i++) {
			this.pixels[this.resolution - 1 - i] = Colors.RED;
		}

		const bottomHeight = Math.floor(this.bottomTerrain.height + 0.5);
		for (let i = 0; i < bottomHeight; i++) {
			this.pixels[i] = Colors.RED;
		}

		const birdIdx = Math.floor(this.bird.position + 0.5);
		if (birdIdx >= 0 && birdIdx < this.resolution) {
			this.pixels[birdIdx] = Colors.YELLOW;
		}
	}

	handleInput(padId, event) {
		if (isGameCommand(event.command)) {
			FlappyBird._birdBoost(this.bird);
		}
	}
}
