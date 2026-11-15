import { Game, Colors, Sound, Command } from '../../core/system.js';

const FroggerStage = Object.freeze({ PLAYING: 'PLAYING', LEVEL_COMPLETE: 'LEVEL_COMPLETE', GAMEOVER: 'GAMEOVER' });

export class Frogger extends Game {
	static BASE_LANES = 8;
	static MAX_LANES = 14;
	static BASE_HAZARD_COUNT = 4;
	static MAX_HAZARD_COUNT = 7;
	static BASE_SPEED = 0.45; // resolution-fraction/sec
	static SPEED_PER_LANE = 0.03;
	static SPEED_PER_LEVEL = 0.03;
	static ROAD_OBSTACLE_FRACTION = 0.5; // of lane spacing
	static RIVER_LOG_FRACTION = 0.7; // of lane spacing
	static LATERAL_SPEED = 0.9; // resolution-fraction/sec
	static MAX_LIVES = 3;

	constructor(system) {
		super('Frogger', system);
		this.level = 0;
		this.score = 0;
		this.lives = Frogger.MAX_LIVES;
		this._buildLevel();
	}

	_buildLevel() {
		this.lanes = Math.min(Frogger.MAX_LANES, Frogger.BASE_LANES + this.level);
		this._resetCrossing();
		this.stage = FroggerStage.PLAYING;
	}

	_resetCrossing() {
		this.lane = 0;
		this.lateral = this.resolution / 2.0;
		this.lateralDir = 0;
	}

	_laneInfo(lane) {
		const isRiver = lane % 2 === 1;
		const hazardCount = Math.min(
			Frogger.MAX_HAZARD_COUNT,
			Frogger.BASE_HAZARD_COUNT + Math.floor(this.level / 2)
		);
		const spacing = this.resolution / hazardCount;
		const direction = lane % 4 < 2 ? 1 : -1;
		const speed = (Frogger.BASE_SPEED + lane * Frogger.SPEED_PER_LANE + this.level * Frogger.SPEED_PER_LEVEL) * this.resolution;
		const width = spacing * (isRiver ? Frogger.RIVER_LOG_FRACTION : Frogger.ROAD_OBSTACLE_FRACTION);
		const phase = (this.time * speed * direction) % this.resolution;
		return { isRiver, hazardCount, spacing, direction, speed, width, phase };
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === FroggerStage.PLAYING) {
			this._loopPlaying(dt);
		} else if (this.stage === FroggerStage.LEVEL_COMPLETE) {
			if (this.delayTime <= 0.0) {
				this.level += 1;
				this._buildLevel();
			} else {
				this._renderFlash(Colors.GREEN, Colors.DARK_GREEN);
			}
		} else {
			if (this.delayTime <= 0.0) {
				this.level = 0;
				this.score = 0;
				this.lives = Frogger.MAX_LIVES;
				this._buildLevel();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopPlaying(dt) {
		if (this.delayTime > 0.0) {
			this._render();
			return;
		}

		this.lateral += this.lateralDir * Frogger.LATERAL_SPEED * this.resolution * dt;
		if (this.lateral < 0) {
			this.lateral = 0;
		} else if (this.lateral > this.resolution - 1) {
			this.lateral = this.resolution - 1;
		}

		let died = false;
		if (this.lane > 0 && this.lane < this.lanes - 1) {
			const info = this._laneInfo(this.lane);
			let onSomething = false;
			for (let i = 0; i < info.hazardCount; i++) {
				let pos = (i * info.spacing + info.phase) % this.resolution;
				if (pos < 0) {
					pos += this.resolution;
				}
				let within;
				if (pos + info.width <= this.resolution) {
					within = this.lateral >= pos && this.lateral <= pos + info.width;
				} else {
					within = this.lateral >= pos || this.lateral <= (pos + info.width) % this.resolution;
				}
				if (within) {
					onSomething = true;
					break;
				}
			}
			if (info.isRiver) {
				if (onSomething) {
					this.lateral += info.direction * info.speed * dt;
				} else {
					died = true;
				}
			} else if (onSomething) {
				died = true;
			}
		}

		if (died) {
			this.lives -= 1;
			this.audio.play(Sound.MISS);
			if (this.lives <= 0) {
				this.stage = FroggerStage.GAMEOVER;
				this.audio.play(Sound.LEVEL_FAIL);
				this.delay(3.0);
			} else {
				this._resetCrossing();
				this.delay(0.6);
			}
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== FroggerStage.PLAYING) {
			return;
		}
		if (event.command === Command.UP_PRESS) {
			if (this.lane < this.lanes - 1) {
				this.lane += 1;
				this.score += 1;
				this.audio.play(Sound.TICK);
				if (this.lane === this.lanes - 1) {
					this.stage = FroggerStage.LEVEL_COMPLETE;
					this.audio.play(Sound.LEVEL_COMPLETE);
					this.delay(2.0);
				}
			}
		} else if (event.command === Command.DOWN_PRESS) {
			if (this.lane > 0) {
				this.lane -= 1;
			}
		} else if (event.command === Command.LEFT_PRESS) {
			this.lateralDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.lateralDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.lateralDir === -1) {
				this.lateralDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.lateralDir === 1) {
				this.lateralDir = 0;
			}
		}
	}

	_render() {
		this.clear();

		const progressBrightness = 0.08 + 0.22 * (this.lane / (this.lanes - 1));
		const bg = Math.floor(0xFF * progressBrightness) << 8;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = bg;
		}

		if (this.lane > 0 && this.lane < this.lanes - 1) {
			const info = this._laneInfo(this.lane);
			const color = info.isRiver ? Colors.DARK_ORANGE : Colors.ORANGE;
			for (let i = 0; i < info.hazardCount; i++) {
				let pos = (i * info.spacing + info.phase) % this.resolution;
				if (pos < 0) {
					pos += this.resolution;
				}
				const start = Math.floor(pos);
				const len = Math.ceil(info.width);
				for (let k = 0; k < len; k++) {
					const p = (start + k) % this.resolution;
					this.pixels[p] = color;
				}
			}
		}

		const cursor = Math.round(this.lateral);
		if (cursor >= 0 && cursor < this.resolution) {
			this.pixels[cursor] = Colors.WHITE;
		}
	}

	_renderFlash(onColor, offColor) {
		this.clear();
		const flashOn = Math.floor(this.time * 6) % 2 === 0;
		const color = flashOn ? onColor : offColor;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = color;
		}
	}

	_renderGameOver() {
		this.clear();
		const lit = Math.min(this.score, this.resolution);
		for (let i = 0; i < lit; i++) {
			this.pixels[i] = Colors.DARK_RED;
		}
		const flashOn = Math.floor(this.time * 4) % 2 === 0;
		if (flashOn) {
			for (let i = 0; i < this.resolution; i++) {
				if (this.pixels[i] === 0) {
					this.pixels[i] = Colors.RED;
				}
			}
		}
	}
}
