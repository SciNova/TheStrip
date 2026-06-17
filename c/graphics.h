#ifndef GRAPHICS_H
#define GRAPHICS_H

#include "system.h"
#include <math.h>

/* ===========================================================
   Alignment & EdgeMode
   =========================================================== */

typedef enum {
	CENTER_ALIGN,
	FORWARD_ALIGN,
	BACKWARD_ALIGN
} Alignment;

typedef enum {
	CLIP_EDGE,
	MIRROR_EDGE,
	WRAP_EDGE
} EdgeMode;

/* ===========================================================
   Shape
   =========================================================== */

typedef struct Shape {
	Game* game;
	Alignment alignment;
	uint32_t* pixels;
	uint16_t length;
	float rotation;
	float viewAngle;
} Shape;

static inline void Shape_init(Shape* shape, Game* game, uint16_t size, Alignment alignment) {
	shape->game = game;
	shape->alignment = alignment;
	shape->pixels = (uint32_t*)calloc(size, sizeof(uint32_t));
	shape->length = size;
	shape->rotation = 0.0f;
	shape->viewAngle = 0.0f;
}

static inline void Shape_free(Shape* shape) {
	free(shape->pixels);
}

static inline void Shape_render(Shape* shape, float position, EdgeMode edge, float scale) {
	if (scale <= 0.0f) return;

	uint16_t srcLen = shape->length;
	uint16_t scaledLen = (uint16_t)ceilf(srcLen * scale);
	if (scaledLen % 2 == 0) scaledLen++;

	uint32_t* temp = (uint32_t*)calloc(scaledLen, sizeof(uint32_t));
	for (uint16_t i = 0; i < scaledLen; i++) {
		float offset = i - (scaledLen - 1) / 2.0f;
		int srcIndex = (int)roundf((srcLen - 1) / 2.0f + offset / scale);
		if (srcIndex >= 0 && srcIndex < (int)srcLen && shape->pixels[srcIndex] != 0) {
			temp[i] = balanceColors(shape->pixels[srcIndex]);
		}
	}

	int half = (scaledLen - 1) / 2;
	int drawStart;
	if (shape->alignment == CENTER_ALIGN)
		drawStart = (int)roundf(position) - half;
	else if (shape->alignment == FORWARD_ALIGN)
		drawStart = (int)roundf(position);
	else
		drawStart = (int)roundf(position) - scaledLen + 1;

	int resolution = (int)shape->game->resolution;

	for (uint16_t i = 0; i < scaledLen; i++) {
		uint32_t px = temp[i];
		if (px == 0) continue;
		int pixelPos = drawStart + i;

		if (edge == CLIP_EDGE) {
			if (pixelPos >= 0 && pixelPos < resolution)
				shape->game->pixels[pixelPos] = px;
		} else if (edge == MIRROR_EDGE) {
			while (pixelPos < 0) pixelPos = -pixelPos;
			while (pixelPos >= resolution)
				pixelPos = 2 * (resolution - 1) - pixelPos;
			shape->game->pixels[pixelPos] = px;
		} else {
			pixelPos = pixelPos % resolution;
			if (pixelPos < 0) pixelPos += resolution;
			shape->game->pixels[pixelPos] = px;
		}
	}
	free(temp);
}

/* ===========================================================
   Square
   =========================================================== */

typedef struct Square Square;
struct Square {
	Shape super;
	uint32_t** faces;
	uint8_t faceCount;
	uint8_t faceSize;
	bool invert;
};

static inline void Square_init(Square* square, Game* game, uint32_t** faces, uint8_t faceCount, uint8_t faceSize, bool invert) {
	uint16_t size = (uint16_t)ceilf(faceSize * sqrtf(2.0f));
	if (size % 2 == 0) size++;
	Shape_init(&square->super, game, size, CENTER_ALIGN);
	square->faces = faces;
	square->faceCount = faceCount;
	square->faceSize = faceSize;
	square->invert = invert;
}

