import { Game, Command, Colors } from './system.js';

const PlayerState = Object.freeze({ IDLE: 'IDLE', AIM_LEFT: 'AIM_LEFT', AIM_RIGHT: 'AIM_RIGHT' });
const ShotState = Object.freeze({ SHOT: 'SHOT', HIT: 'HIT', DONE: 'DONE' });
const TargetState = Object.freeze({ ACTIVE: 'ACTIVE', HIT: 'HIT', GONE: 'GONE' });

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
	constructor(game, location) {
		const size = game.resolution * 0.08;
		super(game, location, Colors.GOLD, size);
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

	constructor(game, location) {
		const size = game.resolution * 0.08;
		super(game, location, Crow.COLOR, size);
	}

	render() {
		const [start, end] = this._span();
		const body = scaleColor(Crow.COLOR, this.visibility);
		const eye = scaleColor(Colors.WHITE, this.visibility);
		const eyeA = Math.floor(this.location);
		const eyeB = eyeA + 1;
		for (let i = start; i < end; i++) {
			this._put(i, (i === eyeA || i === eyeB) ? eye : body);
		}
	}
}

class Cat extends Target {
	static ORANGE = Colors.CHOCOLATE;
	static BROWN = Colors.PERU;

	constructor(game, location) {
		const size = game.resolution * 0.12;
		super(game, location, Cat.ORANGE, size);
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
	constructor(game, location) {
		const size = game.resolution * 0.05;
		super(game, location, Colors.GRAY, size);
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

	constructor(game, location) {
		const size = game.resolution * 0.15;
		super(game, location, Pot.COLOR, size);
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
	constructor(game, location) {
		const size = game.resolution * 0.03;
		super(game, location, Colors.YELLOW, size);
	}

	render() {
		this._put(Math.round(this.location), scaleColor(Colors.YELLOW, this.visibility));
	}
}

class Monkey extends Target {
	static BODY_COLOR = Colors.SADDLE_BROWN;
	static FACE_COLOR = Colors.TAN;

	constructor(game, location) {
		const size = game.resolution * 0.18;
		super(game, location, Monkey.BODY_COLOR, size);
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

	constructor(game, location) {
		const size = game.resolution * 0.06;
		super(game, location, Colors.GREEN, size);
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

	constructor(game, location) {
		const size = game.resolution * 0.3;
		super(game, location, Balloon.COLOR, size);
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

const SPECIES = [Fly, Rat, Frog, Duck, Crow, Cat, Pot, Monkey, Balloon];

export class Shooters extends Game {
	constructor(system) {
		super('Shooters', system);
		this.player = new Player(this);

		this.targets = [];
		let cursor = 0;
		for (const Species of SPECIES) {
			const target = new Species(this, 0);
			target.location = cursor + target.size / 2.0;
			cursor += target.size;
			target.visibility = 1.0;
			this.targets.push(target);
		}
	}

	loop() {
		super.loop();
		this.clear();
		for (const target of this.targets) {
			target.render();
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
