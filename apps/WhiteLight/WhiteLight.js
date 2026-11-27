import { Game } from '../../core/Game.js';
import { Command } from '../../core/Command.js';

const FADE_DURATION = 1.0;
const RAMP_SPEED = 0.5;

export class WhiteLight extends Game {
	constructor(system) {
		super('WhiteLight', system);
		this.level = 0.5;
		this.fading = false;
		this.fadeStartTime = 0.0;
		this.fadeStartLevel = 0.0;
		this.fadeTargetLevel = 0.0;
		this.rampDirection = 0;
	}

	_levelStep(direction) {
		this.fading = false;
		this.level += direction / 100.0;
		this.level = Math.max(0.0, Math.min(1.0, this.level));
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

	_updateRamp() {
		if (this.rampDirection === 0) {
			return;
		}
		this.fading = false;
		const dt = this.system.clock.delta;
		this.level += this.rampDirection * RAMP_SPEED * dt;
		this.level = Math.max(0.0, Math.min(1.0, this.level));
	}

	loop() {
		super.loop();
		this._updateFade();
		this._updateRamp();
		const brightness = Math.floor(this.level * 255);
		const color = (brightness << 16) | (brightness << 8) | brightness;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = color;
		}
	}

	handleInput(padId, event) {
		switch (event.command) {
			case Command.FIRE_PRESS:
			case Command.FIRE2_PRESS:
			case Command.A_PRESS:
			case Command.B_PRESS:
			case Command.C_PRESS:
			case Command.D_PRESS:
				this._levelPressed();
				break;

			case Command.DOWN_PRESS:
			case Command.LEFT_PRESS:
				this.rampDirection = -1;
				break;

			case Command.UP_PRESS:
			case Command.RIGHT_PRESS:
				this.rampDirection = 1;
				break;

			case Command.DOWN_RELEASE:
			case Command.LEFT_RELEASE:
				if (this.rampDirection === -1) {
					this.rampDirection = 0;
				}
				break;

			case Command.UP_RELEASE:
			case Command.RIGHT_RELEASE:
				if (this.rampDirection === 1) {
					this.rampDirection = 0;
				}
				break;

			case Command.ENCODER_LEFT:
				this._levelStep(-1);
				break;

			case Command.ENCODER_RIGHT:
				this._levelStep(1);
				break;
		}
	}
}
