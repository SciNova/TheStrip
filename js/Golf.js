import { Game, Colors, Command } from './system.js';

class Hole {
	constructor(game, location, radius) {
		this.game = game;
		this.location = location;
		this.radius = radius;
	}

	render() {
		const pixel = Math.round(this.location - this.game.viewportOffset);
		if (pixel >= 0 && pixel < this.game.resolution) {
			this.game.pixels[pixel] = Colors.OFF;
		}
	}
}

class Ball {
	static GRAVITY = 10.0; // pixels/sec^2, tuning constant, not physically real
	static MAX_ANGLE = Math.PI / 4; // 45 degrees, reached at the farthest possible hole
	static DRAG = 1.5; // per sec, at ground level; fades to 0 at this shot's apex
	static HEIGHT_MARGIN = 1.2; // height=1.0 sits this far above the optimal 45-degree apex
	static MAX_SHADOW = 30; // pixels, shadow distance at height=1.0 at the screen extremes
	static SHADOW_COLOR = 0x333333;

	constructor(game, location) {
		this.game = game;
		this.location = location;
		this.height = 0.0;
		this.apex = 0.0;
		this.vx = 0.0;
		this.vy = 0.0;
		this.isFlying = false;
		this.maxHeight = (game.resolution / 4) * Ball.HEIGHT_MARGIN;
	}

	requiredAngle(hole) {
		const distance = Math.abs(hole.location - this.location);
		const t = Math.min(1.0, distance / this.game.resolution);
		return Ball.MAX_ANGLE * t;
	}

	requiredSpeed(hole) {
		const distance = Math.abs(hole.location - this.location);
		if (distance === 0) {
			return 0.0;
		}
		const angle = this.requiredAngle(hole);
		return Math.sqrt(distance * Ball.GRAVITY / Math.sin(2 * angle));
	}

	hit(angle, speed, direction) {
		this.vx = speed * Math.cos(angle) * direction;
		this.vy = speed * Math.sin(angle);
		this.height = 0.0;
		this.apex = 0.0;
		this.isFlying = true;
	}

	update() {
		if (this.isFlying) {
			const dt = this.game.system.clock.delta;
			this.apex = Math.max(this.apex, this.height);
			if (this.apex > 0.0) {
				const drag = Ball.DRAG * (1.0 - this.height / this.apex);
				this.vx *= Math.max(0.0, 1.0 - drag * dt);
			}

			this.vy -= Ball.GRAVITY * dt;
			this.location += this.vx * dt;
			this.height += this.vy * dt;
			if (this.height <= 0.0) {
				this.height = 0.0;
				this.isFlying = false;
			}
		}
		this.render();
	}

	render() {
		const pixel = Math.round(this.location - this.game.viewportOffset);
		const center = Math.floor(this.game.resolution / 2);
		const heightFraction = Math.min(1.0, this.height / this.maxHeight);

		if (heightFraction > 0.0 && center > 0) {
			const shadowDistance = Math.round(Math.abs(pixel - center) / center * Ball.MAX_SHADOW * heightFraction);
			const shadowPixel = pixel < center ? pixel + shadowDistance : pixel - shadowDistance;
			if (shadowPixel >= 0 && shadowPixel < this.game.resolution) {
				this.game.pixels[shadowPixel] = Ball.SHADOW_COLOR;
			}
		}

		if (pixel >= 0 && pixel < this.game.resolution) {
			this.game.pixels[pixel] = Colors.WHITE;
		}
	}
}

const PlayerState = Object.freeze({ AIMING: 'AIMING', WALKING: 'WALKING' });

class Player {
	static POWER_FREQUENCY = 0.6; // oscillation cycles/sec while charging
	static BAR_LENGTH = 10; // pixels
	static BAR_FILL = Colors.LIGHT_GRAY;
	static COLOR = Colors.YELLOW;
	static WALK_SECONDS_PER_SCREEN = 4.0;

	constructor(game, location) {
		this.game = game;
		this.location = location;
		this.ball = new Ball(game, location);
		this.speed = game.resolution / Player.WALK_SECONDS_PER_SCREEN; // px/sec
		this.power = 0.0;
		this.charging = false;
		this.chargeTime = 0.0;
		this.state = PlayerState.AIMING;
	}

