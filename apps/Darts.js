import { Game, Colors, Command } from '../core/system.js';

const Phase = Object.freeze({ IDLE: 'IDLE', PLAY: 'PLAY', COMPLETE: 'COMPLETE' });

class Target {
	static SIZE = 0.5; // fraction of resolution, diameter of the outer ring at scale 1
	static RADII = [0.1, 0.3, 0.6, 1.0]; // fraction of half-width, ascending
	static SCORES = [50, 25, 10, 5];
	static COLORS = [Colors.RED, Colors.DARK_YELLOW, Colors.DARK_GREEN, Colors.BLUE];
	static START_SCALE = 1.0;
	static END_SCALE = 0.4;
	static EASE_POWER = 2.5;

	constructor(game) {
		this.game = game;
		this.position = game.resolution / 2.0;
	}

	scale() {
		const t = this.game.level / (this.game.levelCount - 1);
		const eased = t ** Target.EASE_POWER;
		return Target.START_SCALE + (Target.END_SCALE - Target.START_SCALE) * eased;
	}

	halfWidth() {
		const diameter = this.game.resolution * Target.SIZE;
		return (diameter / 2.0) * this.scale();
	}

	hit(position) {
		const half = this.halfWidth();
		const dist = Math.abs(position - this.position);
		for (let i = 0; i < Target.RADII.length; i++) {
			if (dist < Target.RADII[i] * half) {
				return Target.SCORES[i];
			}
		}
		return 0;
	}

	render() {
		const half = this.halfWidth();
		const start = Math.max(0, Math.round(this.position - half));
		const end = Math.min(this.game.resolution - 1, Math.round(this.position + half));
		for (let i = start; i <= end; i++) {
			const dist = Math.abs(i - this.position);
			for (let r = 0; r < Target.RADII.length; r++) {
				if (dist < Target.RADII[r] * half) {
					this.game.pixels[i] = Target.COLORS[r];
					break;
				}
			}
		}
	}
}

class Score {
	static SIZE = 0.2; // fraction of resolution, each side, marker pixel included

	constructor(game, maxValue) {
		this.game = game;
		this.value = 0; // cumulative score for the whole game, never reset
		this.maxValue = maxValue;
	}

	render() {
		const barLength = Math.round(Score.SIZE * this.game.resolution);
		const quarter = this.maxValue / 4.0;
		const rank = Math.min(3, Math.floor(this.value / quarter));
		const relValue = this.value - rank * quarter;
		const color = Target.COLORS[Target.COLORS.length - 1 - rank];
		const r = (color >> 16) & 0xFF;
		const g = (color >> 8) & 0xFF;
		const b = color & 0xFF;
		const dim = ((r >> 1) << 16) | ((g >> 1) << 8) | (b >> 1);
		const fillFloat = (barLength - 1) * (relValue / quarter);
		const fullCount = Math.min(barLength - 1, Math.floor(fillFloat));
		const partial = fillFloat - fullCount;
		const intensity = 0.5 + 0.5 * partial;
		const edgeColor = (Math.floor(r * intensity) << 16) | (Math.floor(g * intensity) << 8) | Math.floor(b * intensity);

		for (let i = 0; i < barLength; i++) {
			let pixelColor;
			if (i === 0 || i <= fullCount) {
				pixelColor = color;
			} else if (i === fullCount + 1) {
				pixelColor = edgeColor;
			} else {
				pixelColor = dim;
			}
			this.game.pixels[this.game.resolution - 1 - i] = pixelColor;
		}
	}
}

class Progress {
	static SIZE = 0.2; // fraction of resolution, marker pixel included
	static COLOR = Colors.YELLOW;

	constructor(game, maxValue) {
		this.game = game;
		this.value = 0; // darts thrown so far, regardless of score
		this.maxValue = maxValue;
	}

	render() {
		const barLength = Math.round(Progress.SIZE * this.game.resolution);
		const r = (Progress.COLOR >> 16) & 0xFF;
		const g = (Progress.COLOR >> 8) & 0xFF;
		const b = Progress.COLOR & 0xFF;
		const dim = ((r >> 1) << 16) | ((g >> 1) << 8) | (b >> 1);
		const fillFloat = (barLength - 1) * (this.value / this.maxValue);
		const fullCount = Math.min(barLength - 1, Math.floor(fillFloat));
		const partial = fillFloat - fullCount;
		const intensity = 0.5 + 0.5 * partial;
		const edgeColor = (Math.floor(r * intensity) << 16) | (Math.floor(g * intensity) << 8) | Math.floor(b * intensity);

		for (let i = 0; i < barLength; i++) {
			let pixelColor;
			if (i === 0 || i <= fullCount) {
				pixelColor = Progress.COLOR;
			} else if (i === fullCount + 1) {
				pixelColor = edgeColor;
			} else {
				pixelColor = dim;
			}
			this.game.pixels[i] = pixelColor;
		}
	}
}

class Needle {
	static START_SPEED = 1.8; // radians/sec
	static END_SPEED = 3.5;
	static EASE_POWER = 2.5;

	constructor(game) {
		this.game = game;
		this.position = game.resolution / 2.0;
		this.phase = 0.0;
		this.sweeping = false;
	}

	speed() {
		const t = this.game.level / (this.game.levelCount - 1);
		const eased = t ** Needle.EASE_POWER;
		return Needle.START_SPEED + (Needle.END_SPEED - Needle.START_SPEED) * eased;
	}

	start() {
		this.sweeping = true;
	}

	stop() {
		this.sweeping = false;
	}

	update() {
		if (!this.sweeping) {
			return;
		}
		this.phase += this.game.system.clock.delta * this.speed();
		const half = this.game.resolution / 2.0;
		this.position = half + half * Math.sin(this.phase);
	}

	render() {
		const pixel = Math.round(this.position);
		if (pixel >= 0 && pixel < this.game.resolution) {
			this.game.pixels[pixel] = Colors.WHITE;
		}
	}
}

export class Darts extends Game {
	static LEVELS = 12;
	static DARTS_PER_LEVEL = 4;

	constructor(system) {
		super('Darts', system);
		this.levelCount = Darts.LEVELS;
		this.target = new Target(this);
		this.needle = new Needle(this);
		this.score = new Score(this, Target.SCORES[0] * Darts.LEVELS * Darts.DARTS_PER_LEVEL);
		this.progress = new Progress(this, Darts.LEVELS * Darts.DARTS_PER_LEVEL);
		this.throwsLeft = Darts.DARTS_PER_LEVEL;
		this.phase = Phase.IDLE;
	}

	loop() {
		super.loop();
		if (this.phase === Phase.PLAY) {
			this.needle.update();
		}
		this.render();
	}

	_throw() {
		this.needle.stop();
		const points = this.target.hit(this.needle.position);
		this.score.value += points;
		this.progress.value += 1;
		this.throwsLeft -= 1;

		if (this.throwsLeft <= 0 && this.level >= this.levelCount - 1) {
			this.phase = Phase.COMPLETE;
			return;
		}

		this.phase = Phase.IDLE;
	}

	handleInput(padId, event) {
		if (event.command !== Command.FIRE_PRESS) {
			return;
		}
		if (this.phase === Phase.IDLE) {
			if (this.throwsLeft <= 0) {
				this.nextLevel();
				this.throwsLeft = Darts.DARTS_PER_LEVEL;
			}
			this.phase = Phase.PLAY;
			this.needle.start();
		} else if (this.phase === Phase.PLAY) {
			this._throw();
		}
	}

	render() {
		this.clear();
		this.target.render();
		this.score.render();
		this.progress.render();
		this.needle.render();
	}
}
