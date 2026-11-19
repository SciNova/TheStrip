import { Game, Colors, Command } from '../../core/system.js';
import { SampleID } from '../../core/audio-common.js';

const LanderStage = Object.freeze({ PLAYING: 'PLAYING', RESULT: 'RESULT' });

export class LunarLander extends Game {
	static BASE_GRAVITY = 0.35; // resolution-fraction/sec^2
	static GRAVITY_PER_LEVEL = 0.04;
	static THRUST_ACCEL = 0.9; // resolution-fraction/sec^2
	static BASE_FUEL_DRAIN = 0.18; // fraction/sec while thrusting
	static SAFE_LANDING_SPEED = 0.18; // resolution-fraction/sec
	static GROUND_BAND = 3; // pixels
	static MAX_LIVES = 3;

	constructor(system) {
		super('LunarLander', system);
		this.level = 0;
		this.score = 0;
		this.lives = LunarLander.MAX_LIVES;
		this._startLevel();
	}

	_startLevel() {
		this.altitude = this.resolution - 1;
		this.velocity = 0.0;
		this.fuel = 1.0;
		this.thrusting = false;
		this.gravity = (LunarLander.BASE_GRAVITY + this.level * LunarLander.GRAVITY_PER_LEVEL) * this.resolution;
		this.fuelDrain = LunarLander.BASE_FUEL_DRAIN * (1 + this.level * 0.05);
		this.stage = LanderStage.PLAYING;
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === LanderStage.PLAYING) {
			this._loopPlaying(dt);
		} else {
			if (this.delayTime <= 0.0) {
				if (this.lives <= 0) {
					this.level = 0;
					this.score = 0;
					this.lives = LunarLander.MAX_LIVES;
				}
				this._startLevel();
			} else {
				this._renderResult();
			}
		}
	}

	_loopPlaying(dt) {
		this.velocity -= this.gravity * dt;
		if (this.thrusting && this.fuel > 0.0) {
			this.velocity += LunarLander.THRUST_ACCEL * this.resolution * dt;
			this.fuel = Math.max(0.0, this.fuel - this.fuelDrain * dt);
		}

		this.altitude += this.velocity * dt;

		if (this.altitude <= 0.0) {
			this.altitude = 0.0;
			const speed = Math.abs(this.velocity);
			if (speed <= LunarLander.SAFE_LANDING_SPEED * this.resolution) {
				this.score += 1;
				this.audio.play(SampleID.CROWD_CHEERING);
				this.stage = LanderStage.RESULT;
				this.landed = true;
				this.delay(2.0);
			} else {
				this.lives -= 1;
				this.audio.play(SampleID.CROWD_BOOING);
				this.stage = LanderStage.RESULT;
				this.landed = false;
				this.delay(2.5);
				if (this.lives <= 0) {
					this.delay(3.5);
				}
			}
		} else if (this.altitude > this.resolution - 1) {
			this.altitude = this.resolution - 1;
			if (this.velocity > 0) {
				this.velocity = 0;
			}
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== LanderStage.PLAYING) {
			return;
		}
		if (event.command === Command.UP_PRESS) {
			this.thrusting = true;
		} else if (event.command === Command.UP_RELEASE) {
			this.thrusting = false;
		}
	}

	_render() {
		this.clear();

		const fuelBrightness = 0.08 + 0.3 * this.fuel;
		const bg = Math.floor(0xFF * fuelBrightness);
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = (bg << 16) | (Math.floor(bg * 0.6) << 8);
		}

		for (let i = 0; i < LunarLander.GROUND_BAND && i < this.resolution; i++) {
			this.pixels[i] = Colors.GREEN;
		}

		const pos = Math.round(this.altitude);
		if (pos >= 0 && pos < this.resolution) {
			this.pixels[pos] = Colors.WHITE;
		}
		if (this.thrusting && this.fuel > 0.0 && pos + 1 < this.resolution) {
			this.pixels[pos + 1] = Colors.ORANGE;
		}
	}

	_renderResult() {
		this.clear();
		const flashOn = Math.floor(this.time * 6) % 2 === 0;
		if (this.landed) {
			const color = flashOn ? Colors.GREEN : Colors.DARK_GREEN;
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = color;
			}
		} else {
			const lit = Math.min(this.score, this.resolution);
			for (let i = 0; i < lit; i++) {
				this.pixels[i] = Colors.DARK_RED;
			}
			if (flashOn) {
				for (let i = 0; i < this.resolution; i++) {
					if (this.pixels[i] === 0) {
						this.pixels[i] = Colors.RED;
					}
				}
			}
		}
	}
}
