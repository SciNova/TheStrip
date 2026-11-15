#ifndef SYSTEM_H
#define SYSTEM_H

#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#define DEBOUNCE_DURATION 0.010
#define HOLD_DURATION 1.0
#define STRIP_MAX_LEDS 120

enum class Action : uint8_t {
	NO_ACTION = 0x00,

	A_PRESS = 0xC1,
	A_RELEASE = 0x81,
	A = 0xC1,

	B_PRESS = 0xC2,
	B_RELEASE = 0x82,
	B = 0xC2,

	C_PRESS = 0xC3,
	C_RELEASE = 0x83,
	C = 0xC3,

	D_PRESS = 0xC4,
	D_RELEASE = 0x84,
	D = 0xC4,

	X_PRESS = 0xC5,
	X_RELEASE = 0x85,
	X = 0xC5,

	Y_PRESS = 0xC6,
	Y_RELEASE = 0x86,
	Y = 0xC6,

	Z_PRESS = 0xC7,
	Z_RELEASE = 0x87,
	Z = 0xC7,

	W_PRESS = 0xC8,
	W_RELEASE = 0x88,
	W = 0xC8,

	FIRE_PRESS = 0xC9,
	FIRE_RELEASE = 0x89,
	FIRE = 0xC9,

	FIRE2_PRESS = 0xCA,
	FIRE2_RELEASE = 0x8A,
	FIRE2 = 0xCA,

	UP_PRESS = 0xCB,
	UP_RELEASE = 0x8B,
	UP = 0xCB,

	DOWN_PRESS = 0xCC,
	DOWN_RELEASE = 0x8C,
	DOWN = 0xCC,

	LEFT_PRESS = 0xCD,
	LEFT_RELEASE = 0x8D,
	LEFT = 0xCD,

	RIGHT_PRESS = 0xCE,
	RIGHT_RELEASE = 0x8E,
	RIGHT = 0xCE,

	ENCODER_LEFT = 0x01,
	ENCODER_RIGHT = 0x02,
	ENCODER2_LEFT = 0x03,
	ENCODER2_RIGHT = 0x04,

	LEFT2 = 0x03,
	RIGHT2 = 0x04,

	JOYSTICK_X = 0x10,
	JOYSTICK_Y = 0x11,
	TILT_LEFT = 0x12,
	TILT_RIGHT = 0x13,
	TILT_FORWARD = 0x14,
	TILT_BACKWARD = 0x15,
	PROXIMITY = 0x16,

	PAUSE_PRESS = 0xD8,
	PAUSE_RELEASE = 0x98,
	PAUSE = 0xD8,

	MENU_PRESS = 0xD9,
	MENU_RELEASE = 0x99,
	MENU = 0xD9,

	POWER_PRESS = 0xDA,
	POWER_RELEASE = 0x9A
};

static inline bool isGameButtonPress(Action action) {
	uint8_t a = static_cast<uint8_t>(action);
	return ((a & 0xC0) == 0xC0) && ((a & 0x18) != 0x18);
}

enum class ButtonState {
	OFF,
	ON
};

enum class EncoderState {
	IDLE,
	DEBOUNCING
};

enum class SystemState {
	PLAY,
	MENU
};

enum class GameState {
	PLAY,
	PAUSED,
	COMPLETED
};

enum class Sound {
	LEVEL_COMPLETE,
	LEVEL_FAIL,
	GAME_COMPLETE,
	SHOOT,
	HIT,
	MISS,
	GENERATE_ITEM,
	TICK,
	CHECKPOINT,
	SIMONSAYS1,
	SIMONSAYS2,
	SIMONSAYS3,
	SIMONSAYS4,
	SIMONSAYS1_ORIGINAL,
	SIMONSAYS2_ORIGINAL,
	SIMONSAYS3_ORIGINAL,
	SIMONSAYS4_ORIGINAL
};

