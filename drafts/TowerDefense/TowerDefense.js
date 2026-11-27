import { Game, Color, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio.js';

export class TowerDefense extends Game {
	static SPAWN_Z = 9.0;
	static BASE_SPAWN_INTERVAL = 1.6;
	static MIN_SPAWN_INTERVAL = 0.5;
	static SPAWN_INTERVAL_STEP = 0.01;
	static BASE_ENEMY_SPEED = 0.5;
	static SPEED_PER_MINUTE = 0.08;
	static BASE_ENEMY_HEALTH = 2;
	static HEALTH_PER_MINUTE = 0.4;
	static BASE_RANGE = 3.0;
	static BASE_FIRE_RATE = 1.5;
	static BASE_DAMAGE = 1;
	static RANGE_STEP = 0.6;
	static FIRE_RATE_STEP = 0.4;
	static DAMAGE_STEP = 1;
	static RANGE_COST_BASE = 10;
	static FIRE_RATE_COST_BASE = 10;
	static DAMAGE_COST_BASE = 12;
	static COST_GROWTH = 1.4;
	static KILL_REWARD = 3;
	static BASE_HEALTH = 10;
	static MIN_ENEMY_SIZE = 1;
	static MAX_ENEMY_SIZE = 4;

	constructor(system) {
		super('TowerDefense', system);
		this._resetGame();
	}

	_resetGame() {
		this.score = 0;
		this.currency = 0;
		this.baseHealth = TowerDefense.BASE_HEALTH;
		this.range = TowerDefense.BASE_RANGE;
		this.fireRate = TowerDefense.BASE_FIRE_RATE;
		this.damage = TowerDefense.BASE_DAMAGE;
		this.rangeCost = TowerDefense.RANGE_COST_BASE;
		this.fireRateCost = TowerDefense.FIRE_RATE_COST_BASE;
		this.damageCost = TowerDefense.DAMAGE_COST_BASE;
		this.spawnInterval = TowerDefense.BASE_SPAWN_INTERVAL;
		this.spawnTimer = 1.0;
		this.fireCooldown = 0.0;
		this.enemies = [];
		this.stage = 'PLAYING';
	}

	_spawnEnemy() {
		const minutes = this.time / 60.0;
		const speed = (TowerDefense.BASE_ENEMY_SPEED + minutes * TowerDefense.SPEED_PER_MINUTE) * this.resolution;
		const health = TowerDefense.BASE_ENEMY_HEALTH + Math.floor(minutes * TowerDefense.HEALTH_PER_MINUTE);
		this.enemies.push({
			z: TowerDefense.SPAWN_Z * this.resolution,
			speed: speed * (0.9 + Math.random() * 0.2),
			health,
			maxHealth: health,
		});
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
		this.spawnTimer -= dt;
		if (this.spawnTimer <= 0.0) {
			this._spawnEnemy();
			this.spawnTimer = this.spawnInterval;
			this.spawnInterval = Math.max(TowerDefense.MIN_SPAWN_INTERVAL, this.spawnInterval - TowerDefense.SPAWN_INTERVAL_STEP);
		}

		if (this.fireCooldown > 0.0) {
			this.fireCooldown -= dt;
		}

		const rangeUnits = this.range * this.resolution;
		let breached = 0;
		const survivors = [];
		for (const enemy of this.enemies) {
			enemy.z -= enemy.speed * dt;
			if (enemy.z <= 0.0) {
				breached += 1;
			} else {
				survivors.push(enemy);
			}
		}
		this.enemies = survivors;

		if (breached > 0) {
			this.baseHealth -= breached;
			this.audio.playSynth(SystemSound.WARNING);
			if (this.baseHealth <= 0) {
				this.stage = 'GAMEOVER';
				this.audio.play(SystemSound.BOOING);
				this.delay(3.0);
			}
		}

		if (this.fireCooldown <= 0.0 && this.enemies.length > 0) {
			let nearest = null;
			let nearestZ = rangeUnits;
			for (const enemy of this.enemies) {
				if (enemy.z <= nearestZ) {
					nearestZ = enemy.z;
					nearest = enemy;
				}
			}
			if (nearest) {
				nearest.health -= this.damage;
				this.fireCooldown = 1.0 / this.fireRate;
				this.audio.playSynth(SystemSound.SHOOT);
				if (nearest.health <= 0) {
					this.enemies.splice(this.enemies.indexOf(nearest), 1);
					this.currency += TowerDefense.KILL_REWARD;
					this.score += 1;
					this.audio.playSynth(SystemSound.EXPLOSION);
				}
			}
		}

		this._render();
	}

	_upgradeRange() {
		if (this.currency >= this.rangeCost) {
			this.currency -= this.rangeCost;
			this.range += TowerDefense.RANGE_STEP;
			this.rangeCost = Math.round(this.rangeCost * TowerDefense.COST_GROWTH);
			this.audio.playSynth(SystemSound.TICK);
		}
	}

	_upgradeFireRate() {
		if (this.currency >= this.fireRateCost) {
			this.currency -= this.fireRateCost;
			this.fireRate += TowerDefense.FIRE_RATE_STEP;
			this.fireRateCost = Math.round(this.fireRateCost * TowerDefense.COST_GROWTH);
			this.audio.playSynth(SystemSound.TICK);
		}
	}

	_upgradeDamage() {
		if (this.currency >= this.damageCost) {
			this.currency -= this.damageCost;
			this.damage += TowerDefense.DAMAGE_STEP;
			this.damageCost = Math.round(this.damageCost * TowerDefense.COST_GROWTH);
			this.audio.playSynth(SystemSound.TICK);
		}
	}

	handleInput(padId, event) {
		if (this.stage !== 'PLAYING') {
			return;
		}
		if (event.command === Command.A_PRESS) {
			this._upgradeRange();
		} else if (event.command === Command.B_PRESS) {
			this._upgradeFireRate();
		} else if (event.command === Command.C_PRESS) {
			this._upgradeDamage();
		}
	}

	_render() {
		this.clear();

		const healthFraction = Math.max(0.0, this.baseHealth / TowerDefense.BASE_HEALTH);
		const barLen = Math.round(healthFraction * this.resolution);
		for (let i = 0; i < barLen; i++) {
			this.pixels[i] = Color.DARK_GREEN;
		}

		const ordered = [...this.enemies].sort((a, b) => b.z - a.z);
		for (const enemy of ordered) {
			const approach = 1.0 - Math.min(1.0, enemy.z / (TowerDefense.SPAWN_Z * this.resolution));
			const brightness = 0.35 + 0.65 * approach;
			const healthFrac = enemy.health / enemy.maxHealth;
			const r = Math.floor(0xFF * brightness);
			const g = Math.floor(0xFF * brightness * healthFrac);
			const color = (r << 16) | (g << 8);
			const size = TowerDefense.MIN_ENEMY_SIZE + Math.round(approach * (TowerDefense.MAX_ENEMY_SIZE - TowerDefense.MIN_ENEMY_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.floor(this.resolution / 2);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		const towerPos = Math.floor(this.resolution / 2);
		this.pixels[towerPos] = Color.CYAN;
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
