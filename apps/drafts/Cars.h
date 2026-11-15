#ifndef CARS_H
#define CARS_H

#include <math.h>
#include <stdlib.h>
#include "system.h"
#include "graphics.h"

class CarsPlayer : public BasePlayer2D {
public:
	float speed;

	CarsPlayer() : BasePlayer2D(nullptr) {
		speed = 0.0f;
	}

	CarsPlayer(Game* game) : BasePlayer2D(game) {
		speed = 0.0f;
	}
};

class Car : public Square2D {
public:
	float speed;

	Car() : Square2D(nullptr, nullptr, 0, 0, false) {
		speed = 0.0f;
	}

	Car(Game* game);
	~Car();
	void tick(float dt);

private:
	static uint32_t* buildFace(uint16_t len, uint32_t body, uint32_t light);
	static void fillLight(uint32_t* face, uint16_t faceLen, int start, int count, uint32_t color);
	static uint32_t* solidFace(uint16_t len, uint32_t color);
};

Car::Car(Game* game)
	: Square2D(game, nullptr, 4, 0, true) {
	uint16_t len = (uint16_t)(game->resolution * (1.0f / 3.0f));
	if (len % 2 == 0)
		len--;
	uint32_t body = (rand() % 2 == 0) ? (uint32_t)Color::GREEN : (uint32_t)Color::BLUE;
	uint32_t dark = ((uint32_t)(((body >> 16) & 0xFF) * 0.5f) << 16) |
	                ((uint32_t)(((body >> 8) & 0xFF) * 0.5f) << 8) |
	                (uint32_t)((body & 0xFF) * 0.5f);

	uint32_t** faces = new uint32_t*[4];
	faces[0] = buildFace(len, body, (uint32_t)Color::WHITE);
	faces[1] = solidFace(len, dark);
	faces[2] = buildFace(len, body, (uint32_t)Color::RED);
	faces[3] = solidFace(len, dark);

	this->faces = faces;
	this->faceCount = 4;
	this->faceSize = len;
	this->invert = true;

	uint16_t newLength = (uint16_t)ceilf(len * sqrtf(2.0f));
	if (newLength % 2 == 0)
		newLength++;
	delete[] pixels;
	pixels = new uint32_t[newLength];
	memset(pixels, 0, newLength * sizeof(uint32_t));
	length = newLength;

	speed = 0.0f;
}

Car::~Car() {
	for (uint8_t i = 0; i < 4; i++)
		delete[] faces[i];
	delete[] faces;
}

void Car::tick(float dt) {
	float angle = rotation * 2.0f * M_PI;
	x += speed * game->resolution * cosf(angle) * dt;
	z += speed * game->resolution * sinf(angle) * dt;
	update();
}

uint32_t* Car::buildFace(uint16_t len, uint32_t body, uint32_t light) {
	uint32_t* face = solidFace(len, body);
	int leftCen = (int)(len * (1.0f / 7.0f));
	int rightCen = (int)(len * (1.0f - 1.0f / 7.0f));
	int dia = (int)ceilf(len * (1.0f / 7.0f));
	int half = (dia - 1) / 2;
	fillLight(face, len, leftCen - half, dia, light);
	fillLight(face, len, rightCen - half, dia, light);
	return face;
}

void Car::fillLight(uint32_t* face, uint16_t faceLen, int start, int count, uint32_t color) {
	int end = start + count;
	if (start < 0) start = 0;
	if (end > (int)faceLen) end = (int)faceLen;
	for (int i = start; i < end; i++)
		face[i] = color;
}

uint32_t* Car::solidFace(uint16_t len, uint32_t color) {
	uint32_t* face = new uint32_t[len];
	for (uint16_t i = 0; i < len; i++)
		face[i] = color;
	return face;
}

class Cars : public Game {
private:
	static constexpr int LEVELS = 10;
	static constexpr float FIRST_LEVEL_START_SIZE = 1.0f;
	static constexpr float FIRST_LEVEL_END_SIZE = 1.0f;
	static constexpr float LAST_LEVEL_START_SIZE = 100.0f;
	static constexpr float LAST_LEVEL_END_SIZE = 10.0f;

	Car** cars;
	uint16_t carCount;
	int initialCars;
	float levelStartSize;
	float levelEndSize;

	CarsPlayer player;
	World2D* world;
	Camera camera;
	bool turnLeftPressed;
	bool turnRightPressed;

public:
	Cars() : player() {
		cars = nullptr;
		carCount = 0;
		world = nullptr;
		turnLeftPressed = false;
		turnRightPressed = false;
	}

	Cars(System* sys);
	~Cars();

	void buildStage() override;
	void loop() override;
	void handleInput(int padId, InputEvent* event) override;
};

Cars::Cars(System* sys)
	: Game(sys),
	  player(this) {
	name = "Cars";
	cars = nullptr;
	carCount = 0;
	world = nullptr;
	player.speed = 0.25f;
	level = 2;
	turnLeftPressed = false;
	turnRightPressed = false;
	camera = Camera();
	playLevel();
}

