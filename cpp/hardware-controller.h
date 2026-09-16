#ifndef HARDWARE_CONTROLLER_H
#define HARDWARE_CONTROLLER_H

#include <Arduino.h>
#include "system.h"

// #define HAS_POWER_BUTTON
// #define HAS_MENU_BUTTON
// #define HAS_PLAY_PAUSE_BUTTON
// #define HAS_BT_BUTTON
// #define HAS_BLE_BUTTON
// #define HAS_BT_BLE_BUTTON

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

class WiredControlPad {
public:
	WiredControlPad() {}
	WiredControlPad(System& system, int port);
	void loop();

private:
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

	inline void emitEvent(InputEvent& event) {
		system->handleInput(port, &event);
	}
};

inline WiredControlPad::WiredControlPad(System& sys, int p)
	: system(&sys), port(p) {

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
	pauseButton = Button(Action::PAUSE_PRESS, Action::PAUSE_RELEASE);
#endif
#if (P1_MENU_BUTTON >= 0 || P2_MENU_BUTTON >= 0) && defined(HAS_MENU_BUTTON)
	menuButton = Button(Action::MENU_PRESS, Action::MENU_RELEASE);
#endif
#if (P1_POWER_BUTTON >= 0 || P2_POWER_BUTTON >= 0) && defined(HAS_POWER_BUTTON)
	powerButton = Button(Action::POWER_PRESS, Action::POWER_RELEASE);
#endif
#if P1_BUTTON_A >= 0 || P2_BUTTON_A >= 0
	buttonA = Button(Action::A_PRESS, Action::A_RELEASE);
#endif
#if P1_BUTTON_B >= 0 || P2_BUTTON_B >= 0
	buttonB = Button(Action::B_PRESS, Action::B_RELEASE);
#endif
#if P1_BUTTON_C >= 0 || P2_BUTTON_C >= 0
	buttonC = Button(Action::C_PRESS, Action::C_RELEASE);
#endif
#if P1_BUTTON_D >= 0 || P2_BUTTON_D >= 0
	buttonD = Button(Action::D_PRESS, Action::D_RELEASE);
#endif
#if P1_BUTTON_X >= 0 || P2_BUTTON_X >= 0
	buttonX = Button(Action::X_PRESS, Action::X_RELEASE);
#endif
#if P1_BUTTON_Y >= 0 || P2_BUTTON_Y >= 0
	buttonY = Button(Action::Y_PRESS, Action::Y_RELEASE);
#endif
#if P1_BUTTON_Z >= 0 || P2_BUTTON_Z >= 0
	buttonZ = Button(Action::Z_PRESS, Action::Z_RELEASE);
#endif
#if P1_BUTTON_W >= 0 || P2_BUTTON_W >= 0
	buttonW = Button(Action::W_PRESS, Action::W_RELEASE);
#endif
#if P1_BUTTON_FIRE >= 0 || P2_BUTTON_FIRE >= 0
	fireButton = Button(Action::FIRE_PRESS, Action::FIRE_RELEASE);
#endif
#if P1_BUTTON_FIRE2 >= 0 || P2_BUTTON_FIRE2 >= 0
	fire2Button = Button(Action::FIRE2_PRESS, Action::FIRE2_RELEASE);
#endif
#if P1_BUTTON_LEFT >= 0 || P2_BUTTON_LEFT >= 0
	leftButton = Button(Action::LEFT_PRESS, Action::LEFT_RELEASE);
#endif
#if P1_BUTTON_RIGHT >= 0 || P2_BUTTON_RIGHT >= 0
	rightButton = Button(Action::RIGHT_PRESS, Action::RIGHT_RELEASE);
#endif
#if P1_BUTTON_UP >= 0 || P2_BUTTON_UP >= 0
	upButton = Button(Action::UP_PRESS, Action::UP_RELEASE);
#endif
#if P1_BUTTON_DOWN >= 0 || P2_BUTTON_DOWN >= 0
	downButton = Button(Action::DOWN_PRESS, Action::DOWN_RELEASE);
#endif
#if P1_ENCODER_A >= 0 || P2_ENCODER_A >= 0
	encoder = Encoder(Action::ENCODER_LEFT, Action::ENCODER_RIGHT);
#endif
#if P1_ENCODER2_A >= 0 || P2_ENCODER2_A >= 0
	encoder2 = Encoder(Action::ENCODER2_LEFT, Action::ENCODER2_RIGHT);
#endif
}

