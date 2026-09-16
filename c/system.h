#ifndef SYSTEM_H
#define SYSTEM_H

#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#define STRIP_MAX_LEDS 120
#define DEBOUNCE_DURATION 0.000
#define HOLD_DURATION 1.0
#define GAME_MIN_RESOLUTION 120

typedef enum {
	NO_ACTION = 0x00,

	A_PRESS = 0xC1,
	A_RELEASE = 0x81,
	A_ACTION = 0xC1,

	B_PRESS = 0xC2,
	B_RELEASE = 0x82,
	B_ACTION = 0xC2,

	C_PRESS = 0xC3,
	C_RELEASE = 0x83,
	C_ACTION = 0xC3,

	D_PRESS = 0xC4,
	D_RELEASE = 0x84,
	D_ACTION = 0xC4,

	X_PRESS = 0xC5,
	X_RELEASE = 0x85,
	X_ACTION = 0xC5,

	Y_PRESS = 0xC6,
	Y_RELEASE = 0x86,
	Y_ACTION = 0xC6,

	Z_PRESS = 0xC7,
	Z_RELEASE = 0x87,
	Z_ACTION = 0xC7,

	W_PRESS = 0xC8,
	W_RELEASE = 0x88,
	W_ACTION = 0xC8,

	FIRE_PRESS = 0xC9,
	FIRE_RELEASE = 0x89,
	FIRE_ACTION = 0xC9,

	FIRE2_PRESS = 0xCA,
	FIRE2_RELEASE = 0x8A,
	FIRE2_ACTION = 0xCA,

	UP_PRESS = 0xCB,
	UP_RELEASE = 0x8B,
	UP_ACTION = 0xCB,

	DOWN_PRESS = 0xCC,
	DOWN_RELEASE = 0x8C,
	DOWN_ACTION = 0xCC,

	LEFT_PRESS = 0xCD,
	LEFT_RELEASE = 0x8D,
	LEFT_ACTION = 0xCD,

	RIGHT_PRESS = 0xCE,
	RIGHT_RELEASE = 0x8E,
	RIGHT_ACTION = 0xCE,

	ENCODER_LEFT = 0x01,
	ENCODER_RIGHT = 0x02,
	ENCODER2_LEFT = 0x03,
	ENCODER2_RIGHT = 0x04,

	LEFT2_ACTION = 0x03,
	RIGHT2_ACTION = 0x04,

	JOYSTICK_X = 0x10,
	JOYSTICK_Y = 0x11,
	TILT_LEFT = 0x12,
	TILT_RIGHT = 0x13,
	TILT_FORWARD = 0x14,
	TILT_BACKWARD = 0x15,
	PROXIMITY = 0x16,

	PAUSE_PRESS = 0xD8,
	PAUSE_RELEASE = 0x98,
	PAUSE_ACTION = 0xD8,

	MENU_PRESS = 0xD9,
	MENU_RELEASE = 0x99,
	MENU_ACTION = 0xD9,

	POWER_PRESS = 0xDA,
	POWER_RELEASE = 0x9A
} Action;

typedef enum {
	BUTTON_OFF,
	BUTTON_ON
} ButtonState;

typedef enum {
	ENCODER_IDLE,
	ENCODER_DEBOUNCING
} EncoderState;

typedef enum {
	SYSTEM_PLAY_STATE,
	SYSTEM_MENU_STATE
} SystemState;

typedef enum {
	GAME_PLAY_STATE,
	GAME_PAUSED_STATE,
	GAME_COMPLETED_STATE
} GameState;

typedef enum {
	LEVEL_COMPLETE_SOUND,
	LEVEL_FAIL_SOUND,
	GAME_COMPLETE_SOUND,
	SHOOT_SOUND,
	HIT_SOUND,
	MISS_SOUND,
	GENERATE_ITEM_SOUND,
	TICK_SOUND,
	CHECKPOINT_SOUND,
	SIMONSAYS1_SOUND,
	SIMONSAYS2_SOUND,
	SIMONSAYS3_SOUND,
	SIMONSAYS4_SOUND,
	SIMONSAYS1_ORIGINAL_SOUND,
	SIMONSAYS2_ORIGINAL_SOUND,
	SIMONSAYS3_ORIGINAL_SOUND,
	SIMONSAYS4_ORIGINAL_SOUND
} Sound;

