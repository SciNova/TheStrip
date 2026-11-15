#ifndef HARDWARE_CONTROLLER_H
#define HARDWARE_CONTROLLER_H

#include <Arduino.h>
#include "system.h"

/* ----------------------------------------------------------
   System‑button feature flags
   ----------------------------------------------------------
   Uncomment to enable the corresponding system button.         */

// #define HAS_POWER_BUTTON
// #define HAS_MENU_BUTTON
// #define HAS_PLAY_PAUSE_BUTTON
// #define HAS_BT_BUTTON
// #define HAS_BLE_BUTTON
// #define HAS_BT_BLE_BUTTON

/* ----------------------------------------------------------
   Default pin assignments
   ---------------------------------------------------------- */

#define P1_PAUSE_BUTTON         -1
#define P1_MENU_BUTTON          -1
#define P1_POWER_BUTTON         -1
#define P1_BUTTON_A             -1
#define P1_BUTTON_B             -1
#define P1_BUTTON_C             -1
#define P1_BUTTON_D             -1
#define P1_BUTTON_X             -1
#define P1_BUTTON_Y             -1
#define P1_BUTTON_Z             -1
#define P1_BUTTON_W             -1
#define P1_BUTTON_FIRE           3
#define P1_BUTTON_FIRE2          4
#define P1_BUTTON_LEFT          -1
#define P1_BUTTON_RIGHT         -1
#define P1_BUTTON_UP            -1
#define P1_BUTTON_DOWN          -1
#define P1_ENCODER_A             5
#define P1_ENCODER_B             6
#define P1_ENCODER2_A            7
#define P1_ENCODER2_B            8

#define P2_PAUSE_BUTTON         -1
#define P2_MENU_BUTTON          -1
#define P2_POWER_BUTTON         -1
#define P2_BUTTON_A             -1
#define P2_BUTTON_B             -1
#define P2_BUTTON_C             -1
#define P2_BUTTON_D             -1
#define P2_BUTTON_X             -1
#define P2_BUTTON_Y             -1
#define P2_BUTTON_Z             -1
#define P2_BUTTON_W             -1
#define P2_BUTTON_FIRE          -1
#define P2_BUTTON_FIRE2         -1
#define P2_BUTTON_LEFT          -1
#define P2_BUTTON_RIGHT         -1
#define P2_BUTTON_UP            -1
#define P2_BUTTON_DOWN          -1
#define P2_ENCODER_A            -1
#define P2_ENCODER_B            -1
#define P2_ENCODER2_A           -1
#define P2_ENCODER2_B           -1

/* ----------------------------------------------------------
   WiredControlPad
   ---------------------------------------------------------- */

typedef struct {
	System* system;
	int port;

	#if (P1_PAUSE_BUTTON >= 0 || P2_PAUSE_BUTTON >= 0) && defined(HAS_PLAY_PAUSE_BUTTON)
		Button pauseButton;
	#endif
	#if (P1_MENU_BUTTON >= 0 || P2_MENU_BUTTON >= 0) && defined(HAS_MENU_BUTTON)
		Button menuButton;
	#endif
	#if (P1_POWER_BUTTON >= 0 || P2_POWER_BUTTON >= 0) && defined(HAS_POWER_BUTTON)
		Button powerButton;
	#endif

	#if P1_BUTTON_A >= 0 || P2_BUTTON_A >= 0
		Button buttonA;
	#endif
	#if P1_BUTTON_B >= 0 || P2_BUTTON_B >= 0
		Button buttonB;
	#endif
	#if P1_BUTTON_C >= 0 || P2_BUTTON_C >= 0
		Button buttonC;
	#endif
	#if P1_BUTTON_D >= 0 || P2_BUTTON_D >= 0
		Button buttonD;
	#endif
	#if P1_BUTTON_X >= 0 || P2_BUTTON_X >= 0
		Button buttonX;
	#endif
	#if P1_BUTTON_Y >= 0 || P2_BUTTON_Y >= 0
		Button buttonY;
	#endif
	#if P1_BUTTON_Z >= 0 || P2_BUTTON_Z >= 0
		Button buttonZ;
	#endif
	#if P1_BUTTON_W >= 0 || P2_BUTTON_W >= 0
		Button buttonW;
	#endif
	#if P1_BUTTON_FIRE >= 0 || P2_BUTTON_FIRE >= 0
		Button fireButton;
	#endif
	#if P1_BUTTON_FIRE2 >= 0 || P2_BUTTON_FIRE2 >= 0
		Button fire2Button;
	#endif
	#if P1_BUTTON_LEFT >= 0 || P2_BUTTON_LEFT >= 0
		Button leftButton;
	#endif
	#if P1_BUTTON_RIGHT >= 0 || P2_BUTTON_RIGHT >= 0
		Button rightButton;
	#endif
	#if P1_BUTTON_UP >= 0 || P2_BUTTON_UP >= 0
		Button upButton;
	#endif
	#if P1_BUTTON_DOWN >= 0 || P2_BUTTON_DOWN >= 0
		Button downButton;
	#endif
	#if P1_ENCODER_A >= 0 || P2_ENCODER_A >= 0
		Encoder encoder;
	#endif
	#if P1_ENCODER2_A >= 0 || P2_ENCODER2_A >= 0
		Encoder encoder2;
	#endif
} WiredControlPad;

