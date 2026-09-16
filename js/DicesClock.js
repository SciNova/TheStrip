import { Game, Colors, Sound } from './system.js';
import { Square, EdgeMode } from './graphics.js';

function digitPattern(zeroIndices) {
	const pattern = new Array(21).fill(Colors.GREEN);
	for (const i of zeroIndices) {
		pattern[i] = 0;
	}
	return pattern;
}

const DIGIT_PATTERNS = [
	digitPattern([]),
	digitPattern([10]),
	digitPattern([4, 16]),
	digitPattern([4, 10, 16]),
	digitPattern([3, 5, 15, 17]),
	digitPattern([3, 5, 10, 15, 17]),
	digitPattern([1, 3, 5, 14, 16, 18]),
	digitPattern([1, 3, 5, 10, 14, 16, 18]),
	digitPattern([1, 3, 5, 7, 13, 15, 17, 19]),
	digitPattern([1, 3, 5, 7, 10, 13, 15, 17, 19]),
];

export class DicesClock extends Game {
	constructor(system) {
		super('DicesClock', system);
		this.cubes = [new Square(this, DIGIT_PATTERNS), new Square(this, DIGIT_PATTERNS), new Square(this, DIGIT_PATTERNS)];
		this.lastSecond = -1;
		this.showColon = true;
		this.updateDisplay();
	}

	setDigit(cubeIdx, digit) {
		this.cubes[cubeIdx].rotation = digit / 10.0;
		this.cubes[cubeIdx].update();
	}

	updateDisplay() {
		const totalSeconds = Math.floor(this.time);
		const minutes = Math.floor(totalSeconds / 60) % 10;
		const seconds = totalSeconds % 60;
		const tens = Math.floor(seconds / 10);
		const ones = seconds % 10;
		this.setDigit(0, minutes);
		this.setDigit(1, tens);
		this.setDigit(2, ones);
	}

	loop() {
		super.loop();

		const currentSecond = Math.floor(this.time);
		if (currentSecond !== this.lastSecond) {
			this.lastSecond = currentSecond;
			this.showColon = !this.showColon;
			this.updateDisplay();
			this.audio.play(Sound.TICK);
		}

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0;
		}

		const cubeW = this.cubes[0].pixels.length;
		const spacing = 1;
		const colonGap = 3;
		const groupW = (3 * cubeW) + spacing + colonGap;
		const leftEdge = Math.floor((this.resolution - groupW) / 2);

		let pos = leftEdge + Math.floor(cubeW / 2);
		this.cubes[0].render(pos, EdgeMode.CLIP);

		pos += cubeW + colonGap;
		this.cubes[1].render(pos, EdgeMode.CLIP);

		pos += cubeW + spacing;
		this.cubes[2].render(pos, EdgeMode.CLIP);

		if (this.showColon) {
			const colonX = leftEdge + cubeW + Math.floor(colonGap / 2);
			if (colonX >= 0 && colonX < this.resolution) {
				this.pixels[colonX] = Colors.WHITE;
			}
			if (colonX + 1 < this.resolution) {
				this.pixels[colonX + 1] = Colors.WHITE;
			}
		}
	}

	handleInput(padId, event) {
	}
}
