import { Game, Color, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio.js';
import { Square, EdgeMode } from '../../core/graphics.js';

const Stage = Object.freeze({ IDLE: 'IDLE', ROLLING: 'ROLLING' });

const FACES = [
	[Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE,
	 Color.WHITE, Color.WHITE, 0, Color.WHITE, Color.WHITE,
	 Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE],

	[Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE,
	 0, Color.WHITE, Color.WHITE, Color.WHITE, 0,
	 Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE],

	[Color.WHITE, Color.WHITE, Color.WHITE, 0, Color.WHITE,
	 Color.WHITE, Color.WHITE, 0, Color.WHITE, Color.WHITE,
	 Color.WHITE, 0, Color.WHITE, Color.WHITE, Color.WHITE],

	[Color.WHITE, Color.WHITE, 0, Color.WHITE, 0,
	 Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE, Color.WHITE,
	 0, Color.WHITE, 0, Color.WHITE, Color.WHITE],

	[Color.WHITE, Color.WHITE, 0, Color.WHITE, 0,
	 Color.WHITE, Color.WHITE, 0, Color.WHITE, Color.WHITE,
	 0, Color.WHITE, 0, Color.WHITE, Color.WHITE],

	[Color.WHITE, 0, Color.WHITE, 0, Color.WHITE,
	 0, Color.WHITE, Color.WHITE, Color.WHITE, 0,
	 Color.WHITE, 0, Color.WHITE, 0, Color.WHITE],
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
	static DICE_FACE_SIZE = 15;

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
					this.audio.playSynth(SystemSound.CHECKPOINT);
				} else {
					this.dice1.rotation = (this.dice1.rotation + this.speed1 * dt) % 1.0;
				}
			}

			const face1 = Math.floor(this.dice1.rotation * 6) % 6;
			if (face1 !== this.lastFace1) {
				this.lastFace1 = face1;
				this.audio.playSynth(SystemSound.TICK);
			}

			if (this.remaining2 > 0) {
				this.dice2.rotation = (this.dice2.rotation + this.speed2 * dt) % 1.0;
				this.remaining2 -= dt;
			} else if (this.speed2 > 0) {
				this.speed2 = Math.max(this.speed2 - Dices.DECELERATION * dt, 0);
				if (this.speed2 === 0) {
					this.dice2.rotation = Math.round(this.dice2.rotation * 6) / 6.0;
					this.audio.playSynth(SystemSound.CHECKPOINT);
				} else {
					this.dice2.rotation = (this.dice2.rotation + this.speed2 * dt) % 1.0;
				}
			}

			const face2 = Math.floor(this.dice2.rotation * 6) % 6;
			if (face2 !== this.lastFace2) {
				this.lastFace2 = face2;
				this.audio.playSynth(SystemSound.TICK);
			}

			if (this.speed1 === 0 && this.remaining1 <= 0 && this.speed2 === 0 && this.remaining2 <= 0) {
				this.stage = Stage.IDLE;
			}
		}

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Color.DARK_GREEN;
		}

		this.dice1.update();
		this.dice2.update();
		const available = Math.max(0, this.resolution - 2 * Dices.DICE_FACE_SIZE);
		const gap = available / 3;
		const halfFace = (Dices.DICE_FACE_SIZE - 1) / 2;
		const position1 = Math.round(gap + halfFace);
		const position2 = Math.round(this.resolution - 1 - gap - halfFace);

		const stopped1 = this.speed1 === 0 && this.remaining1 <= 0;
		const stopped2 = this.speed2 === 0 && this.remaining2 <= 0;
		if (stopped1 && !stopped2) {
			this.dice2.render(position2, EdgeMode.MIRROR);
			this.dice1.render(position1, EdgeMode.MIRROR);
		} else {
			this.dice1.render(position1, EdgeMode.MIRROR);
			this.dice2.render(position2, EdgeMode.MIRROR);
		}
	}

	handleInput(padId, event) {
		if (this.stage === Stage.IDLE && Command.isGameCommand(event.command)) {
			this.speed1 = Dices.MIN_SPEED + Math.random() * (Dices.MAX_SPEED - Dices.MIN_SPEED);
			this.speed2 = Dices.MIN_SPEED + Math.random() * (Dices.MAX_SPEED - Dices.MIN_SPEED);
			this.remaining1 = Dices.MIN_DURATION + Math.random() * (Dices.MAX_DURATION - Dices.MIN_DURATION);
			this.remaining2 = Dices.MIN_DURATION + Math.random() * (Dices.MAX_DURATION - Dices.MIN_DURATION);
			this.stage = Stage.ROLLING;
		}
	}
}
