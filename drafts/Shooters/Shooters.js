import { Game, Command, Colors } from '../../core/system.js';

const PlayerState = Object.freeze({ IDLE: 'IDLE', AIM_LEFT: 'AIM_LEFT', AIM_RIGHT: 'AIM_RIGHT' });
const ShotState = Object.freeze({ SHOT: 'SHOT', HIT: 'HIT', DONE: 'DONE' });
const TargetState = Object.freeze({ ACTIVE: 'ACTIVE', HIT: 'HIT', GONE: 'GONE' });
const FrogState = Object.freeze({ RESTING: 'RESTING', JUMPING: 'JUMPING' });
const CatState = Object.freeze({ RESTING: 'RESTING', MOVING: 'MOVING' });
const RatState = Object.freeze({ RESTING: 'RESTING', MOVING: 'MOVING' });
const MonkeyState = Object.freeze({ RESTING: 'RESTING', MOVING: 'MOVING' });
const CrowState = Object.freeze({ RESTING: 'RESTING', FLYING: 'FLYING' });

function randomRange(min, max) {
	return min + Math.random() * (max - min);
}

function easeOut(t) {
	return 1.0 - (1.0 - t) ** 2;
}

function blendMax(game, index, color) {
	if (index < 0 || index >= game.resolution) {
		return;
	}
	const existing = game.pixels[index];
	const er = (existing >> 16) & 0xFF, eg = (existing >> 8) & 0xFF, eb = existing & 0xFF;
	const nr = (color >> 16) & 0xFF, ng = (color >> 8) & 0xFF, nb = color & 0xFF;
	game.pixels[index] = (Math.max(er, nr) << 16) | (Math.max(eg, ng) << 8) | Math.max(eb, nb);
}

function scaleColor(color, factor) {
	const r = Math.floor(((color >> 16) & 0xFF) * factor);
	const g = Math.floor(((color >> 8) & 0xFF) * factor);
	const b = Math.floor((color & 0xFF) * factor);
	return (r << 16) | (g << 8) | b;
}

class Spark {
	constructor(location, velocity) {
		this.location = location;
		this.velocity = velocity;
	}

	update(dt, gravity) {
		const decel = gravity * dt;
		if (this.velocity > 0) {
			this.velocity = Math.max(0, this.velocity - decel);
		} else if (this.velocity < 0) {
			this.velocity = Math.min(0, this.velocity + decel);
		}
		this.location += this.velocity * dt;
	}
}

class Shot {
	static SHOT_DURATION = 0.3;
	static SPARK_DURATION = 0.8;
	static SPARK_COUNT = 10;
	static COLOR = Colors.RED;

	constructor(game, location) {
		this.game = game;
		this.location = location;
		this.timestamp = game.time;
		this.state = ShotState.SHOT;
		this.RADIUS = (1.0 / 5.0) * game.resolution;
		this.gravity = this.RADIUS / Shot.SPARK_DURATION;
		this.sparks = [];
	}

	_explode() {
		for (let i = 0; i < Shot.SPARK_COUNT; i++) {
			const direction = Math.random() < 0.5 ? -1 : 1;
			const velocity = direction * this.RADIUS / Shot.SPARK_DURATION * (0.6 + Math.random() * 0.8);
			this.sparks.push(new Spark(this.location, velocity));
		}
	}

	update() {
		const dt = this.game.system.clock.delta;
		const elapsed = this.game.time - this.timestamp;

		if (this.state === ShotState.SHOT && elapsed >= Shot.SHOT_DURATION) {
			this.state = ShotState.HIT;
			this._explode();
		}

		if (this.state === ShotState.HIT) {
			for (const spark of this.sparks) {
				spark.update(dt, this.gravity);
			}
			if (elapsed >= Shot.SHOT_DURATION + Shot.SPARK_DURATION) {
				this.state = ShotState.DONE;
			}
		}

		this.render();
	}

