#ifndef WHITELIGHT_H
#define WHITELIGHT_H

#include "system.h"

#define FADE_DURATION 1

class WhiteLight : public Game {
private:
	float level;
	bool fading;
	float fadeStartTime;
	float fadeStartLevel;
	float fadeTargetLevel;

	void levelLeft() {
		fading = false;
		level -= 1.0f / 100.0f;
		if (level < 0.0f)
			level = 0.0f;
	}

	void levelRight() {
		fading = false;
		level += 1.0f / 100.0f;
		if (level > 1.0f)
			level = 1.0f;
	}

	void levelPressed() {
		float now = system->clock.time;
		if (fading) {
			fadeStartLevel = level;
			fadeTargetLevel = (fadeTargetLevel == 1.0f) ? 0.0f : 1.0f;
			fadeStartTime = now;
		} else {
			fading = true;
			fadeStartTime = now;
			fadeStartLevel = level;
			fadeTargetLevel = (level < 1.0f) ? 1.0f : 0.0f;
		}
	}

	void updateFade() {
		if (!fading)
			return;
		float now = system->clock.time;
		float elapsed = now - fadeStartTime;
		if (elapsed >= FADE_DURATION) {
			level = fadeTargetLevel;
			fading = false;
		} else {
			float t = elapsed / FADE_DURATION;
			level = fadeStartLevel + (fadeTargetLevel - fadeStartLevel) * t;
		}
	}

public:
	WhiteLight() {}

	WhiteLight(System* sys) {
		system = sys;
		resolution = sys->strip.length;
		pixels = sys->strip.pixels;
		audio = &sys->audio;
		name = "WhiteLight";
		time = 0.0f;
		levelTime = 0.0f;
		level = 0;
		state = GameState::PLAY;
		delayTime = 0.0f;

		level = 0.5f;
		fading = false;
		fadeStartTime = 0.0f;
		fadeStartLevel = 0.0f;
		fadeTargetLevel = 0.0f;
	}

	void loop() override {
		Game::loop();
		updateFade();

		uint8_t brightness = (uint8_t)(level * 255.0f);
		uint32_t color = ((uint32_t)brightness << 16) | ((uint32_t)brightness << 8) | brightness;
		for (uint16_t i = 0; i < resolution; i++)
			pixels[i] = color;
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;

		switch (event->action) {
			case Action::FIRE_PRESS:
			case Action::FIRE2_PRESS:
			case Action::B_PRESS:
				levelPressed();
				break;
			case Action::A_PRESS:
			case Action::DOWN_PRESS:
			case Action::LEFT_PRESS:
				levelLeft();
				break;
			case Action::C_PRESS:
			case Action::UP_PRESS:
			case Action::RIGHT_PRESS:
				levelRight();
				break;
			case Action::ENCODER_LEFT:
				levelLeft();
				break;
			case Action::ENCODER_RIGHT:
				levelRight();
				break;
			default:
				break;
		}
	}
};

#endif
