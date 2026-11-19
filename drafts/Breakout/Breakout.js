import { Game, Colors, Command } from '../../core/system.js';
import { SampleID, SynthSound } from '../../core/audio-common.js';

const BreakoutStage = Object.freeze({ PLAYING: 'PLAYING', LEVEL_COMPLETE: 'LEVEL_COMPLETE', GAMEOVER: 'GAMEOVER' });

const HEALTH_COLORS = [null, Colors.YELLOW, Colors.ORANGE, Colors.RED];

export class Breakout extends Game {
	static MIN_BRICKS = 6;
	static BRICK_PIXELS = 8; // target pixels per brick column
	static MAX_HEALTH = 3;
	static PADDLE_WIDTH = 9;
	static PADDLE_SPEED = 1.1; // resolution-fraction/sec
	static BALL_Z_SPEED = 0.6; // resolution-fraction/sec, same scale as x speeds (z spans 0..resolution-1, like x)
	static BALL_BASE_VX = 0.3; // resolution-fraction/sec
	static BALL_BOUNCE_VX = 0.6; // resolution-fraction/sec, paddle-reflected max
	static BALL_PERTURB = 0.15; // resolution-fraction/sec, random nudge on brick hit
	static MIN_BALL_SIZE = 1;
	static MAX_BALL_SIZE = 4; // true (world) ball diameter at z=0, before perspective scaling
	static MAX_LIVES = 3;
	static FAR_SCALE = 0.4; // perspective scale at the far wall (z=resolution-1); near wall (z=0) is always 1.0

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

		ball.z += ball.direction * Breakout.BALL_Z_SPEED * this.resolution * dt;

		if (ball.z >= this.resolution - 1) {
			ball.z = this.resolution - 1;
			ball.direction = -1;
			const col = Math.min(this.brickCols - 1, Math.max(0, Math.floor(ball.x / this.brickWidth)));
			const brick = this.bricks[col];
			if (brick.alive) {
				brick.health -= 1;
				if (brick.health <= 0) {
					brick.alive = false;
				}
				this.score += 1;
				this.audio.synth.play(SynthSound.EXPLOSION);
			} else {
				this.audio.synth.play(SynthSound.TICK);
			}
			ball.vx += (Math.random() * 2 - 1) * Breakout.BALL_PERTURB * this.resolution;

			if (this.bricks.every((b) => !b.alive)) {
				this.stage = BreakoutStage.LEVEL_COMPLETE;
				this.audio.play(SampleID.CROWD_CHEERING);
				this.delay(2.0);
			}
		} else if (ball.z <= 0.0) {
			ball.z = 0.0;
			if (Math.abs(ball.x - this.paddleCenter) < Breakout.PADDLE_WIDTH / 2.0) {
				ball.direction = 1;
				const offset = (ball.x - this.paddleCenter) / (Breakout.PADDLE_WIDTH / 2.0);
				ball.vx = offset * Breakout.BALL_BOUNCE_VX * this.resolution;
				this.audio.synth.play(SynthSound.TICK);
			} else {
				this.lives -= 1;
				this.audio.synth.play(SynthSound.WARNING);
				if (this.lives <= 0) {
					this.stage = BreakoutStage.GAMEOVER;
					this.audio.play(SampleID.CROWD_BOOING);
					this.delay(3.0);
				} else {
					this._respawnBall();
					this.delay(0.6);
				}
			}
		}

		this._render();
	}

	// Perspective scale factor for depth z (0 = player/near wall, resolution-1 = far wall).
	// 1.0 at z=0 (full width in view), Breakout.FAR_SCALE at the far wall (view narrows toward
	// a vanishing point at the strip's center). Used for both the brick row and the ball, so
	// depth reads consistently across everything drawn at a given z.
	_perspectiveScale(z) {
		const t = z / (this.resolution - 1);
		return 1.0 + (Breakout.FAR_SCALE - 1.0) * t;
	}

	_render() {
		this.clear();

		const center = (this.resolution - 1) / 2;
		const farScale = Breakout.FAR_SCALE;
		for (let i = 0; i < this.resolution; i++) {
			// Inverse-project this screen pixel back to the brick row's world x. Pixels outside
			// the far wall's projected band have no corresponding brick and stay dark (the
			// receding side walls of the tunnel).
			const worldX = center + (i - center) / farScale;
			if (worldX < 0 || worldX > this.resolution - 1) {
				continue;
			}
			const posInBrick = worldX % this.brickWidth;
			if (posInBrick < 1) {
				continue; // gap between bricks
			}
			const col = Math.min(this.brickCols - 1, Math.floor(worldX / this.brickWidth));
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
		const scale = this._perspectiveScale(ball.z);
		const brightness = 0.3 + 0.7 * scale;
		const size = Math.max(Breakout.MIN_BALL_SIZE, Math.round(Breakout.MAX_BALL_SIZE * scale));
		const v = Math.floor(0xFF * brightness);
		const color = (v << 16) | (v << 8) | v;
		const half = Math.floor(size / 2);
		const ballScreenCenter = Math.round(center + (ball.x - center) * scale);
		for (let i = -half; i <= half; i++) {
			const pos = ballScreenCenter + i;
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
