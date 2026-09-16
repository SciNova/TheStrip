import { Game, Command, hsvToRgb } from './system.js';

const FADE_DURATION = 1.0;

export class ColorLight extends Game {
	constructor(system) {
		super('ColorLight', system);
		this.mode = 0;
		this.level = 0.5;
		this.temperature = 0.5;
		this.hue = 0.0;
		this.fading = false;
		this.fadeStartTime = 0.0;
		this.fadeStartLevel = 0.0;
		this.fadeTargetLevel = 0.0;
	}

	_levelLeft() {
		this.fading = false;
		this.level -= 1.0 / 100.0;
		if (this.level < 0.0) {
			this.level = 0.0;
		}
	}

	_levelRight() {
		this.fading = false;
		this.level += 1.0 / 100.0;
		if (this.level > 1.0) {
			this.level = 1.0;
		}
	}

	_levelPressed() {
		const now = this.system.clock.time;
		if (this.fading) {
			this.fadeStartLevel = this.level;
			this.fadeTargetLevel = this.fadeTargetLevel === 1.0 ? 0.0 : 1.0;
			this.fadeStartTime = now;
		} else {
			this.fading = true;
			this.fadeStartTime = now;
			this.fadeStartLevel = this.level;
			this.fadeTargetLevel = this.level < 1.0 ? 1.0 : 0.0;
		}
	}

	_modePressed() {
		this.mode = this.mode === 0 ? 1 : 0;
	}

	_modeLeft() {
		if (this.mode === 0) {
			this.temperature -= 1.0 / 50.0;
			if (this.temperature < 0.0) {
				this.temperature = 0.0;
			}
		} else {
			this.hue -= 1.0 / 360.0;
			if (this.hue < 0.0) {
				this.hue += 1.0;
			}
		}
	}

	_modeRight() {
		if (this.mode === 0) {
			this.temperature += 1.0 / 50.0;
			if (this.temperature > 1.0) {
				this.temperature = 1.0;
			}
		} else {
			this.hue += 1.0 / 360.0;
			if (this.hue >= 1.0) {
				this.hue -= 1.0;
			}
		}
	}

	_update() {
		if (!this.fading) {
			return;
		}
		const now = this.system.clock.time;
		const elapsed = now - this.fadeStartTime;
		if (elapsed >= FADE_DURATION) {
			this.level = this.fadeTargetLevel;
			this.fading = false;
		} else {
			const t = elapsed / FADE_DURATION;
			this.level = this.fadeStartLevel + (this.fadeTargetLevel - this.fadeStartLevel) * t;
		}
	}

	loop() {
		super.loop();
		this._update();
		if (this.level <= 0.0) {
			this.clear();
			return;
		}
		let color;
		if (this.mode === 0) {
			const coolR = 0.8, coolG = 0.8, coolB = 1.0;
			const warmR = 1.0, warmG = 0.6, warmB = 0.2;
			const t = this.temperature;
			const r = (coolR + t * (warmR - coolR)) * this.level;
			const g = (coolG + t * (warmG - coolG)) * this.level;
			const b = (coolB + t * (warmB - coolB)) * this.level;
			const r8 = Math.floor(r * 255);
			const g8 = Math.floor(g * 255);
			const b8 = Math.floor(b * 255);
			color = (r8 << 16) | (g8 << 8) | b8;
		} else {
			color = hsvToRgb(this.hue, 1, this.level);
		}
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = color;
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE || event.command === Command.B) {
			this._levelPressed();
		} else if (event.command === Command.FIRE2) {
			this._modePressed();
		} else if (event.command === Command.A || event.command === Command.DOWN) {
			this._levelLeft();
		} else if (event.command === Command.C || event.command === Command.UP) {
			this._levelRight();
		} else if (event.command === Command.LEFT) {
			this._modeLeft();
		} else if (event.command === Command.RIGHT) {
			this._modeRight();
		} else if (event.command === Command.ENCODER_LEFT) {
			this._levelLeft();
		} else if (event.command === Command.ENCODER_RIGHT) {
			this._levelRight();
		} else if (event.command === Command.ENCODER2_LEFT) {
			this._modeLeft();
		} else if (event.command === Command.ENCODER2_RIGHT) {
			this._modeRight();
		}
	}
}