// The CSS/X11 extended color keyword list (one spelling per gray/grey pair,
// American spelling kept). Values are the official CSS hex values.
// This must stay in sync with js/color.js — that file is the source of truth.
enum class Color : uint32_t {
	ALICE_BLUE = 0xF0F8FF,
	ANTIQUE_WHITE = 0xFAEBD7,
	AQUA = 0x00FFFF,
	AQUAMARINE = 0x7FFFD4,
	AZURE = 0xF0FFFF,
	BEIGE = 0xF5F5DC,
	BISQUE = 0xFFE4C4,
	BLACK = 0x000000,
	BLANCHED_ALMOND = 0xFFEBCD,
	BLUE = 0x0000FF,
	BLUE_VIOLET = 0x8A2BE2,
	BROWN = 0xA52A2A,
	BURLYWOOD = 0xDEB887,
	CADET_BLUE = 0x5F9EA0,
	CHARTREUSE = 0x7FFF00,
	CHOCOLATE = 0xD2691E,
	CORAL = 0xFF7F50,
	CORNFLOWER_BLUE = 0x6495ED,
	CORNSILK = 0xFFF8DC,
	CRIMSON = 0xDC143C,
	CYAN = 0x00FFFF,
	DARK_BLUE = 0x00008B,
	DARK_CYAN = 0x008B8B,
	DARK_GOLDENROD = 0xB8860B,
	DARK_GRAY = 0xA9A9A9,
	DARK_GREEN = 0x006400,
	DARK_KHAKI = 0xBDB76B,
	DARK_MAGENTA = 0x8B008B,
	DARK_OLIVE_GREEN = 0x556B2F,
	DARK_ORANGE = 0xFF8C00,
	DARK_ORCHID = 0x9932CC,
	DARK_RED = 0x8B0000,
	DARK_SALMON = 0xE9967A,
	DARK_SEA_GREEN = 0x8FBC8F,
	DARK_SLATE_BLUE = 0x483D8B,
	DARK_SLATE_GRAY = 0x2F4F4F,
	DARK_TURQUOISE = 0x00CED1,
	DARK_VIOLET = 0x9400D3,
	DEEP_PINK = 0xFF1493,
	DEEP_SKY_BLUE = 0x00BFFF,
	DIM_GRAY = 0x696969,
	DODGER_BLUE = 0x1E90FF,
	FIREBRICK = 0xB22222,
	FLORAL_WHITE = 0xFFFAF0,
	FOREST_GREEN = 0x228B22,
	FUCHSIA = 0xFF00FF,
	GAINSBORO = 0xDCDCDC,
	GHOST_WHITE = 0xF8F8FF,
	GOLD = 0xFFD700,
	GOLDENROD = 0xDAA520,
	GRAY = 0x808080,
	GREEN = 0x008000,
	GREEN_YELLOW = 0xADFF2F,
	HONEYDEW = 0xF0FFF0,
	HOT_PINK = 0xFF69B4,
	INDIAN_RED = 0xCD5C5C,
	INDIGO = 0x4B0082,
	IVORY = 0xFFFFF0,
	KHAKI = 0xF0E68C,
	LAVENDER = 0xE6E6FA,
	LAVENDER_BLUSH = 0xFFF0F5,
	LAWN_GREEN = 0x7CFC00,
	LEMON_CHIFFON = 0xFFFACD,
	LIGHT_BLUE = 0xADD8E6,
	LIGHT_CORAL = 0xF08080,
	LIGHT_CYAN = 0xE0FFFF,
	LIGHT_GOLDENROD_YELLOW = 0xFAFAD2,
	LIGHT_GRAY = 0xD3D3D3,
	LIGHT_GREEN = 0x90EE90,
	LIGHT_PINK = 0xFFB6C1,
	LIGHT_SALMON = 0xFFA07A,
	LIGHT_SEA_GREEN = 0x20B2AA,
	LIGHT_SKY_BLUE = 0x87CEFA,
	LIGHT_SLATE_GRAY = 0x778899,
	LIGHT_STEEL_BLUE = 0xB0C4DE,
	LIGHT_YELLOW = 0xFFFFE0,
	LIME = 0x00FF00,
	LIME_GREEN = 0x32CD32,
	LINEN = 0xFAF0E6,
	MAGENTA = 0xFF00FF,
	MAROON = 0x800000,
	MEDIUM_AQUAMARINE = 0x66CDAA,
	MEDIUM_BLUE = 0x0000CD,
	MEDIUM_ORCHID = 0xBA55D3,
	MEDIUM_PURPLE = 0x9370DB,
	MEDIUM_SEA_GREEN = 0x3CB371,
	MEDIUM_SLATE_BLUE = 0x7B68EE,
	MEDIUM_SPRING_GREEN = 0x00FA9A,
	MEDIUM_TURQUOISE = 0x48D1CC,
	MEDIUM_VIOLET_RED = 0xC71585,
	MIDNIGHT_BLUE = 0x191970,
	MINT_CREAM = 0xF5FFFA,
	MISTY_ROSE = 0xFFE4E1,
	MOCCASIN = 0xFFE4B5,
	NAVAJO_WHITE = 0xFFDEAD,
	NAVY = 0x000080,
	OLD_LACE = 0xFDF5E6,
	OLIVE = 0x808000,
	OLIVE_DRAB = 0x6B8E23,
	ORANGE = 0xFFA500,
	ORANGE_RED = 0xFF4500,
	ORCHID = 0xDA70D6,
	PALE_GOLDENROD = 0xEEE8AA,
	PALE_GREEN = 0x98FB98,
	PALE_TURQUOISE = 0xAFEEEE,
	PALE_VIOLET_RED = 0xDB7093,
	PAPAYA_WHIP = 0xFFEFD5,
	PEACH_PUFF = 0xFFDAB9,
	PERU = 0xCD853F,
	PINK = 0xFFC0CB,
	PLUM = 0xDDA0DD,
	POWDER_BLUE = 0xB0E0E6,
	PURPLE = 0x800080,
	REBECCA_PURPLE = 0x663399,
	RED = 0xFF0000,
	ROSY_BROWN = 0xBC8F8F,
	ROYAL_BLUE = 0x4169E1,
	SADDLE_BROWN = 0x8B4513,
	SALMON = 0xFA8072,
	SANDY_BROWN = 0xF4A460,
	SEA_GREEN = 0x2E8B57,
	SEASHELL = 0xFFF5EE,
	SIENNA = 0xA0522D,
	SILVER = 0xC0C0C0,
	SKY_BLUE = 0x87CEEB,
	SLATE_BLUE = 0x6A5ACD,
	SLATE_GRAY = 0x708090,
	SNOW = 0xFFFAFA,
	SPRING_GREEN = 0x00FF7F,
	STEEL_BLUE = 0x4682B4,
	TAN = 0xD2B48C,
	TEAL = 0x008080,
	THISTLE = 0xD8BFD8,
	TOMATO = 0xFF6347,
	TURQUOISE = 0x40E0D0,
	VIOLET = 0xEE82EE,
	WHEAT = 0xF5DEB3,
	WHITE = 0xFFFFFF,
	WHITE_SMOKE = 0xF5F5F5,
	YELLOW = 0xFFFF00,
	YELLOW_GREEN = 0x9ACD32,

