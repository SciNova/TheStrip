import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';

class Actor {
	constructor() {
		this.position = 0;
		this.reverse = false;
		this.speed = 0.0;
		this.positionAccumulator = 0.0;
	}

	update(dt) {
		if (this.speed === 0 || dt <= 0) {
			return;
		}
		this.positionAccumulator += this.speed * dt;
		const whole = Math.trunc(this.positionAccumulator);
		if (whole > 0) {
			this.positionAccumulator -= whole;
			if (this.reverse) {
				this.position -= whole;
			} else {
				this.position += whole;
			}
		}
	}
}

class Player extends Actor {
	constructor() {
		super();
		this.isPoweredUp = false;
		this.powerUpEndTime = 0.0;
	}
}

class Pellet {
	constructor(magic = false) {
		this.isMagic = magic;
	}
}

class Ghost extends Actor {
	static BASE_SPEED = 14;

	constructor(game, spawnPosition) {
		super();
		this.game = game;
		this.position = spawnPosition;
		this.speed = this.constructor.BASE_SPEED;
		this.frightenedTarget = null;
		this.wasFrightened = false;
	}

	isFrightened() {
		return this.game.player.isPoweredUp;
	}

	updateFrightenedTarget() {
		const frightened = this.isFrightened();
		if (frightened && !this.wasFrightened) {
			const player = this.game.player;
			this.frightenedTarget = this.position <= player.position ? this.game.resolution - 1 : 0;
		}
		this.wasFrightened = frightened;
	}

	moveToward(target, dt) {
		if (target > this.position) {
			this.reverse = false;
		} else if (target < this.position) {
			this.reverse = true;
		}
		super.update(dt);
		if (this.position < 0) {
			this.position = 0;
		} else if (this.position > this.game.resolution - 1) {
			this.position = this.game.resolution - 1;
		}
	}
}

class Blinky extends Ghost {
	static COLOR = Color.RED;
	static ELROY_START_THRESHOLD = 8;
	static ELROY_END_THRESHOLD = 3;
	static ELROY_MULTIPLIER = 1.5;

	constructor(game, spawnPosition) {
		super(game, spawnPosition);
		this.elroyActive = false;
	}

	update(dt) {
		this.updateFrightenedTarget();
		const player = this.game.player;

		if (!this.elroyActive) {
			const pelletsRemaining = this.game.maze.filter((p) => p !== null).length;
			const levels = this.game.constructor.LEVELS;
			const threshold = Math.round(
				Blinky.ELROY_START_THRESHOLD +
				(Blinky.ELROY_END_THRESHOLD - Blinky.ELROY_START_THRESHOLD) * (this.game.level / (levels - 1))
			);
			if (pelletsRemaining <= threshold) {
				this.elroyActive = true;
				this.speed = Ghost.BASE_SPEED * Blinky.ELROY_MULTIPLIER;
			}
		}

		const target = this.isFrightened() ? this.frightenedTarget : player.position;
		this.moveToward(target, dt);
	}
}

class Pinky extends Ghost {
	static COLOR = Color.PINK;

	update(dt) {
		this.updateFrightenedTarget();
		if (this.isFrightened()) {
			this.moveToward(this.frightenedTarget, dt);
			return;
		}
		const player = this.game.player;
		const pelletSpacing = this.game.constructor.GAP + 1;
		const lookahead = 4 * pelletSpacing;
		const target = player.position + (player.reverse ? -1 : 1) * lookahead;
		this.moveToward(target, dt);
	}
}

class Inky extends Ghost {
	static COLOR = Color.CYAN;

	update(dt) {
		this.updateFrightenedTarget();
		if (this.isFrightened()) {
			this.moveToward(this.frightenedTarget, dt);
			return;
		}
		const player = this.game.player;
		const pelletSpacing = this.game.constructor.GAP + 1;
		const blinky = this.game.ghosts.find((g) => g instanceof Blinky);
		const pointAhead = player.position + (player.reverse ? -1 : 1) * 2 * pelletSpacing;
		const target = blinky ? 2 * pointAhead - blinky.position : pointAhead;
		this.moveToward(target, dt);
	}
}

class Clyde extends Ghost {
	static COLOR = Color.ORANGE;
	static HOME = 0;

	update(dt) {
		this.updateFrightenedTarget();
		if (this.isFrightened()) {
			this.moveToward(this.frightenedTarget, dt);
			return;
		}
		const player = this.game.player;
		const pelletSpacing = this.game.constructor.GAP + 1;
		const panicDistance = 8 * pelletSpacing;
		const distance = Math.abs(this.position - player.position);
		const target = distance > panicDistance ? player.position : Clyde.HOME;
		this.moveToward(target, dt);
	}
}

function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

export class Pacman extends Game {
	static LEVELS = 10;
	static GAP = 3;
	static START_MAGIC = 2;
	static END_MAGIC = 6;
	static POWER_UP_DURATION = 5.0;

