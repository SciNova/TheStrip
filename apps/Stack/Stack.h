#ifndef STACK_H
#define STACK_H

#include <stdlib.h>
#include <math.h>
#include "system.h"
#include "graphics.h"

class Stack;

class Dot : public Shape {
public:
	static constexpr uint16_t EXPLOSION_DIAMETER = 21;
	static constexpr float EXPLOSION_DURATION = 0.5f;

	uint32_t color;
	uint16_t gap;
	float alpha;
	float explosionTime;

private:
	float cosAngles[10];

public:
	Dot() {}

	Dot(Game* game, uint32_t color, uint16_t gap)
		: Shape(game, EXPLOSION_DIAMETER, Alignment::CENTER) {
		this->color = color;
		this->gap = gap;
		alpha = 1.0f;
		explosionTime = 0.0f;
		for (int deg = 0; deg < 10; deg++) {
			float rad = deg * 18.0f * M_PI / 180.0f;
			cosAngles[deg] = cosf(rad);
		}
	}

	void explode() {
		explosionTime = game->levelTime;
	}

	void update() override {
		for (uint16_t i = 0; i < length; i++)
			pixels[i] = 0;

		if (explosionTime == 0.0f) {
			uint16_t center = (length - 1) / 2;
			pixels[center] = color;
		} else {
			float elapsed = game->levelTime - explosionTime;
			float t = elapsed / EXPLOSION_DURATION;
			if (t >= 1.0f) {
				alpha = 0.0f;
				return;
			}
			alpha = 1.0f - t;
			float maxRadius = (EXPLOSION_DIAMETER - 1) / 2;
			float radius = maxRadius * (1.0f - (1.0f - t) * (1.0f - t));
			uint16_t center = (length - 1) / 2;
			uint8_t r = (color >> 16) & 0xFF;
			uint8_t g = (color >> 8) & 0xFF;
			uint8_t b = color & 0xFF;
			for (int i = 0; i < 10; i++) {
				int offset = (int)(radius * cosAngles[i] + 0.5f);
				int idx = center + offset;
				if (idx >= 0 && idx < (int)length) {
					pixels[idx] = ((uint32_t)(r * alpha) << 16) |
					              ((uint32_t)(g * alpha) << 8) |
					              (uint32_t)(b * alpha);
				}
			}
		}
	}
};

class Bullet : public Shape {
public:
	static constexpr float BULLET_SPEED = 60.0f;

	uint32_t color;
	float timestamp;
	float position;

	Bullet() {}

	Bullet(Game* game, uint32_t color)
		: Shape(game, 20, Alignment::BACKWARD) {
		this->color = color;
		this->timestamp = game->levelTime;
		this->position = 0.0f;
	}

	void update() override {
		for (uint16_t i = 0; i < length; i++)
			pixels[i] = 0;

		position = (game->levelTime - timestamp) * BULLET_SPEED;
		uint8_t r = (color >> 16) & 0xFF;
		uint8_t g = (color >> 8) & 0xFF;
		uint8_t b = color & 0xFF;

		for (int i = 0; i < 20; i++) {
			float t = (i + 1) / 21.0f;
			pixels[i] = ((uint32_t)(r * t) << 16) |
			            ((uint32_t)(g * t) << 8) |
			            (uint32_t)(b * t);
		}
	}
};

class Snake {
public:
	static int LEVELS;

	Dot** dots;
	uint16_t dotCount;
	int position;

private:
	Game* game;
	int START_DOTS;
	int END_DOTS;
	int START_GAP;
	int END_GAP;

public:
	Snake() {
		dots = nullptr;
		dotCount = 0;
		position = 0;
		game = nullptr;
	}

	Snake(Game* game) {
		this->game = game;
		START_DOTS = game->resolution / 20;
		END_DOTS = game->resolution / 4;
		START_GAP = game->resolution / 40;
		END_GAP = game->resolution / 40;
		LEVELS = END_DOTS - START_DOTS;
		dots = nullptr;
		dotCount = 0;
		position = 0;
	}

	~Snake() {
		for (uint16_t i = 0; i < dotCount; i++)
			delete dots[i];
		delete[] dots;
	}

