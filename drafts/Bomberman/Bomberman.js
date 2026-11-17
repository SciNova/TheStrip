import { Game, Colors, Command } from '../../core/system.js';
import { SampleID } from '../../core/audio-common.js';

function lerp(min, max, t) {
	return min + (max - min) * t;
}

class Bomb {
	static MIN_FUSE = 1.0; // seconds, timeout=0
	static MAX_FUSE = 3.0; // seconds, timeout=1
	static MIN_BLAST = 3; // pixels, size=0
	static MAX_BLAST = 10; // pixels, size=1
	static BLAST_DURATION = 0.4; // seconds

	constructor(game, location, size, timeout) {
		this.game = game;
		this.location = location;
		this.size = size;
		this.timeout = timeout;
		this.timestamp = game.time;
		this.exploding = false;
		this.expired = false;
	}

	fuse() {
		return lerp(Bomb.MIN_FUSE, Bomb.MAX_FUSE, this.timeout);
	}

	blastRadius() {
		return lerp(Bomb.MIN_BLAST, Bomb.MAX_BLAST, this.size);
	}

	update() {
		const elapsed = this.game.time - this.timestamp;
		if (!this.exploding) {
			if (elapsed >= this.fuse()) {
				this.exploding = true;
				this.blastStart = elapsed;
				this.game.audio.play(SampleID.HIT);
			}
		} else {
			if (elapsed - this.blastStart >= Bomb.BLAST_DURATION) {
				this.expired = true;
			}
		}
	}

	render() {
		if (this.exploding) {
			const elapsed = this.game.time - this.timestamp;
			const fade = Math.max(0.0, 1.0 - (elapsed - this.blastStart) / Bomb.BLAST_DURATION);
			const v = Math.floor(0xFF * (0.5 + 0.5 * fade));
			const color = (v << 16) | (v << 8);
			const center = Math.round(this.location);
			const radius = Math.round(this.blastRadius() * fade);
			for (let i = -radius; i <= radius; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.game.resolution) {
					this.game.pixels[pos] = color;
				}
			}
		} else {
			const elapsed = this.game.time - this.timestamp;
			const approach = Math.min(1.0, elapsed / this.fuse());
			const v = Math.floor(0x55 + 0xAA * approach);
			const color = (v << 16) | (v << 8);
			const pos = Math.round(this.location);
			if (pos >= 0 && pos < this.game.resolution) {
				this.game.pixels[pos] = color;
			}
		}
	}
}

class Player {
	static SPEED = 0.8; // screens/sec
	static SIZE = 0.5;
	static TIMEOUT = 0.5;

	constructor(game) {
		this.game = game;
		this.location = game.resolution * 0.25;
		this.speed = 0.0;
		this.bomb = null;
	}

	update() {
		const dt = this.game.system.clock.delta;
		this.location += this.speed * this.game.resolution * dt;
		if (this.location < 0) {
			this.location = 0;
		} else if (this.location > this.game.resolution - 1) {
			this.location = this.game.resolution - 1;
		}
		if (this.bomb && this.bomb.expired) {
			this.bomb = null;
		}
	}

	render() {
		const pos = Math.round(this.location);
		if (pos >= 0 && pos < this.game.resolution) {
			this.game.pixels[pos] = Colors.CYAN;
		}
	}

	plant() {
		if (this.bomb) {
			return;
		}
		this.bomb = new Bomb(this.game, this.location, Player.SIZE, Player.TIMEOUT);
		this.game.plant(this.bomb);
		this.game.audio.play(SampleID.TICK);
		this.game._playerPlanted();
	}
}

class Enemy {
	static MIN_SPEED = 0.2; // screens/sec, rank=0
	static MAX_SPEED = 0.5; // screens/sec, rank=1

	constructor(game, rank = 0.5) {
		this.game = game;
		this.rank = rank;
		this.location = game.resolution * 0.75;
		const magnitude = lerp(Enemy.MAX_SPEED, Enemy.MIN_SPEED, rank);
		this.speed = magnitude;
		this.bomb = null;
	}

	update() {
		const dt = this.game.system.clock.delta;
		this.location += this.speed * this.game.resolution * dt;
		if (this.location < 0) {
			this.location = 0;
			this.speed = Math.abs(this.speed);
		} else if (this.location > this.game.resolution - 1) {
			this.location = this.game.resolution - 1;
			this.speed = -Math.abs(this.speed);
		}
		if (this.bomb && this.bomb.expired) {
			this.bomb = null;
		}
		if (!this.bomb) {
			this.plant();
		}
	}

	render() {
		const pos = Math.round(this.location);
		if (pos >= 0 && pos < this.game.resolution) {
			this.game.pixels[pos] = Colors.RED;
		}
	}

	plant() {
		this.bomb = new Bomb(this.game, this.location, this.rank, this.rank);
		this.game.plant(this.bomb);
		this.game.audio.play(SampleID.TICK);
	}
}

export class Bomberman extends Game {
	static MAX_LIVES = 3;
	static LEVELS = 11;
	static BOMBS_PER_LEVEL = 4;
	static RANK_STEP = 0.1;

	constructor(system) {
		super('Bomberman', system);
		this._resetGame();
	}

	_resetGame() {
		this.player = new Player(this);
		this.enemies = [new Enemy(this, 0.5)];
		this.bombs = [];
		this.score = 0;
		this.lives = Bomberman.MAX_LIVES;
		this.bombsPlantedThisLevel = 0;
		this.stage = 'PLAYING';
	}

	plant(bomb) {
		this.bombs.push(bomb);
	}

	_playerPlanted() {
		this.bombsPlantedThisLevel += 1;
		if (this.bombsPlantedThisLevel >= Bomberman.BOMBS_PER_LEVEL && this.level < Bomberman.LEVELS - 1) {
			this.bombsPlantedThisLevel = 0;
			this.nextLevel();
			this._addEnemy();
		}
	}

	_addEnemy() {
		const step = Math.ceil(this.level / 2);
		const rank = (this.level % 2 === 1)
			? 0.5 - step * Bomberman.RANK_STEP
			: 0.5 + step * Bomberman.RANK_STEP;
		this.enemies.push(new Enemy(this, rank));
	}

	loop() {
		super.loop();

		if (this.stage === 'PLAYING') {
			this._loopPlaying();
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopPlaying() {
		this.player.update();
		for (const enemy of this.enemies) {
			enemy.update();
		}
		for (const bomb of this.bombs) {
			bomb.update();
		}
		this.bombs = this.bombs.filter((bomb) => !bomb.expired);

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== 'PLAYING') {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.player.speed = -Player.SPEED;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.player.speed = Player.SPEED;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.player.speed === -Player.SPEED) {
				this.player.speed = 0.0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.player.speed === Player.SPEED) {
				this.player.speed = 0.0;
			}
		} else if (event.command === Command.FIRE_PRESS) {
			this.player.plant();
		}
	}

	_render() {
		this.clear();
		for (const bomb of this.bombs) {
			bomb.render();
		}
		for (const enemy of this.enemies) {
			enemy.render();
		}
		this.player.render();
	}

	_renderGameOver() {
		this.clear();
		const lit = Math.min(this.score, this.resolution);
		for (let i = 0; i < lit; i++) {
			this.pixels[i] = Colors.DARK_RED;
		}
		const flashOn = Math.floor(this.time * 4) % 2 === 0;
		if (flashOn) {
			for (let i = 0; i < this.resolution; i++) {
				if (this.pixels[i] === 0) {
					this.pixels[i] = Colors.RED;
				}
			}
		}
	}
}
