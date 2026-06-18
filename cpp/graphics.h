#ifndef GRAPHICS_H
#define GRAPHICS_H

#include <math.h>
#include "system.h"

enum class Alignment {
	CENTER,
	FORWARD,
	BACKWARD
};

enum class EdgeMode {
	CLIP,
	MIRROR,
	WRAP
};

class World {
public:
	float size;
	bool wraps;

	World(float s = 1.0f, bool w = false) {
		size = s;
		wraps = w;
	}
};

class World2D {
public:
	float width;
	float depth;
	bool wrapsX;
	bool wrapsZ;

	World2D(float w = 1.0f, float d = 1.0f, bool wx = false, bool wz = false) {
		width = w;
		depth = d;
		wrapsX = wx;
		wrapsZ = wz;
	}
};

class Camera {
public:
	float x;
	float z;
	float rotation;

	Camera(float xPos = 0.0f, float zPos = 0.0f, float rot = 0.0f) {
		x = xPos;
		z = zPos;
		rotation = rot;
	}
};

class Shape {

public:
 	Game* game;
	uint32_t* pixels;
	Alignment alignment;
	float rotation;
	float viewAngle;
	uint16_t length;
	Shape() {}
	Shape(Game* g, uint16_t size, Alignment align = Alignment::CENTER) {
		game = g;
		alignment = align;
		length = size;
		pixels = new uint32_t[size];
		for (uint16_t i = 0; i < size; i++)
			pixels[i] = 0;
		rotation = 0.0f;
		viewAngle = 0.0f;
	}

	virtual ~Shape() {
		delete[] pixels;
	}

	virtual void update() {}

	void render(float position, EdgeMode edge = EdgeMode::CLIP, float scale = 1.0f) {
		if (scale <= 0.0f)
			return;

		uint16_t srcLen = length;
		uint16_t scaledLen = (uint16_t)ceilf(srcLen * scale);
		if (scaledLen % 2 == 0)
			scaledLen++;

		uint32_t* temp = new uint32_t[scaledLen];
		for (uint16_t i = 0; i < scaledLen; i++) {
			float offset = i - (scaledLen - 1) / 2.0f;
			int srcIndex = (int)roundf((srcLen - 1) / 2.0f + offset / scale);
			if (srcIndex >= 0 && srcIndex < (int)srcLen && pixels[srcIndex] != 0)
				temp[i] = balanceColors(pixels[srcIndex]);
			else
				temp[i] = 0;
		}

		int half = (scaledLen - 1) / 2;
		int drawStart;
		switch (alignment) {
			case Alignment::CENTER:
				drawStart = (int)roundf(position) - half;
				break;
			case Alignment::FORWARD:
				drawStart = (int)roundf(position);
				break;
			case Alignment::BACKWARD:
				drawStart = (int)roundf(position) - scaledLen + 1;
				break;
		}

		for (uint16_t i = 0; i < scaledLen; i++) {
			uint32_t px = temp[i];
			if (px == 0)
				continue;
			int pixelPos = drawStart + i;

			switch (edge) {
				case EdgeMode::CLIP:
					if (pixelPos >= 0 && pixelPos < (int)game->resolution)
						game->pixels[pixelPos] = px;
					break;
				case EdgeMode::MIRROR:
					while (pixelPos < 0)
						pixelPos = -pixelPos;
					while (pixelPos >= (int)game->resolution)
						pixelPos = 2 * ((int)game->resolution - 1) - pixelPos;
					game->pixels[pixelPos] = px;
					break;
				case EdgeMode::WRAP:
					pixelPos = ((pixelPos % (int)game->resolution) + (int)game->resolution) % (int)game->resolution;
					game->pixels[pixelPos] = px;
					break;
			}
		}
		delete[] temp;
	}
};

class Square : public virtual Shape {
public:
	uint32_t** faces;
	uint8_t faceCount;
	uint8_t faceSize;
	bool invert;
	Square() {}

	Square(Game* g, uint32_t** f, uint8_t count, uint8_t size, bool inv = false) :
			Shape(g, (uint16_t)ceilf(size * sqrtf(2.0f)) + 1, Alignment::CENTER) {
		faces = f;
		faceCount = count;
		faceSize = size;
		invert = inv;
	}

