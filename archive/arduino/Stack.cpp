#include "Stack.h"
#include <Arduino.h>
#include <math.h>


/*
enum SoundID {
	stackGenerateDot,
	stackShoot,
	stackHit,
	stackMiss,
	stackLevelComplete,
	stackLevelFail,
	stackGameComplete
	};*/




const float Stack::START_SPEED = 8.0f;
const float Stack::END_SPEED = 12.0f;
const float Stack::BULLET_SPEED = 60.0f;

Dot::Dot(const uint8_t* color, int gap) : color(color), gap(gap) {}

Bullet::Bullet(Stack* game, const uint8_t* color) : game(game), color(color) {
	if (game) {
		timestamp = game->levelTime;
	} else {
		timestamp = 0;
	}
}

int Bullet::position(float t, float speed) {
	float pixels = (t - timestamp) * speed;
	return (int)floor(pixels);
}

Snake::Snake(Stack* game) : game(game) {
	dotCount = 0;
	position = 0;
}

void Snake::build(int level) {
	int numDots = START_DOTS + level;
	float gapFloat = START_GAP + (END_GAP - START_GAP) * (level / (float)LEVELS);
	int lowGap = (int)floor(gapFloat);
	int highGap = (int)ceil(gapFloat);
	const uint8_t* prevColor = Color::None;
	dotCount = numDots;
	for (int i = 0; i < numDots; i++) {
		const uint8_t* color;
		do {
			int r = random(3);
			switch (r) {
				case 0: color = Color::Red; break;
				case 1: color = Color::Green; break;
				case 2: color = Color::Blue; break;
				default: color = Color::None; break;
			}
		} while (color == prevColor);
		int gap = (random(100) / 100.0f < (gapFloat - lowGap)) ? highGap : lowGap;
		dots[i] = Dot(color, gap);
		prevColor = color;
	}
	position = 120;
}

int Snake::length() {
	int total = 0;
	for (int i = 0; i < dotCount; i++) {
		total += 1 + dots[i].gap;
	}
	return total;
}

bool Snake::isAtStart() {
	return position == 120 - length();
}

bool Snake::isAtEnd() {
	return position <= 0;
}

Stack::Stack(BaseAudio* audio) : Game(audio) {
	log("Stack");
	snake = new Snake(this);
	bulletCount = 0;
	snakePositionRemainder = 0.0f;
	lastGameTime = time;
	startLevel();
}

Stack::~Stack() {
	delete snake;
}

void Stack::startLevel(int level) {
	Game::startLevel(level);
	snake->build(this->level);
	snakePositionRemainder = 0.0f;
	bulletCount = 0;
	lastGameTime = time;
}

void Stack::nextLevel() {
	Game::nextLevel();
	snake->build(level);
	snakePositionRemainder = 0.0f;
	bulletCount = 0;
	lastGameTime = time;
}

void Stack::restartLevel() {
	Game::restartLevel();
	snake->build(level);
	snakePositionRemainder = 0.0f;
	bulletCount = 0;
	lastGameTime = time;
}

