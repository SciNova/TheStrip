import { Game, Colors, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio.js';

export class Pinball extends Game {
	static GRAVITY = 0.9;
	static FLIPPER_WIDTH = 11;
	static FLIPPER_SPEED = 1.1;
	static FLIPPER_KICK = 1.4;
	static TOP_DAMPING = 0.6;
	static BUMPER_COUNT = 6;
	static BUMPER_RADIUS_X = 9;
	static BUMPER_RADIUS_Z = 0.1;
	static BUMPER_KICK = 1.0;
	static BUMPER_COOLDOWN = 0.3;
	static BALL_VX_RANGE = 0.5;
	static MAX_BALLS = 3;
	static MIN_BALL_SIZE = 1;
	static MAX_BALL_SIZE = 4;

	constructor(system) {
		super('Pinball', system);
		this._resetGame();
	}

	_resetGame() {
		this.score = 0;
		this.balls = Pinball.MAX_BALLS;
		this.flipperPos = this.resolution / 2.0;
		this.flipperDir = 0;
		this.bumpers = [];
		for (let i = 0; i < Pinball.BUMPER_COUNT; i++) {
			this.bumpers.push({
				x: 0.1 + 0.8 * ((i + Math.random() * 0.4) / Pinball.BUMPER_COUNT),
				z: 0.25 + Math.random() * 0.6,
				cooldown: 0.0,
			});
		}
		this._launchBall();
		this.stage = 'PLAYING';
	}

	_launchBall() {
		this.ball = {
			x: this.resolution / 2.0,
			z: 0.9,
			vx: (Math.random() * 2 - 1) * Pinball.BALL_VX_RANGE * this.resolution,
			vz: 0.0,
		};
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'PLAYING') {
			this._loopPlaying(dt);
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopPlaying(dt) {
		this.flipperPos += this.flipperDir * Pinball.FLIPPER_SPEED * this.resolution * dt;
		const half = Pinball.FLIPPER_WIDTH / 2.0;
		if (this.flipperPos < half) {
			this.flipperPos = half;
		} else if (this.flipperPos > this.resolution - 1 - half) {
			this.flipperPos = this.resolution - 1 - half;
		}

		for (const bumper of this.bumpers) {
			if (bumper.cooldown > 0.0) {
				bumper.cooldown -= dt;
			}
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

		ball.vz -= Pinball.GRAVITY * dt;
		ball.z += ball.vz * dt;

		if (ball.z >= 1.0) {
			ball.z = 1.0;
			ball.vz = -Math.abs(ball.vz) * Pinball.TOP_DAMPING;
		}

		for (const bumper of this.bumpers) {
			if (bumper.cooldown > 0.0) {
				continue;
			}
			const dx = Math.abs(ball.x - bumper.x * this.resolution);
			const dz = Math.abs(ball.z - bumper.z);
			if (dx < Pinball.BUMPER_RADIUS_X && dz < Pinball.BUMPER_RADIUS_Z) {
				ball.vz += Pinball.BUMPER_KICK;
				ball.vx += (Math.random() * 2 - 1) * 0.2 * this.resolution;
				bumper.cooldown = Pinball.BUMPER_COOLDOWN;
				this.score += 1;
				this.audio.playSynth(SystemSound.EXPLOSION);
			}
		}

		if (ball.z <= 0.0) {
			ball.z = 0.0;
			if (Math.abs(ball.x - this.flipperPos) < Pinball.FLIPPER_WIDTH / 2.0) {
				const offset = (ball.x - this.flipperPos) / (Pinball.FLIPPER_WIDTH / 2.0);
				ball.vz = Pinball.FLIPPER_KICK;
				ball.vx += offset * 0.6 * this.resolution;
				this.audio.playSynth(SystemSound.TICK);
			} else {
				this.balls -= 1;
				this.audio.playSynth(SystemSound.WARNING);
				if (this.balls <= 0) {
					this.stage = 'GAMEOVER';
					this.audio.play(SystemSound.BOOING);
					this.delay(3.0);
				} else {
					this._launchBall();
					this.delay(0.4);
				}
			}
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== 'PLAYING') {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.flipperDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.flipperDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.flipperDir === -1) {
				this.flipperDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.flipperDir === 1) {
				this.flipperDir = 0;
			}
		}
	}

	_render() {
		this.clear();

		for (const bumper of this.bumpers) {
			const brightness = bumper.cooldown > 0.0 ? 0.9 : 0.35 + 0.65 * (1.0 - bumper.z);
			const v = Math.floor(0xFF * brightness);
			const color = (v << 16) | (Math.floor(v * 0.4) << 8);
			const pos = Math.round(bumper.x * this.resolution);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = color;
			}
		}

		const flipperHalf = Math.floor(Pinball.FLIPPER_WIDTH / 2);
		const flipperCenter = Math.round(this.flipperPos);
		for (let i = -flipperHalf; i <= flipperHalf; i++) {
			const pos = flipperCenter + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Colors.CYAN;
			}
		}

		const ball = this.ball;
		const brightness = 0.35 + 0.65 * (1.0 - ball.z);
		const v = Math.floor(0xFF * brightness);
		const color = (v << 16) | (v << 8) | v;
		const size = Pinball.MIN_BALL_SIZE + Math.round((1.0 - ball.z) * (Pinball.MAX_BALL_SIZE - Pinball.MIN_BALL_SIZE));
		const half = Math.floor(size / 2);
		const center = Math.round(ball.x);
		for (let i = -half; i <= half; i++) {
			const pos = center + i;
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = color;
			}
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
}