	// Aliases: not CSS names, but meaningful labels for an actual CSS color above.
	OFF = 0x000000,
	BANANA = 0xFFD700,
	LEMON = 0xFFFF00,
	WATERMELON = 0x008000,
	BLACKBERRY = 0x4B0082,
	STRAWBERRY = 0xDC143C,

	// Bogus, invented entries with no CSS equivalent. Kept only so the games
	// still using them don't break outright; remove once those games are
	// updated to reference a real color name above.
	DARK_YELLOW = 0x999900,
	DARK_WHITE = 0x7F7F7F,
	DARK_PURPLE = 0x44007F,
	DARK_PINK = 0x7F334C
};

class Clock {
public:
	float time;
	float timestamp;
	float delta;

	Clock() {
		time = 0;
		timestamp = 0;
		delta = 0;
		update();
	}

	void update() {
		float now = 0;
		#ifdef ARDUINO
		now = millis() / 1000.0;
		#endif
		delta = now - timestamp;
		timestamp = now;
		time = now;
	}
};

class DebouncedPin {
public:
	bool state;
	float timestamp;

	DebouncedPin() {
		state = false;
		timestamp = 0;
	}

	bool process(bool value, float now) {
		if (value != state)
			timestamp = now;
		if ((now - timestamp) >= DEBOUNCE_DURATION && value != state)
			state = value;
		return state;
	}
};

class InputEvent {
public:
	Action action;
	float value;
};

class Button {
public:
	Action pressAction;
	Action releaseAction;
	ButtonState state;

	Button() {}

	Button(Action pressAction, Action releaseAction) {
		this->pressAction = pressAction;
		this->releaseAction = releaseAction;
		state = ButtonState::OFF;
	}

