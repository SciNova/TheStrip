import { Game, Colors, Command } from './system.js';

class Hole {
	static BACKGROUND_COLOR = Colors.DARK_GREEN;
	static RIM_COLOR = 0x003300; // darker than the field, so the hole stays visible to its edge

	constructor(game, location, radius) {
		this.game = game;
		this.location = location;
		this.radius = radius;
	}

	contains(location) {
		return Math.abs(location - this.location) <= this.radius;
	}

	render() {
		const center = Math.round(this.location - this.game.viewportOffset);
		const span = Math.round(this.radius);

		for (let offset = -span; offset <= span; offset++) {
			const pixel = center + offset;
			if (pixel < 0 || pixel >= this.game.resolution) {
				continue;
			}
			this.game.pixels[pixel] = offset === 0 ? Colors.OFF : Hole.RIM_COLOR;
		}
	}
}

class Obstacle {
	static SPEED_FACTOR = 1.0; // walking speed multiplier

	constructor(game, location, size) {
		this.game = game;
		this.location = location;
		this.size = size;
	}

	contains(location) {
		return location >= this.location && location < this.location + this.size;
	}

	render() {
		const start = Math.round(this.location - this.game.viewportOffset);

		for (let i = 0; i < this.size; i++) {
			const pixel = start + i;
			if (pixel >= 0 && pixel < this.game.resolution) {
				this.game.pixels[pixel] = this.constructor.COLOR;
			}
		}
	}
}

class Lake extends Obstacle {
	static COLOR = Colors.CYAN;
	static SPEED_FACTOR = 0.25;
}

class Sand extends Obstacle {
	static COLOR = 0x998033; // muted brown
	static SPEED_FACTOR = 0.5;
}

class Concrete extends Obstacle {
	static COLOR = Colors.GRAY;
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
		this.visible = true;
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
		if (!this.visible) {
			return;
		}

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

const PlayerState = Object.freeze({ AIMING: 'AIMING', WALKING: 'WALKING', ADVANCING: 'ADVANCING' });

class Player {
	static POWER_FREQUENCY = 0.6; // oscillation cycles/sec while charging
	static BAR_LENGTH = 10; // pixels
	static BAR_FILL = Colors.LIGHT_GRAY;
	static COLOR = Colors.BLUE;
	static WALK_SECONDS_PER_SCREEN = 4.0;
	static TEE_OFFSET_FRACTION = 1 / 6; // distance past a sunk hole where the next ball tees up

	constructor(game, location) {
		this.game = game;
		this.location = location;
		this.ball = new Ball(game, location);
		this.speed = game.resolution / Player.WALK_SECONDS_PER_SCREEN; // px/sec
		this.power = 0.0;
		this.charging = false;
		this.chargeTime = 0.0;
		this.holed = false;
		this.walkTarget = location;
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
		this.holed = false;

		const direction = Math.sign(hole.location - this.ball.location) || 1;
		const angle = Ball.MAX_ANGLE * this.power;
		this.ball.hit(angle, this.power * this.game.maxSpeed, direction);
	}

	_walk() {
		const dt = this.game.system.clock.delta;
		const terrain = this.game.terrainAt(this.location);
		const speedFactor = terrain ? terrain.constructor.SPEED_FACTOR : 1.0;
		const step = this.speed * speedFactor * dt;
		const remaining = this.walkTarget - this.location;

		if (Math.abs(remaining) <= step) {
			this.location = this.walkTarget;
			if (this.holed) {
				this.ball.location = this.walkTarget;
				this.ball.visible = true;
				this.state = PlayerState.ADVANCING;
			} else {
				this.state = PlayerState.AIMING;
			}
			this.holed = false;
			return;
		}

		this.location += Math.sign(remaining) * step;
	}

	update(hole) {
		const wasFlying = this.ball.isFlying;
		this.ball.update();
		if (wasFlying && !this.ball.isFlying) {
			this.holed = hole.contains(this.ball.location);
			if (this.holed) {
				this.ball.visible = false;
				this.walkTarget = hole.location + Player.TEE_OFFSET_FRACTION * this.game.resolution;
			} else {
				this.walkTarget = this.ball.location;
			}
		}

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

		for (let i = 0; i < fillCount; i++) {
			const pixel = playerPixel - direction * (i + 1);
			if (pixel >= 0 && pixel < this.game.resolution) {
				this.game.pixels[pixel] = Player.BAR_FILL;
			}
		}
	}
}

export class Golf extends Game {
	static FIELD_SCREENS = 20;
	static HOLE_COUNT = 18;
	static START_RADIUS_FRACTION = 1 / 10;
	static END_RADIUS_FRACTION = 1 / 60;
	static SCROLL_SECONDS = 10.0; // time to scroll across the entire field
	static MAX_OBSTACLES_PER_GAP = 3;
	static BASE_OBSTACLE_SIZE_FRACTION = 1 / 6;
	static CONCRETE_CLEARANCE_FRACTION = 1 / 8; // grass buffer concrete needs from any neighbor

