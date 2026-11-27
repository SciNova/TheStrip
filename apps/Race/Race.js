import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';
import { Shape } from '../../core/graphics/Shape.js';
import { Alignment } from '../../core/graphics/Alignment.js';
import { EdgeMode } from '../../core/graphics/EdgeMode.js';
import { Widget } from '../../core/graphics/Widget.js';
import { WidgetState } from '../../core/graphics/WidgetState.js';
import { ProgressBar } from '../../core/graphics/ProgressBar.js';

const RaceState = Object.freeze({ COUNTDOWN: 'COUNTDOWN', PLAYING: 'PLAYING', RESULT: 'RESULT' });

const SemaphoreState = Object.freeze({ RED: 'RED', RED2: 'RED2', YELLOW: 'YELLOW', GREEN: 'GREEN' });

class Semaphore extends Widget {
	constructor(game, location, size, inverted = false) {
		super(game, location, size, inverted);
		this.phase = null;
		this.blend = true;
	}

	get lightSize() {
		return Math.floor((this.size - 3) / 4);
	}

	update() {
		super.update();

		if (this.state !== WidgetState.ON) {
			return;
		}

		const elapsed = this.game.time - this.startTime;

		if (this.phase === null && elapsed >= 1.0) {
			this.phase = SemaphoreState.RED;
			this.game.audio.playSynthCustom('SQUARE', 880, 0.15, 0.0, 0.0, 1.0, 0.05);
		} else if (this.phase === SemaphoreState.RED && elapsed >= 2.0) {
			this.phase = SemaphoreState.RED2;
			this.game.audio.playSynthCustom('SQUARE', 880, 0.15, 0.0, 0.0, 1.0, 0.05);
		} else if (this.phase === SemaphoreState.RED2 && elapsed >= 3.0) {
			this.phase = SemaphoreState.YELLOW;
			this.game.audio.playSynthCustom('SQUARE', 880, 0.15, 0.0, 0.0, 1.0, 0.05);
		} else if (this.phase === SemaphoreState.YELLOW && elapsed >= 4.0) {
			this.phase = SemaphoreState.GREEN;
			this.game.audio.playSynthCustom('SQUARE', 880, 0.4, 0.0, 0.0, 1.0, 0.05);
		} else if (this.phase === SemaphoreState.GREEN && elapsed >= 5.5) {
			this.fadeOut();
		}

		this.render();
	}

	renderPixel(i) {
		let cRed = Color.DARK_RED;
		let cRed2 = Color.DARK_RED;
		let cYellow = Color.DARK_YELLOW;
		let cGreen = Color.DARK_GREEN;

		if (this.phase === SemaphoreState.RED) {
			cRed = Color.RED;
		} else if (this.phase === SemaphoreState.RED2) {
			cRed = Color.RED;
			cRed2 = Color.RED;
		} else if (this.phase === SemaphoreState.YELLOW) {
			cRed = Color.RED;
			cRed2 = Color.RED;
			cYellow = Color.YELLOW;
		} else if (this.phase === SemaphoreState.GREEN) {
			cRed = Color.RED;
			cRed2 = Color.RED;
			cYellow = Color.YELLOW;
			cGreen = Color.GREEN;
		}

		const colors = [cGreen, cYellow, cRed2, cRed];
		for (let light = 0; light < 4; light++) {
			const start = light * (this.lightSize + 1);
			if (i >= start && i < start + this.lightSize) {
				return colors[light];
			}
		}

		return 0x000000;
	}
}

class Result extends Widget {
	static HELD = 3.6;
	static FLASH_PERIOD = 0.15;

	constructor(game, hostTravel, guestTravel) {
		super(game, 0, game.resolution, false, 1.0);
		this.hostTravel = hostTravel;
		this.guestTravel = guestTravel;
		this.blend = true;
	}

	update() {
		super.update();

		if (this.state !== WidgetState.ON) {
			return;
		}

		const elapsed = this.game.time - this.startTime;
		if (elapsed >= Result.HELD) {
			this.fadeOut();
		}

		this.render();
	}

