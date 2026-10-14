import { Game, Colors, Sound, Command } from './system.js';

const FishingStage = Object.freeze({ IDLE: 'IDLE', WAITING: 'WAITING', BITE: 'BITE', REELING: 'REELING', RESULT: 'RESULT' });

const FISH_TIERS = [
	{ name: 'small', pull: 0.12, value: 1, weight: 5 },
	{ name: 'medium', pull: 0.2, value: 3, weight: 3 },
	{ name: 'large', pull: 0.3, value: 6, weight: 1 },
];

export class Fishing extends Game {
	static CAST_POS_FRACTION = 0.5;
	static MIN_WAIT = 1.5; // seconds
	static MAX_WAIT = 5.0; // seconds
	static REACTION_WINDOW = 0.6; // seconds
	static REEL_TIME_LIMIT = 8.0; // seconds
	static REEL_RATE = 0.35; // progress/sec while reeling
	static TENSION_RATE = 0.5; // tension/sec while reeling
	static TENSION_RELEASE = 0.4; // tension/sec while not reeling

	constructor(system) {
		super('Fishing', system);
		this.score = 0;
		this._goIdle();
	}

	_goIdle() {
		this.stage = FishingStage.IDLE;
	}

	_cast() {
		this.stage = FishingStage.WAITING;
		this.waitTimer = Fishing.MIN_WAIT + Math.random() * (Fishing.MAX_WAIT - Fishing.MIN_WAIT);
	}

	_pickFish() {
		const totalWeight = FISH_TIERS.reduce((sum, t) => sum + t.weight, 0);
		let r = Math.random() * totalWeight;
		for (const tier of FISH_TIERS) {
			if (r < tier.weight) {
				return tier;
			}
			r -= tier.weight;
		}
		return FISH_TIERS[0];
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === FishingStage.WAITING) {
			this.waitTimer -= dt;
			if (this.waitTimer <= 0.0) {
				this.stage = FishingStage.BITE;
				this.biteTimer = Fishing.REACTION_WINDOW;
				this.fish = this._pickFish();
				this.audio.play(Sound.GENERATE_ITEM);
			}
		} else if (this.stage === FishingStage.BITE) {
			this.biteTimer -= dt;
			if (this.biteTimer <= 0.0) {
				this._goIdle();
			}
		} else if (this.stage === FishingStage.REELING) {
			this._loopReeling(dt);
		} else if (this.stage === FishingStage.RESULT) {
			if (this.delayTime <= 0.0) {
				this._goIdle();
			}
		}

		this._render();
	}

	_loopReeling(dt) {
		this.reelTimer -= dt;
		if (this.reeling) {
			this.progress = Math.min(1.0, this.progress + Fishing.REEL_RATE * dt);
			this.tension = Math.min(1.0, this.tension + Fishing.TENSION_RATE * dt);
		} else {
			this.tension = Math.max(0.0, this.tension - Fishing.TENSION_RELEASE * dt);
		}
		this.progress = Math.max(0.0, this.progress - this.fish.pull * dt);

		if (this.tension >= 1.0) {
			this._endReel(false);
		} else if (this.progress >= 1.0) {
			this._endReel(true);
		} else if (this.reelTimer <= 0.0) {
			this._endReel(false);
		}
	}

	_endReel(success) {
		this.success = success;
		if (success) {
			this.score += this.fish.value;
			this.audio.play(Sound.LEVEL_COMPLETE);
		} else {
			this.audio.play(Sound.LEVEL_FAIL);
		}
		this.stage = FishingStage.RESULT;
		this.delay(1.8);
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE_PRESS) {
			if (this.stage === FishingStage.IDLE) {
				this._cast();
			} else if (this.stage === FishingStage.BITE) {
				this.stage = FishingStage.REELING;
				this.progress = 0.0;
				this.tension = 0.3;
				this.reelTimer = Fishing.REEL_TIME_LIMIT;
				this.reeling = true;
				this.audio.play(Sound.HIT);
			}
		} else if (event.command === Command.FIRE_RELEASE) {
			if (this.stage === FishingStage.REELING) {
				this.reeling = false;
			}
		}
	}

	_render() {
		this.clear();

		const castPos = Math.round(this.resolution * Fishing.CAST_POS_FRACTION);

		if (this.stage === FishingStage.IDLE) {
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = Colors.DARK_BLUE;
			}
		} else if (this.stage === FishingStage.WAITING) {
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = Colors.DARK_BLUE;
			}
			const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.0);
			const v = Math.floor(0x55 + 0x55 * pulse);
			if (castPos >= 0 && castPos < this.resolution) {
				this.pixels[castPos] = v << 8;
			}
		} else if (this.stage === FishingStage.BITE) {
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = Colors.DARK_BLUE;
			}
			const blink = Math.floor(this.time * 14) % 2 === 0;
			if (blink && castPos >= 0 && castPos < this.resolution) {
				this.pixels[castPos] = Colors.YELLOW;
			}
		} else if (this.stage === FishingStage.REELING) {
			let tensionColor;
			if (this.tension < 0.5) {
				tensionColor = Colors.DARK_GREEN;
			} else if (this.tension < 0.8) {
				tensionColor = Colors.DARK_YELLOW;
			} else {
				tensionColor = Colors.DARK_RED;
			}
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = tensionColor;
			}
			const barLen = Math.round(this.progress * this.resolution);
			for (let i = 0; i < barLen; i++) {
				this.pixels[i] = Colors.CYAN;
			}
		} else if (this.stage === FishingStage.RESULT) {
			const flashOn = Math.floor(this.time * 6) % 2 === 0;
			if (this.success) {
				const color = flashOn ? Colors.GREEN : Colors.DARK_GREEN;
				for (let i = 0; i < this.resolution; i++) {
					this.pixels[i] = color;
				}
			} else {
				const color = flashOn ? Colors.ORANGE : Colors.DARK_ORANGE;
				for (let i = 0; i < this.resolution; i++) {
					this.pixels[i] = color;
				}
			}
		}
	}
}
