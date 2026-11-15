import { Game, Command, Colors, Sound } from '../core/system.js';

const TOTAL_LEVELS = 10;
const BEEP_DURATION = 0.5;
const ENTRY_DURATION = 0.8;
const INPUT_TIMEOUT = 10.0;

const SimonStage = Object.freeze({
	PLAYBACK: 'PLAYBACK',
	INPUT: 'INPUT',
	RESULT: 'RESULT',
	LEVEL_FAIL: 'LEVEL_FAIL',
	LEVEL_COMPLETE: 'LEVEL_COMPLETE',
	COMPLETE: 'COMPLETE',
});

function soundForColor(color) {
	if (color === Colors.RED) return Sound.SIMONSAYS2;
	if (color === Colors.GREEN) return Sound.SIMONSAYS1;
	if (color === Colors.BLUE) return Sound.SIMONSAYS4;
	if (color === Colors.YELLOW) return Sound.SIMONSAYS3;
	return null;
}

export class SimonSays extends Game {
	constructor(system) {
		super('SimonSays', system);
		this.sequence = new Array(TOTAL_LEVELS).fill(0);
		this.stage = SimonStage.PLAYBACK;
		this.step = 1;
		this.inputStartTime = 0.0;
		this.inputColor = 0;
		this._startLevel();
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

		const sound = soundForColor(this.sequence[0]);
		if (sound) {
			this.audio.play(sound);
		}
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
					const sound = soundForColor(col);
					if (sound) {
						this.audio.play(sound);
					}
				}
			} else {
				this._display(0);
			}
		} else if (this.stage === SimonStage.INPUT) {
			if (this.levelTime - this.inputStartTime > INPUT_TIMEOUT) {
				this.audio.play(Sound.LEVEL_FAIL);
				this.delay(4.0);
				this.stage = SimonStage.LEVEL_FAIL;
			}
		} else if (this.stage === SimonStage.RESULT) {
			const expected = this.sequence[this.step - 1];
			if (this.inputColor === expected) {
				if (this.step === this.level + 1) {
					this.audio.play(Sound.LEVEL_COMPLETE);
					this.delay(4.0);
					this.stage = SimonStage.LEVEL_COMPLETE;
				} else {
					this.step += 1;
					this.stage = SimonStage.INPUT;
					this.inputStartTime = this.levelTime;
					this._display(0);
				}
			} else {
				this.audio.play(Sound.LEVEL_FAIL);
				this.delay(4.0);
				this.stage = SimonStage.LEVEL_FAIL;
			}
		} else if (this.stage === SimonStage.LEVEL_FAIL) {
			this._startLevel();
		} else if (this.stage === SimonStage.LEVEL_COMPLETE) {
			this.nextLevel();
			if (this.level >= TOTAL_LEVELS) {
				this.stage = SimonStage.COMPLETE;
				this.clear();
				this.audio.play(Sound.GAME_COMPLETE);
			} else {
				this._startLevel();
			}
		}
	}

	handleInput(padId, event) {
		if (this.stage !== SimonStage.INPUT) {
			return;
		}
		if (this.delayTime > 0.0) {
			return;
		}
		let color;
		if (event.command === Command.A) {
			color = Colors.RED;
		} else if (event.command === Command.B) {
			color = Colors.GREEN;
		} else if (event.command === Command.C) {
			color = Colors.BLUE;
		} else if (event.command === Command.D) {
			color = Colors.YELLOW;
		} else {
			return;
		}
		this.inputColor = color;
		this._display(color);
		const sound = soundForColor(color);
		if (sound) {
			this.audio.play(sound);
		}
		this.delay(ENTRY_DURATION);
		this.stage = SimonStage.RESULT;
	}
}
