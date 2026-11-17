import { Game, Colors, Command, balanceColors } from '../../core/system.js';
import { SampleID } from '../../core/audio-common.js';
import { Shape, Alignment, EdgeMode } from '../../core/graphics.js';

const RaceStage = Object.freeze({ PLAYING: 'PLAYING', RESULT: 'RESULT' });

class Player extends Shape {
	static TRAIL = 1 / 8;
	static TICK = 1 / 12;
	static CHECKPOINT = 2;

	constructor(game, color) {
		const trailLen = Math.round(game.resolution * Player.TRAIL);
		super(game, trailLen, Alignment.BACKWARD);

		this.color = color;
		this.location = game.resolution / 2.0;
		this.speed = 0.0;
		this.trailSpeed = 0.0;
		this.reverse = false;
		this.travel = 0.0;

		this.BOOST = 0.5 * game.resolution;
		this.FRICTION = 3.75;
		this.TRAIL_FRICTION = 2.5;
		this.MAX_SPEED = 1.5 * game.resolution;
		this.TRAIL_LENGTH = trailLen;
	}

	tick(dt) {
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

		const prevTick = Math.floor(prevTravel / (this.game.resolution * Player.TICK));
		const currTick = Math.floor(this.travel / (this.game.resolution * Player.TICK));
		if (prevTick !== currTick) {
			this.game.audio.play(SampleID.TICK);
		}

		const prevCheck = Math.floor(prevTravel / (this.game.resolution * Player.CHECKPOINT));
		const currCheck = Math.floor(this.travel / (this.game.resolution * Player.CHECKPOINT));
		if (prevCheck !== currCheck) {
			this.game.audio.play(SampleID.CHECKPOINT);
		}

		this.alignment = this.reverse ? Alignment.FORWARD : Alignment.BACKWARD;

		this.trailSpeed *= Math.max(0.0, 1.0 - this.TRAIL_FRICTION * dt);

		const frac = Math.min(this.trailSpeed / this.BOOST, 1.0);
		const trailPixels = 1 + Math.floor(frac * (this.TRAIL_LENGTH - 1));

		const baseR = (this.color >> 16) & 0xFF;
		const baseG = (this.color >> 8) & 0xFF;
		const baseB = this.color & 0xFF;

		for (let j = 0; j < this.TRAIL_LENGTH; j++) {
			if (j < trailPixels) {
				const intensity = trailPixels === 1 ? 1.0 : 1.0 - (128.0 / 255.0) * (j / (trailPixels - 1));
				const r = Math.floor(baseR * intensity);
				const g = Math.floor(baseG * intensity);
				const b = Math.floor(baseB * intensity);
				this.pixels[j] = (r << 16) | (g << 8) | b;
			} else {
				this.pixels[j] = null;
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
	static TOTAL_LAPS = 10.0;

	constructor(system) {
		super('Race', system);
		this.playerA = new Player(this, Colors.RED);
		this.playerB = new Player(this, Colors.BLUE);
		this.stage = RaceStage.PLAYING;
	}

	loop() {
		super.loop();

		const dt = this.system.clock.delta;

		if (this.stage === RaceStage.PLAYING) {
			if (this.delayTime > 0.0) {
				return;
			}

			this.playerA.tick(dt);
			this.playerB.tick(dt);

			const targetTravel = Race.TOTAL_LAPS * 2 * this.resolution;
			const scoreA = this.playerA.travel / targetTravel;
			const scoreB = this.playerB.travel / targetTravel;

			if (scoreA >= 1.0 || scoreB >= 1.0) {
				this.stage = RaceStage.RESULT;
				this.audio.play(SampleID.LEVEL_COMPLETE);
				this.delay(4.0);
			}

			this.clear();
			this._drawProgressBar(scoreA, scoreB);
			this.playerA.render(this.playerA.location, EdgeMode.MIRROR);
			this.playerB.render(this.playerB.location, EdgeMode.MIRROR);
		} else if (this.stage === RaceStage.RESULT) {
			if (this.delayTime <= 0.0) {
				this.playerA = new Player(this, Colors.GREEN);
				this.playerB = new Player(this, Colors.BLUE);
				this.stage = RaceStage.PLAYING;
			} else {
				this.clear();
				this._drawResultBars();
			}
		}
	}

	_drawProgressBar(scoreA, scoreB) {
		const half = Math.floor(this.resolution / 2);
		const barColor = 0x3C3C00;

		const lengthA = Math.min(Math.round(scoreA * half), half);
		for (let i = 0; i < lengthA; i++) {
			this.pixels[i] = barColor;
		}

		const lengthB = Math.min(Math.round(scoreB * half), half);
		for (let i = this.resolution - lengthB; i < this.resolution; i++) {
			this.pixels[i] = barColor;
		}

		const centerLeft = Math.floor(this.resolution / 2) - 1;
		const centerRight = Math.floor(this.resolution / 2);
		if (centerLeft >= 0 && centerLeft < this.resolution) {
			this.pixels[centerLeft] = barColor;
		}
		if (centerRight >= 0 && centerRight < this.resolution) {
			this.pixels[centerRight] = barColor;
		}
	}

	_drawResultBars() {
		const half = Math.floor(this.resolution / 2);
		const targetTravel = Race.TOTAL_LAPS * 2 * this.resolution;
		const aWon = this.playerA.travel >= targetTravel;
		const bWon = this.playerB.travel >= targetTravel;

		const colA = balanceColors(this.playerA.color);
		const colB = balanceColors(this.playerB.color);

		if (aWon && !bWon) {
			for (let i = 0; i < half; i++) {
				this.pixels[i] = colA;
			}
		} else if (bWon && !aWon) {
			for (let i = half; i < this.resolution; i++) {
				this.pixels[i] = colB;
			}
		} else {
			for (let i = 0; i < half; i++) {
				this.pixels[i] = colA;
			}
			for (let i = half; i < this.resolution; i++) {
				this.pixels[i] = colB;
			}
		}
	}

	handleInput(padId, event) {
		if (this.stage !== RaceStage.PLAYING) {
			return;
		}
		if (padId === 0 && event.command === Command.A) {
			this.playerA.boost();
		} else if (padId === 1 && event.command === Command.C) {
			this.playerB.boost();
		}
	}
}
