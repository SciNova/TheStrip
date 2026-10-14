import { Game, Colors, Sound, Command } from './system.js';

export class Bomberman extends Game {
	static PLAYER_SPEED = 0.8; // resolution-fraction/sec
	static ENEMY_SPEED = 0.35; // resolution-fraction/sec
	static BOMB_FUSE = 2.2; // seconds
	static MAX_BOMBS = 1;
	static BLAST_RADIUS = 7; // pixels
	static BLAST_DURATION = 0.4; // seconds
	static MAX_LIVES = 3;

	constructor(system) {
		super('Bomberman', system);
		this._resetGame();
	}

	_resetGame() {
		this.playerPos = this.resolution * 0.25;
		this.playerDir = 0;
		this.enemyPos = this.resolution * 0.75;
		this.enemyDir = 1;
		this.score = 0;
		this.lives = Bomberman.MAX_LIVES;
		this.bombs = [];
		this.stage = 'PLAYING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'PLAYING') {
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
		this.playerPos += this.playerDir * Bomberman.PLAYER_SPEED * this.resolution * dt;
		if (this.playerPos < 0) {
			this.playerPos = 0;
		} else if (this.playerPos > this.resolution - 1) {
			this.playerPos = this.resolution - 1;
		}

		this.enemyPos += this.enemyDir * Bomberman.ENEMY_SPEED * this.resolution * dt;
		if (this.enemyPos < 0) {
			this.enemyPos = 0;
			this.enemyDir = 1;
		} else if (this.enemyPos > this.resolution - 1) {
			this.enemyPos = this.resolution - 1;
			this.enemyDir = -1;
		}

		let playerHit = false;
		const survivors = [];
		for (const bomb of this.bombs) {
			if (bomb.exploding) {
				bomb.blastTimer -= dt;
				if (Math.abs(this.enemyPos - bomb.pos) < Bomberman.BLAST_RADIUS && !bomb.gotEnemy) {
					bomb.gotEnemy = true;
					this.score += 1;
					this.audio.play(Sound.HIT);
					this.enemyPos = Math.random() * (this.resolution - 1);
					this.enemyDir = Math.random() < 0.5 ? 1 : -1;
				}
				if (Math.abs(this.playerPos - bomb.pos) < Bomberman.BLAST_RADIUS) {
					playerHit = true;
				}
				if (bomb.blastTimer > 0.0) {
					survivors.push(bomb);
				}
			} else {
				bomb.fuse -= dt;
				if (bomb.fuse <= 0.0) {
					bomb.exploding = true;
					bomb.blastTimer = Bomberman.BLAST_DURATION;
					bomb.gotEnemy = false;
					this.audio.play(Sound.HIT);
				}
				survivors.push(bomb);
			}
		}
		this.bombs = survivors;

		if (playerHit) {
			this.lives -= 1;
			this.audio.play(Sound.MISS);
			if (this.lives <= 0) {
				this.stage = 'GAMEOVER';
				this.audio.play(Sound.LEVEL_FAIL);
				this.delay(3.0);
			} else {
				this.playerPos = this.resolution * 0.25;
				this.delay(0.6);
			}
		}

		this._render();
	}

	_placeBomb() {
		const active = this.bombs.filter((b) => !b.exploding).length;
		if (active >= Bomberman.MAX_BOMBS) {
			return;
		}
		this.bombs.push({ pos: this.playerPos, fuse: Bomberman.BOMB_FUSE, exploding: false });
		this.audio.play(Sound.TICK);
	}

	handleInput(padId, event) {
		if (this.stage !== 'PLAYING') {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.playerDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.playerDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.playerDir === -1) {
				this.playerDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.playerDir === 1) {
				this.playerDir = 0;
			}
		} else if (event.command === Command.FIRE_PRESS) {
			this._placeBomb();
		}
	}

	_render() {
		this.clear();

		for (const bomb of this.bombs) {
			if (bomb.exploding) {
				const fade = Math.max(0.0, bomb.blastTimer / Bomberman.BLAST_DURATION);
				const v = Math.floor(0xFF * (0.5 + 0.5 * fade));
				const color = (v << 16) | (Math.floor(v * 0.8) << 8);
				const center = Math.round(bomb.pos);
				const radius = Math.round(Bomberman.BLAST_RADIUS * fade);
				for (let i = -radius; i <= radius; i++) {
					const pos = center + i;
					if (pos >= 0 && pos < this.resolution) {
						this.pixels[pos] = color;
					}
				}
			} else {
				const approach = 1.0 - Math.max(0.0, bomb.fuse / Bomberman.BOMB_FUSE);
				const r = Math.min(0xFF, Math.floor(0xAA + 0x55 * approach));
				const g = Math.floor(0x55 * (1.0 - approach));
				const color = (r << 16) | g;
				const pos = Math.round(bomb.pos);
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		const enemyPos = Math.round(this.enemyPos);
		if (enemyPos >= 0 && enemyPos < this.resolution) {
			this.pixels[enemyPos] = Colors.RED;
		}

		const playerPos = Math.round(this.playerPos);
		if (playerPos >= 0 && playerPos < this.resolution) {
			this.pixels[playerPos] = Colors.CYAN;
		}
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