	render() {
		if (this.state !== ShotState.HIT) {
			return;
		}

		const hitElapsed = this.game.time - this.timestamp - Shot.SHOT_DURATION;
		const alpha = Math.max(0, 1.0 - (hitElapsed / Shot.SPARK_DURATION) ** 2);
		const r = Math.floor(((Shot.COLOR >> 16) & 0xFF) * alpha);
		const g = Math.floor(((Shot.COLOR >> 8) & 0xFF) * alpha);
		const b = Math.floor((Shot.COLOR & 0xFF) * alpha);
		const color = (r << 16) | (g << 8) | b;

		for (const spark of this.sparks) {
			blendMax(this.game, Math.round(spark.location), color);
		}
	}
}

class Target {
	static FADE_DURATION = 1.0;

	constructor(game, location, color, size) {
		this.game = game;
		this.location = location;
		this.color = color;
		this.size = size;
		this.state = TargetState.ACTIVE;
		this.visibility = 0.0;
		this.fadeDirection = 0;
		this.fadeStartTime = 0.0;
	}

	hit() {
		this.state = TargetState.HIT;
	}

	show() {
		this.fadeDirection = 1;
		this.fadeStartTime = this.game.time;
	}

	hide() {
		this.fadeDirection = -1;
		this.fadeStartTime = this.game.time;
	}

	update() {
		this.render();
	}

	_span() {
		const halfSize = (this.size * this.visibility) / 2.0;
		const start = Math.round(this.location - halfSize);
		const end = Math.round(this.location + halfSize);
		return [start, end];
	}

	_put(i, color) {
		if (i < 0 || i >= this.game.resolution) {
			return;
		}
		this.game.pixels[i] = color;
	}

	render() {
		const [start, end] = this._span();
		const color = scaleColor(this.color, this.visibility);
		for (let i = start; i < end; i++) {
			this._put(i, color);
		}
	}
}

class Duck extends Target {
	static SPEED_MIN = 0.05;
	static SPEED_MAX = 0.15;

	constructor(game, location, direction = 1) {
		const size = game.resolution * 0.08;
		super(game, location, Colors.GOLD, size);
		this.speed = direction * randomRange(Duck.SPEED_MIN, Duck.SPEED_MAX) * game.resolution;
	}

	update() {
		this.location += this.speed * this.game.system.clock.delta;
		this.render();
	}

	render() {
		const [start, end] = this._span();
		const width = end - start;
		const beakStart = start + Math.floor(width / 3);
		const beakEnd = start + Math.floor(2 * width / 3);
		const body = scaleColor(Colors.GOLD, this.visibility);
		const beak = scaleColor(Colors.CHOCOLATE, this.visibility);
		for (let i = start; i < end; i++) {
			this._put(i, (i >= beakStart && i < beakEnd) ? beak : body);
		}
	}
}

class Crow extends Target {
	static COLOR = Colors.DARK_SLATE_GRAY;
	static REST_MIN = 0.4;
	static REST_MAX = 1.5;
	static DISTANCE_MIN = 0.1;
	static DISTANCE_MAX = 0.5;
	static SPEED_MIN = 0.2;
	static SPEED_MAX = 0.5;
	static WING_RATE = 0.3;

	constructor(game, location) {
		const size = game.resolution * 0.08;
		super(game, location, Crow.COLOR, size);
		this.actionState = CrowState.RESTING;
		this.timestamp = game.time;
		this.patience = randomRange(Crow.REST_MIN, Crow.REST_MAX);
		this.moveStart = location;
		this.moveEnd = location;
		this.speed = 0.0;
	}

	update() {
		const elapsed = this.game.time - this.timestamp;

		if (this.actionState === CrowState.RESTING && elapsed >= this.patience) {
			this.actionState = CrowState.FLYING;
			this.timestamp = this.game.time;
			this.moveStart = this.location;
			const distance = randomRange(Crow.DISTANCE_MIN, Crow.DISTANCE_MAX) * this.game.resolution;
			this.moveEnd = this.location + (Math.random() < 0.5 ? -distance : distance);
			this.speed = randomRange(Crow.SPEED_MIN, Crow.SPEED_MAX) * this.game.resolution;
		} else if (this.actionState === CrowState.FLYING) {
			const direction = Math.sign(this.moveEnd - this.moveStart);
			this.location += direction * this.speed * this.game.system.clock.delta;
			if ((direction > 0 && this.location >= this.moveEnd) || (direction < 0 && this.location <= this.moveEnd)) {
				this.location = this.moveEnd;
				this.actionState = CrowState.RESTING;
				this.timestamp = this.game.time;
				this.patience = randomRange(Crow.REST_MIN, Crow.REST_MAX);
			}
		}

		this.render();
	}