static inline void WiredControlPad_init(WiredControlPad* pad, System* system, int port) {
	pad->system = system;
	pad->port = port;

	switch (port) {
		case 0:
		#if P1_PAUSE_BUTTON >= 0 && defined(HAS_PLAY_PAUSE_BUTTON)
			pinMode(P1_PAUSE_BUTTON, INPUT_PULLUP);
		#endif
		#if P1_MENU_BUTTON >= 0 && defined(HAS_MENU_BUTTON)
			pinMode(P1_MENU_BUTTON, INPUT_PULLUP);
		#endif
		#if P1_POWER_BUTTON >= 0 && defined(HAS_POWER_BUTTON)
			pinMode(P1_POWER_BUTTON, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_A >= 0
			pinMode(P1_BUTTON_A, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_B >= 0
			pinMode(P1_BUTTON_B, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_C >= 0
			pinMode(P1_BUTTON_C, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_D >= 0
			pinMode(P1_BUTTON_D, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_X >= 0
			pinMode(P1_BUTTON_X, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_Y >= 0
			pinMode(P1_BUTTON_Y, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_Z >= 0
			pinMode(P1_BUTTON_Z, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_W >= 0
			pinMode(P1_BUTTON_W, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_FIRE >= 0
			pinMode(P1_BUTTON_FIRE, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_FIRE2 >= 0
			pinMode(P1_BUTTON_FIRE2, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_LEFT >= 0
			pinMode(P1_BUTTON_LEFT, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_RIGHT >= 0
			pinMode(P1_BUTTON_RIGHT, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_UP >= 0
			pinMode(P1_BUTTON_UP, INPUT_PULLUP);
		#endif
		#if P1_BUTTON_DOWN >= 0
			pinMode(P1_BUTTON_DOWN, INPUT_PULLUP);
		#endif
		#if P1_ENCODER_A >= 0
			pinMode(P1_ENCODER_A, INPUT_PULLUP);
			pinMode(P1_ENCODER_B, INPUT_PULLUP);
		#endif
		#if P1_ENCODER2_A >= 0
			pinMode(P1_ENCODER2_A, INPUT_PULLUP);
			pinMode(P1_ENCODER2_B, INPUT_PULLUP);
		#endif
			break;
		case 1:
		#if P2_PAUSE_BUTTON >= 0 && defined(HAS_PLAY_PAUSE_BUTTON)
			pinMode(P2_PAUSE_BUTTON, INPUT_PULLUP);
		#endif
		#if P2_MENU_BUTTON >= 0 && defined(HAS_MENU_BUTTON)
			pinMode(P2_MENU_BUTTON, INPUT_PULLUP);
		#endif
		#if P2_POWER_BUTTON >= 0 && defined(HAS_POWER_BUTTON)
			pinMode(P2_POWER_BUTTON, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_A >= 0
			pinMode(P2_BUTTON_A, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_B >= 0
			pinMode(P2_BUTTON_B, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_C >= 0
			pinMode(P2_BUTTON_C, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_D >= 0
			pinMode(P2_BUTTON_D, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_X >= 0
			pinMode(P2_BUTTON_X, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_Y >= 0
			pinMode(P2_BUTTON_Y, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_Z >= 0
			pinMode(P2_BUTTON_Z, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_W >= 0
			pinMode(P2_BUTTON_W, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_FIRE >= 0
			pinMode(P2_BUTTON_FIRE, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_FIRE2 >= 0
			pinMode(P2_BUTTON_FIRE2, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_LEFT >= 0
			pinMode(P2_BUTTON_LEFT, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_RIGHT >= 0
			pinMode(P2_BUTTON_RIGHT, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_UP >= 0
			pinMode(P2_BUTTON_UP, INPUT_PULLUP);
		#endif
		#if P2_BUTTON_DOWN >= 0
			pinMode(P2_BUTTON_DOWN, INPUT_PULLUP);
		#endif
		#if P2_ENCODER_A >= 0
			pinMode(P2_ENCODER_A, INPUT_PULLUP);
			pinMode(P2_ENCODER_B, INPUT_PULLUP);
		#endif
		#if P2_ENCODER2_A >= 0
			pinMode(P2_ENCODER2_A, INPUT_PULLUP);
			pinMode(P2_ENCODER2_B, INPUT_PULLUP);
		#endif
			break;
	}

	#if (P1_PAUSE_BUTTON >= 0 || P2_PAUSE_BUTTON >= 0) && defined(HAS_PLAY_PAUSE_BUTTON)
		Button_init(&pad->pauseButton, PAUSE_PRESS, PAUSE_RELEASE);
	#endif
	#if (P1_MENU_BUTTON >= 0 || P2_MENU_BUTTON >= 0) && defined(HAS_MENU_BUTTON)
		Button_init(&pad->menuButton, MENU_PRESS, MENU_RELEASE);
	#endif
	#if (P1_POWER_BUTTON >= 0 || P2_POWER_BUTTON >= 0) && defined(HAS_POWER_BUTTON)
		Button_init(&pad->powerButton, POWER_PRESS, POWER_RELEASE);
	#endif
	#if P1_BUTTON_A >= 0 || P2_BUTTON_A >= 0
		Button_init(&pad->buttonA, A_PRESS, A_RELEASE);
	#endif
	#if P1_BUTTON_B >= 0 || P2_BUTTON_B >= 0
		Button_init(&pad->buttonB, B_PRESS, B_RELEASE);
	#endif
	#if P1_BUTTON_C >= 0 || P2_BUTTON_C >= 0
		Button_init(&pad->buttonC, C_PRESS, C_RELEASE);
	#endif
	#if P1_BUTTON_D >= 0 || P2_BUTTON_D >= 0
		Button_init(&pad->buttonD, D_PRESS, D_RELEASE);
	#endif
	#if P1_BUTTON_X >= 0 || P2_BUTTON_X >= 0
		Button_init(&pad->buttonX, X_PRESS, X_RELEASE);
	#endif
	#if P1_BUTTON_Y >= 0 || P2_BUTTON_Y >= 0
		Button_init(&pad->buttonY, Y_PRESS, Y_RELEASE);
	#endif
	#if P1_BUTTON_Z >= 0 || P2_BUTTON_Z >= 0
		Button_init(&pad->buttonZ, Z_PRESS, Z_RELEASE);
	#endif
	#if P1_BUTTON_W >= 0 || P2_BUTTON_W >= 0
		Button_init(&pad->buttonW, W_PRESS, W_RELEASE);
	#endif
	#if P1_BUTTON_FIRE >= 0 || P2_BUTTON_FIRE >= 0
		Button_init(&pad->fireButton, FIRE_PRESS, FIRE_RELEASE);
	#endif
	#if P1_BUTTON_FIRE2 >= 0 || P2_BUTTON_FIRE2 >= 0
		Button_init(&pad->fire2Button, FIRE2_PRESS, FIRE2_RELEASE);
	#endif
	#if P1_BUTTON_LEFT >= 0 || P2_BUTTON_LEFT >= 0
		Button_init(&pad->leftButton, LEFT_PRESS, LEFT_RELEASE);
	#endif
	#if P1_BUTTON_RIGHT >= 0 || P2_BUTTON_RIGHT >= 0
		Button_init(&pad->rightButton, RIGHT_PRESS, RIGHT_RELEASE);
	#endif
	#if P1_BUTTON_UP >= 0 || P2_BUTTON_UP >= 0
		Button_init(&pad->upButton, UP_PRESS, UP_RELEASE);
	#endif
	#if P1_BUTTON_DOWN >= 0 || P2_BUTTON_DOWN >= 0
		Button_init(&pad->downButton, DOWN_PRESS, DOWN_RELEASE);
	#endif
	#if P1_ENCODER_A >= 0 || P2_ENCODER_A >= 0
		Encoder_init(&pad->encoder, ENCODER_LEFT, ENCODER_RIGHT);
	#endif
	#if P1_ENCODER2_A >= 0 || P2_ENCODER2_A >= 0
		Encoder_init(&pad->encoder2, ENCODER2_LEFT, ENCODER2_RIGHT);
	#endif
}

static inline void WiredControlPad_emit(WiredControlPad* pad, InputEvent* event) {
	System_handleInput(pad->system, pad->port, event);
}

static inline void WiredControlPad_loop(WiredControlPad* pad) {
	float now = pad->system->clock.time;
	InputEvent event;

	switch (pad->port) {
		case 0:
		#if P1_PAUSE_BUTTON >= 0 && defined(HAS_PLAY_PAUSE_BUTTON)
			if (Button_process(&pad->pauseButton, !digitalRead(P1_PAUSE_BUTTON), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_MENU_BUTTON >= 0 && defined(HAS_MENU_BUTTON)
			if (Button_process(&pad->menuButton, !digitalRead(P1_MENU_BUTTON), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_POWER_BUTTON >= 0 && defined(HAS_POWER_BUTTON)
			if (Button_process(&pad->powerButton, !digitalRead(P1_POWER_BUTTON), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_A >= 0
			if (Button_process(&pad->buttonA, !digitalRead(P1_BUTTON_A), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_B >= 0
			if (Button_process(&pad->buttonB, !digitalRead(P1_BUTTON_B), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_C >= 0
			if (Button_process(&pad->buttonC, !digitalRead(P1_BUTTON_C), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_D >= 0
			if (Button_process(&pad->buttonD, !digitalRead(P1_BUTTON_D), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_X >= 0
			if (Button_process(&pad->buttonX, !digitalRead(P1_BUTTON_X), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_Y >= 0
			if (Button_process(&pad->buttonY, !digitalRead(P1_BUTTON_Y), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_Z >= 0
			if (Button_process(&pad->buttonZ, !digitalRead(P1_BUTTON_Z), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_W >= 0
			if (Button_process(&pad->buttonW, !digitalRead(P1_BUTTON_W), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_FIRE >= 0
			if (Button_process(&pad->fireButton, !digitalRead(P1_BUTTON_FIRE), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_FIRE2 >= 0
			if (Button_process(&pad->fire2Button, !digitalRead(P1_BUTTON_FIRE2), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_LEFT >= 0
			if (Button_process(&pad->leftButton, !digitalRead(P1_BUTTON_LEFT), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_RIGHT >= 0
			if (Button_process(&pad->rightButton, !digitalRead(P1_BUTTON_RIGHT), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_UP >= 0
			if (Button_process(&pad->upButton, !digitalRead(P1_BUTTON_UP), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_BUTTON_DOWN >= 0
			if (Button_process(&pad->downButton, !digitalRead(P1_BUTTON_DOWN), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_ENCODER_A >= 0
			if (Encoder_process(&pad->encoder,
					!digitalRead(P1_ENCODER_A),
					!digitalRead(P1_ENCODER_B),
					now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P1_ENCODER2_A >= 0
			if (Encoder_process(&pad->encoder2,
					!digitalRead(P1_ENCODER2_A),
					!digitalRead(P1_ENCODER2_B),
					now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
			break;
		case 1:
		#if P2_PAUSE_BUTTON >= 0 && defined(HAS_PLAY_PAUSE_BUTTON)
			if (Button_process(&pad->pauseButton, !digitalRead(P2_PAUSE_BUTTON), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_MENU_BUTTON >= 0 && defined(HAS_MENU_BUTTON)
			if (Button_process(&pad->menuButton, !digitalRead(P2_MENU_BUTTON), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_POWER_BUTTON >= 0 && defined(HAS_POWER_BUTTON)
			if (Button_process(&pad->powerButton, !digitalRead(P2_POWER_BUTTON), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_A >= 0
			if (Button_process(&pad->buttonA, !digitalRead(P2_BUTTON_A), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_B >= 0
			if (Button_process(&pad->buttonB, !digitalRead(P2_BUTTON_B), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_C >= 0
			if (Button_process(&pad->buttonC, !digitalRead(P2_BUTTON_C), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_D >= 0
			if (Button_process(&pad->buttonD, !digitalRead(P2_BUTTON_D), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_X >= 0
			if (Button_process(&pad->buttonX, !digitalRead(P2_BUTTON_X), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_Y >= 0
			if (Button_process(&pad->buttonY, !digitalRead(P2_BUTTON_Y), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_Z >= 0
			if (Button_process(&pad->buttonZ, !digitalRead(P2_BUTTON_Z), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_W >= 0
			if (Button_process(&pad->buttonW, !digitalRead(P2_BUTTON_W), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_FIRE >= 0
			if (Button_process(&pad->fireButton, !digitalRead(P2_BUTTON_FIRE), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_FIRE2 >= 0
			if (Button_process(&pad->fire2Button, !digitalRead(P2_BUTTON_FIRE2), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_LEFT >= 0
			if (Button_process(&pad->leftButton, !digitalRead(P2_BUTTON_LEFT), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_RIGHT >= 0
			if (Button_process(&pad->rightButton, !digitalRead(P2_BUTTON_RIGHT), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_UP >= 0
			if (Button_process(&pad->upButton, !digitalRead(P2_BUTTON_UP), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_BUTTON_DOWN >= 0
			if (Button_process(&pad->downButton, !digitalRead(P2_BUTTON_DOWN), now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_ENCODER_A >= 0
			if (Encoder_process(&pad->encoder,
					!digitalRead(P2_ENCODER_A),
					!digitalRead(P2_ENCODER_B),
					now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
		#if P2_ENCODER2_A >= 0
			if (Encoder_process(&pad->encoder2,
					!digitalRead(P2_ENCODER2_A),
					!digitalRead(P2_ENCODER2_B),
					now, &event))
				WiredControlPad_emit(pad, &event);
		#endif
			break;
	}
}

#endif /* HARDWARE_CONTROLLER_H */
