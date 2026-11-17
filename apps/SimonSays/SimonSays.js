import { Game, Command, Colors } from '../../core/system.js';
import { Note, SampleID } from '../../core/audio-common.js';

const TOTAL_LEVELS = 10;
const TONE_DURATION = 0.3;
const BEEP_DURATION = 0.3;
const ENTRY_DURATION = 0.4;
const INPUT_TIMEOUT = 10.0;

const FAIL_NOTE = Note.C2;
const FAIL_DURATION = 0.4;
const COMPLETE_NOTE = Note.A5;
const COMPLETE_DURATION = 0.3;

const SimonStage = Object.freeze({
	PLAYBACK: 'PLAYBACK',
	INPUT: 'INPUT',
	LEVEL_FAIL: 'LEVEL_FAIL',
	LEVEL_COMPLETE: 'LEVEL_COMPLETE',
	COMPLETE: 'COMPLETE',
});

const NoteSets = [
	[Note.A4, Note.B4, Note.C5, Note.D5],
	[Note.A4, Note.A_4, Note.C_5, Note.D5],
	[Note.A4, Note.B4, Note.C_5, Note.E5],
	[Note.A4, Note.C_5, Note.F5, Note.A5],
];

function noteIndexForColor(color) {
	if (color === Colors.RED) return 0;
	if (color === Colors.GREEN) return 1;
	if (color === Colors.BLUE) return 2;
	if (color === Colors.YELLOW) return 3;
	return -1;
}

export class SimonSays extends Game {
	constructor(system) {
		super('SimonSays', system);
		this.sequence = new Array(TOTAL_LEVELS).fill(0);
		this.stage = SimonStage.PLAYBACK;
		this.step = 1;
		this.inputStartTime = 0.0;
		this.inputColor = 0;
		this.noteSetIndex = 0;
		this._startLevel();
	}

	noteForColor(color) {
		const index = noteIndexForColor(color);
		if (index === -1) {
			return null;
		}
		return NoteSets[this.noteSetIndex][index];
	}

	buildStage() {
		if (this.time > 0) {
			return;
		}
		for (let i = 0; i < TOTAL_LEVELS; i++) {
			const r = Math.floor(Math.random() * 4);
			if (r === 0) {
				this.sequence[i] = Colors.RED;
			} else if (r === 1) {
				this.sequence[i] = Colors.GREEN;
			} else if (r === 2) {
				this.sequence[i] = Colors.BLUE;
			} else {
				this.sequence[i] = Colors.YELLOW;
			}
		}
	}

	_display(color) {
		const section = Math.floor(this.resolution / 4);
		for (let i = 0; i < section; i++) {
			this.pixels[i] = Colors.DARK_RED;
			this.pixels[i + section] = Colors.DARK_GREEN;
			this.pixels[i + 2 * section] = Colors.DARK_BLUE;
			this.pixels[i + 3 * section] = Colors.DARK_YELLOW;
		}

		if (color === 0) {
			return;
		}

		let start;
		if (color === Colors.RED) {
			start = 0;
		} else if (color === Colors.GREEN) {
			start = section;
		} else if (color === Colors.BLUE) {
			start = 2 * section;
		} else if (color === Colors.YELLOW) {
			start = 3 * section;
		} else {
			return;
		}

		for (let i = start; i < start + section; i++) {
			this.pixels[i] = color;
		}
	}

	_startLevel() {
		this.stage = SimonStage.PLAYBACK;
		this.step = 1;
		this.inputStartTime = 0.0;
		this.playLevel();
		this._display(this.sequence[0]);
		this.audio.synth.play('SQUARE', this.noteForColor(this.sequence[0]), TONE_DURATION);
	}

	loop() {
		super.loop();
		if (this.delayTime > 0.0) {
			return;
		}

		if (this.stage === SimonStage.PLAYBACK) {
			const lvl = this.level;
			const total = (lvl + 1) * ENTRY_DURATION;
			if (this.levelTime >= total) {
				this._display(0);
				this.stage = SimonStage.INPUT;
				this.step = 1;
				this.inputStartTime = this.levelTime;
				return;
			}

			const curStep = Math.floor(this.levelTime / ENTRY_DURATION) + 1;
			const inStep = this.levelTime % ENTRY_DURATION;
			if (inStep < BEEP_DURATION) {
				if (curStep !== this.step) {
					this.step = curStep;
					const col = this.sequence[curStep - 1];
					this._display(col);
					this.audio.synth.play('SQUARE', this.noteForColor(col), TONE_DURATION);
				}
			} else {
				this._display(0);
			}
		} else if (this.stage === SimonStage.INPUT) {
			if (this.levelTime - this.inputStartTime > INPUT_TIMEOUT) {
				this.audio.synth.play('SAWTOOTH', FAIL_NOTE, FAIL_DURATION);
				this.delay(1.0);
				this.stage = SimonStage.LEVEL_FAIL;
			}
		} else if (this.stage === SimonStage.LEVEL_FAIL) {
			this._startLevel();
		} else if (this.stage === SimonStage.LEVEL_COMPLETE) {
			this.nextLevel();
			if (this.level >= TOTAL_LEVELS) {
				this.stage = SimonStage.COMPLETE;
				this.clear();
				this.audio.play(SampleID.GAME_COMPLETE);
			} else {
				this._startLevel();
			}
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.LEFT_PRESS) {
			this.noteSetIndex = (this.noteSetIndex + NoteSets.length - 1) % NoteSets.length;
			return;
		}
		if (event.command === Command.RIGHT_PRESS) {
			this.noteSetIndex = (this.noteSetIndex + 1) % NoteSets.length;
			return;
		}

		if (this.stage !== SimonStage.INPUT) {
			return;
		}

		let color;
		let pressed;
		switch (event.command) {
			case Command.A_PRESS: color = Colors.RED; pressed = true; break;
			case Command.A_RELEASE: color = Colors.RED; pressed = false; break;
			case Command.B_PRESS: color = Colors.GREEN; pressed = true; break;
			case Command.B_RELEASE: color = Colors.GREEN; pressed = false; break;
			case Command.C_PRESS: color = Colors.BLUE; pressed = true; break;
			case Command.C_RELEASE: color = Colors.BLUE; pressed = false; break;
			case Command.D_PRESS: color = Colors.YELLOW; pressed = true; break;
			case Command.D_RELEASE: color = Colors.YELLOW; pressed = false; break;
			default: return;
		}

		if (pressed) {
			const expected = this.sequence[this.step - 1];
			if (color !== expected) {
				this.audio.synth.play('SAWTOOTH', FAIL_NOTE, FAIL_DURATION);
				this.delay(1.0);
				this.stage = SimonStage.LEVEL_FAIL;
				return;
			}
			this.inputColor = color;
			this._display(color);
			this.audio.synth.play('SQUARE', this.noteForColor(color), TONE_DURATION);
			return;
		}

		if (color !== this.inputColor) {
			return;
		}
		this._display(0);
		if (this.step === this.level + 1) {
			this.audio.synth.play('SAWTOOTH', COMPLETE_NOTE, COMPLETE_DURATION);
			this.delay(1.0);
			this.stage = SimonStage.LEVEL_COMPLETE;
		} else {
			this.step += 1;
			this.inputColor = 0;
		}
	}
}
