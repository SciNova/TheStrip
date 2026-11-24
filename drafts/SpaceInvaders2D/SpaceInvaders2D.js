import { Game, Colors, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';

const InvadersStage = Object.freeze({ PLAYING: 'PLAYING', LEVEL_COMPLETE: 'LEVEL_COMPLETE', GAMEOVER: 'GAMEOVER' });

export class SpaceInvaders2D extends Game {
	static BASE_COLS = 6;
	static MAX_COLS = 10;
	static LANE_HALF_WIDTH = 1.0;
	static SPAWN_Z = 9.0;
	static CRASH_Z = 0.3;
	static BASE_DESCENT_SPEED = 0.05;
	static DESCENT_PER_LEVEL = 0.15;
	static DESCENT_STEP = 0.35;
	static MARCH_SPEED = 0.6;
	static MARCH_RANGE = 0.4;
	static TURRET_SPEED = 0.9;
	static PLAYER_BULLET_SPEED = 5.0;
	static ENEMY_BULLET_SPEED = 2.2;
	static HIT_TOLERANCE = 0.18;
	static PLAYER_HIT_TOLERANCE = 0.14;
	static Z_HIT_WINDOW = 0.4;
	static MAX_BULLET_RANGE = 10.0;
	static ENEMY_FIRE_MIN = 1.2;
	static ENEMY_FIRE_MAX = 3.0;
	static MAX_LIVES = 3;
	static FOCAL_LENGTH_FACTOR = 0.5;
	static FIRE_COOLDOWN = 0.25;

	constructor(system) {
		super('SpaceInvaders2D', system);
		this.level = 0;
		this.score = 0;
		this.lives = SpaceInvaders2D.MAX_LIVES;
		this._buildLevel();
	}

	_buildLevel() {
		const cols = Math.min(SpaceInvaders2D.MAX_COLS, SpaceInvaders2D.BASE_COLS + this.level);
		this.laneHalf = SpaceInvaders2D.LANE_HALF_WIDTH * this.resolution;
		const spread = this.laneHalf * 0.8;
		const spacing = cols > 1 ? (2 * spread) / (cols - 1) : 0;

		this.enemies = [];
		for (let i = 0; i < cols; i++) {
			this.enemies.push({
				baseX: -spread + i * spacing,
				alive: true,
				fireCooldown: SpaceInvaders2D.ENEMY_FIRE_MIN + Math.random() * (SpaceInvaders2D.ENEMY_FIRE_MAX - SpaceInvaders2D.ENEMY_FIRE_MIN),
			});
		}

		const floorZ = SpaceInvaders2D.CRASH_Z * this.resolution * 3.0;
		this.formationZ = Math.max(floorZ, (SpaceInvaders2D.SPAWN_Z - this.level * 0.4) * this.resolution);
		this.formationOffsetX = 0.0;
		this.formationDir = 1;
		this.descentSpeed = SpaceInvaders2D.BASE_DESCENT_SPEED * this.resolution * (1 + this.level * SpaceInvaders2D.DESCENT_PER_LEVEL);

		this.turretX = 0.0;
		this.turretDir = 0;
		this.fireCooldown = 0.0;
		this.playerBullets = [];
		this.enemyBullets = [];
		this.stage = InvadersStage.PLAYING;
	}

	_project(x, z) {
		const focalLength = this.resolution * SpaceInvaders2D.FOCAL_LENGTH_FACTOR;
		const stripPos = this.resolution / 2 + (x / z) * focalLength;
		let scale = focalLength / z;
		if (scale > 2.5) {
			scale = 2.5;
		}
		return { stripPos, scale };
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === InvadersStage.PLAYING) {
			this._loopPlaying(dt);
		} else if (this.stage === InvadersStage.LEVEL_COMPLETE) {
			if (this.delayTime <= 0.0) {
				this.level += 1;
				this._buildLevel();
			} else {
				this._renderLevelComplete();
			}
		} else {
			if (this.delayTime <= 0.0) {
				this.level = 0;
				this.score = 0;
				this.lives = SpaceInvaders2D.MAX_LIVES;
				this._buildLevel();
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

		this.turretX += this.turretDir * SpaceInvaders2D.TURRET_SPEED * this.resolution * dt;
		if (this.turretX < -this.laneHalf * 0.85) {
			this.turretX = -this.laneHalf * 0.85;
		} else if (this.turretX > this.laneHalf * 0.85) {
			this.turretX = this.laneHalf * 0.85;
		}

		if (this.fireCooldown > 0.0) {
			this.fireCooldown -= dt;
		}

		this.formationOffsetX += this.formationDir * SpaceInvaders2D.MARCH_SPEED * this.resolution * dt;
		const range = SpaceInvaders2D.MARCH_RANGE * this.resolution;
		if (this.formationOffsetX > range) {
			this.formationOffsetX = range;
			this.formationDir = -1;
			this.formationZ -= SpaceInvaders2D.DESCENT_STEP * this.resolution;
		} else if (this.formationOffsetX < -range) {
			this.formationOffsetX = -range;
			this.formationDir = 1;
			this.formationZ -= SpaceInvaders2D.DESCENT_STEP * this.resolution;
		}
		this.formationZ -= this.descentSpeed * dt;

		for (const enemy of this.enemies) {
			if (!enemy.alive) {
				continue;
			}
			enemy.fireCooldown -= dt;
			if (enemy.fireCooldown <= 0.0) {
				this.enemyBullets.push({ x: enemy.baseX + this.formationOffsetX, z: this.formationZ });
				enemy.fireCooldown = SpaceInvaders2D.ENEMY_FIRE_MIN + Math.random() * (SpaceInvaders2D.ENEMY_FIRE_MAX - SpaceInvaders2D.ENEMY_FIRE_MIN);
			}
		}

		const hitTolerance = SpaceInvaders2D.HIT_TOLERANCE * this.resolution;
		const zWindow = SpaceInvaders2D.Z_HIT_WINDOW * this.resolution;
		const maxRange = SpaceInvaders2D.MAX_BULLET_RANGE * this.resolution;
		const playerSurvivors = [];
		for (const bullet of this.playerBullets) {
			bullet.z += SpaceInvaders2D.PLAYER_BULLET_SPEED * this.resolution * dt;

			let consumed = false;
			if (Math.abs(bullet.z - this.formationZ) < zWindow) {
				for (const enemy of this.enemies) {
					if (!enemy.alive) {
						continue;
					}
					const currentX = enemy.baseX + this.formationOffsetX;
					if (Math.abs(bullet.x - currentX) < hitTolerance) {
						enemy.alive = false;
						this.score += 1;
						this.audio.synth.play(SystemSound.EXPLOSION);
						consumed = true;
						break;
					}
				}
			}
			if (!consumed && bullet.z < maxRange) {
				playerSurvivors.push(bullet);
			}
		}
		this.playerBullets = playerSurvivors;

		const crashZ = SpaceInvaders2D.CRASH_Z * this.resolution;
		const playerTolerance = SpaceInvaders2D.PLAYER_HIT_TOLERANCE * this.resolution;
		const enemySurvivors = [];
		let playerHit = false;
		for (const bullet of this.enemyBullets) {
			bullet.z -= SpaceInvaders2D.ENEMY_BULLET_SPEED * this.resolution * dt;
			if (bullet.z <= crashZ) {
				if (Math.abs(bullet.x - this.turretX) < playerTolerance) {
					playerHit = true;
				}
			} else {
				enemySurvivors.push(bullet);
			}
		}
		this.enemyBullets = enemySurvivors;

		if (playerHit) {
			this.lives -= 1;
			this.audio.synth.play(SystemSound.WARNING);
			if (this.lives <= 0) {
				this.stage = InvadersStage.GAMEOVER;
				this.audio.play(SystemSound.BOOING);
				this.delay(3.0);
				this._render();
				return;
			}
		}

		const anyAlive = this.enemies.some((e) => e.alive);
		if (anyAlive && this.formationZ <= crashZ) {
			this.stage = InvadersStage.GAMEOVER;
			this.audio.play(SystemSound.BOOING);
			this.delay(3.0);
		} else if (!anyAlive) {
			this.stage = InvadersStage.LEVEL_COMPLETE;
			this.audio.play(SystemSound.CHEERING);
			this.delay(2.0);
		}

		this._render();
	}

	_fire() {
		if (this.fireCooldown > 0.0) {
			return;
		}
		this.fireCooldown = SpaceInvaders2D.FIRE_COOLDOWN;
		this.playerBullets.push({ x: this.turretX, z: this.resolution * 0.05 });
		this.audio.synth.play(SystemSound.SHOOT);
	}

	_render() {
		this.clear();

		if (this.formationZ > 0) {
			for (let i = 0; i < this.enemies.length; i++) {
				const enemy = this.enemies[i];
				if (!enemy.alive) {
					continue;
				}
				const currentX = enemy.baseX + this.formationOffsetX;
				const { stripPos, scale } = this._project(currentX, this.formationZ);
				const size = Math.max(1, Math.round(3 * scale));
				const half = Math.floor(size / 2);
				const center = Math.round(stripPos);
				const color = i % 2 === 0 ? Colors.GREEN : Colors.CYAN;
				for (let p = -half; p <= half; p++) {
					const pos = center + p;
					if (pos >= 0 && pos < this.resolution) {
						this.pixels[pos] = color;
					}
				}
			}
		}

		for (const bullet of this.playerBullets) {
			if (bullet.z <= 0) {
				continue;
			}
			const { stripPos } = this._project(bullet.x, bullet.z);
			const pos = Math.round(stripPos);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Colors.WHITE;
			}
		}

		for (const bullet of this.enemyBullets) {
			if (bullet.z <= 0) {
				continue;
			}
			const { stripPos } = this._project(bullet.x, bullet.z);
			const pos = Math.round(stripPos);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Colors.ORANGE;
			}
		}

		const turretStripPos = this.resolution / 2 + (this.turretX / this.laneHalf) * (this.resolution / 2) * 0.9;
		const turretCenter = Math.round(turretStripPos);
		for (let i = -1; i <= 1; i++) {
			const pos = turretCenter + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Colors.SILVER;
			}
		}
	}

	_renderLevelComplete() {
		this.clear();
		const flashOn = Math.floor(this.time * 6) % 2 === 0;
		const color = flashOn ? Colors.GREEN : Colors.DARK_GREEN;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = color;
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

	handleInput(padId, event) {
		if (this.stage !== InvadersStage.PLAYING) {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.turretDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.turretDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.turretDir === -1) {
				this.turretDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.turretDir === 1) {
				this.turretDir = 0;
			}
		} else if (event.command === Command.FIRE_PRESS) {
			this._fire();
		}
	}
}