	virtual void update() override {
		for (uint16_t i = 0; i < length; i++)
			pixels[i] = 0;

		float eff = rotation - viewAngle;
		if (invert)
			eff += 0.5f;
		eff = fmodf(eff, 1.0f);
		if (eff < 0)
			eff += 1.0f;

		float quarterRotation = fmodf(eff * faceCount, 1.0f);
		float angle = quarterRotation * M_PI / 2.0f;
		float cosA = cosf(angle);
		float sinA = sinf(angle);

		int length1 = (int)floorf(cosA * faceSize);
		int length2 = (int)floorf(sinA * faceSize);
		int totalWidth = length1 + length2;
		int startPos = (length - totalWidth) / 2;

		int faceIndex = (int)(eff * faceCount) % faceCount;
		int nextFaceIndex = (faceIndex + 1) % faceCount;
		uint32_t* pattern1 = faces[faceIndex];
		uint32_t* pattern2 = faces[nextFaceIndex];

		float maxY = faceSize * sqrtf(2.0f) / 2.0f;

		if (length1 > 0) {
			for (int p = 0; p < length1; p++) {
				float xFace = ((float)p / length1 - 0.5f) * faceSize;
				float y = xFace * sinA;
				float intensity = (y + maxY) / (2.0f * maxY);
				if (intensity < 0.0f)
					intensity = 0.0f;
				if (intensity > 1.0f)
					intensity = 1.0f;
				int patternPos = (int)(p / (float)length1 * faceSize);
				if (patternPos < 0)
					patternPos = 0;
				if (patternPos >= (int)faceSize)
					patternPos = faceSize - 1;
				uint32_t src = pattern1[patternPos];
				if (src != 0) {
					uint8_t r = (src >> 16) & 0xFF;
					uint8_t g = (src >> 8) & 0xFF;
					uint8_t b = src & 0xFF;
					pixels[startPos + p] = ((uint32_t)(r * intensity) << 16) |
										   ((uint32_t)(g * intensity) << 8) |
										   (uint32_t)(b * intensity);
				}
			}
		}

		if (length2 > 0) {
			for (int p = 0; p < length2; p++) {
				float yFace = ((float)p / length2 - 0.5f) * faceSize;
				float y = yFace * cosA;
				float rawIntensity = (y + maxY) / (2.0f * maxY);
				float intensity = 1.0f - rawIntensity;
				if (intensity < 0.0f)
					intensity = 0.0f;
				if (intensity > 1.0f)
					intensity = 1.0f;
				int patternPos = (int)(p / (float)length2 * faceSize);
				if (patternPos < 0)
					patternPos = 0;
				if (patternPos >= (int)faceSize)
					patternPos = faceSize - 1;
				uint32_t src = pattern2[patternPos];
				if (src != 0) {
					uint8_t r = (src >> 16) & 0xFF;
					uint8_t g = (src >> 8) & 0xFF;
					uint8_t b = src & 0xFF;
					pixels[startPos + length1 + p] = ((uint32_t)(r * intensity) << 16) |
													 ((uint32_t)(g * intensity) << 8) |
													 (uint32_t)(b * intensity);
				}
			}
		}
	}
};

class Shape2D : public virtual Shape {
public:
	float x;
	float z;
	Shape2D(Game* g, uint16_t size, Alignment align = Alignment::CENTER)
		: Shape(g, size, align) {
		x = 0.0f;
		z = 0.0f;
	}

	bool collides(float zPos, float xPos, World2D* world) {
		float radius = length / 2.0f;
		float dx = x - xPos;
		float dz = z - zPos;
		if (world->wrapsZ) {
			float halfZ = world->width * game->resolution / 2.0f;
			dz = fmodf(dz + halfZ, 2.0f * halfZ);
			if (dz < 0)
				dz += 2.0f * halfZ;
			dz -= halfZ;
		}
		if (world->wrapsX) {
			float halfX = world->depth * game->resolution / 2.0f;
			dx = fmodf(dx + halfX, 2.0f * halfX);
			if (dx < 0)
				dx += 2.0f * halfX;
			dx -= halfX;
		}
		return (dx * dx + dz * dz) < (radius * radius);
	}
};

class Square2D : public Square, public Shape2D {
public:
	Square2D(Game* g, uint32_t** f, uint8_t count, uint8_t size, bool inv = false)
		: Shape(g, (uint16_t)ceilf(size * sqrtf(2.0f)) + 1, Alignment::CENTER),
		  Square(g, f, count, size, inv),
		  Shape2D(g, (uint16_t)ceilf(size * sqrtf(2.0f)) + 1, Alignment::CENTER) {
	}

	virtual void update() override {
		Square::update();
	}
};

class BasePlayer {

public:
	Game* game;
	BasePlayer(Game* g = nullptr) {
		game = g;
	}
};

class BasePlayer1D : public BasePlayer {

public:
	float location;
	BasePlayer1D(Game* g = nullptr) : BasePlayer(g) {
		location = 0.0f;
	}

	float distance(float pos, World* world) {
		float d = location - pos;
		if (world->wraps) {
			float half = world->size * game->resolution / 2.0f;
			d = fmodf(d + half, 2.0f * half);
			if (d < 0)
				d += 2.0f * half;
			d -= half;
		}
		return fabsf(d);
	}
};

class BasePlayer2D : public BasePlayer {

public:
	float x;
	float z;
	float rotation;
	BasePlayer2D(Game* g = nullptr) : BasePlayer(g) {
		x = 0.0f;
		z = 0.0f;
		rotation = 0.0f;
	}

	float distance(float zPos, float xPos, World2D* world) {
		float dx = x - xPos;
		float dz = z - zPos;
		if (world->wrapsZ) {
			float halfZ = world->width * game->resolution / 2.0f;
			dz = fmodf(dz + halfZ, 2.0f * halfZ);
			if (dz < 0)
				dz += 2.0f * halfZ;
			dz -= halfZ;
		}
		if (world->wrapsX) {
			float halfX = world->depth * game->resolution / 2.0f;
			dx = fmodf(dx + halfX, 2.0f * halfX);
			if (dx < 0)
				dx += 2.0f * halfX;
			dx -= halfX;
		}
		return sqrtf(dx * dx + dz * dz);
	}

	float direction(float zPos, float xPos) {
		float dx = xPos - x;
		float dz = zPos - z;
		float angle = atan2f(dz, dx);
		float result = (angle / (2.0f * M_PI)) + 1.0f;
		while (result >= 1.0f)
			result -= 1.0f;
		while (result < 0.0f)
			result += 1.0f;
		return result;
	}
};

#endif