inline void WiredControlPad::loop() {
	float now = system->clock.time;
	InputEvent event;

	switch (port) {
		case 0:
#if P1_PAUSE_BUTTON >= 0 && defined(HAS_PLAY_PAUSE_BUTTON)
			if (pauseButton.process(!digitalRead(P1_PAUSE_BUTTON), now, &event))
				emitEvent(event);
#endif
#if P1_MENU_BUTTON >= 0 && defined(HAS_MENU_BUTTON)
			if (menuButton.process(!digitalRead(P1_MENU_BUTTON), now, &event))
				emitEvent(event);
#endif
#if P1_POWER_BUTTON >= 0 && defined(HAS_POWER_BUTTON)
			if (powerButton.process(!digitalRead(P1_POWER_BUTTON), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_A >= 0
			if (buttonA.process(!digitalRead(P1_BUTTON_A), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_B >= 0
			if (buttonB.process(!digitalRead(P1_BUTTON_B), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_C >= 0
			if (buttonC.process(!digitalRead(P1_BUTTON_C), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_D >= 0
			if (buttonD.process(!digitalRead(P1_BUTTON_D), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_X >= 0
			if (buttonX.process(!digitalRead(P1_BUTTON_X), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_Y >= 0
			if (buttonY.process(!digitalRead(P1_BUTTON_Y), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_Z >= 0
			if (buttonZ.process(!digitalRead(P1_BUTTON_Z), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_W >= 0
			if (buttonW.process(!digitalRead(P1_BUTTON_W), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_FIRE >= 0
			if (fireButton.process(!digitalRead(P1_BUTTON_FIRE), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_FIRE2 >= 0
			if (fire2Button.process(!digitalRead(P1_BUTTON_FIRE2), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_LEFT >= 0
			if (leftButton.process(!digitalRead(P1_BUTTON_LEFT), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_RIGHT >= 0
			if (rightButton.process(!digitalRead(P1_BUTTON_RIGHT), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_UP >= 0
			if (upButton.process(!digitalRead(P1_BUTTON_UP), now, &event))
				emitEvent(event);
#endif
#if P1_BUTTON_DOWN >= 0
			if (downButton.process(!digitalRead(P1_BUTTON_DOWN), now, &event))
				emitEvent(event);
#endif
#if P1_ENCODER_A >= 0
			if (encoder.process(!digitalRead(P1_ENCODER_A), !digitalRead(P1_ENCODER_B), now, &event))
				emitEvent(event);
#endif
#if P1_ENCODER2_A >= 0
			if (encoder2.process(!digitalRead(P1_ENCODER2_A), !digitalRead(P1_ENCODER2_B), now, &event))
				emitEvent(event);
#endif
			break;
		case 1:
#if P2_PAUSE_BUTTON >= 0 && defined(HAS_PLAY_PAUSE_BUTTON)
			if (pauseButton.process(!digitalRead(P2_PAUSE_BUTTON), now, &event))
				emitEvent(event);
#endif
#if P2_MENU_BUTTON >= 0 && defined(HAS_MENU_BUTTON)
			if (menuButton.process(!digitalRead(P2_MENU_BUTTON), now, &event))
				emitEvent(event);
#endif
#if P2_POWER_BUTTON >= 0 && defined(HAS_POWER_BUTTON)
			if (powerButton.process(!digitalRead(P2_POWER_BUTTON), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_A >= 0
			if (buttonA.process(!digitalRead(P2_BUTTON_A), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_B >= 0
			if (buttonB.process(!digitalRead(P2_BUTTON_B), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_C >= 0
			if (buttonC.process(!digitalRead(P2_BUTTON_C), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_D >= 0
			if (buttonD.process(!digitalRead(P2_BUTTON_D), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_X >= 0
			if (buttonX.process(!digitalRead(P2_BUTTON_X), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_Y >= 0
			if (buttonY.process(!digitalRead(P2_BUTTON_Y), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_Z >= 0
			if (buttonZ.process(!digitalRead(P2_BUTTON_Z), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_W >= 0
			if (buttonW.process(!digitalRead(P2_BUTTON_W), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_FIRE >= 0
			if (fireButton.process(!digitalRead(P2_BUTTON_FIRE), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_FIRE2 >= 0
			if (fire2Button.process(!digitalRead(P2_BUTTON_FIRE2), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_LEFT >= 0
			if (leftButton.process(!digitalRead(P2_BUTTON_LEFT), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_RIGHT >= 0
			if (rightButton.process(!digitalRead(P2_BUTTON_RIGHT), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_UP >= 0
			if (upButton.process(!digitalRead(P2_BUTTON_UP), now, &event))
				emitEvent(event);
#endif
#if P2_BUTTON_DOWN >= 0
			if (downButton.process(!digitalRead(P2_BUTTON_DOWN), now, &event))
				emitEvent(event);
#endif
#if P2_ENCODER_A >= 0
			if (encoder.process(!digitalRead(P2_ENCODER_A), !digitalRead(P2_ENCODER_B), now, &event))
				emitEvent(event);
#endif
#if P2_ENCODER2_A >= 0
			if (encoder2.process(!digitalRead(P2_ENCODER2_A), !digitalRead(P2_ENCODER2_B), now, &event))
				emitEvent(event);
#endif
			break;
	}
}

#endif
