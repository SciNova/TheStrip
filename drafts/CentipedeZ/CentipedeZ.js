import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

export class CentipedeZ extends Game {
	static SPAWN_Z = 9.0;
	static CRASH_Z = 0.3;
	static Z_PER_S = 0.35;
	static BASE_CHAIN_SPEED = 0.9;
	static SPEED_PER_WAVE = 0.05;
	static SEGMENT_GAP = 0.55;
	static BASE_LENGTH = 8;
	static LENGTH_PER_WAVE = 1;
	static AMPLITUDE = 0.32;
	static FREQUENCY = 1.3;
	static AIM_SPEED = 0.9;
	static HIT_TOLERANCE = 5;
	static FIRE_COOLDOWN = 0.15;
	static MAX_LIVES = 3;
	static MIN_SEGMENT_SIZE = 1;
	static MAX_SEGMENT_SIZE = 3;

	constructor(system) {
		super('CentipedeZ', system);
		this.wave = 0;
		this.score = 0;
		this.lives = CentipedeZ.MAX_LIVES;
		this._startWave();
	}

	_startWave() {
		this.chainSpeed = CentipedeZ.BASE_CHAIN_SPEED + this.wave * CentipedeZ.SPEED_PER_WAVE;
		this.chains = [{ headS: 0.0, length: CentipedeZ.BASE_LENGTH + this.wave * CentipedeZ.LENGTH_PER_WAVE }];
		this.aimPos = this.resolution / 2.0;
		this.aimDir = 0;
		this.fireCooldown = 0.0;
		this.stage = 'PLAYING';
	}

	_segmentPos(s) {
		const z = CentipedeZ.SPAWN_Z * this.resolution - s * CentipedeZ.Z_PER_S * this.resolution;
		const amplitude = CentipedeZ.AMPLITUDE * this.resolution;
		const x = this.resolution / 2 + amplitude * Math.sin(s * CentipedeZ.FREQUENCY);
		return { x, z };
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'PLAYING') {
			this._loopPlaying(dt);
		} else {
			if (this.delayTime <= 0.0) {
				if (this.lives <= 0) {
					this.wave = 0;
					this.score = 0;
					this.lives = CentipedeZ.MAX_LIVES;
				}
				this._startWave();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopPlaying(dt) {
		if (this.delayTime > 0.0) {
			this._render();
			return;
		}

		this.aimPos += this.aimDir * CentipedeZ.AIM_SPEED * this.resolution * dt;
		if (this.aimPos < 0) {
			this.aimPos = 0;
		} else if (this.aimPos > this.resolution - 1) {
			this.aimPos = this.resolution - 1;
		}
		if (this.fireCooldown > 0.0) {
			this.fireCooldown -= dt;
		}

		for (const chain of this.chains) {
			chain.headS += this.chainSpeed * dt;
		}

		const crashZ = CentipedeZ.CRASH_Z * this.resolution;
		let playerHit = false;
		const survivors = [];
		for (const chain of this.chains) {
			const head = this._segmentPos(chain.headS);
			if (head.z <= crashZ) {
				playerHit = true;
			} else {
				survivors.push(chain);
			}
		}
		this.chains = survivors;

		if (playerHit) {
			this.lives -= 1;
			this.audio.playSynth(SystemSound.WARNING);
			if (this.lives <= 0) {
				this.stage = 'GAMEOVER';
				this.audio.play(SystemSound.BOOING);
				this.delay(3.0);
				this._render();
				return;
			}
			this.delay(0.6);
		}

		if (this.chains.length === 0) {
			this.wave += 1;
			this._startWave();
			return;
		}

		this._render();
	}

	_fire() {
		if (this.fireCooldown > 0.0) {
			return;
		}
		this.fireCooldown = CentipedeZ.FIRE_COOLDOWN;

		let best = null;
		let bestDist = CentipedeZ.HIT_TOLERANCE;
		for (let ci = 0; ci < this.chains.length; ci++) {
			const chain = this.chains[ci];
			for (let k = 0; k < chain.length; k++) {
				const s = chain.headS - k * CentipedeZ.SEGMENT_GAP;
				if (s < 0) {
					continue;
				}
				const seg = this._segmentPos(s);
				if (seg.z <= 0) {
					continue;
				}
				const dist = Math.abs(seg.x - this.aimPos);
				if (dist < bestDist) {
					bestDist = dist;
					best = { ci, k };
				}
			}
		}

		if (best) {
			this._destroySegment(best.ci, best.k);
			this.score += 1;
			this.audio.playSynth(SystemSound.EXPLOSION);
		} else {
			this.audio.playSynth(SystemSound.SHOOT);
		}
	}

	_destroySegment(ci, k) {
		const chain = this.chains[ci];
		this.chains.splice(ci, 1);

		if (k === 0) {
			const newChain = { headS: chain.headS - CentipedeZ.SEGMENT_GAP, length: chain.length - 1 };
			if (newChain.length > 0) {
				this.chains.push(newChain);
			}
			return;
		}
		if (k === chain.length - 1) {
			const newChain = { headS: chain.headS, length: chain.length - 1 };
			if (newChain.length > 0) {
				this.chains.push(newChain);
			}
			return;
		}

		const front = { headS: chain.headS, length: k };
		const back = { headS: chain.headS - (k + 1) * CentipedeZ.SEGMENT_GAP, length: chain.length - (k + 1) };
		if (front.length > 0) {
			this.chains.push(front);
		}
		if (back.length > 0) {
			this.chains.push(back);
		}
	}

	handleInput(padId, event) {
		if (this.stage !== 'PLAYING') {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.aimDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.aimDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.aimDir === -1) {
				this.aimDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.aimDir === 1) {
				this.aimDir = 0;
			}
		} else if (event.command === Command.FIRE_PRESS) {
			this._fire();
		}
	}

	_render() {
		this.clear();

		const items = [];
		for (const chain of this.chains) {
			for (let k = 0; k < chain.length; k++) {
				const s = chain.headS - k * CentipedeZ.SEGMENT_GAP;
				if (s < 0) {
					continue;
				}
				const seg = this._segmentPos(s);
				if (seg.z > 0) {
					items.push(seg);
				}
			}
		}
		items.sort((a, b) => b.z - a.z);

		for (const seg of items) {
			const approach = 1.0 - Math.min(1.0, seg.z / (CentipedeZ.SPAWN_Z * this.resolution));
			const brightness = 0.35 + 0.65 * approach;
			const g = Math.floor(0xFF * brightness);
			const color = g << 8;
			const size = CentipedeZ.MIN_SEGMENT_SIZE + Math.round(approach * (CentipedeZ.MAX_SEGMENT_SIZE - CentipedeZ.MIN_SEGMENT_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.round(seg.x);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		const blink = Math.floor(this.time * 8) % 2 === 0;
		const aimCenter = Math.round(this.aimPos);
		if (blink && aimCenter >= 0 && aimCenter < this.resolution) {
			this.pixels[aimCenter] = Color.WHITE;
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
