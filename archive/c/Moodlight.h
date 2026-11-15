#ifndef MOODLIGHT_H
#define MOODLIGHT_H

#include "system.h"

typedef struct Moodlight Moodlight;

struct Moodlight {
	Game super;
	uint8_t activeTheme;
	float speed;
	float phase[3];
};

static inline void Moodlight_loop(Moodlight* game);
static inline void Moodlight_handleInput(Moodlight* game, int padId, InputEvent* event);

static inline void Moodlight_init(Moodlight* game, System* system) {
	Game_init(&game->super, system);
	game->super.name = "Moodlight";

	game->activeTheme = 0;
	game->speed = 0.5f;
	game->phase[0] = 0.0f;
	game->phase[1] = 0.0f;
	game->phase[2] = 0.0f;

	game->super.loop = (void (*)(Game*))Moodlight_loop;
	game->super.buildStage = NULL;
	game->super.handleInput = (void (*)(Game*, int, InputEvent*))Moodlight_handleInput;
}

static inline void Moodlight_rainbowRender(Moodlight* game, float dt, float* phase) {
	*phase += dt * game->speed;
	float p = *phase;
	const float PI2 = 3.1415926535f * 2.0f;
	const float third = PI2 / 3.0f;

	for (uint16_t i = 0; i < game->super.resolution; i++) {
		float pos = ((float)i / game->super.resolution + p) * PI2;
		float r = sinf(pos) * 127.5f + 127.5f;
		float g = sinf(pos + third) * 127.5f + 127.5f;
		float b = sinf(pos + 2.0f * third) * 127.5f + 127.5f;
		uint8_t r8 = (r > 255.0f) ? 255 : ((r < 0.0f) ? 0 : (uint8_t)r);
		uint8_t g8 = (g > 255.0f) ? 255 : ((g < 0.0f) ? 0 : (uint8_t)g);
		uint8_t b8 = (b > 255.0f) ? 255 : ((b < 0.0f) ? 0 : (uint8_t)b);
		game->super.pixels[i] = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
	}
}

static inline void Moodlight_oceanRender(Moodlight* game, float dt, float* phase) {
	*phase += dt * game->speed;
	float p = *phase;
	const float PI2 = 3.1415926535f * 2.0f;
	const float third = PI2 / 3.0f;

	for (uint16_t i = 0; i < game->super.resolution; i++) {
		float pos = ((float)i / game->super.resolution + p) * PI2;
		float r = sinf(pos) * 10.0f + 10.0f;
		float g = sinf(pos + third) * 50.0f + 50.0f;
		float b = sinf(pos + 2.0f * third) * 100.0f + 100.0f;
		uint8_t r8 = (r > 255.0f) ? 255 : ((r < 0.0f) ? 0 : (uint8_t)r);
		uint8_t g8 = (g > 255.0f) ? 255 : ((g < 0.0f) ? 0 : (uint8_t)g);
		uint8_t b8 = (b > 255.0f) ? 255 : ((b < 0.0f) ? 0 : (uint8_t)b);
		game->super.pixels[i] = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
	}
}

static inline void Moodlight_fireRender(Moodlight* game, float dt, float* phase) {
	*phase += dt * game->speed;
	float p = *phase;
	const float PI2 = 3.1415926535f * 2.0f;
	const float third = PI2 / 3.0f;

	for (uint16_t i = 0; i < game->super.resolution; i++) {
		float pos = ((float)i / game->super.resolution + p) * PI2;
		float r = sinf(pos) * 100.0f + 155.0f;
		float g = sinf(pos + third) * 30.0f + 30.0f;
		float b = sinf(pos + 2.0f * third) * 10.0f + 5.0f;
		uint8_t r8 = (r > 255.0f) ? 255 : ((r < 0.0f) ? 0 : (uint8_t)r);
		uint8_t g8 = (g > 255.0f) ? 255 : ((g < 0.0f) ? 0 : (uint8_t)g);
		uint8_t b8 = (b > 255.0f) ? 255 : ((b < 0.0f) ? 0 : (uint8_t)b);
		game->super.pixels[i] = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
	}
}

static inline void Moodlight_loop(Moodlight* game) {
	float dt = game->super.system->clock.delta;

	switch (game->activeTheme) {
		case 0:
			Moodlight_rainbowRender(game, dt, &game->phase[0]); break;
		case 1:
			Moodlight_oceanRender(game, dt, &game->phase[1]); break;
		case 2:
			Moodlight_fireRender(game, dt, &game->phase[2]); break;
	}
}

static inline void Moodlight_handleInput(Moodlight* game, int padId, InputEvent* event) {
	(void)padId;

	switch (event->action) {
		case A_PRESS:
			game->speed += 0.1f;
			if (game->speed > 2.0f) game->speed = 2.0f;
			break;
		case B_PRESS:
			game->activeTheme = (game->activeTheme + 1) % 3;
			break;
		case C_PRESS:
			game->speed -= 0.1f;
			if (game->speed < -2.0f) game->speed = -2.0f;
			break;
		default: break;
	}
}

#endif // MOODLIGHT_H
