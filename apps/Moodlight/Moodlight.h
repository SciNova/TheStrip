#ifndef MOODLIGHT_H
#define MOODLIGHT_H

#include "system.h"
#include <math.h>

class Moodlight : public Game {
private:
	uint8_t activeTheme;
	float speed;
	float phase[3];

	void renderRainbow(float dt, float& phaseRef) {
		phaseRef += dt * speed;
		float p = phaseRef;
		const float PI2 = 3.1415926535f * 2.0f;
		const float third = PI2 / 3.0f;

		for (uint16_t i = 0; i < resolution; i++) {
			float pos = ((float)i / resolution + p) * PI2;
			float r = sinf(pos) * 127.5f + 127.5f;
			float g = sinf(pos + third) * 127.5f + 127.5f;
			float b = sinf(pos + 2.0f * third) * 127.5f + 127.5f;
			uint8_t r8 = (r > 255.0f) ? 255 : ((r < 0.0f) ? 0 : (uint8_t)r);
			uint8_t g8 = (g > 255.0f) ? 255 : ((g < 0.0f) ? 0 : (uint8_t)g);
			uint8_t b8 = (b > 255.0f) ? 255 : ((b < 0.0f) ? 0 : (uint8_t)b);
			pixels[i] = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
		}
	}

	void renderOcean(float dt, float& phaseRef) {
		phaseRef += dt * speed;
		float p = phaseRef;
		const float PI2 = 3.1415926535f * 2.0f;
		const float third = PI2 / 3.0f;

		for (uint16_t i = 0; i < resolution; i++) {
			float pos = ((float)i / resolution + p) * PI2;
			float r = sinf(pos) * 10.0f + 10.0f;
			float g = sinf(pos + third) * 50.0f + 50.0f;
			float b = sinf(pos + 2.0f * third) * 100.0f + 100.0f;
			uint8_t r8 = (r > 255.0f) ? 255 : ((r < 0.0f) ? 0 : (uint8_t)r);
			uint8_t g8 = (g > 255.0f) ? 255 : ((g < 0.0f) ? 0 : (uint8_t)g);
			uint8_t b8 = (b > 255.0f) ? 255 : ((b < 0.0f) ? 0 : (uint8_t)b);
			pixels[i] = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
		}
	}

	void renderFire(float dt, float& phaseRef) {
		phaseRef += dt * speed;
		float p = phaseRef;
		const float PI2 = 3.1415926535f * 2.0f;
		const float third = PI2 / 3.0f;

		for (uint16_t i = 0; i < resolution; i++) {
			float pos = ((float)i / resolution + p) * PI2;
			float r = sinf(pos) * 100.0f + 155.0f;
			float g = sinf(pos + third) * 30.0f + 30.0f;
			float b = sinf(pos + 2.0f * third) * 10.0f + 5.0f;
			uint8_t r8 = (r > 255.0f) ? 255 : ((r < 0.0f) ? 0 : (uint8_t)r);
			uint8_t g8 = (g > 255.0f) ? 255 : ((g < 0.0f) ? 0 : (uint8_t)g);
			uint8_t b8 = (b > 255.0f) ? 255 : ((b < 0.0f) ? 0 : (uint8_t)b);
			pixels[i] = ((uint32_t)r8 << 16) | ((uint32_t)g8 << 8) | b8;
		}
	}

public:
	Moodlight() {}

	Moodlight(System* sys) {
		system = sys;
		resolution = sys->strip.length;
		pixels = sys->strip.pixels;
		audio = &sys->audio;
		name = "Moodlight";
		time = 0.0f;
		levelTime = 0.0f;
		level = 0;
		state = GameState::PLAY;
		delayTime = 0.0f;

		activeTheme = 0;
		speed = 0.5f;
		phase[0] = 0.0f;
		phase[1] = 0.0f;
		phase[2] = 0.0f;
	}

	void loop() override {
		Game::loop();
		float dt = system->clock.delta;

		switch (activeTheme) {
			case 0:
				renderRainbow(dt, phase[0]);
				break;
			case 1:
				renderOcean(dt, phase[1]);
				break;
			case 2:
				renderFire(dt, phase[2]);
				break;
		}
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;

		switch (event->action) {
			case Action::A_PRESS:
				speed += 0.1f;
				if (speed > 2.0f)
					speed = 2.0f;
				break;
			case Action::B_PRESS:
				activeTheme = (activeTheme + 1) % 3;
				break;
			case Action::C_PRESS:
				speed -= 0.1f;
				if (speed < -2.0f)
					speed = -2.0f;
				break;
			default:
				break;
		}
	}
};

#endif