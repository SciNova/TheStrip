import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

const MissileStage = Object.freeze({ PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' });

export class MissileCommand extends Game {
	static CITY_COUNT = 5;
	static SPAWN_Z = 9.0;
	static CRASH_Z = 0.3;
	static BASE_MISSILE_SPEED = 0.7;
	static SPEED_STEP = 0.015;
	static BASE_SPAWN_INTERVAL = 1.4;
	static MIN_SPAWN_INTERVAL = 0.5;
	static SPAWN_INTERVAL_STEP = 0.02;
	static AIM_SPEED = 0.9;
	static INTERCEPTOR_SPEED = 6.0;
	static INTERCEPT_Z = 4.0;
	static BLAST_DURATION = 0.3;
	static EXPLOSION_RADIUS = 10;
	static Z_BLAST_WINDOW = 1.2;
	static FIRE_COOLDOWN = 0.3;
	static MIN_MISSILE_SIZE = 1;
	static MAX_MISSILE_SIZE = 5;

	constructor(system) {
		super('MissileCommand', system);
		this._resetGame();
	}

	_resetGame() {
		this.cities = [];
		for (let i = 0; i < MissileCommand.CITY_COUNT; i++) {
			this.cities.push({
				x: ((i + 0.5) / MissileCommand.CITY_COUNT) * this.resolution,
				alive: true,
			});
		}
		this.aimPos = this.resolution / 2.0;
		this.aimDir = 0;
		this.score = 0;
		this.missileSpeed = MissileCommand.BASE_MISSILE_SPEED * this.resolution;
		this.spawnInterval = MissileCommand.BASE_SPAWN_INTERVAL;
		this.spawnTimer = 0.5;
		this.fireCooldown = 0.0;
		this.missiles = [];
		this.interceptors = [];
		this.explosions = [];
		this.stage = MissileStage.PLAYING;
	}

	_spawnMissile() {
		const aliveCities = this.cities.filter((c) => c.alive);
		if (aliveCities.length === 0) {
			return;
		}
		const target = aliveCities[Math.floor(this.system.random() * aliveCities.length)];
		this.missiles.push({
			x: target.x,
			z: MissileCommand.SPAWN_Z * this.resolution,
			speed: this.missileSpeed * (0.9 + this.system.random() * 0.3),
		});
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === MissileStage.PLAYING) {
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
		this.aimPos += this.aimDir * MissileCommand.AIM_SPEED * this.resolution * dt;
		if (this.aimPos < 0) {
			this.aimPos = 0;
		} else if (this.aimPos > this.resolution - 1) {
			this.aimPos = this.resolution - 1;
		}
		if (this.fireCooldown > 0.0) {
			this.fireCooldown -= dt;
		}

		this.spawnTimer -= dt;
		if (this.spawnTimer <= 0.0) {
			this._spawnMissile();
			this.spawnTimer = this.spawnInterval;
		}

		const crashZ = MissileCommand.CRASH_Z * this.resolution;
		const missileSurvivors = [];
		for (const missile of this.missiles) {
			missile.z -= missile.speed * dt;
			if (missile.z > crashZ) {
				missileSurvivors.push(missile);
			} else {
				const city = this.cities.find((c) => c.alive && Math.abs(c.x - missile.x) < 2);
				if (city) {
					city.alive = false;
					this.audio.playSynth(SystemSound.WARNING);
				}
			}
		}
		this.missiles = missileSurvivors;

		const interceptSurvivors = [];
		const interceptZ = MissileCommand.INTERCEPT_Z * this.resolution;
		for (const interceptor of this.interceptors) {
			interceptor.z += MissileCommand.INTERCEPTOR_SPEED * this.resolution * dt;
			if (interceptor.z >= interceptZ) {
				this.explosions.push({ x: interceptor.x, timer: MissileCommand.BLAST_DURATION });
			} else {
				interceptSurvivors.push(interceptor);
			}
		}
		this.interceptors = interceptSurvivors;

		const zWindow = MissileCommand.Z_BLAST_WINDOW * this.resolution;
		const radius = MissileCommand.EXPLOSION_RADIUS;
		const explosionSurvivors = [];
		for (const explosion of this.explosions) {
			explosion.timer -= dt;
			if (explosion.timer > 0.0) {
				explosionSurvivors.push(explosion);
				const remaining = [];
				for (const missile of this.missiles) {
					if (Math.abs(missile.x - explosion.x) < radius && Math.abs(missile.z - interceptZ) < zWindow) {
						this.score += 1;
						this.audio.playSynth(SystemSound.EXPLOSION);
						this.missileSpeed += MissileCommand.SPEED_STEP * this.resolution;
						this.spawnInterval = Math.max(
							MissileCommand.MIN_SPAWN_INTERVAL,
							this.spawnInterval - MissileCommand.SPAWN_INTERVAL_STEP
						);
					} else {
						remaining.push(missile);
					}
				}
				this.missiles = remaining;
			}
		}
		this.explosions = explosionSurvivors;

		if (this.cities.every((c) => !c.alive)) {
			this.stage = MissileStage.GAMEOVER;
			this.audio.play(SystemSound.BOOING);
			this.delay(3.0);
		}

		this._render();
	}

	_fire() {
		if (this.fireCooldown > 0.0) {
			return;
		}
		this.fireCooldown = MissileCommand.FIRE_COOLDOWN;
		this.interceptors.push({ x: this.aimPos, z: 0.0 });
		this.audio.playSynth(SystemSound.SHOOT);
	}

	handleInput(padId, event) {
		if (this.stage !== MissileStage.PLAYING) {
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

		for (const city of this.cities) {
			if (city.alive) {
				const pos = Math.round(city.x);
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = Color.GREEN;
				}
			}
		}

		for (const missile of this.missiles) {
			const approach = 1.0 - Math.min(1.0, missile.z / (MissileCommand.SPAWN_Z * this.resolution));
			const brightness = 0.35 + 0.65 * approach;
			const r = Math.floor(0xFF * brightness);
			const color = r << 16;
			const size = MissileCommand.MIN_MISSILE_SIZE + Math.round(approach * (MissileCommand.MAX_MISSILE_SIZE - MissileCommand.MIN_MISSILE_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.round(missile.x);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		for (const interceptor of this.interceptors) {
			const pos = Math.round(interceptor.x);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Color.CYAN;
			}
		}

		for (const explosion of this.explosions) {
			const fade = Math.max(0.0, explosion.timer / MissileCommand.BLAST_DURATION);
			const brightness = 0.4 + 0.6 * fade;
			const v = Math.floor(0xFF * brightness);
			const color = (v << 16) | (v << 8);
			const radius = Math.round(MissileCommand.EXPLOSION_RADIUS * fade);
			const center = Math.round(explosion.x);
			for (let i = -radius; i <= radius; i++) {
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
