#ifndef DINO_H
#define DINO_H

#include "system.h"

class DinoPlayer {
public:
	float height;
	float speed;
	bool jumping;

	DinoPlayer() {
		height = 0.0f;
		speed = 0.0f;
		jumping = false;
	}

	void jump() {
		if (!jumping) {
			jumping = true;
			speed = 2.828f;
		}
	}

	void update(float dt) {
		if (jumping) {
			speed -= 4.0f * dt;
			height += speed * dt;
			if (height <= 0.0f) {
				height = 0.0f;
				speed = 0.0f;
				jumping = false;
			}
		}
	}

	uint32_t render() {
		int size = 3 + (int)(height * 12.0f);
		if (size % 2 == 0)
			size++;
		float t = height;
		uint8_t r = (uint8_t)(0x00 + (0x00 - 0x00) * t);
		uint8_t g = (uint8_t)(0x99 + (0xFF - 0x99) * t);
		uint8_t b = (uint8_t)(0x00 + (0x00 - 0x00) * t);
		return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
	}

	int size() {
		int s = 3 + (int)(height * 12.0f);
		if (s % 2 == 0)
			s++;
		return s;
	}
};

class Obstacle {
public:
	float height;

	Obstacle() {
		height = 0.0f;
	}

	Obstacle(float h) {
		height = h;
	}

	uint32_t render() {
		int size = 1 + (int)(height * 14.0f);
		if (size % 2 == 0)
			size++;
		float t = height;
		uint8_t r = (uint8_t)(0x99 + (0xCC - 0x99) * t);
		uint8_t g = (uint8_t)(0x99 + (0xCC - 0x99) * t);
		uint8_t b = (uint8_t)(0x99 + (0xCC - 0x99) * t);
		return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
	}

	int size() {
		int s = 1 + (int)(height * 14.0f);
		if (s % 2 == 0)
			s++;
		return s;
	}
};

class Dino : public Game {
private:
	static constexpr int MIN_GAP = 50;
	static constexpr int MAX_GAP = 70;
	static constexpr float MIN_HEIGHT = 0.1f;
	static constexpr float MAX_HEIGHT = 0.5f;
	static constexpr float SPEED = 30.0f;

	DinoPlayer player;
	Obstacle** obstacles;
	int gap;
	float positionRemainder;

public:
	Dino() {}

	Dino(System* sys)
		: Game(sys) {
		name = "Dino";
		obstacles = new Obstacle*[resolution];
		for (uint16_t i = 0; i < resolution; i++)
			obstacles[i] = nullptr;
		gap = 0;
		positionRemainder = 0.0f;
	}

	~Dino() {
		for (uint16_t i = 0; i < resolution; i++)
			if (obstacles[i] != nullptr)
				delete obstacles[i];
		delete[] obstacles;
	}

	void loop() override {
		Game::loop();
		player.update(system->clock.delta);

		float dt = system->clock.delta;
		positionRemainder += SPEED * dt;
		int steps = (int)positionRemainder;
		positionRemainder -= steps;

		for (int s = 0; s < steps; s++) {
			if (obstacles[0] != nullptr)
				delete obstacles[0];
			for (uint16_t i = 0; i < resolution - 1; i++)
				obstacles[i] = obstacles[i + 1];
			obstacles[resolution - 1] = nullptr;

			gap--;
			if (gap <= 0) {
				float h = MIN_HEIGHT + ((float)rand() / RAND_MAX) * (MAX_HEIGHT - MIN_HEIGHT);
				obstacles[resolution - 1] = new Obstacle(h);
				gap = MIN_GAP + rand() % (MAX_GAP - MIN_GAP + 1);
			}
		}

		clear();

		for (uint16_t i = 0; i < resolution; i++) {
			Obstacle* obs = obstacles[i];
			if (obs == nullptr)
				continue;

			uint32_t obsColor = obs->render();
			int obsSize = obs->size();
			int offset = obsSize / 2;

			for (int j = 0; j < obsSize; j++) {
				int stripPos = i - offset + j;
				if (stripPos >= 0 && stripPos < (int)resolution)
					pixels[stripPos] = obsColor;
			}

			uint16_t center = resolution / 2;
			int shadowLength = (int)(abs((int)i - center) * obsSize / center);
			if (shadowLength > 0) {
				uint32_t shadowColor = (uint32_t)Color::DARK_GRAY;
				if (i < center) {
					int start = i + offset + 1;
					for (int k = 0; k < shadowLength; k++) {
						int pos = start + k;
						if (pos >= 0 && pos < (int)resolution)
							pixels[pos] = shadowColor;
					}
				} else {
					int start = i - offset - shadowLength;
					for (int k = 0; k < shadowLength; k++) {
						int pos = start + k;
						if (pos >= 0 && pos < (int)resolution)
							pixels[pos] = shadowColor;
					}
				}
			}
		}

		uint32_t playerColor = player.render();
		int playerSize = player.size();
		int offset = playerSize / 2;
		int centerPos = (int)(resolution * 0.3f);

		for (int j = 0; j < playerSize; j++) {
			int stripPos = centerPos - offset + j;
			if (stripPos >= 0 && stripPos < (int)resolution)
				pixels[stripPos] = playerColor;
		}
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;
		if (isGameButtonPress(event->action))
			player.jump();
	}
};

#endif