	render() {
		const [start, end] = this._span();
		const body = scaleColor(Crow.COLOR, this.visibility);
		const eye = scaleColor(Colors.WHITE, this.visibility);

		if (this.actionState === CrowState.FLYING) {
			const direction = Math.sign(this.moveEnd - this.moveStart) || 1;
			const sweep = (1 + Math.sin(this.game.time * Crow.WING_RATE * Math.abs(this.speed))) / 2;
			const tailExtension = sweep * (end - start);
			const tailStart = direction > 0 ? Math.round(start - tailExtension) : end;
			const tailEnd = direction > 0 ? start : Math.round(end + tailExtension);
			for (let i = tailStart; i < tailEnd; i++) {
				this._put(i, body);
			}
			const eyeIndex = Math.round(this.location) + direction;
			for (let i = start; i < end; i++) {
				this._put(i, (i === eyeIndex) ? eye : body);
			}
		} else {
			const eyeA = Math.floor(this.location);
			const eyeB = eyeA + 1;
			for (let i = start; i < end; i++) {
				this._put(i, (i === eyeA || i === eyeB) ? eye : body);
			}
		}
	}
}

class Cat extends Target {
	static ORANGE = Colors.CHOCOLATE;
	static BROWN = Colors.PERU;
	static REST_MIN = 0.5;
	static REST_MAX = 2.5;
	static DISTANCE_MIN = 0.05;
	static DISTANCE_MAX = 0.4;
	static SPEED_MIN = 0.1;
	static SPEED_MAX = 0.3;

	constructor(game, location) {
		const size = game.resolution * 0.12;
		super(game, location, Cat.ORANGE, size);
		this.actionState = CatState.RESTING;
		this.timestamp = game.time;
		this.patience = randomRange(Cat.REST_MIN, Cat.REST_MAX);
		this.moveStart = location;
		this.moveEnd = location;
		this.speed = 0.0;
	}

	update() {
		const elapsed = this.game.time - this.timestamp;

		if (this.actionState === CatState.RESTING && elapsed >= this.patience) {
			this.actionState = CatState.MOVING;
			this.timestamp = this.game.time;
			this.moveStart = this.location;
			const distance = randomRange(Cat.DISTANCE_MIN, Cat.DISTANCE_MAX) * this.game.resolution;
			this.moveEnd = this.location + (Math.random() < 0.5 ? -distance : distance);
			this.speed = randomRange(Cat.SPEED_MIN, Cat.SPEED_MAX) * this.game.resolution;
		} else if (this.actionState === CatState.MOVING) {
			const direction = Math.sign(this.moveEnd - this.moveStart);
			this.location += direction * this.speed * this.game.system.clock.delta;
			if ((direction > 0 && this.location >= this.moveEnd) || (direction < 0 && this.location <= this.moveEnd)) {
				this.location = this.moveEnd;
				this.actionState = CatState.RESTING;
				this.timestamp = this.game.time;
				this.patience = randomRange(Cat.REST_MIN, Cat.REST_MAX);
			}
		}

		this.render();
	}

	render() {
		const [start, end] = this._span();
		const width = end - start;
		const orange = scaleColor(Cat.ORANGE, this.visibility);
		const brown = scaleColor(Cat.BROWN, this.visibility);
		for (let i = start; i < end; i++) {
			const segment = Math.min(4, Math.floor((i - start) / width * 5));
			this._put(i, (segment % 2 === 0) ? orange : brown);
		}
	}
}

class Rat extends Target {
	static REST_MIN = 0.2;
	static REST_MAX = 0.8;
	static DISTANCE_MIN = 0.1;
	static DISTANCE_MAX = 0.6;
	static SPEED_MIN = 0.4;
	static SPEED_MAX = 0.8;

