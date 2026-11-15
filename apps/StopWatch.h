#ifndef DICESCLOCK_H
#define DICESCLOCK_H

#include <math.h>
#include "system.h"
#include "graphics.h"

static const uint32_t DIGIT_PATTERNS[10][22] = {
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN
	},
	{
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN,
		(uint32_t)Color::OFF,
		(uint32_t)Color::GREEN
	}
};

static uint32_t* DIGIT_ROWS[10];

class StopWatch : public Game {
private:
	Square* cubes[3];
	int lastSecond;
	bool showColon;

	void setDigit(int cubeIndex, int digit) {
		cubes[cubeIndex]->rotation = (float)digit / 10.0f;
		cubes[cubeIndex]->update();
	}

	void updateDisplay() {
		int totalSeconds = (int)time;
		int minutes = (totalSeconds / 60) % 10;
		int seconds = totalSeconds % 60;
		int tens = seconds / 10;
		int ones = seconds % 10;
		setDigit(0, minutes);
		setDigit(1, tens);
		setDigit(2, ones);
	}

public:
	StopWatch() {}

	StopWatch(System* sys)
		: Game(sys) {
		for (int i = 0; i < 10; i++)
			DIGIT_ROWS[i] = (uint32_t*)DIGIT_PATTERNS[i];
		for (int i = 0; i < 3; i++)
			cubes[i] = new Square(this, DIGIT_ROWS, 10, 22, false);
		lastSecond = -1;
		showColon = true;
		updateDisplay();
	}

	~StopWatch() {
		for (int i = 0; i < 3; i++)
			delete cubes[i];
	}

	void loop() override {
		Game::loop();

		int currentSecond = (int)time;
		if (currentSecond != lastSecond) {
			lastSecond = currentSecond;
			showColon = !showColon;
			updateDisplay();
			audio->play(Sound::TICK);
		}

		clear();

		uint16_t cubeWidth = cubes[0]->length;
		uint16_t spacing = 1;
		uint16_t colonGap = 3;
		uint16_t groupWidth = (3 * cubeWidth) + spacing + colonGap;
		int leftEdge = ((int)resolution - (int)groupWidth) / 2;

		int pos = leftEdge + cubeWidth / 2;
		cubes[0]->render((float)pos, EdgeMode::CLIP, 1.0f);

		pos += cubeWidth + colonGap;
		cubes[1]->render((float)pos, EdgeMode::CLIP, 1.0f);

		pos += cubeWidth + spacing;
		cubes[2]->render((float)pos, EdgeMode::CLIP, 1.0f);

		if (showColon) {
			int colonX = leftEdge + cubeWidth + colonGap / 2;
			if (colonX >= 0 && colonX < (int)resolution)
				pixels[colonX] = (uint32_t)Color::WHITE;
			if (colonX + 1 < (int)resolution)
				pixels[colonX + 1] = (uint32_t)Color::WHITE;
		}
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;
		(void)event;
	}
};

#endif
