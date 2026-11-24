#ifndef SIMONSAYS_H
#define SIMONSAYS_H

#include <stdlib.h>
#include "system.h"

#define TOTAL_LEVELS 10
#define BEEP_DURATION 0.5f
#define ENTRY_DURATION 0.8f
#define INPUT_TIMEOUT 10.0f

enum SimonStage {
	STAGE_PLAYBACK,
	STAGE_INPUT,
	STAGE_RESULT,
	STAGE_LEVEL_FAIL,
	STAGE_LEVEL_COMPLETE,
	STAGE_COMPLETE
};

class SimonSays : public Game {
private:
	uint32_t sequence[TOTAL_LEVELS];
	SimonStage stage;
	uint8_t step;
	float inputStartTime;
	uint32_t inputColor;

	void display(uint32_t color) {
		uint16_t section = resolution / 4;
		for (uint16_t i = 0; i < section; i++) {
			pixels[i] = (uint32_t)Color::DARK_RED;
			pixels[i + section] = (uint32_t)Color::DARK_GREEN;
			pixels[i + 2 * section] = (uint32_t)Color::DARK_BLUE;
			pixels[i + 3 * section] = (uint32_t)Color::DARK_YELLOW;
		}
		if (color == 0)
			return;
		uint16_t start;
		if (color == (uint32_t)Color::RED)
			start = 0;
		else if (color == (uint32_t)Color::GREEN)
			start = section;
		else if (color == (uint32_t)Color::BLUE)
			start = 2 * section;
		else if (color == (uint32_t)Color::YELLOW)
			start = 3 * section;
		else
			return;
		for (uint16_t i = start; i < start + section; i++)
			pixels[i] = color;
	}

	void startLevel() {
		stage = STAGE_PLAYBACK;
		step = 1;
		inputStartTime = 0.0f;
		playLevel();
		display(sequence[0]);
		if (sequence[0] == (uint32_t)Color::RED)
			audio->play(Sound::SIMONSAYS2);
		else if (sequence[0] == (uint32_t)Color::GREEN)
			audio->play(Sound::SIMONSAYS1);
		else if (sequence[0] == (uint32_t)Color::BLUE)
			audio->play(Sound::SIMONSAYS4);
		else if (sequence[0] == (uint32_t)Color::YELLOW)
			audio->play(Sound::SIMONSAYS3);
	}

public:
	SimonSays() {}

	SimonSays(System* sys) {
		system = sys;
		resolution = sys->strip.length;
		pixels = sys->strip.pixels;
		audio = &sys->audio;
		name = "SimonSays";
		time = 0.0f;
		levelTime = 0.0f;
		level = 0;
		state = GameState::PLAY;
		delayTime = 0.0f;

		for (uint8_t i = 0; i < TOTAL_LEVELS; i++) {
			uint8_t r = random(4);
			if (r == 0)
				sequence[i] = (uint32_t)Color::RED;
			else if (r == 1)
				sequence[i] = (uint32_t)Color::GREEN;
			else if (r == 2)
				sequence[i] = (uint32_t)Color::BLUE;
			else
				sequence[i] = (uint32_t)Color::YELLOW;
		}

		stage = STAGE_PLAYBACK;
		step = 1;
		inputStartTime = 0.0f;
		inputColor = 0;

		startLevel();
	}

	void loop() override {
		Game::loop();
		if (delayTime > 0.0f)
			return;

		switch (stage) {
			case STAGE_PLAYBACK: {
				uint8_t lvl = level;
				float total = (lvl + 1) * ENTRY_DURATION;
				if (levelTime >= total) {
					display(0);
					stage = STAGE_INPUT;
					step = 1;
					inputStartTime = levelTime;
					return;
				}
				uint8_t curStep = (uint8_t)(levelTime / ENTRY_DURATION) + 1;
				float inStep = fmodf(levelTime, ENTRY_DURATION);
				if (inStep < BEEP_DURATION) {
					if (curStep != step) {
						step = curStep;
						uint32_t col = sequence[curStep - 1];
						display(col);
						if (col == (uint32_t)Color::RED)
							audio->play(Sound::SIMONSAYS2);
						else if (col == (uint32_t)Color::GREEN)
							audio->play(Sound::SIMONSAYS1);
						else if (col == (uint32_t)Color::BLUE)
							audio->play(Sound::SIMONSAYS4);
						else if (col == (uint32_t)Color::YELLOW)
							audio->play(Sound::SIMONSAYS3);
					}
				} else {
					display(0);
				}
				break;
			}
			case STAGE_INPUT: {
				if (levelTime - inputStartTime > INPUT_TIMEOUT) {
					audio->play(Sound::LEVEL_FAIL);
					delay(4.0f);
					stage = STAGE_LEVEL_FAIL;
				}
				break;
			}
			case STAGE_RESULT: {
				uint32_t expected = sequence[step - 1];
				if (inputColor == expected) {
					if (step == level + 1) {
						audio->play(Sound::LEVEL_COMPLETE);
						delay(4.0f);
						stage = STAGE_LEVEL_COMPLETE;
					} else {
						step++;
						stage = STAGE_INPUT;
						inputStartTime = levelTime;
						display(0);
					}
				} else {
					audio->play(Sound::LEVEL_FAIL);
					delay(4.0f);
					stage = STAGE_LEVEL_FAIL;
				}
				break;
			}
			case STAGE_LEVEL_FAIL: {
				startLevel();
				break;
			}
			case STAGE_LEVEL_COMPLETE: {
				nextLevel();
				if (level >= TOTAL_LEVELS) {
					stage = STAGE_COMPLETE;
					clear();
					audio->play(Sound::GAME_COMPLETE);
				} else {
					startLevel();
				}
				break;
			}
			case STAGE_COMPLETE: {
				break;
			}
		}
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;
		if (stage != STAGE_INPUT)
			return;
		if (delayTime > 0.0f)
			return;

		uint32_t color = 0;
		switch (event->action) {
			case Action::A_PRESS:
				color = (uint32_t)Color::RED;
				break;
			case Action::B_PRESS:
				color = (uint32_t)Color::GREEN;
				break;
			case Action::C_PRESS:
				color = (uint32_t)Color::BLUE;
				break;
			case Action::D_PRESS:
				color = (uint32_t)Color::YELLOW;
				break;
			default:
				return;
		}

		inputColor = color;
		display(color);
		if (color == (uint32_t)Color::RED)
			audio->play(Sound::SIMONSAYS2);
		else if (color == (uint32_t)Color::GREEN)
			audio->play(Sound::SIMONSAYS1);
		else if (color == (uint32_t)Color::BLUE)
			audio->play(Sound::SIMONSAYS4);
		else if (color == (uint32_t)Color::YELLOW)
			audio->play(Sound::SIMONSAYS3);

		delay(ENTRY_DURATION);
		stage = STAGE_RESULT;
	}
};

#endif