static inline void Square_update(Square* square) {
	Shape* s = &square->super;
	for (uint16_t i = 0; i < s->length; i++) s->pixels[i] = 0;

	float eff = s->rotation - s->viewAngle;
	if (square->invert) eff += 0.5f;
	eff = fmodf(eff, 1.0f);
	if (eff < 0) eff += 1.0f;

	float quarterRotation = fmodf(eff * square->faceCount, 1.0f);
	float angle = quarterRotation * M_PI / 2.0f;
	float cosA = cosf(angle);
	float sinA = sinf(angle);

	int length1 = (int)floorf(cosA * square->faceSize);
	int length2 = (int)floorf(sinA * square->faceSize);
	int totalWidth = length1 + length2;
	int startPos = (s->length - totalWidth) / 2;

	int faceIndex = ((int)(eff * square->faceCount)) % square->faceCount;
	int nextFaceIndex = (faceIndex + 1) % square->faceCount;
	uint32_t* pattern1 = square->faces[faceIndex];
	uint32_t* pattern2 = square->faces[nextFaceIndex];

	float maxY = square->faceSize * sqrtf(2.0f) / 2.0f;

	if (length1 > 0) {
		for (int p = 0; p < length1; p++) {
			float xFace = ((float)p / length1 - 0.5f) * square->faceSize;
			float y = xFace * sinA;
			float intensity = (y + maxY) / (2.0f * maxY);
			if (intensity < 0.0f) intensity = 0.0f;
			if (intensity > 1.0f) intensity = 1.0f;
			int patternPos = (int)(p / (float)length1 * square->faceSize);
			if (patternPos >= square->faceSize) patternPos = square->faceSize - 1;
			uint32_t src = pattern1[patternPos];
			if (src != 0) {
				uint8_t r = (src >> 16) & 0xFF;
				uint8_t g = (src >> 8) & 0xFF;
				uint8_t b = src & 0xFF;
				s->pixels[startPos + p] = ((uint32_t)(r * intensity) << 16) |
										 ((uint32_t)(g * intensity) << 8)  |
										  (uint32_t)(b * intensity);
			}
		}
	}
	if (length2 > 0) {
		for (int p = 0; p < length2; p++) {
			float yFace = ((float)p / length2 - 0.5f) * square->faceSize;
			float y = yFace * cosA;
			float rawIntensity = (y + maxY) / (2.0f * maxY);
			float intensity = 1.0f - rawIntensity;
			if (intensity < 0.0f) intensity = 0.0f;
			if (intensity > 1.0f) intensity = 1.0f;
			int patternPos = (int)(p / (float)length2 * square->faceSize);
			if (patternPos >= square->faceSize) patternPos = square->faceSize - 1;
			uint32_t src = pattern2[patternPos];
			if (src != 0) {
				uint8_t r = (src >> 16) & 0xFF;
				uint8_t g = (src >> 8) & 0xFF;
				uint8_t b = src & 0xFF;
				s->pixels[startPos + length1 + p] = ((uint32_t)(r * intensity) << 16) |
													((uint32_t)(g * intensity) << 8)  |
													 (uint32_t)(b * intensity);
			}
		}
	}
}

/* ===========================================================
   Worlds (must be defined before Shape2D that uses them)
   =========================================================== */

typedef struct BaseWorld {
	int dummy;
} BaseWorld;

typedef struct World {
	BaseWorld super;
	float size;
	bool wraps;
} World;

static inline void World_init(World* world, float size, bool wraps) {
	world->size = size;
	world->wraps = wraps;
}

typedef struct World2D {
	BaseWorld super;
	float width;
	float depth;
	bool wrapsX;
	bool wrapsZ;
} World2D;

static inline void World2D_init(World2D* world, float width, float depth, bool wrapsX, bool wrapsZ) {
	world->width = width;
	world->depth = depth;
	world->wrapsX = wrapsX;
	world->wrapsZ = wrapsZ;
}

/* ===========================================================
   Shape2D (uses World2D, which is now defined)
   =========================================================== */

typedef struct Shape2D {
	Shape super;
	float x;
	float z;
} Shape2D;

static inline void Shape2D_init(Shape2D* shape2d, Game* game, uint16_t size, Alignment alignment) {
	Shape_init(&shape2d->super, game, size, alignment);
	shape2d->x = 0.0f;
	shape2d->z = 0.0f;
}

