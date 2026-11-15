#ifndef SLOTS_H
#define SLOTS_H

#include <stdlib.h>
#include <math.h>
#include "system.h"
#include "graphics.h"

#define WHEEL_NUM_SYMBOLS 8
#define SLOTS_NUM_WHEELS 3
#define SLOTS_DECELERATION 15.0f
#define SLOTS_MIN_SPEED 10.0f
#define SLOTS_MAX_SPEED 40.0f
#define SLOTS_MIN_SPIN_DURATION 2.0f
#define SLOTS_MAX_SPIN_DURATION 5.0f

enum Fruit {
	FRUIT_APPLE = 0,
	FRUIT_BANANA,
	FRUIT_GRAPE,
	FRUIT_ORANGE,
	FRUIT_CHERRY,
	FRUIT_LEMON,
	FRUIT_WATERMELON,
	FRUIT_BLACKBERRY,
	FRUIT_STRAWBERRY
};

static const float FRUIT_SIZE[] = {
	0.3f, 0.7f, 0.6f, 0.6f, 0.4f, 0.5f, 0.8f, 0.2f, 0.45f
};

static const uint32_t FRUIT_COLOR[] = {
	(uint32_t)Color::GREEN,
	(uint32_t)Color::BANANA,
	(uint32_t)Color::PURPLE,
	(uint32_t)Color::ORANGE,
	(uint32_t)Color::RED,
	(uint32_t)Color::LEMON,
	(uint32_t)Color::WATERMELON,
	(uint32_t)Color::BLACKBERRY,
	(uint32_t)Color::STRAWBERRY
};

static const uint8_t WHEEL_SYMBOLS[SLOTS_NUM_WHEELS][WHEEL_NUM_SYMBOLS] = {
	{ FRUIT_CHERRY, FRUIT_LEMON, FRUIT_ORANGE, FRUIT_BANANA, FRUIT_CHERRY, FRUIT_LEMON, FRUIT_WATERMELON, FRUIT_ORANGE },
	{ FRUIT_BANANA, FRUIT_CHERRY, FRUIT_LEMON, FRUIT_ORANGE, FRUIT_CHERRY, FRUIT_WATERMELON, FRUIT_LEMON, FRUIT_ORANGE },
	{ FRUIT_LEMON, FRUIT_ORANGE, FRUIT_CHERRY, FRUIT_WATERMELON, FRUIT_LEMON, FRUIT_ORANGE, FRUIT_BANANA, FRUIT_CHERRY }
};

enum SlotsStage {
	IDLE,
	SPINNING,
	RESULT
};

class Wheel : public Shape {
public:
	const uint8_t* symbols;
	float speed;
	float spinEndTime;
	float prevRotation;

	Wheel() {}

	Wheel(Game* g, uint16_t size, const uint8_t* syms)
		: Shape(g, size, Alignment::CENTER) {
		symbols = syms;
		speed = 0.0f;
		spinEndTime = 0.0f;
		prevRotation = rotation;
	}

	void tick(float dt, float currentTime) {
		prevRotation = rotation;

		if (speed > 0.0f) {
			if (currentTime >= spinEndTime) {
				speed -= SLOTS_DECELERATION * dt;
				if (speed <= 0.0f) {
					speed = 0.0f;
					rotation = roundf(rotation);
				}
			}
			rotation += speed * dt;
			while (rotation >= WHEEL_NUM_SYMBOLS)
				rotation -= WHEEL_NUM_SYMBOLS;
			while (rotation < 0.0f)
				rotation += WHEEL_NUM_SYMBOLS;

			if ((int)rotation != (int)prevRotation)
				game->audio->play(Sound::TICK);
		}

		const float slotAngle = 2.0f * M_PI / WHEEL_NUM_SYMBOLS;
		const float wheelAngle = rotation * slotAngle + slotAngle / 2.0f;
		const uint16_t S = length;

		for (uint16_t j = 0; j < S; j++) {
			float t = (j + 0.5f) / S;
			float theta = (t - 0.5f) * M_PI;
			float absoluteAngle = theta + wheelAngle;

			absoluteAngle = fmodf(absoluteAngle, 2.0f * M_PI);
			if (absoluteAngle < 0.0f)
				absoluteAngle += 2.0f * M_PI;

			int slotIndex = (int)(absoluteAngle / slotAngle) % WHEEL_NUM_SYMBOLS;
			float localAngle = fmodf(absoluteAngle, slotAngle);

			Fruit fruit = (Fruit)symbols[slotIndex];
			float fruitAngularSpan = FRUIT_SIZE[fruit] * slotAngle;
			float fruitStart = (slotAngle - fruitAngularSpan) / 2.0f;
			float fruitEnd   = (slotAngle + fruitAngularSpan) / 2.0f;

			uint32_t pixelColor;
			if (fruitStart <= localAngle && localAngle <= fruitEnd)
				pixelColor = FRUIT_COLOR[fruit];
			else
				pixelColor = (uint32_t)Color::SILVER;

			float brightness = 1.0f - ((t - 0.5f) * 2.0f) * ((t - 0.5f) * 2.0f);
			uint8_t r = (uint8_t)(((pixelColor >> 16) & 0xFF) * brightness);
			uint8_t g = (uint8_t)(((pixelColor >> 8)  & 0xFF) * brightness);
			uint8_t b = (uint8_t)(( pixelColor        & 0xFF) * brightness);
			pixels[j] = ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
		}
	}
};