	constructor(game, location) {
		const size = game.resolution * 0.05;
		super(game, location, Colors.GRAY, size);
		this.actionState = RatState.RESTING;
		this.timestamp = game.time;
		this.patience = randomRange(Rat.REST_MIN, Rat.REST_MAX);
		this.moveStart = location;
		this.moveEnd = location;
		this.speed = 0.0;
	}

	update() {
		const elapsed = this.game.time - this.timestamp;

		if (this.actionState === RatState.RESTING && elapsed >= this.patience) {
			this.actionState = RatState.MOVING;
			this.timestamp = this.game.time;
			this.moveStart = this.location;
			const distance = randomRange(Rat.DISTANCE_MIN, Rat.DISTANCE_MAX) * this.game.resolution;
			this.moveEnd = this.location + (Math.random() < 0.5 ? -distance : distance);
			this.speed = randomRange(Rat.SPEED_MIN, Rat.SPEED_MAX) * this.game.resolution;
		} else if (this.actionState === RatState.MOVING) {
			const direction = Math.sign(this.moveEnd - this.moveStart);
			this.location += direction * this.speed * this.game.system.clock.delta;
			if ((direction > 0 && this.location >= this.moveEnd) || (direction < 0 && this.location <= this.moveEnd)) {
				this.location = this.moveEnd;
				this.actionState = RatState.RESTING;
				this.timestamp = this.game.time;
				this.patience = randomRange(Rat.REST_MIN, Rat.REST_MAX);
			}
		}

		this.render();
	}

	render() {
		const [start, end] = this._span();
		const body = scaleColor(Colors.GRAY, this.visibility);
		const eye = scaleColor(Colors.WHITE, this.visibility);
		const eyeA = Math.floor(this.location);
		const eyeB = eyeA + 1;
		for (let i = start; i < end; i++) {
			this._put(i, (i === eyeA || i === eyeB) ? eye : body);
		}
	}
}

class Pot extends Target {
	static COLOR = Colors.DARK_GRAY;
	static SPEED_MIN = 0.1;
	static SPEED_MAX = 0.25;

	constructor(game, location, direction = 1) {
		const size = game.resolution * 0.15;
		super(game, location, Pot.COLOR, size);
		this.speed = direction * randomRange(Pot.SPEED_MIN, Pot.SPEED_MAX) * game.resolution;
	}

	update() {
		this.location += this.speed * this.game.system.clock.delta;
		this.render();
	}

	render() {
		const [start, end] = this._span();
		const color = scaleColor(Pot.COLOR, this.visibility);
		for (let i = start; i < end; i++) {
			this._put(i, color);
		}
	}
}

class Fly extends Target {
	static ACCEL = 0.6;
	static MAX_SPEED = 0.25;

	constructor(game, location) {
		const size = game.resolution * 0.03;
		super(game, location, Colors.YELLOW, size);
		this.speed = 0.0;
	}

	update() {
		const dt = this.game.system.clock.delta;
		const maxSpeed = Fly.MAX_SPEED * this.game.resolution;
		const accel = Fly.ACCEL * this.game.resolution;

		this.speed += randomRange(-accel, accel) * dt;
		this.speed = Math.max(-maxSpeed, Math.min(maxSpeed, this.speed));
		this.location += this.speed * dt;

		if (this.location <= 0) {
			this.location = 0;
			this.speed = Math.abs(this.speed);
		} else if (this.location >= this.game.resolution - 1) {
			this.location = this.game.resolution - 1;
			this.speed = -Math.abs(this.speed);
		}

		this.render();
	}

	render() {
		this._put(Math.round(this.location), scaleColor(Colors.YELLOW, this.visibility));
	}
}

class Monkey extends Target {
	static BODY_COLOR = Colors.SADDLE_BROWN;
	static FACE_COLOR = Colors.TAN;
	static REST_MIN = 0.1;
	static REST_MAX = 0.5;
	static DISTANCE_MIN = 0.1;
	static DISTANCE_MAX = 0.4;
	static SPEED_MIN = 0.3;
	static SPEED_MAX = 0.5;

