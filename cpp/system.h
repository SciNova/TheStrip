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

enum class Color : uint32_t {
	OFF = 0x000000,
	WHITE = 0xFFFFFF,
	SILVER = 0x7F7F7F,
	RED = 0xFF0000,
	GREEN = 0x00FF00,
	BLUE = 0x0000FF,
	YELLOW = 0xFFFF00,
	CYAN = 0x00FFFF,
	MAGENTA = 0xFF00FF,
	ORANGE = 0xFF8800,
	PURPLE = 0x8800FF,
	PINK = 0xFF6699,
	DARK_RED = 0x7F0000,
	DARK_GREEN = 0x007F00,
	DARK_BLUE = 0x00007F,
	DARK_YELLOW = 0x999900,
	DARK_CYAN = 0x007F7F,
	DARK_MAGENTA = 0x7F007F,
	DARK_WHITE = 0x7F7F7F,
	DARK_ORANGE = 0x7F4400,
	DARK_PURPLE = 0x44007F,
	DARK_PINK = 0x7F334C,
	BANANA = 0xFFCC00,
	LEMON = 0xCCFF00,
	WATERMELON = 0x007F00,
	BLACKBERRY = 0x44007F,
	STRAWBERRY = 0xFF3366,
	GRAY = 0x808080,
	LIGHT_GRAY = 0xC0C0C0,
	DARK_GRAY = 0x404040
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
