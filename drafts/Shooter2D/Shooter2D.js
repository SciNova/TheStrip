import { Game, Colors, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';

const ShooterStage = Object.freeze({ PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' });

export class Shooter2D extends Game {
	static LANE_HALF_WIDTH = 1.0; // resolution units
	static AIM_SPEED = 0.9; // resolution-fraction/sec
	static HIT_TOLERANCE = 0.06; // resolution-fraction
	static SPAWN_Z = 9.0; // resolution units
	static CRASH_Z = 0.3; // resolution units
	static BASE_TARGET_SPEED = 1.3; // resolution units/sec
	static SPEED_STEP = 0.05;
	static BASE_SPAWN_INTERVAL = 1.1;
	static MIN_SPAWN_INTERVAL = 0.45;
	static SPAWN_INTERVAL_STEP = 0.025;
	static MAX_LIVES = 3;
	static FOCAL_LENGTH_FACTOR = 0.5;
	static FIRE_COOLDOWN = 0.18;
	static MIN_TARGET_SIZE = 1;
	static MAX_TARGET_SIZE = 5;
	static TARGET_COLORS = [Colors.ORANGE, Colors.MAGENTA, Colors.YELLOW, Colors.CYAN];

	constructor(system) {
		super('Shooter2D', system);
		this._resetGame();
	}

	_resetGame() {
		this.aimPos = this.resolution / 2.0;
		this.aimDir = 0;
		this.score = 0;
		this.lives = Shooter2D.MAX_LIVES;
		this.targetSpeed = Shooter2D.BASE_TARGET_SPEED * this.resolution;
		this.spawnInterval = Shooter2D.BASE_SPAWN_INTERVAL;
		this.spawnTimer = 0.3;
		this.fireCooldown = 0.0;
		this.targets = [];
		this.stage = ShooterStage.PLAYING;
	}

	_spawnTarget() {
		const laneHalf = Shooter2D.LANE_HALF_WIDTH * this.resolution;
		const color = Shooter2D.TARGET_COLORS[Math.floor(Math.random() * Shooter2D.TARGET_COLORS.length)];
		this.targets.push({
			x: (Math.random() * 2 - 1) * laneHalf * 0.85,
			z: Shooter2D.SPAWN_Z * this.resolution,
			speed: this.targetSpeed * (0.9 + Math.random() * 0.3),
			color,
		});
	}

	_project(target) {
		const focalLength = this.resolution * Shooter2D.FOCAL_LENGTH_FACTOR;
		const stripPos = this.resolution / 2 + (target.x / target.z) * focalLength;
		let scale = focalLength / target.z;
		if (scale > 2.5) {
			scale = 2.5;
		}
		return { stripPos, scale };
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === ShooterStage.PLAYING) {
			if (this.delayTime > 0.0) {
				this._render();
				return;
			}

			this.aimPos += this.aimDir * Shooter2D.AIM_SPEED * this.resolution * dt;
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
				this._spawnTarget();
				this.spawnTimer = this.spawnInterval;
			}

			const crashZ = Shooter2D.CRASH_Z * this.resolution;
			const survivors = [];
			let breached = false;
			for (const target of this.targets) {
				target.z -= target.speed * dt;
				if (target.z > crashZ) {
					survivors.push(target);
				} else {
					breached = true;
				}
			}
			this.targets = survivors;

			if (breached) {
				this.lives -= 1;
				this.audio.synth.play(SystemSound.WARNING);
				if (this.lives <= 0) {
					this.stage = ShooterStage.GAMEOVER;
					this.audio.play(SystemSound.BOOING);
					this.delay(3.0);
				} else {
					this.delay(0.4);
				}
			}

			this._render();
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			}
			this._renderGameOver();
		}
	}

	_fire() {
		if (this.fireCooldown > 0.0) {
			return;
		}
		this.fireCooldown = Shooter2D.FIRE_COOLDOWN;

		const tolerance = Shooter2D.HIT_TOLERANCE * this.resolution;
		let bestIndex = -1;
		let bestDist = tolerance;
		for (let i = 0; i < this.targets.length; i++) {
			const target = this.targets[i];
			if (target.z <= 0) {
				continue;
			}
			const { stripPos } = this._project(target);
			const dist = Math.abs(stripPos - this.aimPos);
			if (dist < bestDist) {
				bestDist = dist;
				bestIndex = i;
			}
		}

		if (bestIndex >= 0) {
			this.targets.splice(bestIndex, 1);
			this.score += 1;
			this.audio.synth.play(SystemSound.EXPLOSION);
			this.targetSpeed += Shooter2D.SPEED_STEP * this.resolution;
			this.spawnInterval = Math.max(
				Shooter2D.MIN_SPAWN_INTERVAL,
				this.spawnInterval - Shooter2D.SPAWN_INTERVAL_STEP
			);
		} else {
			this.audio.synth.play(SystemSound.SHOOT);
		}
	}

	_render() {
		this.clear();

		const ordered = [...this.targets].sort((a, b) => b.z - a.z);
		for (const target of ordered) {
			if (target.z <= 0) {
				continue;
			}
			const { stripPos } = this._project(target);
			const approach = 1.0 - Math.min(1.0, target.z / (Shooter2D.SPAWN_Z * this.resolution));
			const size = Shooter2D.MIN_TARGET_SIZE + Math.round(approach * (Shooter2D.MAX_TARGET_SIZE - Shooter2D.MIN_TARGET_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.round(stripPos);
			const r = (target.color >> 16) & 0xFF;
			const g = (target.color >> 8) & 0xFF;
			const b = target.color & 0xFF;
			const brightness = 0.4 + 0.6 * approach;
			const color = (Math.floor(r * brightness) << 16) | (Math.floor(g * brightness) << 8) | Math.floor(b * brightness);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}

		const aimCenter = Math.round(this.aimPos);
		const blink = Math.floor(this.time * 6) % 2 === 0;
		if (blink && aimCenter >= 0 && aimCenter < this.resolution) {
			this.pixels[aimCenter] = Colors.WHITE;
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
		if (this.stage !== ShooterStage.PLAYING) {
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
}