	void build(int level) {
		for (uint16_t i = 0; i < dotCount; i++)
			delete dots[i];
		delete[] dots;

		int numDots = START_DOTS + level;
		float gapFloat = START_GAP + (END_GAP - START_GAP) * ((float)level / LEVELS);
		int lowGap = (int)gapFloat;
		int highGap = lowGap + 1;
		uint32_t prevColor = (uint32_t)Color::OFF;

		dots = new Dot*[numDots];
		dotCount = numDots;

		for (int i = 0; i < numDots; i++) {
			uint32_t color;
			do {
				switch (rand() % 3) {
					case 0: color = (uint32_t)Color::RED; break;
					case 1: color = (uint32_t)Color::GREEN; break;
					default: color = (uint32_t)Color::BLUE; break;
				}
			} while (color == prevColor);

			int gap = (((float)rand() / RAND_MAX) < (gapFloat - lowGap)) ? highGap : lowGap;
			dots[i] = new Dot(game, color, gap);
			prevColor = color;
		}

		position = game->resolution;
	}

	int length() {
		int total = 0;
		for (uint16_t i = 0; i < dotCount; i++)
			total += 1 + dots[i]->gap;
		return total;
	}

	bool isAtStart() {
		return position == game->resolution - length();
	}

	bool isAtEnd() {
		return position <= 0;
	}
};

int Snake::LEVELS = 0;

class Stack : public Game {
private:
	static constexpr float START_SPEED = 8.0f;
	static constexpr float END_SPEED = 12.0f;
	static constexpr float BULLET_SPEED = 60.0f;

	Snake snake;
	Bullet** bullets;
	uint16_t bulletCount;
	float snakePositionRemainder;

public:
	Stack() {}

	Stack(System* sys)
		: Game(sys),
		  snake(this) {
		name = "Stack";
		bullets = nullptr;
		bulletCount = 0;
		snakePositionRemainder = 0.0f;
		playLevel();
	}

	~Stack() {
		for (uint16_t i = 0; i < bulletCount; i++)
			delete bullets[i];
		delete[] bullets;
	}

	void buildStage() override {
		snake.build(level);
		snakePositionRemainder = 0.0f;
		for (uint16_t i = 0; i < bulletCount; i++)
			delete bullets[i];
		delete[] bullets;
		bullets = nullptr;
		bulletCount = 0;
	}

