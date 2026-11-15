#ifndef WHITELIGHT_H
#define WHITELIGHT_H

#include "system.h"

#define FADE_DURATION 1.0f

typedef struct WhiteLight WhiteLight;

struct WhiteLight {
	Game super;
	float level;
	bool fading;
	float fadeStartTime;
	float fadeStartLevel;
	float fadeTargetLevel;
};

static inline void WhiteLight_loop(WhiteLight* game);
static inline void WhiteLight_handleInput(WhiteLight* game, int padId, InputEvent* event);

static inline void WhiteLight_init(WhiteLight* game, System* system) {
	Game_init(&game->super, system);
	game->super.name = "WhiteLight";

	game->level = 0.5f;
	game->fading = false;
	game->fadeStartTime = 0.0f;
	game->fadeStartLevel = 0.0f;
	game->fadeTargetLevel = 0.0f;

	game->super.loop = (void (*)(Game*))WhiteLight_loop;
	game->super.buildStage = NULL;
	game->super.handleInput = (void (*)(Game*, int, InputEvent*))WhiteLight_handleInput;
}

static inline void WhiteLight_levelLeft(WhiteLight* game) {
	game->fading = false;
	game->level -= 1.0f / 100.0f;
	if (game->level < 0.0f)
		game->level = 0.0f;
}

static inline void WhiteLight_levelRight(WhiteLight* game) {
	game->fading = false;
	game->level += 1.0f / 100.0f;
	if (game->level > 1.0f)
		game->level = 1.0f;
}

static inline void WhiteLight_levelPressed(WhiteLight* game) {
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

static inline void WhiteLight_updateFade(WhiteLight* game) {
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

static inline void WhiteLight_loop(WhiteLight* game) {
	WhiteLight_updateFade(game);

	uint8_t brightness = (uint8_t)(game->level * 255.0f);
	uint32_t color = ((uint32_t)brightness << 16) | ((uint32_t)brightness << 8) | brightness;
	for (uint16_t i = 0; i < game->super.resolution; i++)
		game->super.pixels[i] = color;
}

static inline void WhiteLight_handleInput(WhiteLight* game, int padId, InputEvent* event) {
	(void)padId;

	switch (event->action) {
		case FIRE_PRESS:
		case FIRE2_PRESS:
		case B_PRESS:
			WhiteLight_levelPressed(game);
			break;
		case A_PRESS:
		case DOWN_PRESS:
		case LEFT_PRESS:
			WhiteLight_levelLeft(game);
			break;
		case C_PRESS:
		case UP_PRESS:
		case RIGHT_PRESS:
			WhiteLight_levelRight(game);
			break;
		case ENCODER_LEFT:
			WhiteLight_levelLeft(game);
			break;
		case ENCODER_RIGHT:
			WhiteLight_levelRight(game);
			break;
		default: break;
	}
}

#endif // WHITELIGHT_H