class Slots : public Game {
private:
	Wheel wheels[SLOTS_NUM_WHEELS];
	SlotsStage stage;
	uint16_t segmentPixels;
	uint16_t offset;

	void spin() {
		float now = time;
		for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
			Wheel* w = &wheels[i];
			w->speed = SLOTS_MIN_SPEED + ((float)rand() / RAND_MAX) * (SLOTS_MAX_SPEED - SLOTS_MIN_SPEED);
			w->spinEndTime = now + SLOTS_MIN_SPIN_DURATION +
			                 ((float)rand() / RAND_MAX) * (SLOTS_MAX_SPIN_DURATION - SLOTS_MIN_SPIN_DURATION);
		}
		stage = SPINNING;
	}

	void evaluate() {
		Fruit centreFruits[SLOTS_NUM_WHEELS];
		for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
			int idx = (int)roundf(wheels[i].rotation) % WHEEL_NUM_SYMBOLS;
			centreFruits[i] = (Fruit)WHEEL_SYMBOLS[i][idx];
		}

		if (centreFruits[0] == centreFruits[1] && centreFruits[1] == centreFruits[2])
			audio->play(Sound::LEVEL_COMPLETE);
		else
			audio->play(Sound::LEVEL_FAIL);

		delay(4.0f);
		stage = IDLE;
	}

	void render() {
		clear();
		for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
			int segmentStart = offset + i * segmentPixels;
			float centre = segmentStart + (segmentPixels - 1) / 2.0f;
			wheels[i].render(centre, EdgeMode::CLIP, 1.0f);
		}
	}

public:
	Slots() {}

	Slots(System* sys) {
		system = sys;
		resolution = sys->strip.length;
		pixels = sys->strip.pixels;
		audio = &sys->audio;
		name = "Slots";
		time = 0.0f;
		levelTime = 0.0f;
		level = 0;
		state = GameState::PLAY;
		delayTime = 0.0f;

		segmentPixels = resolution / SLOTS_NUM_WHEELS;
		if (segmentPixels % 2 == 0)
			segmentPixels--;
		offset = (resolution - segmentPixels * SLOTS_NUM_WHEELS) / 2;

		for (int i = 0; i < SLOTS_NUM_WHEELS; i++)
			wheels[i] = Wheel(this, segmentPixels, WHEEL_SYMBOLS[i]);

		stage = IDLE;
	}

	void loop() override {
		Game::loop();
		if (delayTime > 0.0f) {
			render();
			return;
		}

		float dt = system->clock.delta;

		for (int i = 0; i < SLOTS_NUM_WHEELS; i++)
			wheels[i].tick(dt, time);

		if (stage == SPINNING) {
			bool allStopped = true;
			for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
				if (wheels[i].speed != 0.0f) {
					allStopped = false;
					break;
				}
			}
			if (allStopped) {
				stage = RESULT;
				evaluate();
			}
		}

		render();
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;
		if (stage == IDLE && isGameButtonPress(event->action))
			spin();
	}
};

#endif