	renderPixel(i) {
		const thirdSize = Math.floor(this.size / 3);
		const start = Math.floor((this.size - thirdSize) / 2);
		const end = start + thirdSize;
		if (i < start || i >= end) {
			return 0x000000;
		}

		const elapsed = this.game.time - this.startTime;
		const bright = Math.floor(elapsed / Result.FLASH_PERIOD) % 2 === 0;

		const targetTravel = Race.TOTAL_LAPS * 2 * this.game.resolution;
		const half = start + Math.floor(thirdSize / 2);
		if (i < half) {
			return this.hostTravel >= targetTravel ? (bright ? Color.MAGENTA : Color.DARK_MAGENTA) : Color.DARK_MAGENTA;
		} else {
			return this.guestTravel >= targetTravel ? (bright ? Color.ROYAL_BLUE : Color.DARK_BLUE) : Color.DARK_BLUE;
		}
	}
}

class Player extends Shape {
	static TRAIL = 1 / 8;
	static TICK = 1 / 12;
	static PLAYER_SIZE = 4 / 120;

	constructor(game, color) {
		const trailLen = Math.round(game.resolution * Player.TRAIL);
		const playerPixels = Math.max(1, Math.floor(game.resolution * Player.PLAYER_SIZE));
		super(game, trailLen + playerPixels, Alignment.BACKWARD);

		this.color = color;
		this.location = game.resolution / 2.0;
		this.speed = 0.0;
		this.trailSpeed = 0.0;
		this.reverse = false;
		this.travel = 0.0;
		this.lap = 0;

		this.BOOST = 0.5 * game.resolution;
		this.FRICTION = 3.75;
		this.TRAIL_FRICTION = 2.5;
		this.MAX_SPEED = 1.5 * game.resolution;
		this.TRAIL_LENGTH = trailLen;
		this.PLAYER_PIXELS = playerPixels;
	}

	tick() {
		const dt = this.game.system.clock.delta;
		const oldLocation = this.location;
		this.speed *= Math.max(0.0, 1.0 - this.FRICTION * dt);
		this.location += this.speed * (this.reverse ? -1 : 1) * dt;
		if (this.location < 0) {
			this.location = -this.location;
			this.reverse = !this.reverse;
		} else if (this.location >= this.game.resolution) {
			this.location = 2 * (this.game.resolution - 1) - this.location;
			this.reverse = !this.reverse;
		}

		const prevTravel = this.travel;
		this.travel += Math.abs(this.location - oldLocation);
		if (this.travel >= this.lap * this.game.resolution * 2) {
			this.lap += 1;
			this.game.audio.playSynth(SystemSound.CHECKPOINT);
		}

		const prevTick = Math.floor(prevTravel / (this.game.resolution * Player.TICK));
		const currTick = Math.floor(this.travel / (this.game.resolution * Player.TICK));
		if (prevTick !== currTick) {
			this.game.audio.playSynth(SystemSound.TICK);
		}

		this.alignment = this.reverse ? Alignment.FORWARD : Alignment.BACKWARD;

		this.trailSpeed *= Math.max(0.0, 1.0 - this.TRAIL_FRICTION * dt);

		const frac = Math.min(this.trailSpeed / this.BOOST, 1.0);
		const trailPixels = 1 + Math.floor(frac * (this.TRAIL_LENGTH - 1));

		const baseR = (this.color >> 16) & 0xFF;
		const baseG = (this.color >> 8) & 0xFF;
		const baseB = this.color & 0xFF;

		const headIndex = this.reverse ? 0 : this.pixels.length - 1;
		const step = this.reverse ? 1 : -1;
		for (let d = 0; d < this.pixels.length; d++) {
			const idx = headIndex + d * step;
			if (d < this.PLAYER_PIXELS) {
				this.pixels[idx] = this.color;
			} else if (d < this.PLAYER_PIXELS + trailPixels) {
				const t = d - this.PLAYER_PIXELS;
				const intensity = trailPixels === 1 ? 1.0 : 1.0 - (128.0 / 255.0) * (t / (trailPixels - 1));
				const r = Math.floor(baseR * intensity);
				const g = Math.floor(baseG * intensity);
				const b = Math.floor(baseB * intensity);
				this.pixels[idx] = (r << 16) | (g << 8) | b;
			} else {
				this.pixels[idx] = null;
			}
		}
	}

	boost() {
		this.speed += this.BOOST;
		if (this.speed > this.MAX_SPEED) {
			this.speed = this.MAX_SPEED;
		}
		this.trailSpeed = this.speed;
	}
}

