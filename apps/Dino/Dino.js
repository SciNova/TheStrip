import { Game } from '../../core/Game.js';
import { Command } from '../../core/Command.js';

class Player {
	static LOW_SIZE = 3;
	static HIGH_SIZE = 15;
	static GRAVITY = 4.0;
	static JUMP_SPEED = 2.828;

	constructor(game) {
		this.game = game;
		this.height = 0.0;
		this.speed = 0.0;
		this.isJumping = false;
	}

	jump() {
		if (!this.isJumping) {
			this.isJumping = true;
			this.speed = Player.JUMP_SPEED;
		}
	}

	update() {
		const dt = this.game.system.clock.delta;
		if (this.isJumping) {
			this.speed -= Player.GRAVITY * dt;
			this.height += this.speed * dt;
			if (this.height <= 0.0) {
				this.height = 0.0;
				this.speed = 0.0;
				this.isJumping = false;
			}
		}
	}

	render() {
		let size = Player.LOW_SIZE + Math.floor(this.height * (Player.HIGH_SIZE - Player.LOW_SIZE));
		if (size % 2 === 0) {
			size += 1;
		}
		const lowR = 0x00, lowG = 0x99, lowB = 0x00;
		const highR = 0x00, highG = 0xFF, highB = 0x00;
		const r = Math.floor(lowR + (highR - lowR) * this.height);
		const g = Math.floor(lowG + (highG - lowG) * this.height);
		const b = Math.floor(lowB + (highB - lowB) * this.height);
		const color = (r << 16) | (g << 8) | b;
		return new Array(size).fill(color);
	}
}

class Obstacle {
	static LOW_SIZE = 1;
	static HIGH_SIZE = 15;

	constructor(height) {
		this.height = height;
	}

	render() {
		let size = Obstacle.LOW_SIZE + Math.floor(this.height * (Obstacle.HIGH_SIZE - Obstacle.LOW_SIZE));
		if (size % 2 === 0) {
			size += 1;
		}
		const lowR = 0x99, lowG = 0x99, lowB = 0x99;
		const highR = 0xCC, highG = 0xCC, highB = 0xCC;
		const r = Math.floor(lowR + (highR - lowR) * this.height);
		const g = Math.floor(lowG + (highG - lowG) * this.height);
		const b = Math.floor(lowB + (highB - lowB) * this.height);
		const color = (r << 16) | (g << 8) | b;
		return new Array(size).fill(color);
	}
}

export class Dino extends Game {
	static MIN_GAP = 50;
	static MAX_GAP = 70;
	static MIN_HEIGHT = 0.1;
	static MAX_HEIGHT = 0.5;
	static SPEED = 30.0;

	constructor(system) {
		super('Dino', system);
		this.player = new Player(this);
		this.obstacles = new Array(this.resolution).fill(null);
		this.gap = 0;
		this.positionRemainder = 0.0;
	}

	loop() {
		super.loop();

		this.player.update();

		const dt = this.system.clock.delta;
		this.positionRemainder += Dino.SPEED * dt;
		const steps = Math.floor(this.positionRemainder);
		this.positionRemainder -= steps;

		for (let s = 0; s < steps; s++) {
			this.obstacles.shift();

			this.gap -= 1;
			if (this.gap <= 0) {
				const h = Dino.MIN_HEIGHT + Math.random() * (Dino.MAX_HEIGHT - Dino.MIN_HEIGHT);
				this.obstacles.push(new Obstacle(h));
				this.gap = Dino.MIN_GAP + Math.floor(Math.random() * (Dino.MAX_GAP - Dino.MIN_GAP + 1));
			} else {
				this.obstacles.push(null);
			}
		}

		this.clear();
		for (let i = 0; i < this.obstacles.length; i++) {
			const obs = this.obstacles[i];
			if (obs === null) {
				continue;
			}
			const obsPixels = obs.render();
			const offset = Math.floor(obsPixels.length / 2);
			for (let j = 0; j < obsPixels.length; j++) {
				const stripPos = i - offset + j;
				if (stripPos >= 0 && stripPos < this.resolution) {
					this.pixels[stripPos] = obsPixels[j];
				}
			}

			const center = Math.floor(this.resolution / 2);
			const shadowLength = Math.floor(Math.abs(i - center) * obsPixels.length / center);
			if (shadowLength > 0) {
				const shadowColor = 0x333333;
				if (i < center) {
					const start = i + offset + 1;
					for (let k = 0; k < shadowLength; k++) {
						const pos = start + k;
						if (pos >= 0 && pos < this.resolution) {
							this.pixels[pos] = shadowColor;
						}
					}
				} else {
					const start = i - offset - shadowLength;
					for (let k = 0; k < shadowLength; k++) {
						const pos = start + k;
						if (pos >= 0 && pos < this.resolution) {
							this.pixels[pos] = shadowColor;
						}
					}
				}
			}
		}

		const playerPixels = this.player.render();
		const offset = Math.floor(playerPixels.length / 2);
		const centerPos = Math.floor(this.resolution * 0.3);
		for (let j = 0; j < playerPixels.length; j++) {
			const stripPos = centerPos - offset + j;
			if (stripPos >= 0 && stripPos < this.resolution) {
				this.pixels[stripPos] = playerPixels[j];
			}
		}
	}

	handleInput(padId, event) {
		if (Command.isGameCommand(event.command)) {
			this.player.jump();
		}
	}
}
