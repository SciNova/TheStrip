import { Game, Colors, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';

export class TugOfWar extends Game {
	static PULL_IMPULSE = 0.35;
	static MAX_BOOST = 1.2;
	static BOOST_DECAY = 0.9;
	static BASE_CPU_RATE = 0.4;
	static CPU_RATE_PER_ROUND = 0.03;
	static ROPE_SCALE = 0.35;
	static RESULT_FLASH = 1.5;
	static MAX_LIVES = 3;

	constructor(system) {
		super('TugOfWar', system);
		this.round = 0;
		this.score = 0;
		this.lives = TugOfWar.MAX_LIVES;
		this._startRound();
	}

	_startRound() {
		this.ropePos = 0.5;
		this.playerBoost = 0.0;
		this.cpuRate = TugOfWar.BASE_CPU_RATE + this.round * TugOfWar.CPU_RATE_PER_ROUND;
		this.stage = 'PLAYING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'PLAYING') {
			this._loopPlaying(dt);
		} else if (this.stage === 'RESULT') {
			if (this.delayTime <= 0.0) {
				if (this.lives <= 0) {
					this.round = 0;
					this.score = 0;
					this.lives = TugOfWar.MAX_LIVES;
				}
				this._startRound();
			}
		}

		this._render();
	}

	_loopPlaying(dt) {
		this.playerBoost *= Math.max(0.0, 1.0 - TugOfWar.BOOST_DECAY * dt);
		const cpuNoise = this.cpuRate * (0.85 + Math.random() * 0.3);
		this.ropePos += (this.playerBoost - cpuNoise) * TugOfWar.ROPE_SCALE * dt;

		if (this.ropePos >= 1.0) {
			this.ropePos = 1.0;
			this.score += 1;
			this.round += 1;
			this.audio.play(SystemSound.CHEERING);
			this.won = true;
			this.stage = 'RESULT';
			this.delay(TugOfWar.RESULT_FLASH);
		} else if (this.ropePos <= 0.0) {
			this.ropePos = 0.0;
			this.lives -= 1;
			this.audio.play(SystemSound.BOOING);
			this.won = false;
			this.stage = 'RESULT';
			this.delay(TugOfWar.RESULT_FLASH);
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage === 'PLAYING' && event.command === Command.FIRE_PRESS) {
			this.playerBoost = Math.min(TugOfWar.MAX_BOOST, this.playerBoost + TugOfWar.PULL_IMPULSE);
		}
	}

	_render() {
		this.clear();

		if (this.stage === 'PLAYING') {
			const markerPos = Math.round(this.ropePos * (this.resolution - 1));
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = i < markerPos ? Colors.DARK_RED : Colors.DARK_BLUE;
			}
			if (markerPos >= 0 && markerPos < this.resolution) {
				this.pixels[markerPos] = Colors.WHITE;
			}
		} else if (this.stage === 'RESULT') {
			const flashOn = Math.floor(this.time * 6) % 2 === 0;
			const color = this.won ? (flashOn ? Colors.GREEN : Colors.DARK_GREEN) : (flashOn ? Colors.RED : Colors.DARK_RED);
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = color;
			}
		}
	}
}