	bool process(bool value, float now, InputEvent* event) {
		(void)now;
		if (value && state == ButtonState::OFF) {
			state = ButtonState::ON;
			event->action = pressAction;
			event->value = 0.0f;
			return true;
		} else if (!value && state == ButtonState::ON) {
			state = ButtonState::OFF;
			event->action = releaseAction;
			event->value = 0.0f;
			return true;
		}
		return false;
	}
};

class Encoder {
public:
	Action leftAction;
	Action rightAction;
	EncoderState state;
	int rawQuadratureState;
	int previousQuadratureState;
	float clockTimestamp;
	float inputChangeTimestamp;

	Encoder() {}

	Encoder(Action leftAction, Action rightAction) {
		this->leftAction = leftAction;
		this->rightAction = rightAction;
		state = EncoderState::IDLE;
		rawQuadratureState = 0;
		previousQuadratureState = 0;
		clockTimestamp = 0;
		inputChangeTimestamp = 0;
	}

	bool process(bool clock, bool direction, float now, InputEvent* event) {
		int currentRawQuadratureState = (clock << 1) | direction;
		if (currentRawQuadratureState != rawQuadratureState) {
			rawQuadratureState = currentRawQuadratureState;
			inputChangeTimestamp = now;
		}
		int debouncedQuadratureState = previousQuadratureState;
		if ((now - inputChangeTimestamp) >= DEBOUNCE_DURATION)
			debouncedQuadratureState = rawQuadratureState;

		bool stepDetected = false;
		if (debouncedQuadratureState != previousQuadratureState) {
			int transition = (previousQuadratureState << 2) | debouncedQuadratureState;
			if (state == EncoderState::IDLE) {
				if (transition == 0x01 || transition == 0x07 || transition == 0x0E || transition == 0x08) {
					event->action = rightAction;
					stepDetected = true;
				} else if (transition == 0x02 || transition == 0x0B || transition == 0x0D || transition == 0x04) {
					event->action = leftAction;
					stepDetected = true;
				}
				if (stepDetected) {
					event->value = 0.0f;
					clockTimestamp = now;
					state = EncoderState::DEBOUNCING;
				}
			}
		}
		previousQuadratureState = debouncedQuadratureState;
		if (state == EncoderState::DEBOUNCING && (now - clockTimestamp) >= DEBOUNCE_DURATION)
			state = EncoderState::IDLE;

		return stepDetected;
	}
};

class Strip {
public:
	uint32_t pixels[STRIP_MAX_LEDS];
	uint16_t length;

	Strip() {}

	Strip(uint16_t length) {
		this->length = length;
		memset(pixels, 0, sizeof(pixels));
	}

	void testPattern() {
		uint16_t half = length / 2;

		for (uint16_t i = 0; i < half; i++) {
			float t = (half > 1) ? (float)i / (half - 1) : 0.0f;
			uint8_t v = 255.0f * (1.0f - t);
			pixels[i] = ((uint32_t)v << 16) | ((uint32_t)v << 8) | v;
		}

		uint16_t remainder = length - half;
		uint16_t segment = remainder / 3;
		uint16_t extra = remainder % 3;

		uint16_t index = half;
		uint16_t rampLength;

		rampLength = segment + (extra > 0 ? 1 : 0);
		for (uint16_t i = 0; i < rampLength; i++) {
			float t = (rampLength > 1) ? (float)i / (rampLength - 1) : 1.0f;
			uint8_t r = 255.0f * t;
			pixels[index] = ((uint32_t)r << 16);
			index++;
		}

		rampLength = segment + (extra > 1 ? 1 : 0);
		for (uint16_t i = 0; i < rampLength; i++) {
			float t = (rampLength > 1) ? (float)i / (rampLength - 1) : 1.0f;
			uint8_t g = 255.0f * t;
			pixels[index] = ((uint32_t)g << 8);
			index++;
		}

		rampLength = length - index;
		for (uint16_t i = 0; i < rampLength; i++) {
			float t = (rampLength > 1) ? (float)i / (rampLength - 1) : 1.0f;
			uint8_t b = 255.0f * t;
			pixels[index] = b;
			index++;
		}
	}
};

class Audio {
public:
	Audio() {}

	void play(Sound sound) {}
};

class Game;
class System;

class System {
public:
	Clock clock;
	Audio audio;
	Strip strip;
	Game* game;
	float uptime;
	SystemState state;

	System();