void Stack::loop() {
	Game::loop();
	if (isSuspended)
		return;
	for (int i = 0; i < 120; i++) {
		pixels[i][0] = 0;
		pixels[i][1] = 0;
		pixels[i][2] = 0;
	}
	float deltaTime = (time - lastGameTime) * 1000.0f;
	lastGameTime = time;
	float currentSpeed = START_SPEED + (END_SPEED - START_SPEED) * (level / (float)Snake::LEVELS);
	float pixelsToMove = (currentSpeed * deltaTime) / 1000.0f;
	snakePositionRemainder += pixelsToMove;
	int wholePixels = (int)floor(snakePositionRemainder);
	if (wholePixels > 0) {
		snake->position -= wholePixels;
		snakePositionRemainder -= wholePixels;
		int currentPos = snake->position;
		for (int i = 0; i < snake->dotCount; i++) {
			currentPos += 1 + snake->dots[i].gap;
			if (currentPos == 119) {
				audio->play(stackGenerateDot);
				break;
			}
		}
	}
	if (snake->isAtEnd()) {
		audio->play(stackLevelFail);
		pause();
		bulletCount = 0;
		defer([]() { }, 4.0f);
	}
	int newBulletCount = 0;
	for (int i = 0; i < bulletCount; i++) {
		if (bullets[i].position(levelTime, BULLET_SPEED) < 120) {
			bullets[newBulletCount] = bullets[i];
			newBulletCount++;
		}
	}
	bulletCount = newBulletCount;
	if (bulletCount > 0 && snake->dotCount > 0) {
		Bullet& bullet = bullets[0];
		int bulletPos = bullet.position(levelTime, BULLET_SPEED);
		int headPos = snake->position;
		if (bulletPos >= headPos) {
			if (bullet.color == snake->dots[0].color) {
				if (snake->dotCount > 1) {
					int removedGap = snake->dots[0].gap;
					snake->position += 1 + removedGap;
				}
				for (int i = 1; i < snake->dotCount; i++) {
					snake->dots[i - 1] = snake->dots[i];
				}
				snake->dotCount--;
				for (int i = 1; i < bulletCount; i++) {
					bullets[i - 1] = bullets[i];
				}
				bulletCount--;
				audio->play(stackHit);
			} else {
				for (int i = snake->dotCount; i > 0; i--) {
					snake->dots[i] = snake->dots[i - 1];
				}
				snake->dots[0] = Dot(bullet.color, 0);
				snake->dotCount++;
				snake->position -= 1;
				for (int i = 1; i < bulletCount; i++) {
					bullets[i - 1] = bullets[i];
				}
				bulletCount--;
				audio->play(stackMiss);
			}
		}
	}
	int currentPixel = snake->position;
	for (int i = 0; i < snake->dotCount; i++) {
		Dot& dot = snake->dots[i];
		if (currentPixel >= 0 && currentPixel < 120) {
			pixels[currentPixel][0] = dot.color[0];
			pixels[currentPixel][1] = dot.color[1];
			pixels[currentPixel][2] = dot.color[2];
		}
		currentPixel += 1;
		for (int g = 0; g < dot.gap; g++) {
			if (currentPixel >= 0 && currentPixel < 120) {
				pixels[currentPixel][0] = 0;
				pixels[currentPixel][1] = 0;
				pixels[currentPixel][2] = 0;
			}
			currentPixel += 1;
		}
	}
	for (int i = 0; i < bulletCount; i++) {
		Bullet& bullet = bullets[i];
		int pos = bullet.position(levelTime, BULLET_SPEED);
		if (pos >= 0 && pos < 120) {
			pixels[pos][0] = bullet.color[0];
			pixels[pos][1] = bullet.color[1];
			pixels[pos][2] = bullet.color[2];
		}
	}
	if (snake->dotCount == 0) {
		if (level >= Snake::LEVELS) {
			audio->play(stackGameComplete);
			level = 0;
			defer([]() { }, 30.0f);
		} else {
			audio->play(stackLevelComplete);
			defer([]() { }, 4.0f);
		}
	}
}

void Stack::buttonPress(Signal signal) {
	if (bulletCount >= MAX_BULLETS) return;
	switch (signal) {
		case Signal::BA:
			bullets[bulletCount++] = Bullet(this, Color::Red);
			audio->play(stackShoot);
			break;
		case Signal::BB:
			bullets[bulletCount++] = Bullet(this, Color::Green);
			audio->play(stackShoot);
			break;
		case Signal::BC:
			bullets[bulletCount++] = Bullet(this, Color::Blue);
			audio->play(stackShoot);
			break;
		default:
			break;
	}
}

void Stack::buttonRelease(Signal signal) {
}

void Stack::buttonHold(Signal signal) {
}

void Stack::buttonReleaseHold(Signal signal) {
}