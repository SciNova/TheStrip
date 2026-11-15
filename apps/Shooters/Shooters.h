#ifndef SHOOTERS_H
#define SHOOTERS_H

// Not yet ported — a placeholder mirroring Shooters.js's top-level shape
// so the file exists alongside the other languages.
// See Shooters.js for the actual, current implementation.

#include "system.h"

class Player {
public:
	System* game;
	float location;

	Player() {}

	explicit Player(System* game) {
		this->game = game;
	}
};

class Target {
public:
	System* game;
	float location;
	uint32_t color;
	float size;

	Target() {}

	Target(System* game, float location, uint32_t color, float size) {
		this->game = game;
		this->location = location;
		this->color = color;
		this->size = size;
	}
};

class Shooters : public Game {
public:
	Player player;

	explicit Shooters(System* sys) : Game(sys) {
		name = "Shooters";
		player = Player(sys);
	}

	void loop() override {
		Game::loop();
	}

	void handleInput(int padId, InputEvent* event) override {}
};

#endif
