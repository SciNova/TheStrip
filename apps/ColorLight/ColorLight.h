#ifndef COLORLIGHT_H
#define COLORLIGHT_H

#include "system.h"

#define FADE_DURATION 1

class ColorLight : public Game {
private:
	int mode;
	float level;
	float temperature;
	float hue;
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

	void modePressed() {
		mode = (mode == 0) ? 1 : 0;
	}

	void modeLeft() {
		if (mode == 0) {
			temperature -= 1.0f / 50.0f;
			if (temperature < 0.0f)
				temperature = 0.0f;
		} else {
			hue -= 1.0f / 360.0f;
			if (hue < 0.0f)
				hue += 1.0f;
		}
	}

	void modeRight() {
		if (mode == 0) {
			temperature += 1.0f / 50.0f;
			if (temperature > 1.0f)
				temperature = 1.0f;
		} else {
			hue += 1.0f / 360.0f;
			if (hue >= 1.0f)
				hue -= 1.0f;
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
	ColorLight() {}

	ColorLight(System* sys) {
		system = sys;
		resolution = sys->strip.length;
		pixels = sys->strip.pixels;
		audio = &sys->audio;
		name = "ColorLight";
		time = 0.0f;
		levelTime = 0.0f;
		level = 0;
		state = GameState::PLAY;
		delayTime = 0.0f;

		mode = 0;
		this->level = 0.5f;
		temperature = 0.5f;
		hue = 0.0f;
		fading = false;
		fadeStartTime = 0.0f;
		fadeStartLevel = 0.0f;
		fadeTargetLevel = 0.0f;
	}

	void loop() override {
		Game::loop();
		updateFade();

		if (level <= 0.0f) {
			clear();
			return;
		}

		uint32_t color;
		if (mode == 0) {
			float coolR = 0.8f, coolG = 0.8f, coolB = 1.0f;
			float warmR = 1.0f, warmG = 0.6f, warmB = 0.2f;
			float t = temperature;
			float r = (coolR + t * (warmR - coolR)) * level;
			float g = (coolG + t * (warmG - coolG)) * level;
			float b = (coolB + t * (warmB - coolB)) * level;
			uint8_t r8 = (uint8_t)(r * 255.0f);
			uint8_t g8 = (uint8_t)(g * 255.0f);
			uint8_t b8 = (uint8_t)(b * 255.0f);
			color = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
		} else {
			color = hsv_to_rgb(hue, 1.0f, level);
		}

		for (uint16_t i = 0; i < resolution; i++)
			pixels[i] = color;
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;

		switch (event->action) {
			case Action::FIRE_PRESS:
			case Action::B_PRESS:
				levelPressed();
				break;
			case Action::FIRE2_PRESS:
				modePressed();
				break;
			case Action::A_PRESS:
			case Action::DOWN_PRESS:
				levelLeft();
				break;
			case Action::C_PRESS:
			case Action::UP_PRESS:
				levelRight();
				break;
			case Action::LEFT_PRESS:
				modeLeft();
				break;
			case Action::RIGHT_PRESS:
				modeRight();
				break;
			case Action::ENCODER_LEFT:
				levelLeft();
				break;
			case Action::ENCODER_RIGHT:
				levelRight();
				break;
			case Action::ENCODER2_LEFT:
				modeLeft();
				break;
			case Action::ENCODER2_RIGHT:
				modeRight();
				break;
			default:
				break;
		}
	}
};

#endif
