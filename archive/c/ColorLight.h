#ifndef COLORLIGHT_H
#define COLORLIGHT_H

#include "system.h"

#define FADE_DURATION 1.0f

typedef struct ColorLight ColorLight;

struct ColorLight {
	Game super;
	int mode;
	float level;
	float temperature;
	float hue;
	bool fading;
	float fadeStartTime;
	float fadeStartLevel;
	float fadeTargetLevel;
};

static inline void ColorLight_loop(ColorLight* game);
static inline void ColorLight_handleInput(ColorLight* game, int padId, InputEvent* event);

static inline void ColorLight_init(ColorLight* game, System* system) {
	Game_init(&game->super, system);
	game->super.name = "ColorLight";

	game->mode = 0;
	game->level = 0.5f;
	game->temperature = 0.5f;
	game->hue = 0.0f;
	game->fading = false;
	game->fadeStartTime = 0.0f;
	game->fadeStartLevel = 0.0f;
	game->fadeTargetLevel = 0.0f;

	game->super.loop = (void (*)(Game*))ColorLight_loop;
	game->super.buildStage = NULL;
	game->super.handleInput = (void (*)(Game*, int, InputEvent*))ColorLight_handleInput;
}

static inline void ColorLight_levelLeft(ColorLight* game) {
	game->fading = false;
	game->level -= 1.0f / 100.0f;
	if (game->level < 0.0f)
		game->level = 0.0f;
}

static inline void ColorLight_levelRight(ColorLight* game) {
	game->fading = false;
	game->level += 1.0f / 100.0f;
	if (game->level > 1.0f)
		game->level = 1.0f;
}

static inline void ColorLight_levelPressed(ColorLight* game) {
	float now = game->super.system->clock.time;
	if (game->fading) {
		game->fadeStartLevel = game->level;
		game->fadeTargetLevel = (game->fadeTargetLevel == 1.0f) ? 0.0f : 1.0f;
		game->fadeStartTime = now;
	} else {
		game->fading = true;
		game->fadeStartTime = now;
		game->fadeStartLevel = game->level;
		game->fadeTargetLevel = (game->level < 1.0f) ? 1.0f : 0.0f;
	}
}

static inline void ColorLight_modePressed(ColorLight* game) {
	game->mode = (game->mode == 0) ? 1 : 0;
}

static inline void ColorLight_modeLeft(ColorLight* game) {
	if (game->mode == 0) {
		game->temperature -= 1.0f / 50.0f;
		if (game->temperature < 0.0f)
			game->temperature = 0.0f;
	} else {
		game->hue -= 1.0f / 360.0f;
		if (game->hue < 0.0f)
			game->hue += 1.0f;
	}
}

static inline void ColorLight_modeRight(ColorLight* game) {
	if (game->mode == 0) {
		game->temperature += 1.0f / 50.0f;
		if (game->temperature > 1.0f)
			game->temperature = 1.0f;
	} else {
		game->hue += 1.0f / 360.0f;
		if (game->hue >= 1.0f)
			game->hue -= 1.0f;
	}
}

static inline void ColorLight_updateFade(ColorLight* game) {
	if (!game->fading) return;
	float now = game->super.system->clock.time;
	float elapsed = now - game->fadeStartTime;
	if (elapsed >= FADE_DURATION) {
		game->level = game->fadeTargetLevel;
		game->fading = false;
	} else {
		float t = elapsed / FADE_DURATION;
		game->level = game->fadeStartLevel + (game->fadeTargetLevel - game->fadeStartLevel) * t;
	}
}

static inline void ColorLight_loop(ColorLight* game) {
	ColorLight_updateFade(game);

	if (game->level <= 0.0f) {
		Game_clear(&game->super);
		return;
	}

	uint32_t color;
	if (game->mode == 0) {
		float coolR = 0.8f, coolG = 0.8f, coolB = 1.0f;
		float warmR = 1.0f, warmG = 0.6f, warmB = 0.2f;
		float t = game->temperature;
		float r = (coolR + t * (warmR - coolR)) * game->level;
		float g = (coolG + t * (warmG - coolG)) * game->level;
		float b = (coolB + t * (warmB - coolB)) * game->level;
		uint8_t r8 = (uint8_t)(r * 255.0f);
		uint8_t g8 = (uint8_t)(g * 255.0f);
		uint8_t b8 = (uint8_t)(b * 255.0f);
		color = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
	} else {
		color = hsv_to_rgb(game->hue, 1.0f, game->level);
	}
	for (uint16_t i = 0; i < game->super.resolution; i++)
		game->super.pixels[i] = color;
}

static inline void ColorLight_handleInput(ColorLight* game, int padId, InputEvent* event) {
	(void)padId;
	switch (event->action) {
		case FIRE_PRESS:
		case B_PRESS:
			ColorLight_levelPressed(game);
			break;
		case FIRE2_PRESS:
			ColorLight_modePressed(game);
			break;
		case A_PRESS:
		case DOWN_PRESS:
			ColorLight_levelLeft(game);
			break;
		case C_PRESS:
		case UP_PRESS:
			ColorLight_levelRight(game);
			break;
		case LEFT_PRESS:
			ColorLight_modeLeft(game);
			break;
		case RIGHT_PRESS:
			ColorLight_modeRight(game);
			break;
		case ENCODER_LEFT:
			ColorLight_levelLeft(game);
			break;
		case ENCODER_RIGHT:
			ColorLight_levelRight(game);
			break;
		case ENCODER2_LEFT:
			ColorLight_modeLeft(game);
			break;
		case ENCODER2_RIGHT:
			ColorLight_modeRight(game);
			break;
		default: break;
	}
}

#endif
