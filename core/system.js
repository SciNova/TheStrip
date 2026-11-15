export const Command = Object.freeze({
	NONE: 0,

	A_PRESS: 0x01,
	A_RELEASE: 0x02,
	A: 0x01,

	B_PRESS: 0x03,
	B_RELEASE: 0x04,
	B: 0x03,

	C_PRESS: 0x05,
	C_RELEASE: 0x06,
	C: 0x05,

	D_PRESS: 0x07,
	D_RELEASE: 0x08,
	D: 0x07,

	X_PRESS: 0x09,
	X_RELEASE: 0x0A,
	X: 0x09,

	Y_PRESS: 0x0B,
	Y_RELEASE: 0x0C,
	Y: 0x0B,

	Z_PRESS: 0x0D,
	Z_RELEASE: 0x0E,
	Z: 0x0D,

	W_PRESS: 0x0F,
	W_RELEASE: 0x10,
	W: 0x0F,

	FIRE_PRESS: 0x11,
	FIRE_RELEASE: 0x12,
	FIRE: 0x11,

	FIRE2_PRESS: 0x13,
	FIRE2_RELEASE: 0x14,
	FIRE2: 0x13,

	UP_PRESS: 0x15,
	UP_RELEASE: 0x16,
	UP: 0x15,

	DOWN_PRESS: 0x17,
	DOWN_RELEASE: 0x18,
	DOWN: 0x17,

	LEFT_PRESS: 0x19,
	LEFT_RELEASE: 0x1A,
	LEFT: 0x19,

	RIGHT_PRESS: 0x1B,
	RIGHT_RELEASE: 0x1C,
	RIGHT: 0x1B,

	ENCODER_LEFT: 0x1D,
	ENCODER_RIGHT: 0x1E,
	ENCODER2_LEFT: 0x1F,
	ENCODER2_RIGHT: 0x20,

	POWER_SHORT_PRESS: 0xFE,
	POWER_LONG_PRESS: 0xFF,

	MENU_SHORT_PRESS: 0xFC,
	MENU_LONG_PRESS: 0xFD,

	PAUSE_SHORT_PRESS: 0xFA,
	PAUSE_LONG_PRESS: 0xFB,

	BT_SHORT_PRESS: 0xF8,
	BT_LONG_PRESS: 0xF9,
});

export function isGameButtonPress(command) {
	return command >= Command.A_PRESS && command <= Command.RIGHT_PRESS && (command & 1) === 1;
}

export const SystemState = Object.freeze({
	STANDBY: 'STANDBY',
	MENU: 'MENU',
	GAME: 'GAME',
	POWERSAVE: 'POWERSAVE',
});

export const GameState = Object.freeze({
	PLAY: 'PLAY',
	PAUSED: 'PAUSED',
	COMPLETED: 'COMPLETED',
});

export const Sound = Object.freeze({
	LEVEL_COMPLETE: 'LEVEL_COMPLETE',
	LEVEL_FAIL: 'LEVEL_FAIL',
	GAME_COMPLETE: 'GAME_COMPLETE',
	SHOOT: 'SHOOT',
	HIT: 'HIT',
	MISS: 'MISS',
	GENERATE_ITEM: 'GENERATE_ITEM',
	TICK: 'TICK',
	CHECKPOINT: 'CHECKPOINT',
	SIMONSAYS1: 'SIMONSAYS1',
	SIMONSAYS2: 'SIMONSAYS2',
	SIMONSAYS3: 'SIMONSAYS3',
	SIMONSAYS4: 'SIMONSAYS4',
	SIMONSAYS1_ORIGINAL: 'SIMONSAYS1_ORIGINAL',
	SIMONSAYS2_ORIGINAL: 'SIMONSAYS2_ORIGINAL',
	SIMONSAYS3_ORIGINAL: 'SIMONSAYS3_ORIGINAL',
	SIMONSAYS4_ORIGINAL: 'SIMONSAYS4_ORIGINAL',
});

