import { Game, Colors } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';
import { Square, EdgeMode } from '../../core/graphics.js';

function digitPattern(zeroIndices) {
	const pattern = new Array(21).fill(Colors.WHITE);
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

export class StopWatch extends Game {
	static DIGIT_FACE_SIZE = 21;
	static DIGIT_COUNT = 4;

	constructor(system) {
		super('StopWatch', system);
		this.cubes = [];
		for (let i = 0; i < StopWatch.DIGIT_COUNT; i++) {
			this.cubes.push(new Square(this, DIGIT_PATTERNS));
		}
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
		const minutes = Math.floor(totalSeconds / 60) % 100;
		const seconds = totalSeconds % 60;
		this.setDigit(0, Math.floor(minutes / 10));
		this.setDigit(1, minutes % 10);
		this.setDigit(2, Math.floor(seconds / 10));
		this.setDigit(3, seconds % 10);
	}

	loop() {
		super.loop();

		const currentSecond = Math.floor(this.time);
		if (currentSecond !== this.lastSecond) {
			this.lastSecond = currentSecond;
			this.showColon = !this.showColon;
			this.updateDisplay();
			this.audio.synth.play(SystemSound.TICK);
		}

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Colors.DARK_BLUE;
		}

		const faceSize = StopWatch.DIGIT_FACE_SIZE;
		const n = StopWatch.DIGIT_COUNT;
		const available = Math.max(0, this.resolution - n * faceSize);
		const gap = available / (n + 1);
		const halfFace = (faceSize - 1) / 2;

		const positions = [];
		for (let k = 0; k < n; k++) {
			positions.push(Math.round(gap * (k + 1) + k * faceSize + halfFace));
		}
		for (let k = 0; k < n; k++) {
			this.cubes[k].render(positions[k], EdgeMode.CLIP);
		}

		if (this.showColon) {
			const gapStart = positions[1] + halfFace + 1;
			const gapEnd = positions[2] - halfFace - 1;
			const colonX = gapStart + Math.floor((gapEnd - gapStart - 1) / 2);
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