static inline bool Shape2D_collides(Shape2D* shape2d, float z, float x, World2D* world) {
	float radius = shape2d->super.length / 2.0f;
	float dx = shape2d->x - x;
	float dz = shape2d->z - z;
	if (world->wrapsZ) {
		float halfZ = world->width * shape2d->super.game->resolution / 2.0f;
		dz = fmodf(dz + halfZ, 2.0f * halfZ);
		if (dz < 0) dz += 2.0f * halfZ;
		dz -= halfZ;
	}
	if (world->wrapsX) {
		float halfX = world->depth * shape2d->super.game->resolution / 2.0f;
		dx = fmodf(dx + halfX, 2.0f * halfX);
		if (dx < 0) dx += 2.0f * halfX;
		dx -= halfX;
	}
	return (dx * dx + dz * dz) < (radius * radius);
}

/* ===========================================================
   Square2D
   =========================================================== */

typedef struct Square2D {
	Shape2D super;
	Square square;
} Square2D;

static inline void Square2D_init(Square2D* sq2d, Game* game, uint32_t** faces, uint8_t faceCount, uint8_t faceSize, bool invert) {
	Square_init(&sq2d->square, game, faces, faceCount, faceSize, invert);
	sq2d->super.super = sq2d->square.super;
	sq2d->super.x = 0.0f;
	sq2d->super.z = 0.0f;
}

static inline void Square2D_update(Square2D* sq2d) {
	Square_update(&sq2d->square);
}

/* ===========================================================
   Camera
   =========================================================== */

typedef struct {
	float x;
	float z;
	float rotation;
} Camera;

static inline void Camera_init(Camera* cam, float x, float z, float rotation) {
	cam->x = x;
	cam->z = z;
	cam->rotation = rotation;
}

/* ===========================================================
   Players
   =========================================================== */

typedef struct BasePlayer {
	Game* game;
} BasePlayer;

typedef struct {
	BasePlayer super;
	float location;
} BasePlayer1D;

static inline void BasePlayer1D_init(BasePlayer1D* player, Game* game) {
	player->super.game = game;
	player->location = 0.0f;
}

static inline float BasePlayer1D_distance(BasePlayer1D* player, float location, World* world) {
	float d = player->location - location;
	if (world->wraps) {
		float half = world->size * player->super.game->resolution / 2.0f;
		d = fmodf(d + half, 2.0f * half);
		if (d < 0) d += 2.0f * half;
		d -= half;
	}
	return fabsf(d);
}

typedef struct {
	BasePlayer super;
	float x;
	float z;
	float rotation;
} BasePlayer2D;

static inline void BasePlayer2D_init(BasePlayer2D* player, Game* game) {
	player->super.game = game;
	player->x = 0.0f;
	player->z = 0.0f;
	player->rotation = 0.0f;
}

static inline float BasePlayer2D_distance(BasePlayer2D* player, float z, float x, World2D* world) {
	float dx = player->x - x;
	float dz = player->z - z;
	if (world->wrapsZ) {
		float halfZ = world->width * player->super.game->resolution / 2.0f;
		dz = fmodf(dz + halfZ, 2.0f * halfZ);
		if (dz < 0) dz += 2.0f * halfZ;
		dz -= halfZ;
	}
	if (world->wrapsX) {
		float halfX = world->depth * player->super.game->resolution / 2.0f;
		dx = fmodf(dx + halfX, 2.0f * halfX);
		if (dx < 0) dx += 2.0f * halfX;
		dx -= halfX;
	}
	return sqrtf(dx * dx + dz * dz);
}

static inline float BasePlayer2D_direction(BasePlayer2D* player, float z, float x) {
	float dx = x - player->x;
	float dz = z - player->z;
	float angle = atan2f(dz, dx);
	float result = (angle / (2.0f * M_PI)) + 1.0f;
	while (result >= 1.0f) result -= 1.0f;
	while (result < 0.0f) result += 1.0f;
	return result;
}

#endif /* GRAPHICS_H */
