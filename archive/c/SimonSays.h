#ifndef SIMONSAYS_H
#define SIMONSAYS_H

#include "system.h"

#define TOTAL_LEVELS 10
#define BEEP_DURATION 0.5f
#define ENTRY_DURATION 0.8f
#define INPUT_TIMEOUT 10.0f

typedef enum {
	STAGE_PLAYBACK,
	STAGE_INPUT,
	STAGE_RESULT,
	STAGE_LEVEL_FAIL,
	STAGE_LEVEL_COMPLETE,
	STAGE_COMPLETE
} SimonStage;

typedef struct SimonSays SimonSays;

struct SimonSays {
	Game super;
	uint32_t sequence[TOTAL_LEVELS];
	SimonStage stage;
	uint8_t step;
	float inputStartTime;
	uint32_t inputColor;
};

static inline void SimonSays_loop(SimonSays* game);
static inline void SimonSays_handleInput(SimonSays* game, int padId, InputEvent* event);

static inline void SimonSays_display(SimonSays* game, uint32_t color) {
	uint16_t section = game->super.resolution / 4;
	for (uint16_t i = 0; i < section; i++) {
		game->super.pixels[i] = DARK_RED_COLOR;
		game->super.pixels[i + section] = DARK_GREEN_COLOR;
		game->super.pixels[i + 2 * section] = DARK_BLUE_COLOR;
		game->super.pixels[i + 3 * section] = DARK_YELLOW_COLOR;
	}
	if (color == 0) return;
	uint16_t start;
	if (color == RED_COLOR)
		start = 0;
	else if (color == GREEN_COLOR)
		start = section;
	else if (color == BLUE_COLOR)
		start = 2 * section;
	else if (color == YELLOW_COLOR)
		start = 3 * section;
	else
		return;
	for (uint16_t i = start; i < start + section; i++)
		game->super.pixels[i] = color;
}

static inline void SimonSays_startLevel(SimonSays* game) {
	game->stage = STAGE_PLAYBACK;
	game->step = 1;
	game->inputStartTime = 0.0f;
	Game_playLevel(&game->super);
	SimonSays_display(game, game->sequence[0]);
	if (game->sequence[0] == RED_COLOR)
		playAudio(SIMONSAYS2_SOUND);
	else if (game->sequence[0] == GREEN_COLOR)
		playAudio(SIMONSAYS1_SOUND);
	else if (game->sequence[0] == BLUE_COLOR)
		playAudio(SIMONSAYS4_SOUND);
	else if (game->sequence[0] == YELLOW_COLOR)
		playAudio(SIMONSAYS3_SOUND);
}

static inline void SimonSays_init(SimonSays* game, System* system) {
	Game_init(&game->super, system);
	game->super.name = "SimonSays";

	for (uint8_t i = 0; i < TOTAL_LEVELS; i++) {
		uint8_t r = random(4);
		if (r == 0)
			game->sequence[i] = RED_COLOR;
		else if (r == 1)
			game->sequence[i] = GREEN_COLOR;
		else if (r == 2)
			game->sequence[i] = BLUE_COLOR;
		else
			game->sequence[i] = YELLOW_COLOR;
	}

	game->stage = STAGE_PLAYBACK;
	game->step = 1;
	game->inputStartTime = 0.0f;
	game->inputColor = 0;

	game->super.loop = (void (*)(Game*))SimonSays_loop;
	game->super.buildStage = NULL;
	game->super.handleInput = (void (*)(Game*, int, InputEvent*))SimonSays_handleInput;

	SimonSays_startLevel(game);
}

static inline void SimonSays_loop(SimonSays* game) {
	if (game->super.delayTime > 0.0f) return;

	switch (game->stage) {
		case STAGE_PLAYBACK: {
			uint8_t lvl = game->super.level;
			float total = (lvl + 1) * ENTRY_DURATION;
			if (game->super.levelTime >= total) {
				SimonSays_display(game, 0);
				game->stage = STAGE_INPUT;
				game->step = 1;
				game->inputStartTime = game->super.levelTime;
				return;
			}
			uint8_t curStep = (uint8_t)(game->super.levelTime / ENTRY_DURATION) + 1;
			float inStep = fmodf(game->super.levelTime, ENTRY_DURATION);
			if (inStep < BEEP_DURATION) {
				if (curStep != game->step) {
					game->step = curStep;
					uint32_t col = game->sequence[curStep - 1];
					SimonSays_display(game, col);
					if (col == RED_COLOR)
						playAudio(SIMONSAYS2_SOUND);
					else if (col == GREEN_COLOR)
						playAudio(SIMONSAYS1_SOUND);
					else if (col == BLUE_COLOR)
						playAudio(SIMONSAYS4_SOUND);
					else if (col == YELLOW_COLOR)
						playAudio(SIMONSAYS3_SOUND);
				}
			} else {
				SimonSays_display(game, 0);
			}
			break;
		}
		case STAGE_INPUT: {
			if (game->super.levelTime - game->inputStartTime > INPUT_TIMEOUT) {
				playAudio(LEVEL_FAIL_SOUND);
				Game_delay(&game->super, 4.0f);
				game->stage = STAGE_LEVEL_FAIL;
			}
			break;
		}
		case STAGE_RESULT: {
			uint32_t expected = game->sequence[game->step - 1];
			if (game->inputColor == expected) {
				if (game->step == game->super.level + 1) {
					playAudio(LEVEL_COMPLETE_SOUND);
					Game_delay(&game->super, 4.0f);
					game->stage = STAGE_LEVEL_COMPLETE;
				} else {
					game->step++;
					game->stage = STAGE_INPUT;
					game->inputStartTime = game->super.levelTime;
					SimonSays_display(game, 0);
				}
			} else {
				playAudio(LEVEL_FAIL_SOUND);
				Game_delay(&game->super, 4.0f);
				game->stage = STAGE_LEVEL_FAIL;
			}
			break;
		}
		case STAGE_LEVEL_FAIL: {
			SimonSays_startLevel(game);
			break;
		}
		case STAGE_LEVEL_COMPLETE: {
			Game_nextLevel(&game->super);
			if (game->super.level >= TOTAL_LEVELS) {
				game->stage = STAGE_COMPLETE;
				Game_clear(&game->super);
				playAudio(GAME_COMPLETE_SOUND);
			} else {
				SimonSays_startLevel(game);
			}
			break;
		}
		case STAGE_COMPLETE: break;
	}
}

static inline void SimonSays_handleInput(SimonSays* game, int padId, InputEvent* event) {
	(void)padId;
	if (game->stage != STAGE_INPUT)
		return;
	if (game->super.delayTime > 0.0f)
		return;

	uint32_t color = 0;
	switch (event->action) {
		case A_PRESS:
			color = RED_COLOR;
			break;
		case B_PRESS:
			color = GREEN_COLOR;
			break;
		case C_PRESS:
			color = BLUE_COLOR;
			break;
		case D_PRESS:
			color = YELLOW_COLOR;
			break;
		default:
			return;
	}

	game->inputColor = color;
	SimonSays_display(game, color);
	if (color == RED_COLOR)
		playAudio(SIMONSAYS2_SOUND);
	else if (color == GREEN_COLOR)
		playAudio(SIMONSAYS1_SOUND);
	else if (color == BLUE_COLOR)
		playAudio(SIMONSAYS4_SOUND);
	else if (color == YELLOW_COLOR)
		playAudio(SIMONSAYS3_SOUND);

	Game_delay(&game->super, ENTRY_DURATION);
	game->stage = STAGE_RESULT;
}

#endif // SIMONSAYS_H