enum {
	OFF_COLOR = 0x000000,
	WHITE_COLOR = 0xFFFFFF,
	SILVER_COLOR = 0x7F7F7F,
	RED_COLOR = 0xFF0000,
	GREEN_COLOR = 0x00FF00,
	BLUE_COLOR = 0x0000FF,
	YELLOW_COLOR = 0xFFFF00,
	CYAN_COLOR = 0x00FFFF,
	MAGENTA_COLOR = 0xFF00FF,
	ORANGE_COLOR = 0xFF8800,
	PURPLE_COLOR = 0x8800FF,
	PINK_COLOR = 0xFF6699,
	DARK_RED_COLOR = 0x7F0000,
	DARK_GREEN_COLOR = 0x007F00,
	DARK_BLUE_COLOR = 0x00007F,
	DARK_YELLOW_COLOR = 0x999900,
	DARK_CYAN_COLOR = 0x007F7F,
	DARK_MAGENTA_COLOR = 0x7F007F,
	DARK_WHITE_COLOR = 0x7F7F7F,
	DARK_ORANGE_COLOR = 0x7F4400,
	DARK_PURPLE_COLOR = 0x44007F,
	DARK_PINK_COLOR = 0x7F334C,
	BANANA_COLOR = 0xFFCC00,
	LEMON_COLOR = 0xCCFF00,
	WATERMELON_COLOR = 0x007F00,
	BLACKBERRY_COLOR = 0x44007F,
	STRAWBERRY_COLOR = 0xFF3366,
	GRAY_COLOR = 0x808080,
	LIGHT_GRAY_COLOR = 0xC0C0C0,
	DARK_GRAY_COLOR = 0x404040
};

typedef struct {
	Action action;
	float value;
} InputEvent;

typedef void (*InputHandler)(InputEvent* event, void* self);

typedef struct Audio Audio;
typedef struct System System;
typedef struct Game Game;
typedef struct Clock Clock;

static inline void Clock_update(Clock* clock);
static inline void System_handleInput(System* system, int padId, InputEvent* event);
static inline void Game_togglePause(Game* game);
static inline void Game_pause(Game* game);
static inline void Game_play(Game* game);
static inline bool Action_isGameButtonPress(Action action);

typedef struct Clock {
	float time;
	float timestamp;
	float delta;
} Clock;

typedef struct {
	bool state;
	float timestamp;
} DebouncedPin;

typedef struct {
	Action pressAction;
	Action releaseAction;
	ButtonState state;
} Button;

typedef struct {
	Action leftAction;
	Action rightAction;
	EncoderState state;
	int rawQuadratureState;
	int previousQuadratureState;
	float clockTimestamp;
	float inputChangeTimestamp;
} Encoder;

typedef struct {
	uint32_t pixels[STRIP_MAX_LEDS];
	uint16_t length;
} Strip;

struct Audio {
	int dummy;
};

typedef struct Game {
	uint16_t resolution;
	uint32_t* pixels;
	const char* name;
	Audio* audio;
	float time;
	float levelTime;
	int level;
	GameState state;
	System* system;
	float delayTime;

	void (*loop)(struct Game* self);
	void (*buildStage)(struct Game* self);
	void (*handleInput)(struct Game* self, int padId, InputEvent* event);
} Game;

typedef struct System {
	Clock clock;
	Audio audio;
	Strip strip;
	Game* game;
	float uptime;
	SystemState state;
} System;

static inline void Clock_init(Clock* clock) {
	clock->time = 0;
	clock->timestamp = 0;
	clock->delta = 0;
	Clock_update(clock);
}

static inline void Clock_update(Clock* clock) {
	float now;
	#ifdef ARDUINO
	now = millis() / 1000.0;
	#endif
	clock->delta = now - clock->timestamp;
	clock->timestamp = now;
	clock->time = now;
}

static inline void DebouncedPin_init(DebouncedPin* pin) {
	pin->state = false;
	pin->timestamp = 0;
}

static inline bool DebouncedPin_process(DebouncedPin* pin, bool value, float now) {
	if (value != pin->state)
		pin->timestamp = now;
	if ((now - pin->timestamp) >= DEBOUNCE_DURATION && value != pin->state)
		pin->state = value;
	return pin->state;
}

