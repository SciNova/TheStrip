import { Game, Command } from './system.js';

const FADE_DURATION = 1.0;

export class WhiteLight extends Game {
	constructor(system) {
		super('WhiteLight', system);
		this.level = 0.5;
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

	loop() {
		super.loop();
		this._updateFade();
		const brightness = Math.floor(this.level * 255);
		const color = (brightness << 16) | (brightness << 8) | brightness;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = color;
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE || event.command === Command.FIRE2 || event.command === Command.B) {
			this._levelPressed();
		} else if (event.command === Command.A || event.command === Command.DOWN || event.command === Command.LEFT) {
			this._levelLeft();
		} else if (event.command === Command.C || event.command === Command.UP || event.command === Command.RIGHT) {
			this._levelRight();
		} else if (event.command === Command.ENCODER_LEFT) {
			this._levelLeft();
		} else if (event.command === Command.ENCODER_RIGHT) {
			this._levelRight();
		}
	}
}
