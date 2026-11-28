import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

export class QuickDraw extends Game {
	static MIN_WAIT = 1.0;
	static MAX_WAIT = 4.0;
	static CPU_REACTION_MIN = 0.3;
	static CPU_REACTION_MAX = 0.6;
	static RESULT_FLASH = 1.5;
	static LIGHTNING_TIME = 0.25;
	static FAST_TIME = 0.4;
	static OK_TIME = 0.6;

	constructor(system) {
		super('QuickDraw', system);
		this.wins = 0;
		this.losses = 0;
		this._startRound();
	}

	_startRound() {
		this.waitTime = QuickDraw.MIN_WAIT + this.system.random() * (QuickDraw.MAX_WAIT - QuickDraw.MIN_WAIT);
		this.cpuReaction = QuickDraw.CPU_REACTION_MIN + this.system.random() * (QuickDraw.CPU_REACTION_MAX - QuickDraw.CPU_REACTION_MIN);
		this.stage = 'WAITING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'WAITING') {
			this.waitTime -= dt;
			if (this.waitTime <= 0.0) {
				this.stage = 'GO';
				this.cueTime = this.time;
				this.audio.playSynth(SystemSound.TICK);
			}
		} else if (this.stage === 'GO') {
			const elapsed = this.time - this.cueTime;
			if (elapsed >= this.cpuReaction) {
				this._resolve(null);
			}
		} else if (this.stage === 'RESULT') {
			if (this.delayTime <= 0.0) {
				this._startRound();
			}
		}

		this._render();
	}

	_resolve(playerTime) {
		if (playerTime === null) {
			this.losses += 1;
			this.lastResult = 'CPU wins';
			this.audio.play(SystemSound.BOOING);
		} else if (playerTime < this.cpuReaction) {
			this.wins += 1;
			this.audio.play(SystemSound.CHEERING);
			if (playerTime < QuickDraw.LIGHTNING_TIME) {
				this.lastResult = 'Lightning';
			} else if (playerTime < QuickDraw.FAST_TIME) {
				this.lastResult = 'Fast';
			} else if (playerTime < QuickDraw.OK_TIME) {
				this.lastResult = 'OK';
			} else {
				this.lastResult = 'Slow but won';
			}
		} else {
			this.losses += 1;
			this.lastResult = 'Too slow';
			this.audio.play(SystemSound.BOOING);
		}
		this.stage = 'RESULT';
		this.delay(QuickDraw.RESULT_FLASH);
	}

	handleInput(padId, event) {
		if (event.command !== Command.FIRE_PRESS) {
			return;
		}
		if (this.stage === 'WAITING') {
			this.losses += 1;
			this.lastResult = 'False start';
			this.audio.play(SystemSound.BOOING);
			this.stage = 'RESULT';
			this.delay(QuickDraw.RESULT_FLASH);
		} else if (this.stage === 'GO') {
			const playerTime = this.time - this.cueTime;
			this._resolve(playerTime);
		}
	}

	_render() {
		this.clear();

		if (this.stage === 'WAITING') {
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = Color.DARK_RED;
			}
		} else if (this.stage === 'GO') {
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = Color.WHITE;
			}
		} else if (this.stage === 'RESULT') {
			const won = this.lastResult && this.lastResult !== 'CPU wins' && this.lastResult !== 'Too slow' && this.lastResult !== 'False start';
			const flashOn = Math.floor(this.time * 6) % 2 === 0;
			const color = won ? (flashOn ? Color.GREEN : Color.DARK_GREEN) : (flashOn ? Color.RED : Color.DARK_RED);
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = color;
			}
		}
	}
}
