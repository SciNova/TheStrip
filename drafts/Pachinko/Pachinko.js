import { Game, Colors, Command } from '../../core/system.js';
import { SampleID } from '../../core/audio-common.js';

const SLOTS = [
	{ fraction: 0.5, width: 0.08, score: 50, color: Colors.YELLOW },
	{ fraction: 0.3, width: 0.1, score: 20, color: Colors.CYAN },
	{ fraction: 0.7, width: 0.1, score: 20, color: Colors.CYAN },
	{ fraction: 0.1, width: 0.1, score: 5, color: Colors.BLUE },
	{ fraction: 0.9, width: 0.1, score: 5, color: Colors.BLUE },
];

export class Pachinko extends Game {
	static NEEDLE_SPEED = 2.2; // radians/sec
	static DROP_SPEED = 0.6; // normalized z units/sec (z: 1 top -> 0 bottom)
	static PEG_INTERVAL = 0.12; // z units between peg jitters
	static PEG_KICK = 6; // pixels
	static RESULT_FLASH = 1.0; // seconds
	static MIN_BALL_SIZE = 1;
	static MAX_BALL_SIZE = 3;

	constructor(system) {
		super('Pachinko', system);
		this.score = 0;
		this.stage = 'AIMING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'DROPPING') {
			this._loopDropping(dt);
		} else if (this.stage === 'RESULT') {
			if (this.delayTime <= 0.0) {
				this.stage = 'AIMING';
			}
		}

		this._render();
	}

	_needlePos() {
		const half = this.resolution / 2.0;
		return half + half * Math.sin(this.time * Pachinko.NEEDLE_SPEED);
	}

	_drop() {
		if (this.stage !== 'AIMING') {
			return;
		}
		this.ballX = this._needlePos();
		this.ballZ = 1.0;
		this.nextPegZ = 1.0 - Pachinko.PEG_INTERVAL;
		this.stage = 'DROPPING';
		this.audio.play(SampleID.TICK);
	}

	_loopDropping(dt) {
		this.ballZ -= Pachinko.DROP_SPEED * dt;

		if (this.ballZ <= this.nextPegZ) {
			this.ballX += (Math.random() * 2 - 1) * Pachinko.PEG_KICK;
			if (this.ballX < 0) {
				this.ballX = -this.ballX;
			} else if (this.ballX > this.resolution - 1) {
				this.ballX = 2 * (this.resolution - 1) - this.ballX;
			}
			this.nextPegZ -= Pachinko.PEG_INTERVAL;
		}

		if (this.ballZ <= 0.0) {
			this.ballZ = 0.0;
			const fraction = this.ballX / this.resolution;
			let best = null;
			let bestDist = Infinity;
			for (const slot of SLOTS) {
				const dist = Math.abs(fraction - slot.fraction);
				if (dist < slot.width && dist < bestDist) {
					bestDist = dist;
					best = slot;
				}
			}
			this.lastSlot = best;
			if (best) {
				this.score += best.score;
				this.audio.play(SampleID.HIT);
			} else {
				this.audio.play(SampleID.MISS);
			}
			this.stage = 'RESULT';
			this.delay(Pachinko.RESULT_FLASH);
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE_PRESS) {
			this._drop();
		}
	}

	_render() {
		this.clear();

		for (const slot of SLOTS) {
			const center = slot.fraction * this.resolution;
			const half = (slot.width * this.resolution) / 2.0;
			const start = Math.max(0, Math.round(center - half));
			const end = Math.min(this.resolution - 1, Math.round(center + half));
			const r = ((slot.color >> 16) & 0xFF) * 0.25;
			const g = ((slot.color >> 8) & 0xFF) * 0.25;
			const b = (slot.color & 0xFF) * 0.25;
			const dim = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
			for (let i = start; i <= end; i++) {
				this.pixels[i] = dim;
			}
		}

		if (this.stage === 'AIMING') {
			const needle = Math.round(this._needlePos());
			if (needle >= 0 && needle < this.resolution) {
				this.pixels[needle] = Colors.WHITE;
			}
		} else if (this.stage === 'DROPPING') {
			const approach = 1.0 - this.ballZ;
			const brightness = 0.4 + 0.6 * approach;
			const v = Math.floor(0xFF * brightness);
			const size = Pachinko.MIN_BALL_SIZE + Math.round(approach * (Pachinko.MAX_BALL_SIZE - Pachinko.MIN_BALL_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.round(this.ballX);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = (v << 16) | (v << 8) | v;
				}
			}
		} else if (this.stage === 'RESULT') {
			const flashOn = Math.floor(this.time * 8) % 2 === 0;
			if (flashOn && this.lastSlot) {
				const center = Math.round(this.lastSlot.fraction * this.resolution);
				if (center >= 0 && center < this.resolution) {
					this.pixels[center] = this.lastSlot.color;
				}
			}
		}
	}
}