	constructor(system) {
		super('Pacman', system);
		this.totalPellets = Math.floor(this.resolution / (Pacman.GAP + 1));
		this.player = new Player();
		this.ghosts = [];
		this.maze = new Array(this.resolution).fill(null);
		this.moveUpPressed = false;
		this.moveDownPressed = false;
		this.lives = 3;
		this.playLevel();
	}

	buildStage() {
		this.player = new Player();
		this.ghosts = [];
		this.maze = new Array(this.resolution).fill(null);

		const magic = Pacman.START_MAGIC + Math.round(
			(Pacman.END_MAGIC - Pacman.START_MAGIC) * (this.level / (Pacman.LEVELS - 1))
		);

		const allPositions = [];
		for (let p = 0; p < this.resolution; p += Pacman.GAP + 1) {
			allPositions.push(p);
		}
		shuffle(allPositions);

		for (let i = 0; i < this.totalPellets; i++) {
			const pos = allPositions[i];
			this.maze[pos] = new Pellet(i < magic);
		}

		const center = Math.floor(this.resolution / 2);
		this.ghosts = [
			new Blinky(this, center - 2),
			new Pinky(this, center),
			new Inky(this, center + 2),
			new Clyde(this, center + 4),
		];
	}

	loop() {
		super.loop();

		if (this.delayTime > 0.0) {
			this._render();
			return;
		}

		if (this._pendingLevel) {
			this._pendingLevel = false;
			this.nextLevel();
			this.playLevel();
			return;
		}

		if (this._pendingGameOver) {
			this._pendingGameOver = false;
			this.lives = 3;
			this.setLevel(0);
			this.playLevel();
			return;
		}

		if (this._pendingRestartLevel) {
			this._pendingRestartLevel = false;
			this.playLevel();
			return;
		}

		const dt = this.system.clock.delta;
		this.player.update(dt);
		this.player.position = ((this.player.position % this.resolution) + this.resolution) % this.resolution;

		const pos = this.player.position;
		if (pos >= 0 && pos < this.resolution) {
			const pellet = this.maze[pos];
			if (pellet !== null) {
				this.maze[pos] = null;
				if (pellet.isMagic) {
					this.player.isPoweredUp = true;
					this.player.powerUpEndTime = this.time + Pacman.POWER_UP_DURATION;
				}
			}
		}

		if (this.player.isPoweredUp && this.time >= this.player.powerUpEndTime) {
			this.player.isPoweredUp = false;
		}

		this.ghosts.forEach((ghost) => ghost.update(dt));

		for (let i = this.ghosts.length - 1; i >= 0; i--) {
			if (this.ghosts[i].position !== this.player.position) {
				continue;
			}
			if (this.player.isPoweredUp) {
				this.ghosts.splice(i, 1);
				continue;
			}
			this.lives -= 1;
			if (this.lives <= 0) {
				this._pendingGameOver = true;
			} else {
				this._pendingRestartLevel = true;
			}
			this.delay(1.0);
			this._render();
			return;
		}

		if (!this.maze.some((p) => p !== null)) {
			if (this.level < Pacman.LEVELS - 1) {
				this._pendingLevel = true;
				this.delay(1.0);
			}
			this._render();
			return;
		}

		this._render();
	}

	_render() {
		for (let i = 0; i < this.resolution; i++) {
			const pellet = this.maze[i];
			if (pellet !== null) {
				this.pixels[i] = pellet.isMagic ? Color.GREEN : Color.DARK_GREEN;
			} else {
				this.pixels[i] = Color.OFF;
			}
		}
		const pos = this.player.position;
		if (pos >= 0 && pos < this.resolution) {
			this.pixels[pos] = this.player.isPoweredUp ? Color.MAGENTA : Color.YELLOW;
		}

		this.ghosts.forEach((ghost) => {
			if (ghost.position >= 0 && ghost.position < this.resolution) {
				this.pixels[ghost.position] = this.player.isPoweredUp ? Color.BLUE : ghost.constructor.COLOR;
			}
		});
	}

	_updateMovement() {
		if (this.moveUpPressed && !this.moveDownPressed) {
			this.player.reverse = false;
			this.player.speed = 20;
		} else if (this.moveDownPressed && !this.moveUpPressed) {
			this.player.reverse = true;
			this.player.speed = 20;
		} else {
			this.player.speed = 0;
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.A || event.command === Command.UP) {
			this.moveUpPressed = true;
			this.moveDownPressed = false;
			this._updateMovement();
		} else if (event.command === Command.A_RELEASE || event.command === Command.UP_RELEASE) {
			this.moveUpPressed = false;
			this._updateMovement();
		} else if (event.command === Command.C || event.command === Command.DOWN) {
			this.moveDownPressed = true;
			this.moveUpPressed = false;
			this._updateMovement();
		} else if (event.command === Command.C_RELEASE || event.command === Command.DOWN_RELEASE) {
			this.moveDownPressed = false;
			this._updateMovement();
		}
	}
}
