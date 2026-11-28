import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';
import { Note } from '../../core/audio/Note.js';
import { Scale } from '../../core/audio/Note.js';
import { Shape } from '../../core/graphics/Shape.js';
import { Alignment } from '../../core/graphics/Alignment.js';
import { EdgeMode } from '../../core/graphics/EdgeMode.js';

const Fruit = Object.freeze({
	APPLE: 0,
	BANANA: 1,
	GRAPE: 2,
	ORANGE: 3,
	CHERRY: 4,
	LEMON: 5,
	WATERMELON: 6,
	BLACKBERRY: 7,
	STRAWBERRY: 8,
});

const FRUIT_SIZE = [
	0.3,
	0.7,
	0.6,
	0.6,
	0.4,
	0.5,
	0.8,
	0.2,
	0.45,
];

const FRUIT_COLOR = {
	[Fruit.APPLE]: Color.GREEN,
	[Fruit.BANANA]: Color.BANANA,
	[Fruit.GRAPE]: Color.PURPLE,
	[Fruit.ORANGE]: Color.ORANGE,
	[Fruit.CHERRY]: Color.RED,
	[Fruit.LEMON]: Color.LEMON,
	[Fruit.WATERMELON]: Color.WATERMELON,
	[Fruit.BLACKBERRY]: Color.BLACKBERRY,
	[Fruit.STRAWBERRY]: Color.STRAWBERRY,
};

const FRUIT_SCALE_POSITION = {
	[Fruit.BANANA]: 0,
	[Fruit.ORANGE]: 1,
	[Fruit.CHERRY]: 2,
	[Fruit.LEMON]: 3,
	[Fruit.WATERMELON]: 4,
	[Fruit.APPLE]: 5,
	[Fruit.GRAPE]: 6,
	[Fruit.BLACKBERRY]: 7,
	[Fruit.STRAWBERRY]: 8,
};

const Scales = [
	Scale.MAJOR,
	Scale.MINOR,
	Scale.ARABIC,
	Scale.CHINESE,
	Scale.SCARY,
];

class Wheel extends Shape {
	static NUM_SYMBOLS = 8;

	constructor(game, size, symbols) {
		super(game, size, Alignment.CENTER);
		this.symbols = symbols;
		this.speed = 0.0;
		this.spinEndTime = 0.0;
		this.rotation = 0.0;
		this._prevRotation = 0.0;
	}

	tick(dt) {
		this._prevRotation = this.rotation;

		if (this.speed > 0) {
			if (this.game.time >= this.spinEndTime) {
				this.speed -= Slots.DECELERATION * dt;
				if (this.speed <= 0) {
					this.speed = 0;
					this.rotation = Math.round(this.rotation);
					const fruit = this.symbols[this.rotation % Wheel.NUM_SYMBOLS];
					const scale = Scales[this.game.scaleIndex];
					const note = scale[FRUIT_SCALE_POSITION[fruit]];
					this.game.audio.playSynthCustom('SAWTOOTH', Note.frequency(note), 0.3, 0.0, 0.18, 0.0, 0.08);
				}
			}

			this.rotation += this.speed * dt;
			while (this.rotation >= Wheel.NUM_SYMBOLS) {
				this.rotation -= Wheel.NUM_SYMBOLS;
			}
			while (this.rotation < 0) {
				this.rotation += Wheel.NUM_SYMBOLS;
			}
		}

		if (this.speed > 0) {
			if (Math.floor(this.rotation) !== Math.floor(this._prevRotation)) {
				this.game.audio.playSynth(SystemSound.TICK);
			}
		}

		const S = this.pixels.length;
		const slotAngle = 2 * Math.PI / Wheel.NUM_SYMBOLS;
		const wheelAngle = this.rotation * slotAngle + slotAngle / 2;

		for (let j = 0; j < S; j++) {
			const t = j / (S - 1);
			const theta = (t - 0.5) * Math.PI;
			let absoluteAngle = (theta + wheelAngle) % (2 * Math.PI);
			if (absoluteAngle < 0) {
				absoluteAngle += 2 * Math.PI;
			}

			const slotIndex = Math.floor(absoluteAngle / slotAngle) % Wheel.NUM_SYMBOLS;
			const localAngle = absoluteAngle - slotIndex * slotAngle;
			const fruit = this.symbols[slotIndex];

			const fruitAngularSpan = FRUIT_SIZE[fruit] * slotAngle;
			const fruitStart = (slotAngle - fruitAngularSpan) / 2;
			const fruitEnd = (slotAngle + fruitAngularSpan) / 2;

			let pixelColor;
			if (localAngle >= fruitStart && localAngle <= fruitEnd) {
				pixelColor = FRUIT_COLOR[fruit];
			} else {
				pixelColor = Color.SILVER;
			}

			const brightness = 1 - ((t - 0.5) * 2) ** 2;
			const r = Math.floor(((pixelColor >> 16) & 0xFF) * brightness);
			const g = Math.floor(((pixelColor >> 8) & 0xFF) * brightness);
			const b = Math.floor((pixelColor & 0xFF) * brightness);
			this.pixels[j] = (r << 16) | (g << 8) | b;
		}
	}
}

