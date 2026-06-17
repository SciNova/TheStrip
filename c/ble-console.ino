#include "hardware-strip.h"
#include "ble.h"

System sys;
AdafruitStripView view;
BLE ble;

void setup() {
	Serial.begin(115200);
	pinMode(2, OUTPUT);

	System_init(&sys);
	AdafruitStripView_init(&view, &sys.strip);
	ble.begin(&sys);
}

void loop() {
	digitalWrite(2, (millis() / 500) % 2);
	System_loop(&sys);
	AdafruitStripView_update(&view);
}
