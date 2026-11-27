import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { Square2D } from '../../core/graphics/Square2D.js';
import { EdgeMode } from '../../core/graphics/EdgeMode.js';
import { Camera } from '../../core/graphics/Camera.js';
import { BasePlayer2D } from '../../core/graphics/BasePlayer2D.js';
import { World2D } from '../../core/graphics/World2D.js';

class Player extends BasePlayer2D {
	constructor(game) {
		super(game);
		this.speed = 0.0;
	}
}

class Car extends Square2D {
	static SIZE = 1 / 3;
	static LIGHT_SIZE = 1 / 7;
	static LIGHT_INSET = 1 / 4;
	static BODY_COLORS = [Color.GREEN, Color.BLUE];

	constructor(game) {
		let length = Math.floor(game.resolution * Car.SIZE);
		if (length % 2 === 0) {
			length -= 1;
		}
		const body = Car.BODY_COLORS[Math.floor(Math.random() * Car.BODY_COLORS.length)];
		const dark = Car._darken(body);
		const faces = [
			Car._buildFace(length, body, Color.WHITE),
			Car._solidFace(length, dark),
			Car._buildFace(length, body, Color.RED),
			Car._solidFace(length, dark),
		];
		super(game, faces, true);
		this.speed = 0.0;
	}

	tick(dt) {
		const angle = this.rotation * 2 * Math.PI;
		this.x += this.speed * this.game.resolution * Math.cos(angle) * dt;
		this.z += this.speed * this.game.resolution * Math.sin(angle) * dt;
		this.update();
	}

	static _buildFace(length, body, light) {
		const face = Car._solidFace(length, body);
		const leftCenter = Math.floor(length * Car.LIGHT_INSET);
		const rightCenter = Math.floor(length * (1 - Car.LIGHT_INSET));
		const diameter = Math.ceil(length * Car.LIGHT_SIZE);
		const half = Math.floor((diameter - 1) / 2);
		Car._fillLight(face, leftCenter - half, diameter, light);
		Car._fillLight(face, rightCenter - half, diameter, light);
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

export class Cars extends Game {
	static LEVELS = 10;
	static FIRST_LEVEL_START_SIZE = 1.0;
	static FIRST_LEVEL_END_SIZE = 1.0;
	static LAST_LEVEL_START_SIZE = 100.0;
	static LAST_LEVEL_END_SIZE = 10.0;

	constructor(system) {
		super('Cars', system);
		this.camera = new Camera();
		this.player = new Player(this);
		this.player.speed = 0.25;
		this.level = 2;
		this.turnLeftPressed = false;
		this.turnRightPressed = false;
		this.cars = [];
		this.playLevel();
	}

	buildStage() {
		const n = this.level;
		this.initialCars = Math.floor(2 ** n);
		this.levelStartSize = (
			Cars.FIRST_LEVEL_START_SIZE +
			(Cars.LAST_LEVEL_START_SIZE - Cars.FIRST_LEVEL_START_SIZE) * n / (Cars.LEVELS - 1)
		);
		this.levelEndSize = (
			Cars.FIRST_LEVEL_END_SIZE +
			(Cars.LAST_LEVEL_END_SIZE - Cars.FIRST_LEVEL_END_SIZE) * n / (Cars.LEVELS - 1)
		);
		this.world = new World2D(this.levelStartSize, this.levelStartSize, true, true);

		this.cars = [];
		const w = this.world;
		const halfW = w.width * this.resolution / 2.0;
		const halfD = w.depth * this.resolution / 2.0;
		for (let i = 0; i < this.initialCars; i++) {
			const car = new Car(this);
			car.x = Math.random() * 2 * halfD - halfD;
			car.z = Math.random() * 2 * halfW - halfW;
			car.rotation = Math.random();
			car.speed = 1 / 15 + Math.random() * (1 / 12 - 1 / 15);
			this.cars.push(car);
		}

		this.player.x = 0.0;
		this.player.z = 0.0;
		this.player.rotation = 0.0;
		this.turnLeftPressed = false;
		this.turnRightPressed = false;
	}

	loop() {
		super.loop();
		this.clear();
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Color.LIGHT_GRAY;
		}
		const dt = this.system.clock.delta;

		if (this.turnLeftPressed) {
			this.player.rotation = (((this.player.rotation - 0.5 * dt + 1.0) % 1.0) + 1.0) % 1.0;
		}
		if (this.turnRightPressed) {
			this.player.rotation = ((this.player.rotation + 0.5 * dt) % 1.0 + 1.0) % 1.0;
		}

		const pAngle = this.player.rotation * 2 * Math.PI;
		this.player.x += this.player.speed * this.resolution * Math.cos(pAngle) * dt;
		this.player.z += this.player.speed * this.resolution * Math.sin(pAngle) * dt;

		const w = this.world;
		const worldW = w.width * this.resolution;
		const worldD = w.depth * this.resolution;
		const halfW = worldW / 2.0;
		const halfD = worldD / 2.0;
		this.player.x = (((this.player.x + halfD) % worldD + worldD) % worldD) - halfD;
		this.player.z = (((this.player.z + halfW) % worldW + worldW) % worldW) - halfW;

		const camDist = 20.0;
		const camAngle = this.player.rotation * 2 * Math.PI;
		this.camera.x = this.player.x - camDist * Math.cos(camAngle);
		this.camera.z = this.player.z - camDist * Math.sin(camAngle);
		this.camera.rotation = this.player.rotation;

		for (const car of this.cars) {
			car.tick(dt);
			car.x = (((car.x + halfD) % worldD + worldD) % worldD) - halfD;
			car.z = (((car.z + halfW) % worldW + worldW) % worldW) - halfW;

			let dx = car.x - this.camera.x;
			let dz = car.z - this.camera.z;
			dx = (((dx + halfD) % worldD + worldD) % worldD) - halfD;
			dz = (((dz + halfW) % worldW + worldW) % worldW) - halfW;

			const cosT = Math.cos(this.camera.rotation * 2 * Math.PI);
			const sinT = Math.sin(this.camera.rotation * 2 * Math.PI);
			const forward = dx * cosT + dz * sinT;
			const lateral = -dx * sinT + dz * cosT;

			if (forward > 0) {
				const focalLength = this.resolution / 2.0;
				const stripPos = this.resolution / 2 + (lateral / forward) * focalLength;
				let scale = focalLength / forward;
				if (scale > 2.0) {
					scale = 2.0;
				}
				car.render(stripPos, EdgeMode.CLIP, scale);
			}
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.A) {
			this.turnLeftPressed = true;
		} else if (event.command === Command.A_RELEASE) {
			this.turnLeftPressed = false;
		} else if (event.command === Command.C) {
			this.turnRightPressed = true;
		} else if (event.command === Command.C_RELEASE) {
			this.turnRightPressed = false;
		}
	}
}