	constructor(game, location) {
		const size = game.resolution * 0.18;
		super(game, location, Monkey.BODY_COLOR, size);
		this.actionState = MonkeyState.RESTING;
		this.timestamp = game.time;
		this.patience = randomRange(Monkey.REST_MIN, Monkey.REST_MAX);
		this.moveStart = location;
		this.moveEnd = location;
		this.speed = 0.0;
	}

	update() {
		const elapsed = this.game.time - this.timestamp;

		if (this.actionState === MonkeyState.RESTING && elapsed >= this.patience) {
			this.actionState = MonkeyState.MOVING;
			this.timestamp = this.game.time;
			this.moveStart = this.location;
			const distance = randomRange(Monkey.DISTANCE_MIN, Monkey.DISTANCE_MAX) * this.game.resolution;
			this.moveEnd = this.location + (Math.random() < 0.5 ? -distance : distance);
			this.speed = randomRange(Monkey.SPEED_MIN, Monkey.SPEED_MAX) * this.game.resolution;
		} else if (this.actionState === MonkeyState.MOVING) {
			const direction = Math.sign(this.moveEnd - this.moveStart);
			this.location += direction * this.speed * this.game.system.clock.delta;
			if ((direction > 0 && this.location >= this.moveEnd) || (direction < 0 && this.location <= this.moveEnd)) {
				this.location = this.moveEnd;
				this.actionState = MonkeyState.RESTING;
				this.timestamp = this.game.time;
				this.patience = randomRange(Monkey.REST_MIN, Monkey.REST_MAX);
			}
		}

		this.render();
	}

	render() {
		const [start, end] = this._span();
		const width = end - start;
		const faceStart = start + Math.floor(width / 4);
		const faceEnd = start + Math.floor(3 * width / 4);
		const body = scaleColor(Monkey.BODY_COLOR, this.visibility);
		const face = scaleColor(Monkey.FACE_COLOR, this.visibility);
		const eye = body;
		const eyeA = Math.floor(this.location);
		const eyeB = eyeA + 1;
		for (let i = start; i < end; i++) {
			if (i === eyeA || i === eyeB) {
				this._put(i, eye);
			} else if (i >= faceStart && i < faceEnd) {
				this._put(i, face);
			} else {
				this._put(i, body);
			}
		}
	}
}

class Frog extends Target {
	static EYE_COLOR = Colors.YELLOW_GREEN;
	static REST_MIN = 0.5;
	static REST_MAX = 2.0;
	static JUMP_DISTANCE_MIN = 0.1;
	static JUMP_DISTANCE_MAX = 0.2;
	static JUMP_DURATION = 0.25;

	constructor(game, location) {
		const size = game.resolution * 0.06;
		super(game, location, Colors.GREEN, size);
		this.actionState = FrogState.RESTING;
		this.timestamp = game.time;
		this.patience = randomRange(Frog.REST_MIN, Frog.REST_MAX);
		this.jumpStart = location;
		this.jumpEnd = location;
	}

	update() {
		const elapsed = this.game.time - this.timestamp;

		if (this.actionState === FrogState.RESTING && elapsed >= this.patience) {
			this.actionState = FrogState.JUMPING;
			this.timestamp = this.game.time;
			this.jumpStart = this.location;
			this.jumpEnd = this.location + randomRange(Frog.JUMP_DISTANCE_MIN, Frog.JUMP_DISTANCE_MAX) * this.game.resolution;
		} else if (this.actionState === FrogState.JUMPING) {
			const t = Math.min(1, elapsed / Frog.JUMP_DURATION);
			this.location = this.jumpStart + (this.jumpEnd - this.jumpStart) * easeOut(t);
			if (t >= 1) {
				this.actionState = FrogState.RESTING;
				this.timestamp = this.game.time;
				this.patience = randomRange(Frog.REST_MIN, Frog.REST_MAX);
				const croaks = [Shooters.sounds.CROAK, Shooters.sounds.CROAK2, Shooters.sounds.CROAK3];
				this.game.audio.play(croaks[Math.floor(Math.random() * croaks.length)]);
			}
		}

		this.render();
	}