// The CSS/X11 extended color keyword list (one spelling per gray/grey pair,
// American spelling kept). Values are the official CSS hex values.
export const Colors = Object.freeze({
	ALICE_BLUE: 0xF0F8FF,
	ANTIQUE_WHITE: 0xFAEBD7,
	AQUA: 0x00FFFF,
	AQUAMARINE: 0x7FFFD4,
	AZURE: 0xF0FFFF,
	BEIGE: 0xF5F5DC,
	BISQUE: 0xFFE4C4,
	BLACK: 0x000000,
	BLANCHED_ALMOND: 0xFFEBCD,
	BLUE: 0x0000FF,
	BLUE_VIOLET: 0x8A2BE2,
	BROWN: 0xA52A2A,
	BURLYWOOD: 0xDEB887,
	CADET_BLUE: 0x5F9EA0,
	CHARTREUSE: 0x7FFF00,
	CHOCOLATE: 0xD2691E,
	CORAL: 0xFF7F50,
	CORNFLOWER_BLUE: 0x6495ED,
	CORNSILK: 0xFFF8DC,
	CRIMSON: 0xDC143C,
	CYAN: 0x00FFFF,
	DARK_BLUE: 0x00008B,
	DARK_CYAN: 0x008B8B,
	DARK_GOLDENROD: 0xB8860B,
	DARK_GRAY: 0xA9A9A9,
	DARK_GREEN: 0x006400,
	DARK_KHAKI: 0xBDB76B,
	DARK_MAGENTA: 0x8B008B,
	DARK_OLIVE_GREEN: 0x556B2F,
	DARK_ORANGE: 0xFF8C00,
	DARK_ORCHID: 0x9932CC,
	DARK_RED: 0x8B0000,
	DARK_SALMON: 0xE9967A,
	DARK_SEA_GREEN: 0x8FBC8F,
	DARK_SLATE_BLUE: 0x483D8B,
	DARK_SLATE_GRAY: 0x2F4F4F,
	DARK_TURQUOISE: 0x00CED1,
	DARK_VIOLET: 0x9400D3,
	DEEP_PINK: 0xFF1493,
	DEEP_SKY_BLUE: 0x00BFFF,
	DIM_GRAY: 0x696969,
	DODGER_BLUE: 0x1E90FF,
	FIREBRICK: 0xB22222,
	FLORAL_WHITE: 0xFFFAF0,
	FOREST_GREEN: 0x228B22,
	FUCHSIA: 0xFF00FF,
	GAINSBORO: 0xDCDCDC,
	GHOST_WHITE: 0xF8F8FF,
	GOLD: 0xFFD700,
	GOLDENROD: 0xDAA520,
	GRAY: 0x808080,
	GREEN: 0x008000,
	GREEN_YELLOW: 0xADFF2F,
	HONEYDEW: 0xF0FFF0,
	HOT_PINK: 0xFF69B4,
	INDIAN_RED: 0xCD5C5C,
	INDIGO: 0x4B0082,
	IVORY: 0xFFFFF0,
	KHAKI: 0xF0E68C,
	LAVENDER: 0xE6E6FA,
	LAVENDER_BLUSH: 0xFFF0F5,
	LAWN_GREEN: 0x7CFC00,
	LEMON_CHIFFON: 0xFFFACD,
	LIGHT_BLUE: 0xADD8E6,
	LIGHT_CORAL: 0xF08080,
	LIGHT_CYAN: 0xE0FFFF,
	LIGHT_GOLDENROD_YELLOW: 0xFAFAD2,
	LIGHT_GRAY: 0xD3D3D3,
	LIGHT_GREEN: 0x90EE90,
	LIGHT_PINK: 0xFFB6C1,
	LIGHT_SALMON: 0xFFA07A,
	LIGHT_SEA_GREEN: 0x20B2AA,
	LIGHT_SKY_BLUE: 0x87CEFA,
	LIGHT_SLATE_GRAY: 0x778899,
	LIGHT_STEEL_BLUE: 0xB0C4DE,
	LIGHT_YELLOW: 0xFFFFE0,
	LIME: 0x00FF00,
	LIME_GREEN: 0x32CD32,
	LINEN: 0xFAF0E6,
	MAGENTA: 0xFF00FF,
	MAROON: 0x800000,
	MEDIUM_AQUAMARINE: 0x66CDAA,
	MEDIUM_BLUE: 0x0000CD,
	MEDIUM_ORCHID: 0xBA55D3,
	MEDIUM_PURPLE: 0x9370DB,
	MEDIUM_SEA_GREEN: 0x3CB371,
	MEDIUM_SLATE_BLUE: 0x7B68EE,
	MEDIUM_SPRING_GREEN: 0x00FA9A,
	MEDIUM_TURQUOISE: 0x48D1CC,
	MEDIUM_VIOLET_RED: 0xC71585,
	MIDNIGHT_BLUE: 0x191970,
	MINT_CREAM: 0xF5FFFA,
	MISTY_ROSE: 0xFFE4E1,
	MOCCASIN: 0xFFE4B5,
	NAVAJO_WHITE: 0xFFDEAD,
	NAVY: 0x000080,
	OLD_LACE: 0xFDF5E6,
	OLIVE: 0x808000,
	OLIVE_DRAB: 0x6B8E23,
	ORANGE: 0xFFA500,
	ORANGE_RED: 0xFF4500,
	ORCHID: 0xDA70D6,
	PALE_GOLDENROD: 0xEEE8AA,
	PALE_GREEN: 0x98FB98,
	PALE_TURQUOISE: 0xAFEEEE,
	PALE_VIOLET_RED: 0xDB7093,
	PAPAYA_WHIP: 0xFFEFD5,
	PEACH_PUFF: 0xFFDAB9,
	PERU: 0xCD853F,
	PINK: 0xFFC0CB,
	PLUM: 0xDDA0DD,
	POWDER_BLUE: 0xB0E0E6,
	PURPLE: 0x800080,
	REBECCA_PURPLE: 0x663399,
	RED: 0xFF0000,
	ROSY_BROWN: 0xBC8F8F,
	ROYAL_BLUE: 0x4169E1,
	SADDLE_BROWN: 0x8B4513,
	SALMON: 0xFA8072,
	SANDY_BROWN: 0xF4A460,
	SEA_GREEN: 0x2E8B57,
	SEASHELL: 0xFFF5EE,
	SIENNA: 0xA0522D,
	SILVER: 0xC0C0C0,
	SKY_BLUE: 0x87CEEB,
	SLATE_BLUE: 0x6A5ACD,
	SLATE_GRAY: 0x708090,
	SNOW: 0xFFFAFA,
	SPRING_GREEN: 0x00FF7F,
	STEEL_BLUE: 0x4682B4,
	TAN: 0xD2B48C,
	TEAL: 0x008080,
	THISTLE: 0xD8BFD8,
	TOMATO: 0xFF6347,
	TURQUOISE: 0x40E0D0,
	VIOLET: 0xEE82EE,
	WHEAT: 0xF5DEB3,
	WHITE: 0xFFFFFF,
	WHITE_SMOKE: 0xF5F5F5,
	YELLOW: 0xFFFF00,
	YELLOW_GREEN: 0x9ACD32,

	// Aliases: not CSS names, but meaningful labels for an actual CSS color above.
	OFF: 0x000000,
	BANANA: 0xFFD700,
	LEMON: 0xFFFF00,
	WATERMELON: 0x008000,
	BLACKBERRY: 0x4B0082,
	STRAWBERRY: 0xDC143C,

	// Bogus, invented entries with no CSS equivalent. Kept only so the games
	// still using them don't break outright; remove once those games are
	// updated to reference a real color name above.
	DARK_YELLOW: 0x999900,
	DARK_WHITE: 0x7F7F7F,
	DARK_PURPLE: 0x44007F,
	DARK_PINK: 0x7F334C,
});

