#ifndef RACE_H
#define RACE_H

#include "system.h"
#include "graphics.h"

class RacePlayer : public Shape {
public:
	static constexpr float TRAIL = 1.0f / 8.0f;
	static constexpr float TICK = 1.0f / 12.0f;
	static constexpr float CHECKPOINT = 2.0f;

	float location;
	float speed;
	float trailSpeed;
	bool reverse;
	float travel;
	uint32_t color;

	float BOOST;
	float FRICTION;
	float TRAIL_FRICTION;
	float MAX_SPEED;
	uint16_t TRAIL_LENGTH;

	RacePlayer() {}

	RacePlayer(Game* g, uint32_t col)
		: Shape(g, (uint16_t)(g->resolution * TRAIL), Alignment::BACKWARD),
		  location(g->resolution / 2.0f),
		  speed(0.0f),
		  trailSpeed(0.0f),
		  reverse(false),
		  travel(0.0f),
		  color(col) {
		BOOST = 0.5f * g->resolution;
		FRICTION = 3.75f;
		TRAIL_FRICTION = 2.5f;
		MAX_SPEED = 1.5f * g->resolution;
		TRAIL_LENGTH = (uint16_t)(g->resolution * TRAIL);
	}

	void tick(float dt) {
		float oldLocation = location;

		speed *= (1.0f - FRICTION * dt);
		if (speed < 0.0f)
			speed = 0.0f;
		location += speed * (reverse ? -1.0f : 1.0f) * dt;

		if (location < 0.0f) {
			location = -location;
			reverse = !reverse;
		} else if (location >= (float)game->resolution) {
			location = 2.0f * ((float)game->resolution - 1.0f) - location;
			reverse = !reverse;
		}

		float prevTravel = travel;
		travel += fabsf(location - oldLocation);

		uint32_t prevTick = (uint32_t)(prevTravel / (game->resolution * TICK));
		uint32_t currTick = (uint32_t)(travel / (game->resolution * TICK));
		if (prevTick != currTick)
			game->audio->play(Sound::TICK);

		uint32_t prevCheck = (uint32_t)(prevTravel / (game->resolution * CHECKPOINT));
		uint32_t currCheck = (uint32_t)(travel / (game->resolution * CHECKPOINT));
		if (prevCheck != currCheck)
			game->audio->play(Sound::CHECKPOINT);

		alignment = reverse ? Alignment::FORWARD : Alignment::BACKWARD;

		trailSpeed *= (1.0f - TRAIL_FRICTION * dt);
		if (trailSpeed < 0.0f)
			trailSpeed = 0.0f;

		float frac = trailSpeed / BOOST;
		if (frac > 1.0f)
			frac = 1.0f;
		uint16_t trailPixels = 1 + (uint16_t)(frac * (TRAIL_LENGTH - 1));

		uint8_t baseR = (color >> 16) & 0xFF;
		uint8_t baseG = (color >> 8)  & 0xFF;
		uint8_t baseB = color         & 0xFF;

		for (uint16_t j = 0; j < TRAIL_LENGTH; j++) {
			if (j < trailPixels) {
				float intensity;
				if (trailPixels == 1)
					intensity = 1.0f;
				else
					intensity = 1.0f - (128.0f / 255.0f) * ((float)j / (float)(trailPixels - 1));
				pixels[j] = ((uint32_t)(baseR * intensity) << 16) |
				            ((uint32_t)(baseG * intensity) << 8)  |
				            (uint32_t)(baseB * intensity);
			} else {
				pixels[j] = 0;
			}
		}
	}

	void boost() {
		speed += BOOST;
		if (speed > MAX_SPEED)
			speed = MAX_SPEED;
		trailSpeed = speed;
	}
};

enum class RaceStage {
	PLAYING,
	RESULT
};

class Race : public Game {
private:
	static constexpr float TOTAL_LAPS = 10.0f;

	RacePlayer playerA;
	RacePlayer playerB;
	RaceStage stage;

	void drawProgressBar(float scoreA, float scoreB) {
		uint16_t half = resolution / 2;
		uint32_t barColor = 0x3C3C00;

		uint16_t lengthA = (uint16_t)(scoreA * half);
		if (lengthA > half)
			lengthA = half;
		for (uint16_t i = 0; i < lengthA; i++)
			pixels[i] = barColor;

		uint16_t lengthB = (uint16_t)(scoreB * half);
		if (lengthB > half)
			lengthB = half;
		for (uint16_t i = 0; i < lengthB; i++)
			pixels[resolution - 1 - i] = barColor;

		uint16_t centerLeft = resolution / 2 - 1;
		uint16_t centerRight = resolution / 2;
		if (centerLeft < resolution)
			pixels[centerLeft] = barColor;
		if (centerRight < resolution)
			pixels[centerRight] = barColor;
	}

	void drawResultBars() {
		uint16_t half = resolution / 2;
		float targetTravel = TOTAL_LAPS * 2.0f * resolution;
		bool aWon = playerA.travel >= targetTravel;
		bool bWon = playerB.travel >= targetTravel;

		uint32_t colA = balanceColors(playerA.color);
		uint32_t colB = balanceColors(playerB.color);

		if (aWon && !bWon) {
			for (uint16_t i = 0; i < half; i++)
				pixels[i] = colA;
		} else if (bWon && !aWon) {
			for (uint16_t i = half; i < resolution; i++)
				pixels[i] = colB;
		} else {
			for (uint16_t i = 0; i < half; i++)
				pixels[i] = colA;
			for (uint16_t i = half; i < resolution; i++)
				pixels[i] = colB;
		}
	}

public:
	Race() {}

	Race(System* sys)
		: Game(sys),
		  playerA(this, (uint32_t)Color::RED),
		  playerB(this, (uint32_t)Color::BLUE),
		  stage(RaceStage::PLAYING) {
		name = "Race";
	}

	void loop() override {
		Game::loop();
		float dt = system->clock.delta;

		if (stage == RaceStage::PLAYING) {
			if (delayTime > 0.0f)
				return;

			playerA.tick(dt);
			playerB.tick(dt);

			float targetTravel = TOTAL_LAPS * 2.0f * resolution;
			float scoreA = playerA.travel / targetTravel;
			float scoreB = playerB.travel / targetTravel;

			if (scoreA >= 1.0f || scoreB >= 1.0f) {
				stage = RaceStage::RESULT;
				audio->play(Sound::LEVEL_COMPLETE);
				delay(4.0f);
			}

			clear();
			drawProgressBar(scoreA, scoreB);
			playerA.render(playerA.location, EdgeMode::MIRROR, 1.0f);
			playerB.render(playerB.location, EdgeMode::MIRROR, 1.0f);

		} else if (stage == RaceStage::RESULT) {
			if (delayTime <= 0.0f) {
				playerA = RacePlayer(this, (uint32_t)Color::RED);
				playerB = RacePlayer(this, (uint32_t)Color::BLUE);
				stage = RaceStage::PLAYING;
			} else {
				clear();
				drawResultBars();
			}
		}
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		if (stage != RaceStage::PLAYING)
			return;
		if (padId == 0 && event->action == Action::A_PRESS)
			playerA.boost();
		else if (padId == 1 && event->action == Action::C_PRESS)
			playerB.boost();
	}
};

#endif
