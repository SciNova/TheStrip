import { Game, Color, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio.js';

const SubmarineStage = Object.freeze({ PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' });

export class Submarine extends Game {
	static SUB_SPEED = 0.8;
	static SURFACE_ZONE = 0.12;
	static OXYGEN_DRAIN_RATE = 0.045;
	static OXYGEN_REFILL_RATE = 0.22;
	static MINE_FUSE_TIME = 3.5;
	static MIN_FUSE_TIME = 1.6;
	static FUSE_TIME_STEP = 0.06;
	static BASE_SPAWN_INTERVAL = 1.5;
	static MIN_SPAWN_INTERVAL = 0.6;
	static SPAWN_INTERVAL_STEP = 0.03;
	static MINE_RADIUS = 4;
	static MAX_LIVES = 3;
	static MIN_MINE_SIZE = 1;
	static MAX_MINE_SIZE = 5;

	constructor(system) {
		super('Submarine', system);
		this._resetGame();
	}

	_resetGame() {
		this.depth = this.resolution / 2.0;
		this.moveDir = 0;
		this.oxygen = 1.0;
		this.score = 0;
		this.lives = Submarine.MAX_LIVES;
		this.fuseTime = Submarine.MINE_FUSE_TIME;
		this.spawnInterval = Submarine.BASE_SPAWN_INTERVAL;
		this.spawnTimer = 1.0;
		this.mines = [];
		this.stage = SubmarineStage.PLAYING;
	}

	_spawnMine() {
		const surfacePixels = Submarine.SURFACE_ZONE * this.resolution;
		const pos = surfacePixels + Math.random() * (this.resolution - 1 - surfacePixels);
		this.mines.push({ pos, timer: this.fuseTime, fuse: this.fuseTime });
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === SubmarineStage.PLAYING) {
			this._loopPlaying(dt);
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
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

		this.depth += this.moveDir * Submarine.SUB_SPEED * this.resolution * dt;
		if (this.depth < 0) {
			this.depth = 0;
		} else if (this.depth > this.resolution - 1) {
			this.depth = this.resolution - 1;
		}

		const surfacePixels = Submarine.SURFACE_ZONE * this.resolution;
		if (this.depth < surfacePixels) {
			this.oxygen += Submarine.OXYGEN_REFILL_RATE * dt;
		} else {
			this.oxygen -= Submarine.OXYGEN_DRAIN_RATE * dt;
		}
		if (this.oxygen > 1.0) {
			this.oxygen = 1.0;
		}

		this.spawnTimer -= dt;
		if (this.spawnTimer <= 0.0) {
			this._spawnMine();
			this.spawnTimer = this.spawnInterval;
		}

		let hit = false;
		const survivors = [];
		for (const mine of this.mines) {
			mine.timer -= dt;
			if (mine.timer > 0.0) {
				survivors.push(mine);
				continue;
			}
			if (Math.abs(mine.pos - this.depth) < Submarine.MINE_RADIUS) {
				hit = true;
			} else {
				this.score += 1;
				this.fuseTime = Math.max(Submarine.MIN_FUSE_TIME, this.fuseTime - Submarine.FUSE_TIME_STEP);
				this.spawnInterval = Math.max(Submarine.MIN_SPAWN_INTERVAL, this.spawnInterval - Submarine.SPAWN_INTERVAL_STEP);
				this.audio.playSynth(SystemSound.TICK);
			}
		}
		this.mines = survivors;

		let drowned = false;
		if (this.oxygen <= 0.0) {
			drowned = true;
		}

		if (hit || drowned) {
			this.lives -= 1;
			this.audio.playSynth(hit ? SystemSound.EXPLOSION : SystemSound.WARNING);
			if (this.lives <= 0) {
				this.stage = SubmarineStage.GAMEOVER;
				this.audio.play(SystemSound.BOOING);
				this.delay(3.0);
			} else {
				this.oxygen = 1.0;
				this.mines = [];
				this.delay(0.6);
			}
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== SubmarineStage.PLAYING) {
			return;
		}
		if (event.command === Command.UP_PRESS) {
			this.moveDir = -1;
		} else if (event.command === Command.DOWN_PRESS) {
			this.moveDir = 1;
		} else if (event.command === Command.UP_RELEASE) {
			if (this.moveDir === -1) {
				this.moveDir = 0;
			}
		} else if (event.command === Command.DOWN_RELEASE) {
			if (this.moveDir === 1) {
				this.moveDir = 0;
			}
		}
	}

	_render() {
		this.clear();

		const oxygenBrightness = 0.08 + 0.3 * this.oxygen;
		const bg = Math.floor(0xFF * oxygenBrightness);
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = bg;
		}

		const surfacePixels = Math.round(Submarine.SURFACE_ZONE * this.resolution);
		for (let i = 0; i < surfacePixels && i < this.resolution; i++) {
			this.pixels[i] = Color.CYAN;
		}

		for (const mine of this.mines) {
			const approach = 1.0 - Math.max(0.0, Math.min(1.0, mine.timer / mine.fuse));
			const brightness = 0.3 + 0.7 * approach;
			const r = Math.floor(0xFF * brightness);
			const g = Math.floor(0x55 * brightness);
			const color = (r << 16) | (g << 8);
			const size = Submarine.MIN_MINE_SIZE + Math.round(approach * (Submarine.MAX_MINE_SIZE - Submarine.MIN_MINE_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.round(mine.pos);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		const subCenter = Math.round(this.depth);
		for (let i = -1; i <= 1; i++) {
			const pos = subCenter + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Color.WHITE;
			}
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