	void loop() override {
		Game::loop();

		if (delayTime > 0.0f)
			return;

		float dt = system->clock.delta;

		float currentSpeed = START_SPEED + (END_SPEED - START_SPEED) * ((float)level / Snake::LEVELS);
		float pixelsToMove = currentSpeed * dt;
		snakePositionRemainder += pixelsToMove;
		int wholePixels = (int)snakePositionRemainder;

		if (wholePixels > 0) {
			snake.position -= wholePixels;
			snakePositionRemainder -= wholePixels;
			int currentPos = snake.position;
			for (uint16_t i = 0; i < snake.dotCount; i++) {
				currentPos += 1 + snake.dots[i]->gap;
				if (currentPos == (int)resolution - 1) {
					audio->play(Sound::GENERATE_ITEM);
					break;
				}
			}
		}

		if (snake.isAtEnd()) {
			audio->play(Sound::LEVEL_FAIL);
			pause();
			for (uint16_t i = 0; i < bulletCount; i++)
				delete bullets[i];
			delete[] bullets;
			bullets = nullptr;
			bulletCount = 0;
			delay(4.0f);
			return;
		}

		for (uint16_t i = 0; i < bulletCount; i++)
			bullets[i]->update();
		for (uint16_t i = 0; i < snake.dotCount; i++)
			snake.dots[i]->update();

		{
			Dot** filtered = new Dot*[snake.dotCount];
			uint16_t filteredCount = 0;
			for (uint16_t i = 0; i < snake.dotCount; i++) {
				if (snake.dots[i]->alpha != 0.0f) {
					filtered[filteredCount] = snake.dots[i];
					filteredCount++;
				} else {
					delete snake.dots[i];
				}
			}
			delete[] snake.dots;
			snake.dots = filtered;
			snake.dotCount = filteredCount;
		}

		{
			Bullet** filtered = new Bullet*[bulletCount];
			uint16_t filteredCount = 0;
			for (uint16_t i = 0; i < bulletCount; i++) {
				if (bullets[i]->position < (float)resolution) {
					filtered[filteredCount] = bullets[i];
					filteredCount++;
				} else {
					delete bullets[i];
				}
			}
			delete[] bullets;
			bullets = filtered;
			bulletCount = filteredCount;
		}

		Dot* headDot = nullptr;
		for (uint16_t i = 0; i < snake.dotCount; i++) {
			if (snake.dots[i]->explosionTime == 0.0f) {
				headDot = snake.dots[i];
				break;
			}
		}

		if (bulletCount > 0 && headDot != nullptr) {
			Bullet* bullet = bullets[0];
			if (bullet->position >= snake.position) {
				if (bullet->color == headDot->color) {
					headDot->explode();
					snake.position += 1 + headDot->gap;
					delete bullet;
					for (uint16_t i = 0; i < bulletCount - 1; i++)
						bullets[i] = bullets[i + 1];
					bulletCount--;
					audio->play(Sound::HIT);
				} else {
					delete bullet;
					for (uint16_t i = 0; i < bulletCount - 1; i++)
						bullets[i] = bullets[i + 1];
					bulletCount--;

					Dot** newDots = new Dot*[snake.dotCount + 1];
					newDots[0] = new Dot(this, bullet->color, 0);
					for (uint16_t i = 0; i < snake.dotCount; i++)
						newDots[i + 1] = snake.dots[i];
					delete[] snake.dots;
					snake.dots = newDots;
					snake.dotCount++;
					snake.position -= 1;
					audio->play(Sound::MISS);
				}
			}
		}

		if (snake.dotCount == 0) {
			if (level >= Snake::LEVELS) {
				audio->play(Sound::GAME_COMPLETE);
				setLevel(0);
				delay(30.0f);
			} else {
				audio->play(Sound::LEVEL_COMPLETE);
				nextLevel();
				delay(4.0f);
			}
			return;
		}

		render();
	}

	void handleInput(int padId, InputEvent* event) override {
		(void)padId;
		if (event->action == Action::A_PRESS) {
			Bullet** newBullets = new Bullet*[bulletCount + 1];
			for (uint16_t i = 0; i < bulletCount; i++)
				newBullets[i] = bullets[i];
			newBullets[bulletCount] = new Bullet(this, (uint32_t)Color::RED);
			delete[] bullets;
			bullets = newBullets;
			bulletCount++;
			audio->play(Sound::SHOOT);
		} else if (event->action == Action::B_PRESS) {
			Bullet** newBullets = new Bullet*[bulletCount + 1];
			for (uint16_t i = 0; i < bulletCount; i++)
				newBullets[i] = bullets[i];
			newBullets[bulletCount] = new Bullet(this, (uint32_t)Color::GREEN);
			delete[] bullets;
			bullets = newBullets;
			bulletCount++;
			audio->play(Sound::SHOOT);
		} else if (event->action == Action::C_PRESS) {
			Bullet** newBullets = new Bullet*[bulletCount + 1];
			for (uint16_t i = 0; i < bulletCount; i++)
				newBullets[i] = bullets[i];
			newBullets[bulletCount] = new Bullet(this, (uint32_t)Color::BLUE);
			delete[] bullets;
			bullets = newBullets;
			bulletCount++;
			audio->play(Sound::SHOOT);
		}
	}

private:
	void render() {
		clear();

		int currentPixel = snake.position;
		for (uint16_t i = 0; i < snake.dotCount; i++) {
			Dot* dot = snake.dots[i];
			dot->render((float)currentPixel, EdgeMode::CLIP, 1.0f);
			if (dot->explosionTime == 0.0f)
				currentPixel += 1 + dot->gap;
		}

		for (uint16_t i = 0; i < bulletCount; i++)
			bullets[i]->render(bullets[i]->position, EdgeMode::CLIP, 1.0f);
	}
};

#endif
