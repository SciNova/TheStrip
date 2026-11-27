import { Game } from '../../core/Game.js';
import { Command } from '../../core/Command.js';

const PLASMA_SPEED = 1.8;
const PLASMA_WARP = 0.35;
const THEME_FADE_DURATION = 1.5;
const SPEED_MIN = 0.0;
const SPEED_MAX = 2.0;
const SPEED_STEP = 0.1;
const SPEED_RAMP_SPEED = 2.0;

const THEME_SCALES = [
	1.2,
	2.4,
	5.5,
];

const THEME_COLORS = [
	[[0, 10, 60], [20, 70, 160], [110, 170, 230], [255, 255, 255]],
	[[8, 45, 18], [30, 115, 55], [110, 125, 80], [196, 155, 110]],
	[[60, 0, 0], [180, 30, 0], [255, 120, 0], [255, 200, 40]],
];

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function smoothstep(t) {
	return t * t * (3 - 2 * t);
}

function sampleGradient(stops, t) {
	const clamped = Math.max(0, Math.min(1, t));
	const segments = stops.length - 1;
	const scaled = clamped * segments;
	const idx = Math.min(segments - 1, Math.floor(scaled));
	const frac = scaled - idx;
	const a = stops[idx];
	const b = stops[idx + 1];
	return [lerp(a[0], b[0], frac), lerp(a[1], b[1], frac), lerp(a[2], b[2], frac)];
}

function plasmaValue(pos, t, scale) {
	const twoPi = Math.PI * 2;
	const x = pos * scale * twoPi;
	const warp = PLASMA_WARP * Math.sin(t * 0.31 + x * 0.5);
	let v = 0;
	v += Math.sin(x + warp + t);
	v += Math.sin(x * 1.7 - t * 0.8 + 2.1);
	v += Math.sin(x * 0.46 + t * 1.6 + 4.0);
	v += Math.sin((x + warp) * 2.3 - t * 1.1);
	return v * 0.25;
}

export class Moodlight extends Game {
	constructor(system) {
		super('Moodlight', system);
		this.activeTheme = 0;
		this.fadeFromTheme = null;
		this.fadeProgress = 0.0;
		this.speed = 1.0;
		this.phase = [0.0, 0.0, 0.0];
		this.speedRampDirection = 0;
	}

	_themeColor(themeIndex, pos) {
		const v = plasmaValue(pos, this.phase[themeIndex], THEME_SCALES[themeIndex]);
		return sampleGradient(THEME_COLORS[themeIndex], (v + 1) * 0.5);
	}

	_plasmaRender(dt) {
		this.phase[this.activeTheme] += dt * this.speed * PLASMA_SPEED;

		const fadeFromTheme = this.fadeFromTheme;
		const fading = fadeFromTheme !== null;
		let mix = 1.0;
		if (fading) {
			this.phase[fadeFromTheme] += dt * this.speed * PLASMA_SPEED;
			this.fadeProgress += Math.abs(dt) / THEME_FADE_DURATION;
			mix = smoothstep(Math.min(1.0, this.fadeProgress));
			if (this.fadeProgress >= 1.0) {
				this.fadeFromTheme = null;
				this.fadeProgress = 0.0;
			}
		}

		for (let i = 0; i < this.resolution; i++) {
			const pos = i / this.resolution;
			const [r, g, b] = this._themeColor(this.activeTheme, pos);
			let outR = r, outG = g, outB = b;
			if (fading) {
				const [fr, fg, fb] = this._themeColor(fadeFromTheme, pos);
				outR = lerp(fr, r, mix);
				outG = lerp(fg, g, mix);
				outB = lerp(fb, b, mix);
			}
			this.pixels[i] = (Math.round(outR) << 16) | (Math.round(outG) << 8) | Math.round(outB);
		}
	}

	_updateSpeedRamp() {
		if (this.speedRampDirection === 0) {
			return;
		}
		const dt = this.system.clock.delta;
		this.speed += this.speedRampDirection * SPEED_RAMP_SPEED * dt;
		this.speed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, this.speed));
	}

	loop() {
		super.loop();
		this._updateSpeedRamp();
		const dt = this.system.clock.delta;
		this._plasmaRender(dt);
	}

	_switchTheme() {
		const next = (this.activeTheme + 1) % THEME_COLORS.length;
		this.fadeFromTheme = this.activeTheme;
		this.fadeProgress = 0.0;
		this.activeTheme = next;
	}

	_speedStep(direction) {
		this.speed += direction * SPEED_STEP;
		this.speed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, this.speed));
	}

	handleInput(padId, event) {
		switch (event.command) {
			case Command.FIRE_PRESS:
			case Command.FIRE2_PRESS:
			case Command.A_PRESS:
			case Command.B_PRESS:
			case Command.C_PRESS:
			case Command.D_PRESS:
				this._switchTheme();
				break;

			case Command.DOWN_PRESS:
			case Command.LEFT_PRESS:
				this.speedRampDirection = -1;
				break;

			case Command.UP_PRESS:
			case Command.RIGHT_PRESS:
				this.speedRampDirection = 1;
				break;

			case Command.DOWN_RELEASE:
			case Command.LEFT_RELEASE:
				if (this.speedRampDirection === -1) {
					this.speedRampDirection = 0;
				}
				break;

			case Command.UP_RELEASE:
			case Command.RIGHT_RELEASE:
				if (this.speedRampDirection === 1) {
					this.speedRampDirection = 0;
				}
				break;

			case Command.ENCODER_LEFT:
				this._speedStep(-1);
				break;

			case Command.ENCODER_RIGHT:
				this._speedStep(1);
				break;
		}
	}
}
