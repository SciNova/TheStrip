#ifndef FLAPPYBIRD_H
#define FLAPPYBIRD_H

#include "system.h"

typedef struct {
	float position;
	float speed;
} Bird;

typedef struct {
	float height;
	float baseHeight;
	float fluctuation;
	float speed;
} Terrain;

typedef struct FlappyBird FlappyBird;

struct FlappyBird {
	Game super;
	Bird bird;
	Terrain topTerrain;
	Terrain bottomTerrain;
	float gap;
	float gapPosition;
	float fluctuation;
};

static inline void FlappyBird_loop(FlappyBird* game);
static inline void FlappyBird_handleInput(FlappyBird* game, int padId, InputEvent* event);

static inline void Bird_boost(Bird* bird) {
	bird->speed = 20.0f;
}

static inline void Bird_update(Bird* bird, float dt, float maxPos) {
	bird->speed -= 20.0f * dt;
	bird->position += bird->speed * dt;
	if (bird->position < 0.0f) bird->position = 0.0f;
	if (bird->position > maxPos) bird->position = maxPos;
}

static inline void Terrain_update(Terrain* terrain, float dt, float resolution) {
	float maxChange = terrain->speed * resolution * dt;
	float step = ((float)rand() / RAND_MAX * 2.0f - 1.0f) * maxChange;
	terrain->height += step;
	float minHeight = terrain->baseHeight - terrain->fluctuation * resolution;
	float maxHeight = terrain->baseHeight + terrain->fluctuation * resolution;
	if (terrain->height < minHeight) terrain->height = minHeight;
	if (terrain->height > maxHeight) terrain->height = maxHeight;
}

static inline void FlappyBird_init(FlappyBird* game, System* system) {
	Game_init(&game->super, system);
	game->super.name = "FlappyBird";

	game->bird.position = game->super.resolution / 2.0f;
	game->bird.speed = 0.0f;

	game->topTerrain.height = 0.0f;
	game->topTerrain.baseHeight = 0.0f;
	game->topTerrain.fluctuation = 0.0f;
	game->topTerrain.speed = 0.0f;

	game->bottomTerrain.height = 0.0f;
	game->bottomTerrain.baseHeight = 0.0f;
	game->bottomTerrain.fluctuation = 0.0f;
	game->bottomTerrain.speed = 0.0f;

	game->gap = 0.5f;
	game->gapPosition = 0.5f;
	game->fluctuation = 0.1f;

	game->super.loop = (void (*)(Game*))FlappyBird_loop;
	game->super.buildStage = NULL;
	game->super.handleInput = (void (*)(Game*, int, InputEvent*))FlappyBird_handleInput;
}

static inline void FlappyBird_loop(FlappyBird* game) {
	///Game_update(&game->super);

	float dt = game->super.system->clock.delta;
	float t = game->super.time / 60.0f;
	if (t > 1.0f) t = 1.0f;

	game->gap = 0.5f - (0.5f - 0.2f) * t;
	game->fluctuation = 0.0f + (0.3f - 0.0f) * t;

	game->topTerrain.fluctuation = 0.0f + (0.15f - 0.0f) * t;
	game->bottomTerrain.fluctuation = game->topTerrain.fluctuation;

	game->topTerrain.speed = 0.1f + (1.0f - 0.1f) * t;
	game->bottomTerrain.speed = game->topTerrain.speed;

	float gapCenter = game->gapPosition * game->super.resolution;
	float gapSize = game->gap * game->super.resolution;

	game->topTerrain.baseHeight = game->super.resolution - (gapCenter + gapSize / 2.0f);
	game->bottomTerrain.baseHeight = gapCenter - gapSize / 2.0f;

	Terrain_update(&game->topTerrain, dt, game->super.resolution);
	Terrain_update(&game->bottomTerrain, dt, game->super.resolution);
	Bird_update(&game->bird, dt, game->super.resolution - 1.0f);

	for (uint16_t i = 0; i < game->super.resolution; i++)
		game->super.pixels[i] = 0x00007F;

	int topHeight = (int)(game->topTerrain.height + 0.5f);
	for (int i = 0; i < topHeight; i++)
		game->super.pixels[game->super.resolution - 1 - i] = RED_COLOR;

	int bottomHeight = (int)(game->bottomTerrain.height + 0.5f);
	for (int i = 0; i < bottomHeight; i++)
		game->super.pixels[i] = RED_COLOR;

	int birdIdx = (int)(game->bird.position + 0.5f);
	game->super.pixels[birdIdx] = YELLOW_COLOR;
}

static inline void FlappyBird_handleInput(FlappyBird* game, int padId, InputEvent* event) {
	(void)padId;
	if (Action_isGameButtonPress(event->action))
		Bird_boost(&game->bird);
}

#endif // FLAPPYBIRD_H