export class InputEvent {
	constructor(command, value = 0) {
		this.command = command;
		this.value = value;
	}
}

const DEBOUNCE_DURATION = 0.0;
const HOLD_DURATION = 1.0;

export class Clock {
	constructor() {
		this.time = 0.0;
		this.timestamp = 0.0;
		this.delta = 0.0;
		this.update();
	}

	update() {
		const now = Date.now() / 1000;
		this.delta = now - this.timestamp;
		this.timestamp = now;
		this.time = now;
	}
}

export class DebouncedPin {
	constructor() {
		this.state = false;
		this.timestamp = 0.0;
	}

	process(value, now) {
		if (value !== this.state) {
			this.timestamp = now;
		}
		if ((now - this.timestamp) >= DEBOUNCE_DURATION && value !== this.state) {
			this.state = value;
		}
		return this.state;
	}
}

export const ButtonState = Object.freeze({ IDLE: 'IDLE', PRESS: 'PRESS', HOLD: 'HOLD' });
export const ButtonEvent = Object.freeze({ PRESS: 'PRESS', RELEASE: 'RELEASE', HOLD: 'HOLD', HOLDRELEASE: 'HOLDRELEASE' });

export class Button {
	constructor() {
		this.state = ButtonState.IDLE;
		this.pressTimestamp = 0.0;
		this.held = false;
	}

	process(value, now) {
		if (value && this.state === ButtonState.IDLE) {
			this.state = ButtonState.PRESS;
			this.pressTimestamp = now;
			this.held = false;
			return ButtonEvent.PRESS;
		} else if (!value && (this.state === ButtonState.PRESS || this.state === ButtonState.HOLD)) {
			const event = this.state === ButtonState.HOLD ? ButtonEvent.HOLDRELEASE : ButtonEvent.RELEASE;
			this.state = ButtonState.IDLE;
			return event;
		} else if (this.state === ButtonState.PRESS && !this.held) {
			if ((now - this.pressTimestamp) >= HOLD_DURATION) {
				this.state = ButtonState.HOLD;
				this.held = true;
				return ButtonEvent.HOLD;
			}
		}
		return null;
	}
}

