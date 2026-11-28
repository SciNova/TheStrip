import { Command } from './Command.js';
import { Clock } from './Clock.js';
import { Strip } from './Strip.js';
import { Menu } from './Menu.js';
import { GameState } from './Game.js';

const MAX_LOG_LINES = 200;

export const SystemState = Object.freeze({
	OFF: 'OFF',
	MENU: 'MENU',
	GAME: 'GAME',
});

export class System {
	constructor(resolution = 120, seed = null) {
		this.seed = seed;
		this.clock = new Clock();
		this.audio = null;
		this.strip = new Strip(resolution);
		this.game = null;
		this.GAMES = null;
		this.menu = new Menu(this);
		this.uptime = 0.0;
		this.state = SystemState.OFF;
		this.logLines = [];
		this.load = null;
	}

	random() {
		if (this.seed === null) {
			return Math.random();
		}
		this.seed |= 0;
		this.seed = (this.seed + 0x6D2B79F5) | 0;
		let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	log(text) {
		this.logLines.push(text);
		if (this.logLines.length > MAX_LOG_LINES) {
			this.logLines.shift();
		}
	}

	loadGame(gameId) {
		const GameClass = this.GAMES[gameId];
		this.game = new GameClass(this);
		this.game.playLevel();
		this.state = SystemState.GAME;
	}

	unload() {
		this.game = null;
	}

	loop() {
		this.clock.update();
		if (this.state === SystemState.OFF) {
			return;
		}
		this.uptime += this.clock.delta;
		if (this.state === SystemState.GAME) {
			if (this.game && this.game.state === GameState.PLAY) {
				this.game.loop();
			}
		} else if (this.state === SystemState.MENU) {
			this.menu.loop();
		}
	}

	togglePause() {
		if (this.game) {
			this.game.togglePause();
		}
	}

	handleCommand(padId, event) {
		switch (event.command) {
			case Command.POWER_SHORT_PRESS:
				if (this.state === SystemState.OFF) {
					this.state = this.game === null ? SystemState.MENU : SystemState.GAME;
				} else if (this.state === SystemState.MENU || this.state === SystemState.GAME) {
					this.state = SystemState.OFF;
				}
				break;

			case Command.POWER_LONG_PRESS:
				if (padId === 0 && (this.state === SystemState.MENU || this.state === SystemState.GAME)) {
					this.unload();
					this.uptime = 0.0;
					this.state = SystemState.OFF;
				}
				break;

			case Command.MENU_SHORT_PRESS:
				if (this.state === SystemState.GAME) {
					this.state = SystemState.MENU;
					this.game?.pause();
				} else if (this.state === SystemState.MENU && this.game !== null) {
					this.state = SystemState.GAME;
					this.game.play();
				}
				break;

			case Command.MENU_LONG_PRESS:
				if (padId === 0 && this.game !== null) {
					this.unload();
					this.state = SystemState.MENU;
				}
				break;

			case Command.PAUSE_SHORT_PRESS:
				if (this.state === SystemState.GAME && this.game) {
					this.togglePause();
				}
				break;

			case Command.PAUSE_LONG_PRESS:
				break;

			case Command.BT_SHORT_PRESS:
			case Command.BT_LONG_PRESS:
				break;

			case Command.FIRE_PRESS:
			case Command.FIRE2_PRESS:
			case Command.C_PRESS:
			case Command.D_PRESS:
				if (this.state === SystemState.MENU) {
					this.loadGame(this.menu.selected + 1);
				} else if (this.game !== null && this.state === SystemState.GAME) {
					this.game.handleInput(padId, event);
				}
				break;

			default:
				if (this.state === SystemState.MENU) {
					this.menu.handleInput(padId, event);
				} else if (this.game !== null && this.state === SystemState.GAME) {
					this.game.handleInput(padId, event);
				}
		}
	}

	static balanceColors(color) {
		return color;
	}

	static correctGamma(color) {
		return color;
	}

	static hsvToRgb(h, s, v) {
		h = h * 6.0;
		const i = Math.floor(h);
		const f = h - i;
		const p = v * (1.0 - s);
		const q = v * (1.0 - f * s);
		const t = v * (1.0 - (1.0 - f) * s);
		let r, g, b;
		switch (((i % 6) + 6) % 6) {
			case 0: r = v; g = t; b = p; break;
			case 1: r = q; g = v; b = p; break;
			case 2: r = p; g = v; b = t; break;
			case 3: r = p; g = q; b = v; break;
			case 4: r = t; g = p; b = v; break;
			default: r = v; g = p; b = q; break;
		}
		const r8 = Math.floor(r * 255);
		const g8 = Math.floor(g * 255);
		const b8 = Math.floor(b * 255);
		return (r8 << 16) | (g8 << 8) | b8;
	}
}