	void loop();
	void togglePause();
	void toggleMenu();
	void handleInput(int padId, InputEvent* event);
};








class Game {

public:
	System* system;
	uint16_t resolution;
	uint32_t* pixels;
	Audio* audio;
	const char* name;
	float time;
	float levelTime;
	int level;
	GameState state;
	float delayTime;

	Game() {}

	explicit Game(System* sys);

	virtual ~Game() = default;

	virtual void loop() {
		float dt = system->clock.delta;
		time += dt;
		levelTime += dt;
		if (delayTime > 0.0f) {
			delayTime -= dt;
			if (delayTime < 0.0f)
				delayTime = 0.0f;
			return;
		}
	}

	virtual void buildStage() {}
	virtual void handleInput(int padId, InputEvent* event) {}

	void pause();
	void play();
	void togglePause();
	void delay(float seconds);
	void clear();
	void setLevel(int n);
	void nextLevel();
	void playLevel();
};

inline System::System() {
	strip = Strip(STRIP_MAX_LEDS);
	game = nullptr;
	uptime = 0.0f;
	state = SystemState::PLAY;
}

inline void System::loop() {
	clock.update();
	uptime += clock.delta;

	switch (state) {
		case SystemState::PLAY:
			if (game && game->state == GameState::PLAY)
				game->loop();
			break;
		case SystemState::MENU:
			strip.testPattern();
			break;
	}
}

inline void System::togglePause() {
	if (game)
		game->togglePause();
}

inline void System::toggleMenu() {
	state = (state == SystemState::PLAY) ? SystemState::MENU : SystemState::PLAY;
}

inline void System::handleInput(int padId, InputEvent* event) {
	if (event->action == Action::MENU_PRESS) {
		toggleMenu();
	} else if (event->action == Action::PAUSE_PRESS) {
		if (state == SystemState::PLAY && game)
			game->togglePause();
	} else if (state == SystemState::PLAY && game) {
		game->handleInput(padId, event);
	}
}

inline Game::Game(System* sys) {
	system = sys;
	resolution = sys->strip.length;
	pixels = sys->strip.pixels;
	audio = &sys->audio;
	name = "";
	time = 0.0f;
	levelTime = 0.0f;
	level = 0;
	state = GameState::PLAY;
	delayTime = 0.0f;
}

inline void Game::pause() {
	state = GameState::PAUSED;
}

inline void Game::play() {
	state = GameState::PLAY;
}

inline void Game::togglePause() {
	if (state == GameState::PLAY)
		pause();
	else
		play();
}

inline void Game::delay(float seconds) {
	delayTime = seconds;
}

inline void Game::clear() {
	memset(pixels, 0, resolution * sizeof(uint32_t));
}

inline void Game::setLevel(int n) {
	level = n;
}

inline void Game::nextLevel() {
	level++;
}

inline void Game::playLevel() {
	buildStage();
	levelTime = 0.0f;
	play();
}

uint32_t hsv_to_rgb(float h, float s, float v) {
	h = h * 6.0f;
	int i = (int)h;
	float f = h - (float)i;
	float p = v * (1.0f - s);
	float q = v * (1.0f - f * s);
	float t = v * (1.0f - (1.0f - f) * s);
	float r, g, b;

	switch (i % 6) {
		case 0:
			r = v; g = t; b = p;
			break;
		case 1:
			r = q; g = v; b = p;
			break;
		case 2:
			r = p; g = v; b = t;
			break;
		case 3:
			r = p; g = q; b = v;
			break;
		case 4:
			r = t; g = p; b = v;
			break;
		default:
			r = v; g = p; b = q;
			break;
	}

	uint8_t r8 = (uint8_t)(r * 255.0f);
	uint8_t g8 = (uint8_t)(g * 255.0f);
	uint8_t b8 = (uint8_t)(b * 255.0f);
	return ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
}

uint32_t balanceColors(uint32_t color) {
	uint8_t r = (color >> 16) & 0xFF;
	uint8_t g = (color >> 8) & 0xFF;
	uint8_t b = color & 0xFF;
	r = (uint8_t)(r * 0.38);
	g = (uint8_t)(g * 0.28);
	return ((uint32_t)r << 16) | ((uint32_t)g << 8) | (uint32_t)b;
}

uint32_t correctGamma(uint32_t color) {
	return color;
}

#endif
