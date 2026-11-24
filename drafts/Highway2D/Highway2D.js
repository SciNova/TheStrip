import { Game, Colors, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';
import { Square2D, EdgeMode } from '../../core/graphics.js';

const HighwayStage = Object.freeze({ PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' });

class OncomingCar extends Square2D {
	static SIZE = 1 / 3;
	static LIGHT_SIZE = 1 / 7;
	static LIGHT_INSET = 1 / 4;
	static BODY_COLORS = [Colors.RED, Colors.YELLOW, Colors.BLUE, Colors.ORANGE];

	constructor(game) {
		let length = Math.floor(game.resolution * OncomingCar.SIZE);
		if (length % 2 === 0) {
			length -= 1;
		}
		const body = OncomingCar.BODY_COLORS[Math.floor(Math.random() * OncomingCar.BODY_COLORS.length)];
		const dark = OncomingCar._darken(body);
		const faces = [
			OncomingCar._buildFace(length, body, Colors.WHITE),
			OncomingCar._solidFace(length, dark),
			OncomingCar._solidFace(length, dark),
			OncomingCar._solidFace(length, dark),
		];
		super(game, faces, true);
		this.rotation = 0.0;
		this.update();
	}

	static _buildFace(length, body, light) {
		const face = OncomingCar._solidFace(length, body);
		const leftCenter = Math.floor(length * OncomingCar.LIGHT_INSET);
		const rightCenter = Math.floor(length * (1 - OncomingCar.LIGHT_INSET));
		const diameter = Math.ceil(length * OncomingCar.LIGHT_SIZE);
		const half = Math.floor((diameter - 1) / 2);
		OncomingCar._fillLight(face, leftCenter - half, diameter, light);
		OncomingCar._fillLight(face, rightCenter - half, diameter, light);
		return face;
	}

	static _fillLight(face, start, count, color) {
		let end = start + count;
		if (start < 0) {
			start = 0;
		}
		if (end > face.length) {
			end = face.length;
		}
		for (let i = start; i < end; i++) {
			face[i] = color;
		}
	}

	static _solidFace(length, color) {
		return new Array(length).fill(color);
	}

	static _darken(color) {
		const r = (color >> 16) & 0xFF;
		const g = (color >> 8) & 0xFF;
		const b = color & 0xFF;
		return (Math.floor(r * 0.5) << 16) | (Math.floor(g * 0.5) << 8) | Math.floor(b * 0.5);
	}
}

export class Highway2D extends Game {
	static LANE_HALF_WIDTH = 1.0;
	static STEER_SPEED = 1.3;
	static SPAWN_Z = 9.0;
	static CRASH_Z = 0.3;
	static CRASH_TOLERANCE = 0.22;
	static BASE_CAR_SPEED = 1.6;
	static SPEED_STEP = 0.06;
	static BASE_SPAWN_INTERVAL = 1.4;
	static MIN_SPAWN_INTERVAL = 0.55;
	static SPAWN_INTERVAL_STEP = 0.03;
	static MAX_LIVES = 3;
	static FOCAL_LENGTH_FACTOR = 0.5;

	constructor(system) {
		super('Highway2D', system);
		this._resetGame();
	}

	_resetGame() {
		this.playerX = 0.0;
		this.steerDir = 0;
		this.score = 0;
		this.lives = Highway2D.MAX_LIVES;
		this.carSpeed = Highway2D.BASE_CAR_SPEED * this.resolution;
		this.spawnInterval = Highway2D.BASE_SPAWN_INTERVAL;
		this.spawnTimer = 0.3;
		this.cars = [];
		this.stage = HighwayStage.PLAYING;
	}

	_spawnCar() {
		const laneHalf = Highway2D.LANE_HALF_WIDTH * this.resolution;
		const car = new OncomingCar(this);
		car.x = (Math.random() * 2 - 1) * laneHalf * 0.85;
		car.z = Highway2D.SPAWN_Z * this.resolution;
		car.speed = this.carSpeed * (0.9 + Math.random() * 0.3);
		this.cars.push(car);
	}

	loop() {
		super.loop();

		const dt = this.system.clock.delta;

		if (this.stage === HighwayStage.PLAYING) {
			if (this.delayTime > 0.0) {
				this._render();
				return;
			}

			const laneHalf = Highway2D.LANE_HALF_WIDTH * this.resolution;
			this.playerX += this.steerDir * Highway2D.STEER_SPEED * this.resolution * dt;
			if (this.playerX < -laneHalf) {
				this.playerX = -laneHalf;
			} else if (this.playerX > laneHalf) {
				this.playerX = laneHalf;
			}

			this.spawnTimer -= dt;
			if (this.spawnTimer <= 0.0) {
				this._spawnCar();
				this.spawnTimer = this.spawnInterval;
			}

			const crashZ = Highway2D.CRASH_Z * this.resolution;
			const survivors = [];
			let crashed = false;
			for (const car of this.cars) {
				car.z -= car.speed * dt;
				if (car.z > crashZ) {
					survivors.push(car);
					continue;
				}

				const lateral = Math.abs(car.x - this.playerX);
				if (lateral < Highway2D.CRASH_TOLERANCE * this.resolution) {
					crashed = true;
				} else {
					this.score += 1;
					this.audio.synth.play(SystemSound.TICK);
					this.carSpeed += Highway2D.SPEED_STEP * this.resolution;
					this.spawnInterval = Math.max(
						Highway2D.MIN_SPAWN_INTERVAL,
						this.spawnInterval - Highway2D.SPAWN_INTERVAL_STEP
					);
				}
			}
			this.cars = survivors;

			if (crashed) {
				this.lives -= 1;
				this.audio.synth.play(SystemSound.EXPLOSION);
				if (this.lives <= 0) {
					this.stage = HighwayStage.GAMEOVER;
					this.audio.play(SystemSound.BOOING);
					this.delay(3.0);
				} else {
					this.cars = [];
					this.delay(0.6);
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

	_render() {
		this.clear();
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Colors.DARK_GRAY;
		}

		const focalLength = this.resolution * Highway2D.FOCAL_LENGTH_FACTOR;
		const ordered = [...this.cars].sort((a, b) => b.z - a.z);
		for (const car of ordered) {
			const forward = car.z;
			if (forward <= 0) {
				continue;
			}
			const lateral = car.x - this.playerX;
			const stripPos = this.resolution / 2 + (lateral / forward) * focalLength;
			let scale = focalLength / forward;
			if (scale > 2.5) {
				scale = 2.5;
			}
			car.render(stripPos, EdgeMode.CLIP, scale);
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
		if (this.stage !== HighwayStage.PLAYING) {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.steerDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.steerDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.steerDir === -1) {
				this.steerDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.steerDir === 1) {
				this.steerDir = 0;
			}
		}
	}
}
