#ifndef FLAPPYBIRD_H
#define FLAPPYBIRD_H

#include <stdlib.h>
#include "system.h"

class Bird {
public:
	float position;
	float speed;

	Bird() {
		position = 0.0f;
		speed = 0.0f;
	}

	void boost() {
		speed = 20.0f;
	}

	void update(float dt, float maxPos) {
		speed -= 20.0f * dt;
		position += speed * dt;
		if (position < 0.0f)
			position = 0.0f;
		if (position > maxPos)
			position = maxPos;
	}
};

class Terrain {
public:
	float height;
	float baseHeight;
	float fluctuation;
	float speed;

	Terrain() {
		height = 0.0f;
		baseHeight = 0.0f;
		fluctuation = 0.0f;
		speed = 0.0f;
	}

	void update(float dt, float resolution) {
		float maxChange = speed * resolution * dt;
		float step = ((float)rand() / RAND_MAX * 2.0f - 1.0f) * maxChange;
		height += step;
		float minHeight = baseHeight - fluctuation * resolution;
		float maxHeight = baseHeight + fluctuation * resolution;
		if (height < minHeight)
			height = minHeight;
		if (height > maxHeight)
			height = maxHeight;
	}
};

class FlappyBird : public Game {
private:
	Bird bird;
	Terrain topTerrain;
	Terrain bottomTerrain;
	float gap;
	float gapPosition;
	float fluctuation;

public:
	FlappyBird() {}

	FlappyBird(System* sys) {
		system = sys;
		resolution = sys->strip.length;
		pixels = sys->strip.pixels;
		audio = &sys->audio;
		name = "FlappyBird";
		time = 0.0f;
		levelTime = 0.0f;
		level = 0;
		state = GameState::PLAY;
		delayTime = 0.0f;

		bird.position = resolution / 2.0f;
		bird.speed = 0.0f;

		topTerrain.height = 0.0f;
		topTerrain.baseHeight = 0.0f;
		topTerrain.fluctuation = 0.0f;
		topTerrain.speed = 0.0f;

		bottomTerrain.height = 0.0f;
		bottomTerrain.baseHeight = 0.0f;
		bottomTerrain.fluctuation = 0.0f;
		bottomTerrain.speed = 0.0f;

		gap = 0.5f;
		gapPosition = 0.5f;
		fluctuation = 0.1f;
	}

	void loop() override {
		Game::loop();

		float dt = system->clock.delta;
		float t = time / 60.0f;
		if (t > 1.0f)
			t = 1.0f;

		gap = 0.5f - (0.5f - 0.2f) * t;
		fluctuation = 0.0f + (0.3f - 0.0f) * t;

		topTerrain.fluctuation = 0.0f + (0.15f - 0.0f) * t;
		bottomTerrain.fluctuation = topTerrain.fluctuation;

		topTerrain.speed = 0.1f + (1.0f - 0.1f) * t;
		bottomTerrain.speed = topTerrain.speed;

		float gapCenter = gapPosition * resolution;
		float gapSize = gap * resolution;

		topTerrain.baseHeight = resolution - (gapCenter + gapSize / 2.0f);
		bottomTerrain.baseHeight = gapCenter - gapSize / 2.0f;

		topTerrain.update(dt, resolution);
		bottomTerrain.update(dt, resolution);
		bird.update(dt, resolution - 1.0f);

		for (uint16_t i = 0; i < resolution; i++)
			pixels[i] = 0x00007F;

		int topHeight = (int)(topTerrain.height + 0.5f);
		for (int i = 0; i < topHeight; i++)
			pixels[resolution - 1 - i] = (uint32_t)Color::RED;

		int bottomHeight = (int)(bottomTerrain.height + 0.5f);
		for (int i = 0; i < bottomHeight; i++)
			pixels[i] = (uint32_t)Color::RED;

		int birdIdx = (int)(bird.position + 0.5f);
		pixels[birdIdx] = (uint32_t)Color::YELLOW;
	}

	void buildStage() override {
		// no levels
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;

		if (isGameButtonPress(event->action))
			bird.boost();
	}
};

#endif
