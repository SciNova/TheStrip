#ifndef DEMOSCENE_H
#define DEMOSCENE_H

#include <stdlib.h>
#include <math.h>
#include "system.h"

enum DemoStage {
	STAGE_PLASMA,
	STAGE_INTERFERENCE,
	STAGE_FIREWORKS,
	STAGE_BOUNCING_BALLS
};

class Particle {
public:
	float position;
	float velocity;
	uint32_t color;
	float life;
	float age;

	Particle()
		: position(0), velocity(0), color(0), life(0), age(0) {}

	Particle(float pos, float vel, uint32_t col, float lifetime)
		: position(pos), velocity(vel), color(col), life(lifetime), age(0) {}

	bool update(float dt) {
		position += velocity * dt;
		age += dt;
		return age >= life;
	}

	float alpha() {
		float t = age / life;
		return 1.0f - t * t;
	}
};

class Firework {
public:
	float peakPosition;
	float riseTime;
	float burstRadius;
	float burstLife;
	float hue;
	float riseElapsed;
	float burstElapsed;
	bool bursted;
	Particle* particles;
	int particleCount;

	Firework()
		: peakPosition(0), riseTime(0), burstRadius(0), burstLife(0),
		  hue(0), riseElapsed(0), burstElapsed(0), bursted(false),
		  particles(nullptr), particleCount(0) {}

	Firework(uint16_t resolution)
		: peakPosition(10.0f + ((float)rand() / RAND_MAX) * (resolution - 20)),
		  riseTime(0.5f + ((float)rand() / RAND_MAX) * 1.0f),
		  burstRadius(5.0f + ((float)rand() / RAND_MAX) * 20.0f),
		  burstLife(0.3f + ((float)rand() / RAND_MAX) * 0.5f),
		  hue((float)rand() / RAND_MAX),
		  riseElapsed(0), burstElapsed(0), bursted(false),
		  particles(nullptr), particleCount(0) {}

	~Firework() {
		if (particles != nullptr)
			delete[] particles;
	}

	bool update(float dt, uint16_t stripLength) {
		if (!bursted) {
			riseElapsed += dt;
			if (riseElapsed >= riseTime) {
				riseElapsed = riseTime;
				bursted = true;
				explode(stripLength);
			}
			return true;
		}
		burstElapsed += dt;
		for (int i = 0; i < particleCount; i++)
			particles[i].update(dt);
		int alive = 0;
		for (int i = 0; i < particleCount; i++) {
			if (particles[i].age < particles[i].life)
				alive++;
		}
		if (alive == 0 && burstElapsed >= burstLife)
			return false;
		return true;
	}

private:
	void explode(uint16_t resolution) {
		int numParticles = 12 + rand() % 9;
		particles = new Particle[numParticles];
		particleCount = numParticles;
		for (int i = 0; i < numParticles; i++) {
			float angle = ((float)rand() / RAND_MAX) * 2.0f * M_PI;
			float vel = cosf(angle) * burstRadius * 1.2f;
			uint32_t col = hsv_to_rgb(hue, ((float)rand() / RAND_MAX) * 0.3f + 0.7f, 1.0f);
			float life = burstLife * (0.5f + ((float)rand() / RAND_MAX) * 0.5f);
			particles[i] = Particle(peakPosition, vel, col, life);
		}
	}
};

class BouncingBall {
public:
	float position;
	float velocity;
	float restitution;
	uint32_t color;
	bool alive;

	BouncingBall()
		: position(0), velocity(0), restitution(0.5f), color(0), alive(false) {}

	BouncingBall(uint16_t resolution)
		: position(resolution - 1.0f),
		  velocity(-1.0f - ((float)rand() / RAND_MAX) * 4.0f),
		  restitution(0.4f + ((float)rand() / RAND_MAX) * 0.45f),
		  alive(true) {
		switch (rand() % 8) {
			case 0: color = (uint32_t)Color::RED; break;
			case 1: color = (uint32_t)Color::GREEN; break;
			case 2: color = (uint32_t)Color::BLUE; break;
			case 3: color = (uint32_t)Color::YELLOW; break;
			case 4: color = (uint32_t)Color::MAGENTA; break;
			case 5: color = (uint32_t)Color::CYAN; break;
			case 6: color = (uint32_t)Color::ORANGE; break;
			case 7: color = (uint32_t)Color::PINK; break;
		}
	}

	void update(float dt, float gravity) {
		if (!alive)
			return;
		velocity -= gravity * dt;
		position += velocity * dt;
		if (position <= 0.0f) {
			position = 0.0f;
			velocity = -velocity * restitution;
			if (fabsf(velocity) < 1.0f) {
				alive = false;
				position = 0.0f;
			}
		}
	}

	float brightness() {
		float speed = fabsf(velocity);
		float b = speed / 20.0f;
		return (b > 1.0f) ? 1.0f : b;
	}
};

class DemoScene : public Game {
private:
	static constexpr float SEGMENT_DURATION = 10.0f;

	int stage;
	float stageStart;

	Firework* fireworks[6];
	int fireworkCount;
	float nextFirework;

	BouncingBall* balls[12];
	int ballCount;
	float nextBallTime;
	float ballGravity;

public:
	DemoScene() {}

	DemoScene(System* sys)
		: Game(sys) {
		name = "DemoScene";
		stage = STAGE_PLASMA;
		stageStart = 0.0f;
		fireworkCount = 0;
		nextFirework = 2.0f;
		ballCount = 0;
		nextBallTime = 1.0f;
		ballGravity = 80.0f;
		for (int i = 0; i < 6; i++)
			fireworks[i] = nullptr;
		for (int i = 0; i < 12; i++)
			balls[i] = nullptr;
	}