static inline void Button_init(Button* button, Action pressAction, Action releaseAction) {
	button->pressAction = pressAction;
	button->releaseAction = releaseAction;
	button->state = BUTTON_OFF;
}

static inline bool Button_process(Button* button, bool value, float now, InputEvent* event) {
	(void)now;
	if (value && button->state == BUTTON_OFF) {
		button->state = BUTTON_ON;
		event->action = button->pressAction;
		event->value = 0.0f;
		return true;
	} else if (!value && button->state == BUTTON_ON) {
		button->state = BUTTON_OFF;
		event->action = button->releaseAction;
		event->value = 0.0f;
		return true;
	}
	return false;
}

static inline void Encoder_init(Encoder* encoder, Action leftAction, Action rightAction) {
	encoder->leftAction = leftAction;
	encoder->rightAction = rightAction;
	encoder->state = ENCODER_IDLE;
	encoder->rawQuadratureState = 0;
	encoder->previousQuadratureState = 0;
	encoder->clockTimestamp = 0;
	encoder->inputChangeTimestamp = 0;
}

static inline bool Encoder_process(Encoder* encoder, bool clock, bool direction, float now, InputEvent* event) {
	int currentRawQuadratureState = (clock << 1) | direction;
	if (currentRawQuadratureState != encoder->rawQuadratureState) {
		encoder->rawQuadratureState = currentRawQuadratureState;
		encoder->inputChangeTimestamp = now;
	}
	int debouncedQuadratureState = encoder->previousQuadratureState;
	if ((now - encoder->inputChangeTimestamp) >= DEBOUNCE_DURATION)
		debouncedQuadratureState = encoder->rawQuadratureState;

	bool stepDetected = false;
	if (debouncedQuadratureState != encoder->previousQuadratureState) {
		int transition = (encoder->previousQuadratureState << 2) | debouncedQuadratureState;
		if (encoder->state == ENCODER_IDLE) {
			if (transition == 0x01 || transition == 0x07 || transition == 0x0E || transition == 0x08) {
				event->action = encoder->rightAction;
				stepDetected = true;
			} else if (transition == 0x02 || transition == 0x0B || transition == 0x0D || transition == 0x04) {
				event->action = encoder->leftAction;
				stepDetected = true;
			}
			if (stepDetected) {
				event->value = 0.0f;
				encoder->clockTimestamp = now;
				encoder->state = ENCODER_DEBOUNCING;
			}
		}
	}
	encoder->previousQuadratureState = debouncedQuadratureState;
	if (encoder->state == ENCODER_DEBOUNCING && (now - encoder->clockTimestamp) >= DEBOUNCE_DURATION)
		encoder->state = ENCODER_IDLE;

	return stepDetected;
}

static inline void Strip_init(Strip* strip, uint16_t length) {
	strip->length = length;
	memset(strip->pixels, 0, sizeof(strip->pixels));
}

static inline void Strip_testPattern(Strip* strip) {
	uint16_t half = strip->length / 2;

	for (uint16_t i = 0; i < half; i++) {
		float t = (half > 1) ? (float)i / (half - 1) : 0.0f;
		uint8_t v = 255.0f * (1.0f - t);
		strip->pixels[i] = ((uint32_t)v << 16) | ((uint32_t)v << 8) | v;
	}

	uint16_t remainder = strip->length - half;
	uint16_t segment = remainder / 3;
	uint16_t extra = remainder % 3;

	uint16_t index = half;
	uint16_t rampLength;

	rampLength = segment + (extra > 0 ? 1 : 0);
	for (uint16_t i = 0; i < rampLength; i++) {
		float t = (rampLength > 1) ? (float)i / (rampLength - 1) : 1.0f;
		uint8_t r = 255.0f * t;
		strip->pixels[index] = ((uint32_t)r << 16);
		index++;
	}

	rampLength = segment + (extra > 1 ? 1 : 0);
	for (uint16_t i = 0; i < rampLength; i++) {
		float t = (rampLength > 1) ? (float)i / (rampLength - 1) : 1.0f;
		uint8_t g = 255.0f * t;
		strip->pixels[index] = ((uint32_t)g << 8);
		index++;
	}

	rampLength = strip->length - index;
	for (uint16_t i = 0; i < rampLength; i++) {
		float t = (rampLength > 1) ? (float)i / (rampLength - 1) : 1.0f;
		uint8_t b = 255.0f * t;
		strip->pixels[index] = b;
		index++;
	}
}