export class Slots extends Game {
	static NUM_WHEELS = 3;
	static NUM_SYMBOLS = 8;
	static DECELERATION = 15.0;
	static MIN_SPEED = 10;
	static MAX_SPEED = 40;
	static MIN_SPIN_DURATION = 2.0;
	static MAX_SPIN_DURATION = 5.0;

	static WHEELS = [
		[Fruit.CHERRY, Fruit.LEMON, Fruit.ORANGE, Fruit.BANANA, Fruit.CHERRY, Fruit.LEMON, Fruit.WATERMELON, Fruit.ORANGE],
		[Fruit.BANANA, Fruit.CHERRY, Fruit.LEMON, Fruit.ORANGE, Fruit.CHERRY, Fruit.WATERMELON, Fruit.LEMON, Fruit.ORANGE],
		[Fruit.LEMON, Fruit.ORANGE, Fruit.CHERRY, Fruit.WATERMELON, Fruit.LEMON, Fruit.ORANGE, Fruit.BANANA, Fruit.CHERRY],
	];

	static STAGE_IDLE = 0;
	static STAGE_SPINNING = 1;
	static STAGE_RESULT = 2;

	constructor(system) {
		super('Slots', system);

		this.segmentPixels = Math.floor(this.resolution / Slots.NUM_WHEELS);
		if (this.segmentPixels % 2 === 0) {
			this.segmentPixels -= 1;
		}
		this.offset = Math.floor((this.resolution - this.segmentPixels * Slots.NUM_WHEELS) / 2);

		this.wheels = [];
		for (let i = 0; i < Slots.NUM_WHEELS; i++) {
			const wheel = new Wheel(this, this.segmentPixels, Slots.WHEELS[i]);
			wheel.rotation = Math.floor(this.system.random() * Slots.NUM_SYMBOLS);
			this.wheels.push(wheel);
		}

		this.stage = Slots.STAGE_IDLE;
		this.scaleIndex = 0;
	}

	spin() {
		for (const wheel of this.wheels) {
			wheel.speed = Slots.MIN_SPEED + this.system.random() * (Slots.MAX_SPEED - Slots.MIN_SPEED);
			wheel.spinEndTime = this.time + Slots.MIN_SPIN_DURATION + this.system.random() * (Slots.MAX_SPIN_DURATION - Slots.MIN_SPIN_DURATION);
		}
		this.stage = Slots.STAGE_SPINNING;
	}

	loop() {
		super.loop();

		const dt = this.system.clock.delta;

		for (const wheel of this.wheels) {
			wheel.tick(dt);
		}

		if (this.stage === Slots.STAGE_SPINNING) {
			const allStopped = this.wheels.every((w) => w.speed === 0);
			if (allStopped) {
				this.stage = Slots.STAGE_RESULT;
				this._evaluate();
			}
		}

		this._render();
	}

	_evaluate() {
		const centreFruits = [];
		for (const wheel of this.wheels) {
			const idx = Math.round(wheel.rotation) % Slots.NUM_SYMBOLS;
			centreFruits.push(wheel.symbols[idx]);
		}

		if (centreFruits[0] === centreFruits[1] && centreFruits[1] === centreFruits[2]) {
			this.audio.play(SystemSound.CHEERING);
		}

		this.delay(4.0);
		this.stage = Slots.STAGE_IDLE;
	}

	_render() {
		this.clear();
		for (let i = 0; i < this.wheels.length; i++) {
			const wheel = this.wheels[i];
			const segmentStart = this.offset + i * this.segmentPixels;
			const centre = segmentStart + (this.segmentPixels - 1) / 2.0;
			wheel.render(centre, EdgeMode.CLIP);
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.LEFT_PRESS) {
			this.scaleIndex = (this.scaleIndex + Scales.length - 1) % Scales.length;
			return;
		}
		if (event.command === Command.RIGHT_PRESS) {
			this.scaleIndex = (this.scaleIndex + 1) % Scales.length;
			return;
		}

		if (this.stage === Slots.STAGE_IDLE && Command.isGameCommand(event.command)) {
			this.spin();
		}
	}
}
