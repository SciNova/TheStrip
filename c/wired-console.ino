#include "hardware-strip.h"
#include "hardware-controller.h"
#include "graphics.h"


#include "Moodlight.h"
#include "WhiteLight.h"
#include "ColorLight.h"
#include "SimonSays.h"
#include "FlappyBird.h"
#include "Slots.h"


System sys;
AdafruitStripView view;
WiredControlPad pad1;
WiredControlPad pad2;

//Moodlight moodlight;
//WhiteLight whitelight;
ColorLight colorlight;
//SimonSays simonsays;
//FlappyBird flappybird;
Slots slots;

void setup() {
	Serial.begin(115200);
	System_init(&sys);

	//Moodlight_init(&moodlight, &sys);
	// sys.game = (Game*)&moodlight;
	//sys.state = SYSTEM_PLAY_STATE;

	//WhiteLight_init(&whitelight, &sys);
	//sys.game = (Game*)&whitelight;
	//sys.state = SYSTEM_PLAY_STATE;

	Slots_init(&slots, &sys);
	sys.game = (Game*)&colorlight;
	sys.state = SYSTEM_PLAY_STATE;

	//ColorLight_init(&colorlight, &sys);
	//sys.game = (Game*)&colorlight;
	//sys.state = SYSTEM_PLAY_STATE;

	//SimonSays_init(&simonsays, &sys);
	//sys.game = (Game*)&simonsays;
	//sys.state = SYSTEM_PLAY_STATE;

	//FlappyBird_init(&flappybird, &sys);
	//sys.game = (Game*)&flappybird;
	//sys.state = SYSTEM_PLAY_STATE;

	AdafruitStripView_init(&view, &sys.strip);
	WiredControlPad_init(&pad1, &sys, 0);
	WiredControlPad_init(&pad2, &sys, 1);
}

void loop() {
	Serial.println(millis());
	System_loop(&sys);
	WiredControlPad_loop(&pad1);
	WiredControlPad_loop(&pad2);
	AdafruitStripView_update(&view);
}