static inline void Audio_init(Audio* audio) {
	audio->dummy = 0;
}

static inline void playAudio(Sound sound) {
	(void)sound;
}

static inline void Game_init(Game* game, System* system) {
	game->system = system;
	game->audio = &system->audio;
	game->pixels = system->strip.pixels;
	game->resolution = system->strip.length;
	game->time = 0;
	game->levelTime = 0;
	game->level = 0;
	game->state = GAME_PLAY_STATE;
	game->delayTime = 0;
	game->name = "";

	game->loop = NULL;
	game->buildStage = NULL;
	game->handleInput = NULL;
}

static inline void Game_loop(Game* game) {
	float delta = game->system->clock.delta;
	game->time += delta;
	game->levelTime += delta;

	if (game->delayTime > 0) {
		game->delayTime -= delta;
		if (game->delayTime < 0)
			game->delayTime = 0;
		return;
	}

	if (game->loop)
		game->loop(game);
}

static inline void Game_pause(Game* game) {
	game->state = GAME_PAUSED_STATE;
}

static inline void Game_play(Game* game) {
	game->state = GAME_PLAY_STATE;
}

static inline void Game_togglePause(Game* game) {
	if (game->state == GAME_PLAY_STATE)
		Game_pause(game);
	else
		Game_play(game);
}

static inline void Game_delay(Game* game, float seconds) {
	game->delayTime = seconds;
}

static inline void Game_clear(Game* game) {
	memset(game->pixels, 0, game->resolution * sizeof(uint32_t));
}

static inline void Game_setLevel(Game* game, int n) {
	game->level = n;
}

static inline void Game_nextLevel(Game* game) {
	game->level++;
}

static inline void Game_playLevel(Game* game) {
	if (game->buildStage)
		game->buildStage(game);
	game->levelTime = 0;
	Game_play(game);
}

static inline void System_init(System* system) {
	Clock_init(&system->clock);
	Audio_init(&system->audio);
	Strip_init(&system->strip, STRIP_MAX_LEDS);
	system->uptime = 0.0f;
	system->state = SYSTEM_PLAY_STATE;
}

static inline void System_loop(System* system) {
	Clock_update(&system->clock);
	system->uptime += system->clock.delta;

	switch (system->state) {
		case SYSTEM_PLAY_STATE:
			if (system->game && system->game->state == GAME_PLAY_STATE)
				Game_loop(system->game);
			break;
		case SYSTEM_MENU_STATE:
			Strip_testPattern(&system->strip);
			break;
	}
}

static inline void System_togglePause(System* system) {
	if (system->game)
		Game_togglePause(system->game);
}

static inline void System_toggleMenu(System* system) {
	system->state = (system->state == SYSTEM_PLAY_STATE) ? SYSTEM_MENU_STATE : SYSTEM_PLAY_STATE;
}

static inline void System_handleInput(System* system, int padId, InputEvent* event) {
	if (event->action == MENU_PRESS)
		System_toggleMenu(system);
	else if (event->action == PAUSE_PRESS) {
		if (system->state == SYSTEM_PLAY_STATE && system->game)
			Game_togglePause(system->game);
	} else if (system->state == SYSTEM_PLAY_STATE && system->game && system->game->handleInput)
		system->game->handleInput(system->game, padId, event);
}

static inline bool Action_isGameButtonPress(Action action) {
	return ((action & 0xC0) == 0xC0) && ((action & 0x18) != 0x18);
}

static inline uint32_t hsv_to_rgb(float h, float s, float v) {
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

static inline uint32_t balanceColors(uint32_t color) {
	uint8_t r = (color >> 16) & 0xFF;
	uint8_t g = (color >> 8) & 0xFF;
	uint8_t b = color & 0xFF;
	r = (uint8_t)(r * 0.38);
	g = (uint8_t)(g * 0.28);
	return ((uint32_t)r << 16) | ((uint32_t)g << 8) | (uint32_t)b;
}

static inline uint32_t correctGamma(uint32_t color) {
	return color;
}

#endif /* SYSTEM_H */
