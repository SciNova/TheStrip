import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

export class TreasureHunt extends Game {
	static CURSOR_SPEED = 0.8;
	static BASE_TOLERANCE = 0.08;
	static MIN_TOLERANCE = 0.02;
	static TOLERANCE_STEP = 0.006;
	static SENSE_RANGE = 0.5;
	static DIG_COOLDOWN = 0.3;

	constructor(system) {
		super('TreasureHunt', system);
		this.score = 0;
		this.tolerance = TreasureHunt.BASE_TOLERANCE;
		this.cursorPos = this.resolution / 2.0;
		this.cursorDir = 0;
		this.digCooldown = 0.0;
		this.digFlash = 0.0;
		this.found = false;
		this._spawnTarget();
	}

	_spawnTarget() {
		this.targetPos = this.system.random() * (this.resolution - 1);
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		this.cursorPos += this.cursorDir * TreasureHunt.CURSOR_SPEED * this.resolution * dt;
		if (this.cursorPos < 0) {
			this.cursorPos = 0;
		} else if (this.cursorPos > this.resolution - 1) {
			this.cursorPos = this.resolution - 1;
		}

		if (this.digCooldown > 0.0) {
			this.digCooldown -= dt;
		}
		if (this.digFlash > 0.0) {
			this.digFlash -= dt;
		}

		this._render();
	}

	_dig() {
		if (this.digCooldown > 0.0) {
			return;
		}
		this.digCooldown = TreasureHunt.DIG_COOLDOWN;

		const toleranceUnits = this.tolerance * this.resolution;
		if (Math.abs(this.cursorPos - this.targetPos) < toleranceUnits) {
			this.score += 1;
			this.audio.play(SystemSound.CHEERING);
			this.tolerance = Math.max(TreasureHunt.MIN_TOLERANCE, this.tolerance - TreasureHunt.TOLERANCE_STEP);
			this._spawnTarget();
		} else {
			this.audio.playSynth(SystemSound.WARNING);
		}
		this.digFlash = 0.25;
	}

	handleInput(padId, event) {
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
			this._dig();
		}
	}

	_render() {
		this.clear();

		const senseRange = TreasureHunt.SENSE_RANGE * this.resolution;
		const dist = Math.abs(this.cursorPos - this.targetPos);
		const heat = Math.max(0.0, 1.0 - dist / senseRange);

		for (let i = 0; i < this.resolution; i++) {
			const r = Math.floor(0x30 * heat);
			const b = Math.floor(0x30 * (1.0 - heat));
			this.pixels[i] = (r << 16) | b;
		}

		if (this.digFlash > 0.0) {
			const pos = Math.round(this.cursorPos);
			const color = heat > 0.85 ? Color.GREEN : Color.ORANGE;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = color;
			}
		} else {
			const pos = Math.round(this.cursorPos);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Color.WHITE;
			}
		}
	}
}