export class Race extends Game {
	static TOTAL_LAPS = 10;
	static START_OFFSET = 1.0 / 40.0;
	static BAR_COLOR = 0x3C3C00;

	constructor(system) {
		super('Race', system);
		this.inverted = false;
	}

	playLevel() {
		super.playLevel();
		this.raceState = RaceState.COUNTDOWN;
		this.semaphore.fadeIn();
	}

	buildStage() {
		const clusterCenter = (this.inverted ? 7.0 / 8.0 : 1.0 / 8.0) * this.resolution;
		const offset = Race.START_OFFSET * this.resolution;

		const center = this.resolution / 2.0;

		this.playerA = new Player(this, Color.MAGENTA);
		this.playerA.location = clusterCenter + offset;
		this.playerA.travel = -Math.abs(this.playerA.location - center);
		this.playerB = new Player(this, Color.ROYAL_BLUE);
		this.playerB.location = clusterCenter - offset;
		this.playerB.travel = -Math.abs(this.playerB.location - center);

		const semaphoreLocation = this.inverted ? 0 : this.resolution - 1;
		this.semaphore = new Semaphore(this, semaphoreLocation, this.resolution / 4, !this.inverted);

		const half = Math.floor(this.resolution / 2);
		this.progressBarA = new ProgressBar(this, 0, half, Race.BAR_COLOR, false);
		this.progressBarB = new ProgressBar(this, this.resolution - 1, half, Race.BAR_COLOR, true);
	}

	loop() {
		super.loop();

		if (this.raceState === RaceState.COUNTDOWN || this.raceState === RaceState.PLAYING) {
			if (this.delayTime > 0.0) {
				return;
			}

			this.playerA.tick();
			this.playerB.tick();

			const targetTravel = Race.TOTAL_LAPS * 2 * this.resolution;
			this.progressBarA.value = this.playerA.travel / targetTravel;
			this.progressBarB.value = this.playerB.travel / targetTravel;

			this.clear();
			this._drawProgressBar();
			this.playerA.render(this.playerA.location, EdgeMode.MIRROR);
			this.playerB.render(this.playerB.location, EdgeMode.MIRROR);

			if (this.semaphore.state !== WidgetState.OFF) {
				this.semaphore.update();
			}

			if (this.raceState === RaceState.COUNTDOWN) {
				if (this.semaphore.state === WidgetState.ON && this.semaphore.phase === SemaphoreState.GREEN) {
					this.raceState = RaceState.PLAYING;
				}
			} else if (this.playerA.lap > Race.TOTAL_LAPS || this.playerB.lap > Race.TOTAL_LAPS) {
				this.audio.play(SystemSound.CHEERING);

				const hostTravel = this.playerA.travel;
				const guestTravel = this.playerB.travel;
				this.inverted = !this.inverted;
				this.buildStage();
				this.resultWidget = new Result(this, hostTravel, guestTravel);
				this.resultWidget.fadeIn();

				this.raceState = RaceState.RESULT;
			}
		} else if (this.raceState === RaceState.RESULT) {
			if (this.resultWidget.state === WidgetState.OFF) {
				this.raceState = RaceState.COUNTDOWN;
				this.semaphore.fadeIn();
			} else {
				this.clear();
				this._drawProgressBar();
				this.playerA.render(this.playerA.location, EdgeMode.MIRROR);
				this.playerB.render(this.playerB.location, EdgeMode.MIRROR);
				this.resultWidget.update();
			}
		}
	}

	_drawProgressBar() {
		this.progressBarA.render();
		this.progressBarB.render();

		const centerLeft = Math.floor(this.resolution / 2) - 1;
		const centerRight = Math.floor(this.resolution / 2);
		if (centerLeft >= 0 && centerLeft < this.resolution) {
			this.pixels[centerLeft] = Race.BAR_COLOR;
		}
		if (centerRight >= 0 && centerRight < this.resolution) {
			this.pixels[centerRight] = Race.BAR_COLOR;
		}
	}

	handleInput(padId, event) {
		if (this.raceState !== RaceState.PLAYING) {
			return;
		}
		if (!Command.isGameCommand(event.command)) {
			return;
		}
		if (padId === 0) {
			this.playerA.boost();
		} else if (padId === 1) {
			this.playerB.boost();
		}
	}
}
