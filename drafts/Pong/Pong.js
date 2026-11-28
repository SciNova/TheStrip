import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

const PongStage = Object.freeze({ PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' });

export class Pong extends Game {
	static PADDLE_WIDTH = 9;
	static PADDLE_SPEED = 60.0;
	static BASE_APPROACH_SPEED = 0.35;
	static APPROACH_SPEED_STEP = 0.035;
	static MAX_LIVES = 3;
	static MIN_BALL_SIZE = 1;
	static MAX_BALL_SIZE = 5;

	constructor(system) {
		super('Pong', system);
		this.stage = PongStage.PLAYING;
		this.paddlePos = this.resolution / 2.0;
		this.paddleDir = 0;
		this.score = 0;
		this.lives = Pong.MAX_LIVES;
		this.approachSpeed = Pong.BASE_APPROACH_SPEED;
		this._spawnBall();
	}

	_spawnBall() {
		const half = Math.floor(Pong.PADDLE_WIDTH / 2);
		this.ballLane = half + Math.floor(this.system.random() * (this.resolution - 2 * half));
		this.ballZ = 1.0;
	}

	_resetGame() {
		this.paddlePos = this.resolution / 2.0;
		this.paddleDir = 0;
		this.score = 0;
		this.lives = Pong.MAX_LIVES;
		this.approachSpeed = Pong.BASE_APPROACH_SPEED;
		this.stage = PongStage.PLAYING;
		this._spawnBall();
	}

	loop() {
		super.loop();

		const dt = this.system.clock.delta;

		if (this.stage === PongStage.PLAYING) {
			if (this.delayTime > 0.0) {
				this._render();
				return;
			}

			this.paddlePos += this.paddleDir * Pong.PADDLE_SPEED * dt;
			if (this.paddlePos < 0) {
				this.paddlePos = 0;
			} else if (this.paddlePos > this.resolution - 1) {
				this.paddlePos = this.resolution - 1;
			}

			this.ballZ -= this.approachSpeed * dt;
			if (this.ballZ <= 0.0) {
				const half = Pong.PADDLE_WIDTH / 2.0;
				const hit = Math.abs(this.ballLane - this.paddlePos) <= half;
				if (hit) {
					this.score += 1;
					this.approachSpeed += Pong.APPROACH_SPEED_STEP;
					this.audio.playSynth(SystemSound.EXPLOSION);
					this._spawnBall();
					this.delay(0.1);
				} else {
					this.lives -= 1;
					this.audio.playSynth(SystemSound.WARNING);
					if (this.lives <= 0) {
						this.stage = PongStage.GAMEOVER;
						this.audio.play(SystemSound.BOOING);
						this.delay(3.0);
					} else {
						this._spawnBall();
						this.delay(0.5);
					}
				}
			}

			this._render();
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			}
			this._renderGameOver();
		}
	}

	_render() {
		this.clear();

		const half = Math.floor(Pong.PADDLE_WIDTH / 2);
		const paddleCenter = Math.round(this.paddlePos);
		for (let i = -half; i <= half; i++) {
			const pos = paddleCenter + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Color.CYAN;
			}
		}

		const approach = 1.0 - this.ballZ;
		const size = Pong.MIN_BALL_SIZE + Math.round(approach * (Pong.MAX_BALL_SIZE - Pong.MIN_BALL_SIZE));
		const brightness = 0.25 + 0.75 * approach;
		const r = Math.floor(0xFF * brightness);
		const g = Math.floor(0xFF * brightness);
		const b = Math.floor(0xFF * brightness);
		const ballColor = (r << 16) | (g << 8) | b;
		const ballHalf = Math.floor(size / 2);
		const ballCenter = Math.round(this.ballLane);
		for (let i = -ballHalf; i <= ballHalf; i++) {
			const pos = ballCenter + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = ballColor;
			}
		}
	}

	_renderGameOver() {
		this.clear();
		const lit = Math.min(this.score, this.resolution);
		for (let i = 0; i < lit; i++) {
			this.pixels[i] = Color.DARK_RED;
		}
		const flashOn = Math.floor(this.time * 4) % 2 === 0;
		if (flashOn) {
			for (let i = 0; i < this.resolution; i++) {
				if (this.pixels[i] === 0) {
					this.pixels[i] = Color.RED;
				}
			}
		}
	}

	handleInput(padId, event) {
		if (this.stage !== PongStage.PLAYING) {
			return;
		}
		if (event.command === Command.UP_PRESS) {
			this.paddleDir = 1;
		} else if (event.command === Command.DOWN_PRESS) {
			this.paddleDir = -1;
		} else if (event.command === Command.UP_RELEASE) {
			if (this.paddleDir === 1) {
				this.paddleDir = 0;
			}
		} else if (event.command === Command.DOWN_RELEASE) {
			if (this.paddleDir === -1) {
				this.paddleDir = 0;
			}
		}
	}
}
