#ifndef SLOTS_H
#define SLOTS_H

#include "system.h"
#include "graphics.h"
#include <stdlib.h>
#include <math.h>

/* ----------------------------------------------------------
   Fruit definitions
   ---------------------------------------------------------- */

typedef enum {
	FRUIT_APPLE = 0,
	FRUIT_BANANA,
	FRUIT_GRAPE,
	FRUIT_ORANGE,
	FRUIT_CHERRY,
	FRUIT_LEMON,
	FRUIT_WATERMELON,
	FRUIT_BLACKBERRY,
	FRUIT_STRAWBERRY
} Fruit;

static const float FRUIT_SIZE[] = {
	0.3f, 0.7f, 0.6f, 0.6f, 0.4f, 0.5f, 0.8f, 0.2f, 0.45f
};

static const uint32_t FRUIT_COLOR[] = {
	GREEN_COLOR,        // APPLE
	BANANA_COLOR,       // BANANA
	PURPLE_COLOR,       // GRAPE
	ORANGE_COLOR,       // ORANGE
	RED_COLOR,          // CHERRY
	LEMON_COLOR,        // LEMON
	WATERMELON_COLOR,   // WATERMELON
	BLACKBERRY_COLOR,   // BLACKBERRY
	STRAWBERRY_COLOR    // STRAWBERRY
};

/* ----------------------------------------------------------
   Wheel – extends Shape with spin physics and cylinder shading
   ---------------------------------------------------------- */

typedef struct {
	Shape base;                 /* base.rotation holds wheel position (0‑8) */
	const uint8_t* symbols;     /* array of NUM_SYMBOLS fruits */
	float speed;                /* symbols per second */
	float spinEndTime;          /* game time when constant speed phase ends */
	float prevRotation;         /* for tick detection */
} Wheel;

/* constant for each wheel */
#define WHEEL_NUM_SYMBOLS 8

static inline void Wheel_init(Wheel* wheel, Game* game, uint16_t size, const uint8_t symbols[WHEEL_NUM_SYMBOLS]) {
	Shape_init(&wheel->base, game, size, CENTER_ALIGN);
	wheel->symbols = symbols;
	wheel->speed = 0.0f;
	wheel->spinEndTime = 0.0f;
	wheel->base.rotation = (float)(rand() % WHEEL_NUM_SYMBOLS);
	wheel->prevRotation = wheel->base.rotation;
}

static inline void Wheel_tick(Wheel* wheel, float dt, float currentTime) {
	wheel->prevRotation = wheel->base.rotation;

	if (wheel->speed > 0.0f) {
		if (currentTime >= wheel->spinEndTime) {
			wheel->speed -= 15.0f * dt;   /* DECELERATION = 15 */
			if (wheel->speed <= 0.0f) {
				wheel->speed = 0.0f;
				wheel->base.rotation = roundf(wheel->base.rotation);
			}
		}
		wheel->base.rotation += wheel->speed * dt;
		/* wrap rotation into [0, NUM_SYMBOLS) */
		while (wheel->base.rotation >= WHEEL_NUM_SYMBOLS)
			wheel->base.rotation -= WHEEL_NUM_SYMBOLS;
		while (wheel->base.rotation < 0.0f)
			wheel->base.rotation += WHEEL_NUM_SYMBOLS;

		/* tick sound on symbol boundary */
		if ((int)wheel->base.rotation != (int)wheel->prevRotation)
			playAudio(TICK_SOUND);
	}

	/* cylinder rendering into shape buffer */
	const float slotAngle = 2.0f * M_PI / WHEEL_NUM_SYMBOLS;
	const float wheelAngle = wheel->base.rotation * slotAngle + slotAngle / 2.0f;
	const uint16_t S = wheel->base.length;

	for (uint16_t j = 0; j < S; j++) {
		float t = (j + 0.5f) / S;                  /* use centre of pixel for smooth wrap */
		float theta = (t - 0.5f) * M_PI;           /* -90° to +90° */
		float absoluteAngle = theta + wheelAngle;

		/* normalise angle into [0, 2pi) */
		absoluteAngle = fmodf(absoluteAngle, 2.0f * M_PI);
		if (absoluteAngle < 0.0f) absoluteAngle += 2.0f * M_PI;

		int slotIndex = (int)(absoluteAngle / slotAngle) % WHEEL_NUM_SYMBOLS;
		float localAngle = fmodf(absoluteAngle, slotAngle);

		Fruit fruit = (Fruit)wheel->symbols[slotIndex];
		float fruitAngularSpan = FRUIT_SIZE[fruit] * slotAngle;
		float fruitStart = (slotAngle - fruitAngularSpan) / 2.0f;
		float fruitEnd   = (slotAngle + fruitAngularSpan) / 2.0f;

		uint32_t pixelColor;
		if (fruitStart <= localAngle && localAngle <= fruitEnd)
			pixelColor = FRUIT_COLOR[fruit];
		else
			pixelColor = SILVER_COLOR;

		float brightness = 1.0f - ((t - 0.5f) * 2.0f) * ((t - 0.5f) * 2.0f);
		uint8_t r = (uint8_t)(((pixelColor >> 16) & 0xFF) * brightness);
		uint8_t g = (uint8_t)(((pixelColor >> 8)  & 0xFF) * brightness);
		uint8_t b = (uint8_t)(( pixelColor        & 0xFF) * brightness);
		wheel->base.pixels[j] = ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
	}
}

/* ----------------------------------------------------------
   Slots game
   ---------------------------------------------------------- */

#define SLOTS_NUM_WHEELS 3
#define SLOTS_DECELERATION 15.0f
#define SLOTS_MIN_SPEED 10.0f
#define SLOTS_MAX_SPEED 40.0f
#define SLOTS_MIN_SPIN_DURATION 2.0f
#define SLOTS_MAX_SPIN_DURATION 5.0f