Cars::~Cars() {
	for (uint16_t i = 0; i < carCount; i++)
		delete cars[i];
	delete[] cars;
	if (world)
		delete world;
}

void Cars::buildStage() {
	int n = level;
	initialCars = (int)powf(2.0f, (float)n);
	levelStartSize = FIRST_LEVEL_START_SIZE +
		(LAST_LEVEL_START_SIZE - FIRST_LEVEL_START_SIZE) * (float)n / (float)(LEVELS - 1);
	levelEndSize = FIRST_LEVEL_END_SIZE +
		(LAST_LEVEL_END_SIZE - FIRST_LEVEL_END_SIZE) * (float)n / (float)(LEVELS - 1);

	if (world) delete world;
	world = new World2D(levelStartSize, levelStartSize, true, true);

	for (uint16_t i = 0; i < carCount; i++)
		delete cars[i];
	delete[] cars;

	carCount = initialCars;
	cars = new Car*[carCount];

	float halfW = world->width * (float)resolution / 2.0f;
	float halfD = world->depth * (float)resolution / 2.0f;
	for (int i = 0; i < initialCars; i++) {
		Car* car = new Car(this);
		car->x = ((float)rand() / RAND_MAX) * 2.0f * halfD - halfD;
		car->z = ((float)rand() / RAND_MAX) * 2.0f * halfW - halfW;
		car->rotation = (float)rand() / RAND_MAX;
		car->speed = 1.0f / 15.0f + ((float)rand() / RAND_MAX) * (1.0f / 12.0f - 1.0f / 15.0f);
		cars[i] = car;
	}

	player.x = 0.0f;
	player.z = 0.0f;
	player.rotation = 0.0f;
	turnLeftPressed = false;
	turnRightPressed = false;
}

void Cars::loop() {
	Game::loop();
	clear();
	for (uint16_t i = 0; i < resolution; i++)
		pixels[i] = (uint32_t)Color::LIGHT_GRAY;

	float dt = system->clock.delta;

	if (turnLeftPressed)
		player.rotation = fmodf(player.rotation - 0.5f * dt + 1.0f, 1.0f);
	if (turnRightPressed)
		player.rotation = fmodf(player.rotation + 0.5f * dt, 1.0f);

	float pAngle = player.rotation * 2.0f * M_PI;
	player.x += player.speed * (float)resolution * cosf(pAngle) * dt;
	player.z += player.speed * (float)resolution * sinf(pAngle) * dt;

	float worldW = world->width * (float)resolution;
	float worldD = world->depth * (float)resolution;
	float halfW = worldW / 2.0f;
	float halfD = worldD / 2.0f;

	player.x = fmodf(fmodf(player.x + halfD, worldD) + worldD, worldD) - halfD;
	player.z = fmodf(fmodf(player.z + halfW, worldW) + worldW, worldW) - halfW;

	float camDist = 20.0f;
	float camAngle = player.rotation * 2.0f * M_PI;
	camera.x = player.x - camDist * cosf(camAngle);
	camera.z = player.z - camDist * sinf(camAngle);
	camera.rotation = player.rotation;

	for (uint16_t i = 0; i < carCount; i++) {
		Car* car = cars[i];
		car->tick(dt);
		car->x = fmodf(fmodf(car->x + halfD, worldD) + worldD, worldD) - halfD;
		car->z = fmodf(fmodf(car->z + halfW, worldW) + worldW, worldW) - halfW;

		float dx = car->x - camera.x;
		float dz = car->z - camera.z;
		dx = fmodf(fmodf(dx + halfD, worldD) + worldD, worldD) - halfD;
		dz = fmodf(fmodf(dz + halfW, worldW) + worldW, worldW) - halfW;

		float cosT = cosf(camera.rotation * 2.0f * M_PI);
		float sinT = sinf(camera.rotation * 2.0f * M_PI);
		float forward = dx * cosT + dz * sinT;
		float lateral = -dx * sinT + dz * cosT;

		if (forward > 0.0f) {
			float focalLength = (float)resolution / 2.0f;
			float stripPos = (float)resolution / 2.0f + (lateral / forward) * focalLength;
			float scale = focalLength / forward;
			if (scale > 2.0f) scale = 2.0f;
			car->render(stripPos, EdgeMode::CLIP, scale);
		}
	}
}

void Cars::handleInput(int padId, InputEvent* event) {
	(void)padId;
	switch (event->action) {
		case Action::A_PRESS:
			turnLeftPressed = true;
			break;
		case Action::C_PRESS:
			turnRightPressed = true;
			break;
		case Action::A_RELEASE:
			turnLeftPressed = false;
			break;
		case Action::C_RELEASE:
			turnRightPressed = false;
			break;
		default:
			break;
	}
}

#endif
