import { Game, Colors, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';
import { World2D } from '../../core/graphics.js';

const AsteroidsStage = Object.freeze({ PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' });

const TIER = Object.freeze({
	LARGE: { radius: 0.5, speedMin: 0.3, speedMax: 0.5, score: 1, next: 'MEDIUM' },
	MEDIUM: { radius: 0.3, speedMin: 0.5, speedMax: 0.8, score: 2, next: 'SMALL' },
	SMALL: { radius: 0.15, speedMin: 0.8, speedMax: 1.2, score: 3, next: null },
});

export class AsteroidsZ extends Game {
	static WORLD_SIZE = 8.0;
	static THRUST_ACCEL = 1.2;
	static FRICTION = 0.3;
	static TURN_RATE = 0.6;
	static MAX_SPEED = 2.5;
	static BULLET_SPEED = 3.5;
	static BULLET_LIFETIME = 1.8;
	static FIRE_COOLDOWN = 0.25;
	static SPLIT_COUNT = 2;
	static BASE_ASTEROID_COUNT = 3;
	static SHIP_RADIUS = 0.18;
	static INVULN_TIME = 1.5;
	static MAX_LIVES = 3;
	static FOCAL_LENGTH_FACTOR = 0.5;
	static MAX_RENDER_DIST = 6.0;

	constructor(system) {
		super('AsteroidsZ', system);
		this.level = 0;
		this.score = 0;
		this.lives = AsteroidsZ.MAX_LIVES;
		this._buildLevel();
	}

	_buildLevel() {
		this.world = new World2D(AsteroidsZ.WORLD_SIZE, AsteroidsZ.WORLD_SIZE, true, true);
		this.shipX = 0.0;
		this.shipZ = 0.0;
		this.shipRotation = 0.0;
		this.shipVX = 0.0;
		this.shipVZ = 0.0;
		this.turnLeftPressed = false;
		this.turnRightPressed = false;
		this.thrustPressed = false;
		this.fireCooldown = 0.0;
		this.invuln = AsteroidsZ.INVULN_TIME;
		this.bullets = [];

		const count = AsteroidsZ.BASE_ASTEROID_COUNT + this.level;
		const half = (AsteroidsZ.WORLD_SIZE * this.resolution) / 2.0;
		this.asteroids = [];
		for (let i = 0; i < count; i++) {
			let x, z;
			do {
				x = Math.random() * 2 * half - half;
				z = Math.random() * 2 * half - half;
			} while (Math.sqrt(x * x + z * z) < half * 0.3);
			this._addAsteroid(x, z, 'LARGE');
		}

		this.stage = AsteroidsStage.PLAYING;
	}

	_addAsteroid(x, z, tierName) {
		const tier = TIER[tierName];
		const speed = (tier.speedMin + Math.random() * (tier.speedMax - tier.speedMin)) * this.resolution;
		const angle = Math.random() * 2 * Math.PI;
		this.asteroids.push({
			x,
			z,
			vx: speed * Math.cos(angle),
			vz: speed * Math.sin(angle),
			tierName,
		});
	}

	_wrapDelta(value, span) {
		const half = span / 2.0;
		return (((value + half) % span) + span) % span - half;
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === AsteroidsStage.PLAYING) {
			this._loopPlaying(dt);
		} else {
			if (this.delayTime <= 0.0) {
				this.level = 0;
				this.score = 0;
				this.lives = AsteroidsZ.MAX_LIVES;
				this._buildLevel();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopPlaying(dt) {
		const worldW = this.world.width * this.resolution;
		const worldD = this.world.depth * this.resolution;
		const halfW = worldW / 2.0;
		const halfD = worldD / 2.0;

		if (this.invuln > 0.0) {
			this.invuln -= dt;
		}
		if (this.fireCooldown > 0.0) {
			this.fireCooldown -= dt;
		}

		if (this.turnLeftPressed) {
			this.shipRotation = (((this.shipRotation - AsteroidsZ.TURN_RATE * dt) % 1.0) + 1.0) % 1.0;
		}
		if (this.turnRightPressed) {
			this.shipRotation = ((this.shipRotation + AsteroidsZ.TURN_RATE * dt) % 1.0 + 1.0) % 1.0;
		}

		if (this.thrustPressed) {
			const angle = this.shipRotation * 2 * Math.PI;
			this.shipVX += AsteroidsZ.THRUST_ACCEL * this.resolution * Math.cos(angle) * dt;
			this.shipVZ += AsteroidsZ.THRUST_ACCEL * this.resolution * Math.sin(angle) * dt;
		}
		const friction = Math.max(0.0, 1.0 - AsteroidsZ.FRICTION * dt);
		this.shipVX *= friction;
		this.shipVZ *= friction;
		const speed = Math.sqrt(this.shipVX * this.shipVX + this.shipVZ * this.shipVZ);
		const maxSpeed = AsteroidsZ.MAX_SPEED * this.resolution;
		if (speed > maxSpeed) {
			this.shipVX = (this.shipVX / speed) * maxSpeed;
			this.shipVZ = (this.shipVZ / speed) * maxSpeed;
		}

		this.shipX = (((this.shipX + this.shipVX * dt + halfD) % worldD) + worldD) % worldD - halfD;
		this.shipZ = (((this.shipZ + this.shipVZ * dt + halfW) % worldW) + worldW) % worldW - halfW;

		for (const asteroid of this.asteroids) {
			asteroid.x = (((asteroid.x + asteroid.vx * dt + halfD) % worldD) + worldD) % worldD - halfD;
			asteroid.z = (((asteroid.z + asteroid.vz * dt + halfW) % worldW) + worldW) % worldW - halfW;
		}

		const bulletSurvivors = [];
		for (const bullet of this.bullets) {
			bullet.x = (((bullet.x + bullet.vx * dt + halfD) % worldD) + worldD) % worldD - halfD;
			bullet.z = (((bullet.z + bullet.vz * dt + halfW) % worldW) + worldW) % worldW - halfW;
			bullet.life -= dt;
			if (bullet.life > 0.0) {
				bulletSurvivors.push(bullet);
			}
		}
		this.bullets = bulletSurvivors;

		const newAsteroids = [];
		for (const asteroid of this.asteroids) {
			const tier = TIER[asteroid.tierName];
			const radius = tier.radius * this.resolution;
			let destroyed = false;
			for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
				const bullet = this.bullets[bi];
				const dx = this._wrapDelta(asteroid.x - bullet.x, worldD);
				const dz = this._wrapDelta(asteroid.z - bullet.z, worldW);
				if (Math.sqrt(dx * dx + dz * dz) < radius) {
					this.bullets.splice(bi, 1);
					destroyed = true;
					break;
				}
			}
			if (destroyed) {
				this.score += tier.score;
				this.audio.synth.play(SystemSound.EXPLOSION);
				if (tier.next) {
					for (let s = 0; s < AsteroidsZ.SPLIT_COUNT; s++) {
						this._addAsteroidInto(newAsteroids, asteroid.x, asteroid.z, tier.next);
					}
				}
			} else {
				newAsteroids.push(asteroid);
			}
		}
		this.asteroids = newAsteroids;

		if (this.asteroids.length === 0) {
			this.level += 1;
			this._buildLevel();
			return;
		}

		if (this.invuln <= 0.0) {
			const shipRadius = AsteroidsZ.SHIP_RADIUS * this.resolution;
			for (const asteroid of this.asteroids) {
				const tier = TIER[asteroid.tierName];
				const dx = this._wrapDelta(asteroid.x - this.shipX, worldD);
				const dz = this._wrapDelta(asteroid.z - this.shipZ, worldW);
				if (Math.sqrt(dx * dx + dz * dz) < shipRadius + tier.radius * this.resolution) {
					this.lives -= 1;
					this.audio.synth.play(SystemSound.WARNING);
					if (this.lives <= 0) {
						this.stage = AsteroidsStage.GAMEOVER;
						this.audio.play(SystemSound.BOOING);
						this.delay(3.0);
					} else {
						this.shipX = 0.0;
						this.shipZ = 0.0;
						this.shipVX = 0.0;
						this.shipVZ = 0.0;
						this.invuln = AsteroidsZ.INVULN_TIME;
					}
					break;
				}
			}
		}

		this._render();
	}

	_addAsteroidInto(list, x, z, tierName) {
		const tier = TIER[tierName];
		const speed = (tier.speedMin + Math.random() * (tier.speedMax - tier.speedMin)) * this.resolution;
		const angle = Math.random() * 2 * Math.PI;
		list.push({
			x,
			z,
			vx: speed * Math.cos(angle),
			vz: speed * Math.sin(angle),
			tierName,
		});
	}

	_fire() {
		if (this.fireCooldown > 0.0) {
			return;
		}
		this.fireCooldown = AsteroidsZ.FIRE_COOLDOWN;
		const angle = this.shipRotation * 2 * Math.PI;
		const speed = AsteroidsZ.BULLET_SPEED * this.resolution;
		this.bullets.push({
			x: this.shipX,
			z: this.shipZ,
			vx: speed * Math.cos(angle),
			vz: speed * Math.sin(angle),
			life: AsteroidsZ.BULLET_LIFETIME,
		});
		this.audio.synth.play(SystemSound.SHOOT);
	}

	handleInput(padId, event) {
		if (this.stage !== AsteroidsStage.PLAYING) {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.turnLeftPressed = true;
		} else if (event.command === Command.LEFT_RELEASE) {
			this.turnLeftPressed = false;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.turnRightPressed = true;
		} else if (event.command === Command.RIGHT_RELEASE) {
			this.turnRightPressed = false;
		} else if (event.command === Command.UP_PRESS) {
			this.thrustPressed = true;
		} else if (event.command === Command.UP_RELEASE) {
			this.thrustPressed = false;
		} else if (event.command === Command.FIRE_PRESS) {
			this._fire();
		}
	}

	_render() {
		this.clear();

		const worldW = this.world.width * this.resolution;
		const worldD = this.world.depth * this.resolution;
		const cosT = Math.cos(this.shipRotation * 2 * Math.PI);
		const sinT = Math.sin(this.shipRotation * 2 * Math.PI);
		const focalLength = this.resolution * AsteroidsZ.FOCAL_LENGTH_FACTOR;
		const maxDist = AsteroidsZ.MAX_RENDER_DIST * this.resolution;

		const items = [];
		for (const asteroid of this.asteroids) {
			const dx = this._wrapDelta(asteroid.x - this.shipX, worldD);
			const dz = this._wrapDelta(asteroid.z - this.shipZ, worldW);
			const forward = dx * cosT + dz * sinT;
			const lateral = -dx * sinT + dz * cosT;
			if (forward > 0.01 && forward < maxDist) {
				items.push({ forward, lateral, color: Colors.GRAY, big: true });
			}
		}
		for (const bullet of this.bullets) {
			const dx = this._wrapDelta(bullet.x - this.shipX, worldD);
			const dz = this._wrapDelta(bullet.z - this.shipZ, worldW);
			const forward = dx * cosT + dz * sinT;
			const lateral = -dx * sinT + dz * cosT;
			if (forward > 0.01 && forward < maxDist) {
				items.push({ forward, lateral, color: Colors.WHITE, big: false });
			}
		}
		items.sort((a, b) => b.forward - a.forward);

		for (const item of items) {
			const stripPos = this.resolution / 2 + (item.lateral / item.forward) * focalLength;
			let scale = focalLength / item.forward;
			if (scale > 2.5) {
				scale = 2.5;
			}
			const approach = 1.0 - Math.min(1.0, item.forward / maxDist);
			const brightness = 0.35 + 0.65 * approach;
			const r = ((item.color >> 16) & 0xFF) * brightness;
			const g = ((item.color >> 8) & 0xFF) * brightness;
			const b = (item.color & 0xFF) * brightness;
			const color = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
			const maxSize = item.big ? 5 : 2;
			const size = 1 + Math.round(approach * (maxSize - 1));
			const half = Math.floor(size / 2);
			const center = Math.round(stripPos);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		if (this.invuln > 0.0) {
			const blink = Math.floor(this.time * 10) % 2 === 0;
			if (blink) {
				this.pixels[Math.floor(this.resolution / 2)] = Colors.CYAN;
			}
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
