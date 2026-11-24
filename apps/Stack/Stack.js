import { Game, Colors, Command, GameState } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';
import { Shape, Alignment, EdgeMode } from '../../core/graphics.js';

class Dot extends Shape {
	static EXPLOSION_DIAMETER = 21;
	static EXPLOSION_DURATION = 0.5;

	constructor(game, color, gap) {
		super(game, Dot.EXPLOSION_DIAMETER, Alignment.CENTER);
		this.color = color;
		this.gap = gap;
		this.alpha = 1.0;
		this.explosionTime = 0.0;
		this.cosAngles = [];
		for (let deg = 0; deg < 10; deg++) {
			this.cosAngles.push(Math.cos(deg * 18.0 * Math.PI / 180.0));
		}
	}

	explode() {
		this.explosionTime = this.game.levelTime;
	}

	update() {
		for (let i = 0; i < this.pixels.length; i++) {
			this.pixels[i] = null;
		}

		if (this.explosionTime === 0.0) {
			const center = Math.floor((this.pixels.length - 1) / 2);
			this.pixels[center] = this.color;
		} else {
			const elapsed = this.game.levelTime - this.explosionTime;
			const t = elapsed / Dot.EXPLOSION_DURATION;
			if (t >= 1.0) {
				this.alpha = 0.0;
				return;
			}
			this.alpha = 1.0 - t;
			const maxRadius = (Dot.EXPLOSION_DIAMETER - 1) / 2;
			const radius = maxRadius * (1.0 - (1.0 - t) ** 2);
			const center = Math.floor((this.pixels.length - 1) / 2);
			const r = (this.color >> 16) & 0xFF;
			const g = (this.color >> 8) & 0xFF;
			const b = this.color & 0xFF;
			for (const cosVal of this.cosAngles) {
				const offset = Math.floor(radius * cosVal + 0.5);
				const idx = center + offset;
				if (idx >= 0 && idx < this.pixels.length) {
					this.pixels[idx] = (
						(Math.floor(r * this.alpha) << 16) |
						(Math.floor(g * this.alpha) << 8) |
						Math.floor(b * this.alpha)
					);
				}
			}
		}
	}
}

class Bullet extends Shape {
	static BULLET_SPEED = 60.0;

	constructor(game, color) {
		super(game, 20, Alignment.BACKWARD);
		this.color = color;
		this.timestamp = game.levelTime;
		this.position = 0.0;
	}

	update() {
		for (let i = 0; i < this.pixels.length; i++) {
			this.pixels[i] = null;
		}

		this.position = (this.game.levelTime - this.timestamp) * Bullet.BULLET_SPEED;
		const r = (this.color >> 16) & 0xFF;
		const g = (this.color >> 8) & 0xFF;
		const b = this.color & 0xFF;
		for (let i = 0; i < 20; i++) {
			const t = (i + 1) / 21.0;
			this.pixels[i] = (Math.floor(r * t) << 16) | (Math.floor(g * t) << 8) | Math.floor(b * t);
		}
	}
}

class Snake {
	constructor(game) {
		this.game = game;
		this.START_DOTS = Math.max(1, Math.floor(game.resolution / 20));
		this.END_DOTS = Math.max(1, Math.floor(game.resolution / 4));
		this.START_GAP = Math.max(1, Math.floor(game.resolution / 40));
		this.END_GAP = this.START_GAP;
		this.LEVELS = this.END_DOTS - this.START_DOTS;
		this.dots = [];
		this.position = 0;
	}

	build(level) {
		const numDots = this.START_DOTS + level;
		const gapFloat = this.START_GAP + (this.END_GAP - this.START_GAP) * (level / this.LEVELS);
		const lowGap = Math.floor(gapFloat);
		const highGap = lowGap + 1;
		let prevColor = null;

		this.dots = [];
		for (let n = 0; n < numDots; n++) {
			let color = null;
			while (color === null || color === prevColor) {
				const r = Math.floor(Math.random() * 3);
				if (r === 0) {
					color = Colors.RED;
				} else if (r === 1) {
					color = Colors.GREEN;
				} else {
					color = Colors.BLUE;
				}
			}
			const gap = Math.random() < (gapFloat - lowGap) ? highGap : lowGap;
			this.dots.push(new Dot(this.game, color, gap));
			prevColor = color;
		}

		this.position = this.game.resolution;
	}

