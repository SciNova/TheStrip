import { Game, Command, Colors } from './system.js';

const PlayerState = Object.freeze({ IDLE: 'IDLE', AIM_LEFT: 'AIM_LEFT', AIM_RIGHT: 'AIM_RIGHT' });
const ShotState = Object.freeze({ SHOT: 'SHOT', HIT: 'HIT', DONE: 'DONE' });

function blendMax(game, index, color) {
	if (index < 0 || index >= game.resolution) {
		return;
	}
	const existing = game.pixels[index];
	const er = (existing >> 16) & 0xFF, eg = (existing >> 8) & 0xFF, eb = existing & 0xFF;
	const nr = (color >> 16) & 0xFF, ng = (color >> 8) & 0xFF, nb = color & 0xFF;
	game.pixels[index] = (Math.max(er, nr) << 16) | (Math.max(eg, ng) << 8) | Math.max(eb, nb);
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
	constructor(system) {
		super('Shooters', system);
		this.player = new Player(this);
	}

	loop() {
		super.loop();
		this.clear();
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
