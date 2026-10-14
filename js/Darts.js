import { Game, Colors, Sound, Command } from './system.js';

const ZONES = [
	{ radius: 0.05, score: 50, color: Colors.RED, name: 'Bullseye' },
	{ radius: 0.15, score: 25, color: Colors.YELLOW, name: 'Inner' },
	{ radius: 0.35, score: 10, color: Colors.GREEN, name: 'Outer' },
	{ radius: 0.7, score: 5, color: Colors.BLUE, name: 'Board' },
	{ radius: 1.01, score: 0, color: Colors.DARK_GRAY, name: 'Miss' },
];

export class Darts extends Game {
	static BASE_SWING_SPEED = 1.8; // radians/sec
	static SWING_SPEED_PER_ROUND = 0.05;
	static MAX_SWING_SPEED = 3.5;
	static THROWS_PER_ROUND = 3;
	static RESULT_FLASH = 0.6; // seconds

	constructor(system) {
		super('Darts', system);
		this.round = 0;
		this.totalScore = 0;
		this._startRound();
	}

	_startRound() {
		this.roundScore = 0;
		this.throwsLeft = Darts.THROWS_PER_ROUND;
		this.swingSpeed = Math.min(Darts.MAX_SWING_SPEED, Darts.BASE_SWING_SPEED + this.round * Darts.SWING_SPEED_PER_ROUND);
		this.stage = 'AIMING';
	}

	loop() {
		super.loop();

		if (this.stage === 'RESULT') {
			if (this.delayTime <= 0.0) {
				if (this.throwsLeft <= 0) {
					this.round += 1;
					this.totalScore += this.roundScore;
					this._startRound();
				} else {
					this.stage = 'AIMING';
				}
			}
		}

		this._render();
	}

	_needlePos() {
		const half = this.resolution / 2.0;
		return half + half * Math.sin(this.time * this.swingSpeed);
	}

	_throw() {
		if (this.stage !== 'AIMING') {
			return;
		}
		const needle = this._needlePos();
		const distFraction = Math.abs(needle - this.resolution / 2.0) / (this.resolution / 2.0);
		const zone = ZONES.find((z) => distFraction < z.radius);
		this.lastZone = zone;
		this.lastPos = needle;
		this.roundScore += zone.score;
		this.throwsLeft -= 1;
		this.audio.play(zone.score > 0 ? Sound.HIT : Sound.MISS);
		this.stage = 'RESULT';
		this.delay(Darts.RESULT_FLASH);
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE_PRESS) {
			this._throw();
		}
	}

	_render() {
		this.clear();

		const half = this.resolution / 2.0;
		for (let i = 0; i < this.resolution; i++) {
			const distFraction = Math.abs(i - half) / half;
			const zone = ZONES.find((z) => distFraction < z.radius);
			const r = ((zone.color >> 16) & 0xFF) * 0.3;
			const g = ((zone.color >> 8) & 0xFF) * 0.3;
			const b = (zone.color & 0xFF) * 0.3;
			this.pixels[i] = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
		}

		if (this.stage === 'AIMING') {
			const needle = Math.round(this._needlePos());
			if (needle >= 0 && needle < this.resolution) {
				this.pixels[needle] = Colors.WHITE;
			}
		} else if (this.stage === 'RESULT' && this.lastZone) {
			const flashOn = Math.floor(this.time * 8) % 2 === 0;
			const pos = Math.round(this.lastPos);
			if (flashOn && pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = this.lastZone.color;
			}
		}
	}
}