	length() {
		return this.dots.reduce((sum, dot) => sum + 1 + dot.gap, 0);
	}
}

export class Stack extends Game {
	static START_SPEED = 8.0;
	static END_SPEED = 12.0;
	static BULLET_SPEED = 60.0;

	constructor(system) {
		super('Stack', system);
		this.snake = new Snake(this);
		this.bullets = [];
		this.snakePositionRemainder = 0.0;
		this.playLevel();
	}

	buildStage() {
		this.snake.build(this.level);
		this.snakePositionRemainder = 0.0;
		this.bullets = [];
	}

	render() {
		this.clear();
		let currentPixel = this.snake.position;
		for (const dot of this.snake.dots) {
			dot.render(currentPixel, EdgeMode.CLIP, 1.0);
			if (dot.explosionTime === 0.0) {
				currentPixel += 1 + dot.gap;
			}
		}

		for (const bullet of this.bullets) {
			bullet.render(bullet.position, EdgeMode.CLIP, 1.0);
		}
	}

	loop() {
		super.loop();

		if (this.delayTime > 0.0) {
			return;
		}

		if (this.snake.position === 0) {
			this.playLevel();
			return;
		}
		if (this.snake.dots.length === 0) {
			this.nextLevel();
			this.playLevel();
			return;
		}

		const dt = this.system.clock.delta;

		const currentSpeed = Stack.START_SPEED + (Stack.END_SPEED - Stack.START_SPEED) * (this.level / this.snake.LEVELS);
		const pixelsToMove = currentSpeed * dt;
		this.snakePositionRemainder += pixelsToMove;
		const wholePixels = Math.floor(this.snakePositionRemainder);

		if (wholePixels > 0) {
			this.snake.position -= wholePixels;
			this.snakePositionRemainder -= wholePixels;
			let currentPos = this.snake.position;
			for (const dot of this.snake.dots) {
				currentPos += 1 + dot.gap;
				if (currentPos === this.resolution - 1) {
					this.audio.synth.play(SystemSound.SPAWN);
					break;
				}
			}
		}

		if (this.snake.position === 0) {
			this.audio.play(SystemSound.BOOING);
			this.bullets = [];
			this.delay(4.0);
			return;
		}

		for (const bullet of this.bullets) {
			bullet.update();
		}
		for (const dot of this.snake.dots) {
			dot.update();
		}

		this.snake.dots = this.snake.dots.filter((dot) => dot.alpha !== 0.0);
		this.bullets = this.bullets.filter((bullet) => bullet.position < this.resolution);

		let headDot = null;
		for (const dot of this.snake.dots) {
			if (dot.explosionTime === 0.0) {
				headDot = dot;
				break;
			}
		}

		if (this.bullets.length > 0 && headDot !== null) {
			const bullet = this.bullets[0];
			if (bullet.position >= this.snake.position) {
				if (bullet.color === headDot.color) {
					headDot.explode();
					this.snake.position += 1 + headDot.gap;
					this.bullets.shift();
					this.audio.synth.play(SystemSound.EXPLOSION);
				} else {
					this.bullets.shift();
					const newDot = new Dot(this, bullet.color, 0);
					this.snake.dots.unshift(newDot);
					this.snake.position -= 1;
					this.audio.synth.play(SystemSound.WARNING);
				}
			}
		}

		if (this.snake.dots.length === 0) {
			this.audio.play(SystemSound.CHEERING);
			if (this.level === this.snake.LEVELS) {
				this.state = GameState.COMPLETED;
			} else {
				this.delay(4.0);
			}
			return;
		}

		this.render();
	}

	handleInput(padId, event) {
		if (event.command === Command.A) {
			this.bullets.push(new Bullet(this, Colors.RED));
			this.audio.synth.play(SystemSound.SHOOT);
		} else if (event.command === Command.B) {
			this.bullets.push(new Bullet(this, Colors.GREEN));
			this.audio.synth.play(SystemSound.SHOOT);
		} else if (event.command === Command.C) {
			this.bullets.push(new Bullet(this, Colors.BLUE));
			this.audio.synth.play(SystemSound.SHOOT);
		}
	}
}