	constructor(system) {
		super('Golf', system);
		this.maxSpeed = Math.sqrt(this.resolution * Ball.GRAVITY);
		this.buildStage();
	}

	buildStage() {
		this.fieldLength = Golf.FIELD_SCREENS * this.resolution;
		this.scrollSpeed = this.fieldLength / Golf.SCROLL_SECONDS;
		this.viewportOffset = 0.0;
		this.scrollDirection = 0;

		const playerStart = this.resolution / 5;
		const gap = (this.resolution * 4 / 5) - playerStart; // same distance as the first hole, every hole

		this.field = [];
		for (let i = 0; i < Golf.HOLE_COUNT; i++) {
			const t = i / (Golf.HOLE_COUNT - 1);
			const radiusFraction = Golf.START_RADIUS_FRACTION + (Golf.END_RADIUS_FRACTION - Golf.START_RADIUS_FRACTION) * t;
			this.field.push(new Hole(this, playerStart + gap * (i + 1), this.resolution * radiusFraction));
		}
		this.currentHoleIndex = 0;

		this.obstacles = this._placeObstacles();

		this.player = new Player(this, playerStart);
	}

	_placeObstacles() {
		const obstacles = [];
		const clearance = this.resolution * Golf.CONCRETE_CLEARANCE_FRACTION;

		const fits = (type, start, end, placed) => {
			for (const other of placed) {
				const otherStart = other.location;
				const otherEnd = other.location + other.size;
				const needsClearance = type === Concrete || other instanceof Concrete;
				const touching = start < otherEnd && otherStart < end;
				const tooClose = needsClearance && start < otherEnd + clearance && otherStart < end + clearance;
				if (touching || tooClose) {
					return false;
				}
			}
			return true;
		};

		for (let i = 0; i < this.field.length - 1; i++) {
			const from = this.field[i].location;
			const to = this.field[i + 1].location;
			const t = i / (this.field.length - 2); // 0 right after hole 1, 1 at the last gap

			const count = Math.round(t * Golf.MAX_OBSTACLES_PER_GAP);
			const types = [Sand];
			if (t > 1 / 3) {
				types.push(Lake);
			}
			if (t > 2 / 3) {
				types.push(Concrete);
			}

			const placed = [];
			for (let j = 0; j < count; j++) {
				const ObstacleType = types[Math.floor(Math.random() * types.length)];
				const sizeScale = 0.6 + t * 0.8; // obstacles grow as the course progresses
				const size = this.resolution * Golf.BASE_OBSTACLE_SIZE_FRACTION * sizeScale * (0.7 + Math.random() * 0.6);

				for (let attempt = 0; attempt < 20; attempt++) {
					const location = from + Math.random() * Math.max(0, to - from - size);
					if (fits(ObstacleType, location, location + size, placed)) {
						placed.push(new ObstacleType(this, location, size));
						break;
					}
				}
			}
			obstacles.push(...placed);
		}

		return obstacles;
	}

	_currentHole() {
		return this.field[this.currentHoleIndex];
	}

	terrainAt(location) {
		for (const obstacle of this.obstacles) {
			if (obstacle.contains(location)) {
				return obstacle;
			}
		}
		return null;
	}

	loop() {
		super.loop();

		const hole = this._currentHole();
		if (this.player.ball.isFlying || this.player.state === PlayerState.WALKING) {
			const points = [this.player.location, this.player.ball.location, hole.location];
			const center = (Math.min(...points) + Math.max(...points)) / 2;
			this.viewportOffset = center - this.resolution / 2;
		} else if (this.player.state === PlayerState.ADVANCING) {
			const nextHole = this.field[this.currentHoleIndex + 1];
			const target = (this.player.location + nextHole.location) / 2 - this.resolution / 2;
			const step = this.player.speed * this.system.clock.delta;
			const remaining = target - this.viewportOffset;
			if (Math.abs(remaining) <= step) {
				this.viewportOffset = target;
				this.currentHoleIndex += 1;
				this.player.state = PlayerState.AIMING;
			} else {
				this.viewportOffset += Math.sign(remaining) * step;
			}
		} else {
			this.viewportOffset += this.scrollDirection * this.scrollSpeed * this.system.clock.delta;
		}
		this.viewportOffset = Math.max(0, Math.min(this.fieldLength - this.resolution, this.viewportOffset));

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Hole.BACKGROUND_COLOR;
		}
		for (const obstacle of this.obstacles) {
			obstacle.render();
		}
		for (const h of this.field) {
			h.render();
		}
		this.player.update(hole);
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
