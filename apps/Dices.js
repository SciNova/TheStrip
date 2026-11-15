import { Game, Colors, Sound, isGameButtonPress } from '../core/system.js';
import { Square, EdgeMode } from '../core/graphics.js';

const Stage = Object.freeze({ IDLE: 'IDLE', ROLLING: 'ROLLING' });

const FACES = [
	[Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE,
	 Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE,
	 Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE], // face 1

	[Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE,
	 0, Colors.WHITE, Colors.WHITE, Colors.WHITE, 0,
	 Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE], // face 2

	[Colors.WHITE, Colors.WHITE, Colors.WHITE, 0, Colors.WHITE,
	 Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE,
	 Colors.WHITE, 0, Colors.WHITE, Colors.WHITE, Colors.WHITE], // face 3

	[Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, 0,
	 Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE,
	 0, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE], // face 4

	[Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, 0,
	 Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE,
	 0, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE], // face 5

	[Colors.WHITE, 0, Colors.WHITE, 0, Colors.WHITE,
	 0, Colors.WHITE, Colors.WHITE, Colors.WHITE, 0,
	 Colors.WHITE, 0, Colors.WHITE, 0, Colors.WHITE], // face 6
];

class Dice extends Square {
	constructor(game) {
		super(game, FACES);
	}
}

export class Dices extends Game {
	static MIN_SPEED = 4.0;
	static MAX_SPEED = 10.0;
	static MIN_DURATION = 0.5;
	static MAX_DURATION = 2.0;
	static DECELERATION = 6.0;

	constructor(system) {
		super('Dices', system);
		this.dice1 = new Dice(this);
		this.dice2 = new Dice(this);
		this.stage = Stage.IDLE;
		this.speed1 = 0.0;
		this.speed2 = 0.0;
		this.remaining1 = 0.0;
		this.remaining2 = 0.0;
		this.lastFace1 = Math.floor(this.dice1.rotation * 6);
		this.lastFace2 = Math.floor(this.dice2.rotation * 6);
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === Stage.ROLLING) {
			if (this.remaining1 > 0) {
				this.dice1.rotation = (this.dice1.rotation + this.speed1 * dt) % 1.0;
				this.remaining1 -= dt;
			} else if (this.speed1 > 0) {
				this.speed1 = Math.max(this.speed1 - Dices.DECELERATION * dt, 0);
				if (this.speed1 === 0) {
					this.dice1.rotation = Math.round(this.dice1.rotation * 6) / 6.0;
					this.audio.play(Sound.CHECKPOINT);
				} else {
					this.dice1.rotation = (this.dice1.rotation + this.speed1 * dt) % 1.0;
				}
			}

			const face1 = Math.floor(this.dice1.rotation * 6) % 6;
			if (face1 !== this.lastFace1) {
				this.lastFace1 = face1;
				this.audio.play(Sound.TICK);
			}

			if (this.remaining2 > 0) {
				this.dice2.rotation = (this.dice2.rotation + this.speed2 * dt) % 1.0;
				this.remaining2 -= dt;
			} else if (this.speed2 > 0) {
				this.speed2 = Math.max(this.speed2 - Dices.DECELERATION * dt, 0);
				if (this.speed2 === 0) {
					this.dice2.rotation = Math.round(this.dice2.rotation * 6) / 6.0;
					this.audio.play(Sound.CHECKPOINT);
				} else {
					this.dice2.rotation = (this.dice2.rotation + this.speed2 * dt) % 1.0;
				}
			}

			const face2 = Math.floor(this.dice2.rotation * 6) % 6;
			if (face2 !== this.lastFace2) {
				this.lastFace2 = face2;
				this.audio.play(Sound.TICK);
			}

			if (this.speed1 === 0 && this.remaining1 <= 0 && this.speed2 === 0 && this.remaining2 <= 0) {
				this.stage = Stage.IDLE;
			}
		}

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Colors.DARK_GREEN;
		}

		this.dice1.update();
		this.dice2.update();
		this.dice1.render(Math.floor(this.resolution / 3), EdgeMode.MIRROR);
		this.dice2.render(Math.floor(2 * this.resolution / 3), EdgeMode.MIRROR);
	}

	handleInput(padId, event) {
		if (this.stage === Stage.IDLE && isGameButtonPress(event.command)) {
			this.speed1 = Dices.MIN_SPEED + Math.random() * (Dices.MAX_SPEED - Dices.MIN_SPEED);
			this.speed2 = Dices.MIN_SPEED + Math.random() * (Dices.MAX_SPEED - Dices.MIN_SPEED);
			this.remaining1 = Dices.MIN_DURATION + Math.random() * (Dices.MAX_DURATION - Dices.MIN_DURATION);
			this.remaining2 = Dices.MIN_DURATION + Math.random() * (Dices.MAX_DURATION - Dices.MIN_DURATION);
			this.stage = Stage.ROLLING;
		}
	}
}
