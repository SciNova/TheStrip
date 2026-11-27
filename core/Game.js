import { Audio } from '../browser/audio.js';

export const GameId = Object.freeze({
	WHITE_LIGHT: 1,
	COLOR_LIGHT: 2,
	MOODLIGHT: 3,
	STOPWATCH: 4,
	DICES: 5,
	SLOTS: 6,
	DARTS: 7,
	SIMON_SAYS: 8,
	STACK: 9,
	FLAPPY_BIRD: 10,
	DINO: 11,
	RACE: 12,
	PACMAN: 13,
	DEMO_SCENE: 14,

	DRAFT_BOMBERMAN: 15,
	DRAFT_BREAKOUT: 16,
	DRAFT_GOLF: 17,
	DRAFT_MEMORY_MATCH: 18,
	DRAFT_SHOOTERS: 19,
	DRAFT_TEST: 20,
	DRAFT_ASTEROIDS_Z: 21,
	DRAFT_BLACKJACK: 22,
	DRAFT_CARS: 23,
	DRAFT_CENTIPEDE_Z: 24,
	DRAFT_DRAG: 25,
	DRAFT_FISHING: 26,
	DRAFT_FROGGER: 27,
	DRAFT_LUNAR_LANDER: 28,
	DRAFT_MISSILE_COMMAND: 29,
	DRAFT_PACHINKO: 30,
	DRAFT_PINBALL: 31,
	DRAFT_PONG: 32,
	DRAFT_QUICK_DRAW: 33,
	DRAFT_RHYTHM_TAP: 34,
	DRAFT_SHUFFLEBOARD: 35,
	DRAFT_SPRINT: 36,
	DRAFT_SUBMARINE: 37,
	DRAFT_TOWER_DEFENSE: 38,
	DRAFT_TREASURE_HUNT: 39,
	DRAFT_TUG_OF_WAR: 40,
	DRAFT_WHACK_A_MOLE: 41,
	DRAFT_HIGHWAY_2D: 42,
	DRAFT_MAZE_2D: 43,
	DRAFT_SHOOTER_2D: 44,
	DRAFT_SNAKE_2D: 45,
	DRAFT_SPACE_INVADERS_2D: 46,
});

export const GameState = Object.freeze({
	PLAY: 'PLAY',
	PAUSED: 'PAUSED',
	COMPLETED: 'COMPLETED',
});

export class Game {
	constructor(name, system) {
		this.system = system;
		this.audio = system.audio;
		this.pixels = system.strip.pixels;
		this.resolution = system.strip.length;
		this.name = name;
		this.time = 0.0;
		this.levelTime = 0.0;
		this.level = 0;
		this.state = GameState.PLAY;
		this.delayTime = 0.0;
		this.sounds = [];
		this.trackers = [];
		this.freeChannels = Audio.CHANNELS;
	}

	loop() {
		const dt = this.system.clock.delta;
		this.time += dt;
		this.levelTime += dt;
		if (this.delayTime > 0.0) {
			this.delayTime -= dt;
			if (this.delayTime < 0.0) {
				this.delayTime = 0.0;
			}
		}
	}

	pause() {
		this.state = GameState.PAUSED;
		for (const tracker of this.trackers) {
			tracker.pause();
		}
	}

	play() {
		this.state = GameState.PLAY;
		for (const tracker of this.trackers) {
			tracker.play();
		}
	}

	togglePause() {
		if (this.state === GameState.PLAY) {
			this.pause();
		} else {
			this.play();
		}
	}

	delay(seconds) {
		this.delayTime = seconds;
	}

	clear() {
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0;
		}
	}

	blend(index, value, alpha) {
		const a = this.pixels[index];
		const r = Math.round(((a >> 16) & 0xFF) + (((value >> 16) & 0xFF) - ((a >> 16) & 0xFF)) * alpha);
		const g = Math.round(((a >> 8) & 0xFF) + (((value >> 8) & 0xFF) - ((a >> 8) & 0xFF)) * alpha);
		const b = Math.round((a & 0xFF) + ((value & 0xFF) - (a & 0xFF)) * alpha);
		this.pixels[index] = (r << 16) | (g << 8) | b;
	}

	setLevel(n) {
		this.level = n;
	}

	nextLevel() {
		this.level += 1;
	}

	playLevel() {
		if (this.buildStage) {
			this.buildStage();
		}
		this.levelTime = 0.0;
		this.play();
	}

}
