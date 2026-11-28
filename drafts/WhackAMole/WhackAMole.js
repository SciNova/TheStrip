import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

const WhackStage = Object.freeze({ PLAYING: 'PLAYING', ROUND_END: 'ROUND_END' });

export class WhackAMole extends Game {
	static ROUND_DURATION = 30.0;
	static BASE_LIT_DURATION = 1.1;
	static MIN_LIT_DURATION = 0.45;
	static LIT_DURATION_STEP = 0.02;
	static BASE_SPAWN_INTERVAL = 0.6;
	static MIN_SPAWN_INTERVAL = 0.25;
	static SPAWN_INTERVAL_STEP = 0.01;
	static MAX_CONCURRENT = 3;
	static CURSOR_SPEED = 0.9;
	static HIT_TOLERANCE = 5;
	static MOLE_MARGIN = 4;

	constructor(system) {
		super('WhackAMole', system);
		this._resetGame();
	}

	_resetGame() {
		this.cursorPos = this.resolution / 2.0;
		this.cursorDir = 0;
		this.score = 0;
		this.roundTime = WhackAMole.ROUND_DURATION;
		this.litDuration = WhackAMole.BASE_LIT_DURATION;
		this.spawnInterval = WhackAMole.BASE_SPAWN_INTERVAL;
		this.spawnTimer = 0.3;
		this.moles = [];
		this.stage = WhackStage.PLAYING;
	}

	_spawnMole() {
		const margin = WhackAMole.MOLE_MARGIN;
		const pos = margin + this.system.random() * (this.resolution - 1 - 2 * margin);
		this.moles.push({ pos, timer: this.litDuration, fuse: this.litDuration });
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === WhackStage.PLAYING) {
			this._loopPlaying(dt);
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			} else {
				this._renderRoundEnd();
			}
		}
	}

	_loopPlaying(dt) {
		this.cursorPos += this.cursorDir * WhackAMole.CURSOR_SPEED * this.resolution * dt;
		if (this.cursorPos < 0) {
			this.cursorPos = 0;
		} else if (this.cursorPos > this.resolution - 1) {
			this.cursorPos = this.resolution - 1;
		}

		this.spawnTimer -= dt;
		if (this.spawnTimer <= 0.0) {
			if (this.moles.length < WhackAMole.MAX_CONCURRENT) {
				this._spawnMole();
			}
			this.spawnTimer = this.spawnInterval;
		}

		const survivors = [];
		for (const mole of this.moles) {
			mole.timer -= dt;
			if (mole.timer > 0.0) {
				survivors.push(mole);
			}
		}
		this.moles = survivors;

		this.roundTime -= dt;
		if (this.roundTime <= 0.0) {
			this.roundTime = 0.0;
			this.stage = WhackStage.ROUND_END;
			this.audio.play(SystemSound.CHEERING);
			this.delay(4.0);
		}

		this._render();
	}

	_whack() {
		let bestIndex = -1;
		let bestDist = WhackAMole.HIT_TOLERANCE;
		for (let i = 0; i < this.moles.length; i++) {
			const dist = Math.abs(this.moles[i].pos - this.cursorPos);
			if (dist < bestDist) {
				bestDist = dist;
				bestIndex = i;
			}
		}

		if (bestIndex >= 0) {
			this.moles.splice(bestIndex, 1);
			this.score += 1;
			this.audio.playSynth(SystemSound.EXPLOSION);
			this.litDuration = Math.max(WhackAMole.MIN_LIT_DURATION, this.litDuration - WhackAMole.LIT_DURATION_STEP);
			this.spawnInterval = Math.max(WhackAMole.MIN_SPAWN_INTERVAL, this.spawnInterval - WhackAMole.SPAWN_INTERVAL_STEP);
		} else {
			this.audio.playSynth(SystemSound.SHOOT);
		}
	}

	handleInput(padId, event) {
		if (this.stage !== WhackStage.PLAYING) {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.cursorDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.cursorDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.cursorDir === -1) {
				this.cursorDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.cursorDir === 1) {
				this.cursorDir = 0;
			}
		} else if (event.command === Command.FIRE_PRESS) {
			this._whack();
		}
	}

	_render() {
		this.clear();

		const barLen = Math.round((this.roundTime / WhackAMole.ROUND_DURATION) * this.resolution);
		for (let i = 0; i < barLen; i++) {
			this.pixels[i] = Color.DARK_GRAY;
		}

		for (const mole of this.moles) {
			const remaining = Math.max(0.0, Math.min(1.0, mole.timer / mole.fuse));
			const brightness = 0.35 + 0.65 * remaining;
			const r = Math.floor(0xFF * brightness);
			const g = Math.floor(0x22 * brightness);
			const color = (r << 16) | (g << 8);
			const pos = Math.round(mole.pos);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = color;
			}
			if (pos - 1 >= 0) {
				this.pixels[pos - 1] = color;
			}
			if (pos + 1 < this.resolution) {
				this.pixels[pos + 1] = color;
			}
		}

		const blink = Math.floor(this.time * 8) % 2 === 0;
		const cursorPos = Math.round(this.cursorPos);
		if (blink && cursorPos >= 0 && cursorPos < this.resolution) {
			this.pixels[cursorPos] = Color.WHITE;
		}
	}

	_renderRoundEnd() {
		this.clear();
		const lit = Math.min(this.score, this.resolution);
		for (let i = 0; i < lit; i++) {
			this.pixels[i] = Color.DARK_YELLOW;
		}
		const flashOn = Math.floor(this.time * 5) % 2 === 0;
		if (flashOn) {
			for (let i = 0; i < this.resolution; i++) {
				if (this.pixels[i] === 0) {
					this.pixels[i] = Color.YELLOW;
				}
			}
		}
	}
}