	~DemoScene() {
		for (int i = 0; i < 6; i++) {
			if (fireworks[i] != nullptr)
				delete fireworks[i];
		}
		for (int i = 0; i < 12; i++) {
			if (balls[i] != nullptr)
				delete balls[i];
		}
	}

	void loop() override {
		Game::loop();
		float dt = system->clock.delta;
		float now = time;

		if (now - stageStart >= SEGMENT_DURATION) {
			stage = (stage + 1) % 4;
			stageStart = now;
			for (int i = 0; i < fireworkCount; i++) {
				delete fireworks[i];
				fireworks[i] = nullptr;
			}
			fireworkCount = 0;
			nextFirework = now + 2.0f;
			for (int i = 0; i < ballCount; i++) {
				delete balls[i];
				balls[i] = nullptr;
			}
			ballCount = 0;
			nextBallTime = now + 1.0f;
		}

		switch (stage) {
			case STAGE_PLASMA:
				renderPlasma(now * 2.0f);
				break;
			case STAGE_INTERFERENCE:
				renderInterference(now * 2.0f);
				break;
			case STAGE_FIREWORKS:
				renderFireworks(now, dt);
				break;
			case STAGE_BOUNCING_BALLS:
				renderBouncingBalls(dt);
				break;
		}
	}

	void buildStage() override {
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;
		(void)event;
	}

private:
	void renderPlasma(float t) {
		for (uint16_t i = 0; i < resolution; i++) {
			float v = sinf(i * 0.05f + t)
			        + sinf(i * 0.1f - t * 1.5f)
			        + sinf(i * 0.03f + t * 0.7f);
			float hue = (v + 3.0f) / 6.0f;
			pixels[i] = hsv_to_rgb(hue, 1.0f, 0.9f);
		}
	}

	void renderInterference(float t) {
		for (uint16_t i = 0; i < resolution; i++) {
			float wave1 = sinf(i * 0.07f + t);
			float wave2 = sinf(i * 0.13f - t * 1.3f);
			float w1 = (wave1 + 1.0f) * 0.5f;
			float w2 = (wave2 + 1.0f) * 0.5f;
			float combined = (w1 + w2) * 0.5f;
			float hue = 0.6f + combined * 0.4f;
			if (hue > 1.0f)
				hue -= 1.0f;
			pixels[i] = hsv_to_rgb(hue, 0.8f, 0.9f);
		}
	}

	void renderFireworks(float t, float dt) {
		for (uint16_t i = 0; i < resolution; i++)
			pixels[i] = 0x000011;

		if (time >= nextFirework && fireworkCount < 6) {
			fireworks[fireworkCount] = new Firework(resolution);
			fireworkCount++;
			nextFirework = time + 0.8f + ((float)rand() / RAND_MAX) * 2.2f;
		}

		int active = 0;
		for (int i = 0; i < fireworkCount; i++) {
			if (fireworks[i]->update(dt, resolution)) {
				fireworks[active] = fireworks[i];
				active++;
			} else {
				delete fireworks[i];
				fireworks[i] = nullptr;
			}
		}
		fireworkCount = active;

		for (int f = 0; f < fireworkCount; f++) {
			Firework* fw = fireworks[f];
			if (!fw->bursted) {
				float frac = fw->riseElapsed / fw->riseTime;
				int pos = (int)(frac * fw->peakPosition);
				if (pos >= 0 && pos < (int)resolution)
					pixels[pos] = (uint32_t)Color::WHITE;
			} else {
				for (int p = 0; p < fw->particleCount; p++) {
					Particle& particle = fw->particles[p];
					int pos = (int)particle.position;
					if (pos >= 0 && pos < (int)resolution) {
						float a = particle.alpha();
						uint32_t c = particle.color;
						uint8_t r = (uint8_t)(((c >> 16) & 0xFF) * a);
						uint8_t g = (uint8_t)(((c >> 8) & 0xFF) * a);
						uint8_t b = (uint8_t)((c & 0xFF) * a);
						pixels[pos] = ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
					}
				}
			}
		}
	}

	void renderBouncingBalls(float dt) {
		for (uint16_t i = 0; i < resolution; i++)
			pixels[i] = 0x001100;

		if (time >= nextBallTime && ballCount < 12) {
			balls[ballCount] = new BouncingBall(resolution);
			ballCount++;
			nextBallTime = time + ((float)rand() / RAND_MAX) * 1.2f + 0.3f;
		}

		for (int i = 0; i < ballCount; i++)
			balls[i]->update(dt, ballGravity);

		int alive = 0;
		for (int i = 0; i < ballCount; i++) {
			if (balls[i]->alive) {
				balls[alive] = balls[i];
				alive++;
			} else {
				delete balls[i];
				balls[i] = nullptr;
			}
		}
		ballCount = alive;

		for (int i = 0; i < ballCount; i++) {
			BouncingBall* ball = balls[i];
			int pos = (int)ball->position;
			if (pos >= 0 && pos < (int)resolution) {
				float b = ball->brightness();
				uint32_t c = ball->color;
				uint8_t r = (uint8_t)(((c >> 16) & 0xFF) * b);
				uint8_t g = (uint8_t)(((c >> 8) & 0xFF) * b);
				uint8_t bb = (uint8_t)((c & 0xFF) * b);
				pixels[pos] = ((uint32_t)r << 16) | ((uint32_t)g << 8) | bb;
			}
		}
	}
};

#endif
