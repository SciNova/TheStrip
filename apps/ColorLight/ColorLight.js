import { Game, Command, hsvToRgb } from '../../core/system.js';

const FADE_DURATION = 1.0;
const RAMP_SPEED = 0.5;

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
		this.levelRampDirection = 0;
		this.modeRampDirection = 0;
	}

	_levelStep(direction) {
		this.fading = false;
		this.level += direction / 100.0;
		this.level = Math.max(0.0, Math.min(1.0, this.level));
	}

	_modeStep(direction) {
		if (this.mode === 0) {
			this.temperature += direction / 50.0;
			this.temperature = Math.max(0.0, Math.min(1.0, this.temperature));
		} else {
			this.hue += direction / 360.0;
			this.hue = ((this.hue % 1.0) + 1.0) % 1.0;
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

	_updateFade() {
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

	_updateRamps() {
		const dt = this.system.clock.delta;

		if (this.levelRampDirection !== 0) {
			this.fading = false;
			this.level += this.levelRampDirection * RAMP_SPEED * dt;
			this.level = Math.max(0.0, Math.min(1.0, this.level));
		}

		if (this.modeRampDirection !== 0) {
			if (this.mode === 0) {
				this.temperature += this.modeRampDirection * RAMP_SPEED * dt;
				this.temperature = Math.max(0.0, Math.min(1.0, this.temperature));
			} else {
				this.hue += this.modeRampDirection * RAMP_SPEED * dt;
				this.hue = ((this.hue % 1.0) + 1.0) % 1.0;
			}
		}
	}

	loop() {
		super.loop();
		this._updateFade();
		this._updateRamps();
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
		switch (event.command) {
			case Command.FIRE_PRESS:
			case Command.A_PRESS:
			case Command.B_PRESS:
			case Command.C_PRESS:
			case Command.D_PRESS:
				this._levelPressed();
				break;

			case Command.FIRE2_PRESS:
				this._modePressed();
				break;

			case Command.DOWN_PRESS:
				this.levelRampDirection = -1;
				break;

			case Command.UP_PRESS:
				this.levelRampDirection = 1;
				break;

			case Command.DOWN_RELEASE:
				if (this.levelRampDirection === -1) {
					this.levelRampDirection = 0;
				}
				break;

			case Command.UP_RELEASE:
				if (this.levelRampDirection === 1) {
					this.levelRampDirection = 0;
				}
				break;

			case Command.LEFT_PRESS:
				this.modeRampDirection = -1;
				break;

			case Command.RIGHT_PRESS:
				this.modeRampDirection = 1;
				break;

			case Command.LEFT_RELEASE:
				if (this.modeRampDirection === -1) {
					this.modeRampDirection = 0;
				}
				break;

			case Command.RIGHT_RELEASE:
				if (this.modeRampDirection === 1) {
					this.modeRampDirection = 0;
				}
				break;

			case Command.ENCODER_LEFT:
				this._levelStep(-1);
				break;

			case Command.ENCODER_RIGHT:
				this._levelStep(1);
				break;

			case Command.ENCODER2_LEFT:
				this._modeStep(-1);
				break;

			case Command.ENCODER2_RIGHT:
				this._modeStep(1);
				break;
		}
	}
}
