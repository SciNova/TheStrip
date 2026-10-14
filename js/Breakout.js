import { Game, Colors, Sound, Command } from './system.js';

const BreakoutStage = Object.freeze({ PLAYING: 'PLAYING', LEVEL_COMPLETE: 'LEVEL_COMPLETE', GAMEOVER: 'GAMEOVER' });

const HEALTH_COLORS = [null, Colors.YELLOW, Colors.ORANGE, Colors.RED];

export class Breakout extends Game {
	static MIN_BRICKS = 6;
	static BRICK_PIXELS = 8; // target pixels per brick column
	static MAX_HEALTH = 3;
	static PADDLE_WIDTH = 9;
	static PADDLE_SPEED = 1.1; // resolution-fraction/sec
	static BALL_Z_SPEED = 0.6; // normalized depth units/sec (z spans 0..1)
	static BALL_BASE_VX = 0.3; // resolution-fraction/sec
	static BALL_BOUNCE_VX = 0.6; // resolution-fraction/sec, paddle-reflected max
	static BALL_PERTURB = 0.15; // resolution-fraction/sec, random nudge on brick hit
	static MIN_BALL_SIZE = 1;
	static MAX_BALL_SIZE = 4;
	static MAX_LIVES = 3;

	constructor(system) {
		super('Breakout', system);
		this.level = 0;
		this.score = 0;
		this.lives = Breakout.MAX_LIVES;
		this.paddleCenter = this.resolution / 2.0;
		this.paddleDir = 0;
		this._buildLevel();
	}

	_buildLevel() {
		const cols = Math.max(Breakout.MIN_BRICKS, Math.round(this.resolution / Breakout.BRICK_PIXELS));
		this.brickCols = cols;
		this.brickWidth = this.resolution / cols;
		const extraHealth = Math.min(Breakout.MAX_HEALTH - 1, Math.floor(this.level / 3));
		this.bricks = [];
		for (let i = 0; i < cols; i++) {
			this.bricks.push({ health: 1 + extraHealth, alive: true });
		}
		this._respawnBall();
		this.stage = BreakoutStage.PLAYING;
	}

