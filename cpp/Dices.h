#ifndef DICES_H
#define DICES_H

#include <stdlib.h>
#include "system.h"
#include "graphics.h"

static const uint32_t FACES[6][15] = {
	{
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE
	},
	{
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE
	},
	{
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE
	},
	{
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE
	},
	{
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE
	},
	{
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE,
		(uint32_t)Color::OFF,
		(uint32_t)Color::WHITE
	}
};

static uint32_t* FACE_ROWS[6];

class Dice : public Square {
public:
	Dice() {
		faces = FACE_ROWS;
	}

	Dice(Game* g) : Square(g, nullptr, 6, 15, false) {
		faces = FACE_ROWS;
	}
};

enum class DiceStage {
	IDLE,
	ROLLING
};

class Dices : public Game {
private:
	static constexpr float MIN_SPEED = 4.0f;
	static constexpr float MAX_SPEED = 10.0f;
	static constexpr float MIN_DURATION = 0.5f;
	static constexpr float MAX_DURATION = 2.0f;
	static constexpr float DECELERATION = 6.0f;

	Dice dice1;
	Dice dice2;
	DiceStage stage;
	float speed1;
	float speed2;
	float remaining1;
	float remaining2;
	int lastFace1;
	int lastFace2;

public:
	Dices() {}

	Dices(System* sys)
		: Game(sys),
		  dice1(this),
		  dice2(this) {
		for (int i = 0; i < 6; i++)
			FACE_ROWS[i] = (uint32_t*)FACES[i];
		name = "Dices";
		stage = DiceStage::IDLE;
		speed1 = 0.0f;
		speed2 = 0.0f;
		remaining1 = 0.0f;
		remaining2 = 0.0f;
		lastFace1 = (int)(dice1.rotation * 6);
		lastFace2 = (int)(dice2.rotation * 6);
	}

	void loop() override {
		Game::loop();
		float dt = system->clock.delta;

		if (stage == DiceStage::ROLLING) {
			if (remaining1 > 0.0f) {
				dice1.rotation = fmodf(dice1.rotation + speed1 * dt, 1.0f);
				remaining1 -= dt;
			} else if (speed1 > 0.0f) {
				speed1 -= DECELERATION * dt;
				if (speed1 <= 0.0f) {
					speed1 = 0.0f;
					dice1.rotation = roundf(dice1.rotation * 6) / 6.0f;
					audio->play(Sound::CHECKPOINT);
				} else {
					dice1.rotation = fmodf(dice1.rotation + speed1 * dt, 1.0f);
				}
			}

			int face1 = ((int)(dice1.rotation * 6)) % 6;
			if (face1 != lastFace1) {
				lastFace1 = face1;
				audio->play(Sound::TICK);
			}

			if (remaining2 > 0.0f) {
				dice2.rotation = fmodf(dice2.rotation + speed2 * dt, 1.0f);
				remaining2 -= dt;
			} else if (speed2 > 0.0f) {
				speed2 -= DECELERATION * dt;
				if (speed2 <= 0.0f) {
					speed2 = 0.0f;
					dice2.rotation = roundf(dice2.rotation * 6) / 6.0f;
					audio->play(Sound::CHECKPOINT);
				} else {
					dice2.rotation = fmodf(dice2.rotation + speed2 * dt, 1.0f);
				}
			}

			int face2 = ((int)(dice2.rotation * 6)) % 6;
			if (face2 != lastFace2) {
				lastFace2 = face2;
				audio->play(Sound::TICK);
			}

			if (speed1 == 0.0f && remaining1 <= 0.0f && speed2 == 0.0f && remaining2 <= 0.0f)
				stage = DiceStage::IDLE;
		}

		clear();
		for (uint16_t i = 0; i < resolution; i++)
			pixels[i] = (uint32_t)Color::DARK_GREEN;

		dice1.update();
		dice2.update();
		dice1.render((float)(resolution / 3), EdgeMode::MIRROR, 1.0f);
		dice2.render((float)(2 * resolution / 3), EdgeMode::MIRROR, 1.0f);
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;
		if (stage == DiceStage::IDLE && isGameButtonPress(event->action)) {
			speed1 = MIN_SPEED + ((float)rand() / RAND_MAX) * (MAX_SPEED - MIN_SPEED);
			speed2 = MIN_SPEED + ((float)rand() / RAND_MAX) * (MAX_SPEED - MIN_SPEED);
			remaining1 = MIN_DURATION + ((float)rand() / RAND_MAX) * (MAX_DURATION - MIN_DURATION);
			remaining2 = MIN_DURATION + ((float)rand() / RAND_MAX) * (MAX_DURATION - MIN_DURATION);
			stage = DiceStage::ROLLING;
		}
	}
};

#endif
