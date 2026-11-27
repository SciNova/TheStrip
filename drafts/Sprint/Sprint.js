import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

export class Sprint extends Game {
	static SPEED_BOOST = 0.3;
	static MAX_SPEED = 1.6;
	static SPEED_DECAY = 0.7;
	static BASE_PURSUER_SPEED = 0.55;
	static PURSUER_SPEED_PER_MIN = 0.05;
	static MAX_GAP = 1.0;
	static START_GAP = 0.6;
	static SPAWN_Z = 6.0;
	static HURDLE_APPROACH_SPEED = 2.0;
	static JUMP_WINDOW_Z = 0.4;
	static JUMP_BUFFER = 0.25;
	static STUMBLE_PENALTY = 0.25;
	static HURDLE_INTERVAL = 2.2;
	static MIN_HURDLE_SIZE = 1;
	static MAX_HURDLE_SIZE = 4;

	constructor(system) {
		super('Sprint', system);
		this._resetGame();
	}

	_resetGame() {
		this.speed = 0.0;
		this.gap = Sprint.START_GAP * this.resolution;
		this.pursuerSpeed = Sprint.BASE_PURSUER_SPEED * this.resolution;
		this.lastUpPress = -999.0;
		this.hurdleTimer = Sprint.HURDLE_INTERVAL;
		this.hurdles = [];
		this.score = 0;
		this.stage = 'RUNNING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'RUNNING') {
			this._loopRunning(dt);
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopRunning(dt) {
		this.speed *= Math.max(0.0, 1.0 - Sprint.SPEED_DECAY * dt);
		const minutes = this.time / 60.0;
		this.pursuerSpeed = (Sprint.BASE_PURSUER_SPEED + minutes * Sprint.PURSUER_SPEED_PER_MIN) * this.resolution;

		this.gap += (this.speed - this.pursuerSpeed) * dt;
		const maxGap = Sprint.MAX_GAP * this.resolution;
		if (this.gap > maxGap) {
			this.gap = maxGap;
		}

		this.hurdleTimer -= dt;
		if (this.hurdleTimer <= 0.0) {
			this.hurdles.push({ z: Sprint.SPAWN_Z * this.resolution, cleared: false });
			this.hurdleTimer = Sprint.HURDLE_INTERVAL;
		}

		const jumpWindow = Sprint.JUMP_WINDOW_Z * this.resolution;
		const survivors = [];
		for (const hurdle of this.hurdles) {
			hurdle.z -= Sprint.HURDLE_APPROACH_SPEED * this.resolution * dt;
			if (!hurdle.cleared && hurdle.z <= jumpWindow) {
				const sinceJump = this.time - this.lastUpPress;
				if (sinceJump < Sprint.JUMP_BUFFER) {
					hurdle.cleared = true;
					this.speed = Math.min(Sprint.MAX_SPEED * this.resolution, this.speed + Sprint.SPEED_BOOST * this.resolution * 0.5);
					this.score += 1;
					this.audio.playSynth(SystemSound.TICK);
				}
			}
			if (!hurdle.cleared && hurdle.z <= 0) {
				this.gap -= Sprint.STUMBLE_PENALTY * this.resolution;
				this.speed = 0.0;
				this.audio.playSynth(SystemSound.WARNING);
			}
			if (hurdle.z > -this.resolution * 0.5) {
				survivors.push(hurdle);
			}
		}
		this.hurdles = survivors;

		if (this.gap <= 0.0) {
			this.gap = 0.0;
			this.stage = 'GAMEOVER';
			this.audio.play(SystemSound.BOOING);
			this.delay(3.0);
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== 'RUNNING') {
			return;
		}
		if (event.command === Command.FIRE_PRESS) {
			this.speed = Math.min(Sprint.MAX_SPEED * this.resolution, this.speed + Sprint.SPEED_BOOST * this.resolution);
		} else if (event.command === Command.UP_PRESS) {
			this.lastUpPress = this.time;
		}
	}

	_render() {
		this.clear();

		const maxGap = Sprint.MAX_GAP * this.resolution;
		const danger = 1.0 - Math.max(0.0, Math.min(1.0, this.gap / maxGap));
		const bg = Math.floor(0xFF * 0.3 * danger);
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = bg << 16;
		}

		for (const hurdle of this.hurdles) {
			if (hurdle.cleared || hurdle.z <= 0) {
				continue;
			}
			const approach = 1.0 - Math.min(1.0, hurdle.z / (Sprint.SPAWN_Z * this.resolution));
			const brightness = 0.35 + 0.65 * approach;
			const v = Math.floor(0xFF * brightness);
			const color = (v << 16) | (Math.floor(v * 0.8) << 8);
			const size = Sprint.MIN_HURDLE_SIZE + Math.round(approach * (Sprint.MAX_HURDLE_SIZE - Sprint.MIN_HURDLE_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.floor(this.resolution * 0.75);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		const runnerPos = Math.round((this.gap / maxGap) * (this.resolution - 1));
		if (runnerPos >= 0 && runnerPos < this.resolution) {
			this.pixels[runnerPos] = Color.WHITE;
		}
	}

	_renderGameOver() {
		this.clear();
		const lit = Math.min(this.score, this.resolution);
		for (let i = 0; i < lit; i++) {
			this.pixels[i] = Color.DARK_RED;
		}
		const flashOn = Math.floor(this.time * 4) % 2 === 0;
		if (flashOn) {
			for (let i = 0; i < this.resolution; i++) {
				if (this.pixels[i] === 0) {
					this.pixels[i] = Color.RED;
				}
			}
		}
	}
}