	_respawnBall() {
		this.ball = {
			x: this.paddleCenter,
			vx: (Math.random() < 0.5 ? -1 : 1) * Breakout.BALL_BASE_VX * this.resolution,
			z: 0.0,
			direction: 1,
		};
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === BreakoutStage.PLAYING) {
			this._loopPlaying(dt);
		} else if (this.stage === BreakoutStage.LEVEL_COMPLETE) {
			if (this.delayTime <= 0.0) {
				this.level += 1;
				this._buildLevel();
			} else {
				this._renderFlash(Colors.GREEN, Colors.DARK_GREEN);
			}
		} else {
			if (this.delayTime <= 0.0) {
				this.level = 0;
				this.score = 0;
				this.lives = Breakout.MAX_LIVES;
				this._buildLevel();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopPlaying(dt) {
		if (this.delayTime > 0.0) {
			this._render();
			return;
		}

		this.paddleCenter += this.paddleDir * Breakout.PADDLE_SPEED * this.resolution * dt;
		const half = Breakout.PADDLE_WIDTH / 2.0;
		if (this.paddleCenter < half) {
			this.paddleCenter = half;
		} else if (this.paddleCenter > this.resolution - 1 - half) {
			this.paddleCenter = this.resolution - 1 - half;
		}

		const ball = this.ball;
		ball.x += ball.vx * dt;
		if (ball.x < 0) {
			ball.x = -ball.x;
			ball.vx = -ball.vx;
		} else if (ball.x > this.resolution - 1) {
			ball.x = 2 * (this.resolution - 1) - ball.x;
			ball.vx = -ball.vx;
		}

		ball.z += ball.direction * Breakout.BALL_Z_SPEED * dt;

		if (ball.z >= 1.0) {
			ball.z = 1.0;
			ball.direction = -1;
			const col = Math.min(this.brickCols - 1, Math.max(0, Math.floor(ball.x / this.brickWidth)));
			const brick = this.bricks[col];
			if (brick.alive) {
				brick.health -= 1;
				if (brick.health <= 0) {
					brick.alive = false;
				}
				this.score += 1;
				this.audio.play(Sound.HIT);
			} else {
				this.audio.play(Sound.TICK);
			}
			ball.vx += (Math.random() * 2 - 1) * Breakout.BALL_PERTURB * this.resolution;

			if (this.bricks.every((b) => !b.alive)) {
				this.stage = BreakoutStage.LEVEL_COMPLETE;
				this.audio.play(Sound.LEVEL_COMPLETE);
				this.delay(2.0);
			}
		} else if (ball.z <= 0.0) {
			ball.z = 0.0;
			if (Math.abs(ball.x - this.paddleCenter) < Breakout.PADDLE_WIDTH / 2.0) {
				ball.direction = 1;
				const offset = (ball.x - this.paddleCenter) / (Breakout.PADDLE_WIDTH / 2.0);
				ball.vx = offset * Breakout.BALL_BOUNCE_VX * this.resolution;
				this.audio.play(Sound.TICK);
			} else {
				this.lives -= 1;
				this.audio.play(Sound.MISS);
				if (this.lives <= 0) {
					this.stage = BreakoutStage.GAMEOVER;
					this.audio.play(Sound.LEVEL_FAIL);
					this.delay(3.0);
				} else {
					this._respawnBall();
					this.delay(0.6);
				}
			}
		}

		this._render();
	}

	_render() {
		this.clear();

		for (let i = 0; i < this.resolution; i++) {
			const col = Math.min(this.brickCols - 1, Math.floor(i / this.brickWidth));
			const brick = this.bricks[col];
			if (brick.alive) {
				const base = HEALTH_COLORS[Math.min(HEALTH_COLORS.length - 1, brick.health)];
				const r = ((base >> 16) & 0xFF) * 0.4;
				const g = ((base >> 8) & 0xFF) * 0.4;
				const b = (base & 0xFF) * 0.4;
				this.pixels[i] = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
			}
		}

		const paddleHalf = Math.floor(Breakout.PADDLE_WIDTH / 2);
		const paddleCenterI = Math.round(this.paddleCenter);
		for (let i = -paddleHalf; i <= paddleHalf; i++) {
			const pos = paddleCenterI + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Colors.CYAN;
			}
		}

		const ball = this.ball;
		const brightness = 0.3 + 0.7 * ball.z;
		const size = Breakout.MIN_BALL_SIZE + Math.round(ball.z * (Breakout.MAX_BALL_SIZE - Breakout.MIN_BALL_SIZE));
		const v = Math.floor(0xFF * brightness);
		const color = (v << 16) | (v << 8) | v;
		const half = Math.floor(size / 2);
		const center = Math.round(ball.x);
		for (let i = -half; i <= half; i++) {
			const pos = center + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = color;
			}
		}
	}

	_renderFlash(onColor, offColor) {
		this.clear();
		const flashOn = Math.floor(this.time * 6) % 2 === 0;
		const color = flashOn ? onColor : offColor;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = color;
		}
	}

	_renderGameOver() {
		this.clear();
		const lit = Math.min(this.score, this.resolution);
		for (let i = 0; i < lit; i++) {
			this.pixels[i] = Colors.DARK_RED;
		}
		const flashOn = Math.floor(this.time * 4) % 2 === 0;
		if (flashOn) {
			for (let i = 0; i < this.resolution; i++) {
				if (this.pixels[i] === 0) {
					this.pixels[i] = Colors.RED;
				}
			}
		}
	}

	handleInput(padId, event) {
		if (this.stage !== BreakoutStage.PLAYING) {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.paddleDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.paddleDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.paddleDir === -1) {
				this.paddleDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.paddleDir === 1) {
				this.paddleDir = 0;
			}
		}
	}
}