export const EncoderState = Object.freeze({ IDLE: 'IDLE', DEBOUNCING: 'DEBOUNCING' });
export const EncoderEvent = Object.freeze({ LEFT: 'LEFT', RIGHT: 'RIGHT' });

export class Encoder {
	constructor() {
		this.state = EncoderState.IDLE;
		this.rawQuadState = 0;
		this.previousQuadState = 0;
		this.clkTimestamp = 0.0;
		this.inputChangeTimestamp = 0.0;
	}

	update(clk, direction, now) {
		const currentRaw = (clk << 1) | direction;
		if (currentRaw !== this.rawQuadState) {
			this.rawQuadState = currentRaw;
			this.inputChangeTimestamp = now;
		}

		let debounced = this.previousQuadState;
		if ((now - this.inputChangeTimestamp) >= DEBOUNCE_DURATION) {
			debounced = this.rawQuadState;
		}

		let event = null;
		if (debounced !== this.previousQuadState) {
			const transition = (this.previousQuadState << 2) | debounced;
			if (this.state === EncoderState.IDLE) {
				if ([0x01, 0x07, 0x0E, 0x08].includes(transition)) {
					event = EncoderEvent.RIGHT;
				} else if ([0x02, 0x0B, 0x0D, 0x04].includes(transition)) {
					event = EncoderEvent.LEFT;
				}
				if (event !== null) {
					this.clkTimestamp = now;
					this.state = EncoderState.DEBOUNCING;
				}
			}
		}

		this.previousQuadState = debounced;
		if (this.state === EncoderState.DEBOUNCING && (now - this.clkTimestamp) >= DEBOUNCE_DURATION) {
			this.state = EncoderState.IDLE;
		}

		return event;
	}
}

export class Strip {
	constructor(length) {
		this.length = length;
		this.pixels = new Array(length).fill(0);
	}

	clear() {
		for (let i = 0; i < this.length; i++) {
			this.pixels[i] = 0;
		}
	}
}

export class Audio {
	play(sound) {
	}
}

export class System {
	constructor() {
		this.clock = new Clock();
		this.audio = new Audio();
		this.strip = new Strip(60);
		this.game = null;
		this.uptime = 0.0;
		this.state = SystemState.GAME;
	}

	loop() {
		this.clock.update();
		this.uptime += this.clock.delta;
		if (this.state === SystemState.GAME) {
			if (this.game && this.game.state === GameState.PLAY) {
				this.game.loop();
			}
		}
	}

	togglePause() {
		if (this.game) {
			this.game.togglePause();
		}
	}

	toggleMenu() {
		this.state = this.state === SystemState.GAME ? SystemState.MENU : SystemState.GAME;
	}

	handleCommand(padId, event) {
		switch (event.command) {
			case Command.POWER_SHORT_PRESS:
				if (this.state === SystemState.STANDBY || this.state === SystemState.POWERSAVE) {
					this.state = this.game === null ? SystemState.MENU : SystemState.GAME;
				} else if (this.state === SystemState.MENU || this.state === SystemState.GAME) {
					this.state = SystemState.STANDBY;
				}
				break;

			case Command.POWER_LONG_PRESS:
				if (this.state === SystemState.MENU || this.state === SystemState.GAME) {
					this.state = SystemState.POWERSAVE;
				}
				break;

			case Command.MENU_SHORT_PRESS:
				if (this.state === SystemState.GAME) {
					this.state = SystemState.MENU;
				} else if (this.state === SystemState.MENU) {
					this.state = SystemState.GAME;
				}
				break;

			case Command.MENU_LONG_PRESS:
				if (this.game !== null) {
					this.game = null;
					this.state = SystemState.MENU;
				}
				break;

			case Command.PAUSE_SHORT_PRESS:
				if (this.state === SystemState.GAME && this.game) {
					if (this.game.state === GameState.PLAY) {
						this.game.pause();
					} else if (this.game.state === GameState.PAUSED) {
						this.game.play();
					}
				}
				break;

			case Command.PAUSE_LONG_PRESS:
				break;

			default:
				if (this.game !== null && this.state === SystemState.GAME) {
					this.game.handleInput(padId, event);
				}
		}
	}
}

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
	}

	play() {
		this.state = GameState.PLAY;
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

export function balanceColors(color) {
	return color;
}

export function correctGamma(color) {
	return color;
}

export function hsvToRgb(h, s, v) {
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