	startCharge() {
		if (this.state !== PlayerState.AIMING || this.ball.isFlying) {
			return;
		}
		this.charging = true;
		this.chargeTime = 0.0;
	}

	release(hole) {
		if (!this.charging) {
			return;
		}
		this.charging = false;

		const direction = Math.sign(hole.location - this.ball.location) || 1;
		const angle = this.ball.requiredAngle(hole);
		this.ball.hit(angle, this.power * this.game.maxSpeed, direction);
	}

	_walk() {
		const dt = this.game.system.clock.delta;
		const step = this.speed * dt;
		const remaining = this.ball.location - this.location;

		if (Math.abs(remaining) <= step) {
			this.location = this.ball.location;
			this.state = PlayerState.AIMING;
			return;
		}

		this.location += Math.sign(remaining) * step;
	}

	update(hole) {
		this.ball.update();

		if (this.state === PlayerState.AIMING) {
			if (!this.ball.isFlying && this.location !== this.ball.location) {
				this.state = PlayerState.WALKING;
				this.charging = false;
			} else if (this.charging) {
				const dt = this.game.system.clock.delta;
				this.chargeTime += dt;
				this.power = 0.5 - 0.5 * Math.cos(this.chargeTime * Player.POWER_FREQUENCY * 2 * Math.PI);
			}
		} else if (this.state === PlayerState.WALKING) {
			this._walk();
		}

		this.render(hole);
	}

	render(hole) {
		const direction = Math.sign(hole.location - this.location) || 1;

		let playerLocation = this.location;
		if (this.location === this.ball.location) {
			playerLocation -= direction;
		}
		const playerPixel = Math.round(playerLocation - this.game.viewportOffset);
		if (playerPixel >= 0 && playerPixel < this.game.resolution) {
			this.game.pixels[playerPixel] = Player.COLOR;
		}

		if (!this.charging) {
			return;
		}

		const fillCount = Math.round(this.power * Player.BAR_LENGTH);
		const screenLocation = Math.round(this.location - this.game.viewportOffset);

		for (let i = 0; i < fillCount; i++) {
			const pixel = screenLocation - direction * (i + 1);
			if (pixel >= 0 && pixel < this.game.resolution) {
				this.game.pixels[pixel] = Player.BAR_FILL;
			}
		}
	}
}

export class Golf extends Game {
	static FIELD_SCREENS = 20;
	static SCROLL_SECONDS = 10.0; // time to scroll across the entire field

	constructor(system) {
		super('Golf', system);
		this.fieldLength = Golf.FIELD_SCREENS * this.resolution;
		this.scrollSpeed = this.fieldLength / Golf.SCROLL_SECONDS;
		this.viewportOffset = 0.0;
		this.scrollDirection = 0;

		this.field = [new Hole(this, this.resolution * 4 / 5, 1)];

		this.player = new Player(this, this.resolution / 5);
		this.maxSpeed = Math.sqrt(this.resolution * Ball.GRAVITY);
	}

	_currentHole() {
		return this.field[0];
	}

	loop() {
		super.loop();

		this.viewportOffset += this.scrollDirection * this.scrollSpeed * this.system.clock.delta;
		this.viewportOffset = Math.max(0, Math.min(this.fieldLength - this.resolution, this.viewportOffset));

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Colors.DARK_GREEN;
		}
		for (const hole of this.field) {
			hole.render();
		}
		this.player.update(this._currentHole());
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE_PRESS) {
			this.player.startCharge();
		} else if (event.command === Command.FIRE_RELEASE) {
			this.player.release(this._currentHole());
		} else if (event.command === Command.LEFT_PRESS) {
			this.scrollDirection = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.scrollDirection = 1;
		} else if (event.command === Command.LEFT_RELEASE && this.scrollDirection === -1) {
			this.scrollDirection = 0;
		} else if (event.command === Command.RIGHT_RELEASE && this.scrollDirection === 1) {
			this.scrollDirection = 0;
		}
	}
}