	render() {
		const [start, end] = this._span();
		const body = scaleColor(Colors.GREEN, this.visibility);
		const eye = scaleColor(Frog.EYE_COLOR, this.visibility);
		const eyeA = Math.floor(this.location);
		const eyeB = eyeA + 1;
		for (let i = start; i < end; i++) {
			this._put(i, (i === eyeA || i === eyeB) ? eye : body);
		}
	}
}

class Balloon extends Target {
	static COLOR = Colors.ROYAL_BLUE;
	static ACCEL = 0.3;
	static MAX_SPEED = 0.15;

	constructor(game, location, color = Balloon.COLOR, size = null) {
		super(game, location, color, size ?? game.resolution * 0.3);
		this.velocity = 0.0;
	}

	update() {
		const dt = this.game.system.clock.delta;
		const maxSpeed = Balloon.MAX_SPEED * this.game.resolution;
		const accel = Balloon.ACCEL * this.game.resolution;

		this.velocity += randomRange(-accel, accel) * dt;
		this.velocity = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocity));
		this.location += this.velocity * dt;

		if (this.location <= 0) {
			this.location = 0;
			this.velocity = Math.abs(this.velocity);
		} else if (this.location >= this.game.resolution - 1) {
			this.location = this.game.resolution - 1;
			this.velocity = -Math.abs(this.velocity);
		}

		this.render();
	}
}

class Obstacle {
	constructor(game, location, color, size) {
		this.game = game;
		this.location = location;
		this.color = color;
		this.size = size;
	}
}

class Player {
	constructor(game) {
		this.game = game;
		this.location = game.resolution / 2.0;
		this.state = PlayerState.IDLE;
		this.SPEED = 0.7 * game.resolution;
		this.shots = new Array(20).fill(null);
	}

	shoot() {
		const index = this.shots.findIndex((shot) => shot === null);
		if (index === -1) {
			return;
		}
		this.shots[index] = new Shot(this.game, this.location);
	}

	update() {
		const dt = this.game.system.clock.delta;
		if (this.state === PlayerState.AIM_LEFT) {
			this.location -= this.SPEED * dt;
		} else if (this.state === PlayerState.AIM_RIGHT) {
			this.location += this.SPEED * dt;
		}

		if (this.location <= 0) {
			this.location = 0;
			this.state = PlayerState.IDLE;
		} else if (this.location >= this.game.resolution - 1) {
			this.location = this.game.resolution - 1;
			this.state = PlayerState.IDLE;
		}

		for (const shot of this.shots) {
			if (shot) {
				shot.update();
			}
		}
		for (let i = 0; i < this.shots.length; i++) {
			if (this.shots[i] && this.shots[i].state === ShotState.DONE) {
				this.shots[i] = null;
			}
		}

		this.render();
	}

	render() {
		this.game.pixels[Math.round(this.location)] = Colors.WHITE;
	}
}

export class Shooters extends Game {
	static sounds = Object.freeze({
		CROAK: 'CROAK',
		CROAK2: 'CROAK2',
		CROAK3: 'CROAK3',
	});

	constructor(system) {
		super('Shooters', system);
		this.player = new Player(this);

		const frog = new Frog(this, -0.1 * this.resolution);
		frog.visibility = 1.0;
		this.targets = [frog];
	}

	loop() {
		super.loop();
		this.clear();
		for (const target of this.targets) {
			target.update();
		}
		this.player.update();
	}

	handleInput(padId, event) {
		switch (event.command) {
			case Command.FIRE_PRESS:
			case Command.FIRE2_PRESS:
				this.player.shoot();
				break;

			case Command.LEFT_PRESS:
			case Command.UP_PRESS:
				this.player.state = PlayerState.AIM_LEFT;
				break;

			case Command.RIGHT_PRESS:
			case Command.DOWN_PRESS:
				this.player.state = PlayerState.AIM_RIGHT;
				break;

			case Command.LEFT_RELEASE:
			case Command.UP_RELEASE:
				if (this.player.state === PlayerState.AIM_LEFT) {
					this.player.state = PlayerState.IDLE;
				}
				break;

			case Command.RIGHT_RELEASE:
			case Command.DOWN_RELEASE:
				if (this.player.state === PlayerState.AIM_RIGHT) {
					this.player.state = PlayerState.IDLE;
				}
				break;
		}
	}
}
