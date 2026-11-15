#include <Arduino.h>
#include "Game.h"
#include "Stack.h"
#include "Hardware.h"

Audio audio;

Stack game(&audio);

Strip strip(&game);
Controller controller(&game, 2, Signal::BA, 3, Signal::BB, 4, Signal::BC);

void setup() {
	Serial.begin(115200);
	Serial.println("Stack");

	audio.begin();
	strip.begin();
	game.startLevel(0);
}

void loop() {
	game.loop();
	controller.loop();
	strip.update();
	delay(10);
}
