#ifndef STACK_H
#define STACK_H
#include "Game.h"

enum {
	stackGenerateDot = 0,
	stackShoot = 1,
	stackHit = 2,
	stackMiss = 3,
	stackLevelComplete = 4,
	stackLevelFail = 5,
	stackGameComplete = 6
};

class Dot {
public:
	const uint8_t* color;
	int gap;
	Dot(const uint8_t* color = Color::None, int gap = 0);
};

class Bullet {
public:
	class Stack* game;
	const uint8_t* color;
	float timestamp;
	Bullet(class Stack* game = nullptr, const uint8_t* color = Color::None);
	int position(float t, float speed);
};

class Snake {
public:
	static const int START_DOTS = 7;
	static const int END_DOTS = 30;
	static const int START_GAP = 3;
	static const int END_GAP = 1;
	static const int LEVELS = END_DOTS - START_DOTS;
	Dot dots[END_DOTS];
	int dotCount;
	int position;
	class Stack* game;
	Snake(class Stack* game = nullptr);
	void build(int level);
	int length();
	bool isAtStart();
	bool isAtEnd();
};

class Stack : public Game {
public:
	static const float START_SPEED;
	static const float END_SPEED;
	static const float BULLET_SPEED;
	static const int MAX_BULLETS = 10;
	Snake* snake;
	Bullet bullets[MAX_BULLETS];
	int bulletCount;
	float snakePositionRemainder;
	float lastGameTime;
	Stack(BaseAudio* audio);
	~Stack();
	virtual void startLevel(int level = 0) override;
	virtual void nextLevel() override;
	virtual void restartLevel() override;
	virtual void loop() override;
	virtual void buttonPress(Signal signal) override;
	virtual void buttonRelease(Signal signal) override;
	virtual void buttonHold(Signal signal) override;
	virtual void buttonReleaseHold(Signal signal) override;
};

#endif