/* predefined wheel symbol layouts (fruit indices) */
static const uint8_t WHEEL_SYMBOLS[SLOTS_NUM_WHEELS][WHEEL_NUM_SYMBOLS] = {
	{ FRUIT_CHERRY, FRUIT_LEMON, FRUIT_ORANGE, FRUIT_BANANA, FRUIT_CHERRY, FRUIT_LEMON, FRUIT_WATERMELON, FRUIT_ORANGE },
	{ FRUIT_BANANA, FRUIT_CHERRY, FRUIT_LEMON, FRUIT_ORANGE, FRUIT_CHERRY, FRUIT_WATERMELON, FRUIT_LEMON, FRUIT_ORANGE },
	{ FRUIT_LEMON, FRUIT_ORANGE, FRUIT_CHERRY, FRUIT_WATERMELON, FRUIT_LEMON, FRUIT_ORANGE, FRUIT_BANANA, FRUIT_CHERRY }
};

typedef enum {
	SLOTS_STAGE_IDLE,
	SLOTS_STAGE_SPINNING,
	SLOTS_STAGE_RESULT
} SlotsStage;

typedef struct Slots Slots;

struct Slots {
	Game super;
	Wheel wheels[SLOTS_NUM_WHEELS];
	SlotsStage stage;
	uint16_t segmentPixels;
	uint16_t offset;            /* left margin to centre the wheels */
};

static inline void Slots_loop(Slots* game);
static inline void Slots_handleInput(Slots* game, int padId, InputEvent* event);

static inline void Slots_init(Slots* game, System* system) {
	Game_init(&game->super, system);
	game->super.name = "Slots";

	game->segmentPixels = game->super.resolution / SLOTS_NUM_WHEELS;
	if (game->segmentPixels % 2 == 0)
		game->segmentPixels--;
	game->offset = (game->super.resolution - game->segmentPixels * SLOTS_NUM_WHEELS) / 2;

	for (int i = 0; i < SLOTS_NUM_WHEELS; i++)
		Wheel_init(&game->wheels[i], &game->super, game->segmentPixels, WHEEL_SYMBOLS[i]);

	game->stage = SLOTS_STAGE_IDLE;

	game->super.loop = (void (*)(Game*))Slots_loop;
	game->super.buildStage = NULL;
	game->super.handleInput = (void (*)(Game*, int, InputEvent*))Slots_handleInput;
}

static inline void Slots_spin(Slots* game) {
	float now = game->super.time;
	for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
		Wheel* w = &game->wheels[i];
		w->speed = SLOTS_MIN_SPEED + ((float)rand() / RAND_MAX) * (SLOTS_MAX_SPEED - SLOTS_MIN_SPEED);
		w->spinEndTime = now + SLOTS_MIN_SPIN_DURATION +
		                 ((float)rand() / RAND_MAX) * (SLOTS_MAX_SPIN_DURATION - SLOTS_MIN_SPIN_DURATION);
	}
	game->stage = SLOTS_STAGE_SPINNING;
}

static inline void Slots_evaluate(Slots* game) {
	Fruit centreFruits[SLOTS_NUM_WHEELS];
	for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
		int idx = (int)roundf(game->wheels[i].base.rotation) % WHEEL_NUM_SYMBOLS;
		centreFruits[i] = (Fruit)WHEEL_SYMBOLS[i][idx];
	}

	if (centreFruits[0] == centreFruits[1] && centreFruits[1] == centreFruits[2])
		playAudio(LEVEL_COMPLETE_SOUND);
	else
		playAudio(LEVEL_FAIL_SOUND);

	Game_delay(&game->super, 4.0f);
	game->stage = SLOTS_STAGE_IDLE;
}

static inline void Slots_render(Slots* game) {
	Game_clear(&game->super);
	for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
		Wheel* w = &game->wheels[i];
		int segmentStart = game->offset + i * game->segmentPixels;
		float centre = segmentStart + (game->segmentPixels - 1) / 2.0f;
		Shape_render(&w->base, centre, CLIP_EDGE, 1.0f);
	}
	/* optional payline pixel (uncomment to enable) */
	/*
	for (int i = 0; i < SLOTS_NUM_WHEELS; i++) {
		int segmentStart = game->offset + i * game->segmentPixels;
		int pixelCentre = segmentStart + game->segmentPixels / 2;
		if (pixelCentre >= 0 && pixelCentre < game->super.resolution)
			game->super.pixels[pixelCentre] = balanceColors(WHITE_COLOR);
	}
	*/
}

static inline void Slots_loop(Slots* game) {
	if (game->super.delayTime > 0.0f) {
		Slots_render(game);
		return;
	}

	float dt = game->super.system->clock.delta;

	/* tick each wheel */
	for (int i = 0; i < SLOTS_NUM_WHEELS; i++)
		Wheel_tick(&game->wheels[i], dt, game->super.time);

	if (game->stage == SLOTS_STAGE_SPINNING) {
		bool allStopped = true;
		for (int i = 0; i < SLOTS_NUM_WHEELS; i++)
			if (game->wheels[i].speed != 0.0f) { allStopped = false; break; }
		if (allStopped) {
			game->stage = SLOTS_STAGE_RESULT;
			Slots_evaluate(game);
		}
	}

	Slots_render(game);
}

static inline void Slots_handleInput(Slots* game, int padId, InputEvent* event) {
	(void)padId;
	if (game->stage == SLOTS_STAGE_IDLE && Action_isGameButtonPress(event->action))
		Slots_spin(game);
}

#endif /* SLOTS_H */
