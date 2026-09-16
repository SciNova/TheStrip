#include "hardware-strip.h"
#include "hardware-pad.h"
//#include "moodlight.h"
//#include "whitelight.h"
#include "colorlight.h"
//#include "simonsays.h"
//#include "flappybird.h"

System sys;
AdafruitStripView view;
WiredControlPad pad;

//Moodlight moodlight;
//WhiteLight whitelight;
ColorLight colorlight;
//SimonSays simonsays;
//FlappyBird flappybird;

void setup() {
	System_init(&sys);

	//Moodlight_init(&moodlight, &sys);
	//sys.game = (Game*)&moodlight;
	//sys.state = SYSTEM_PLAY_STATE;

	//WhiteLight_init(&whitelight, &sys);
	//sys.game = (Game*)&whitelight;
	//sys.state = SYSTEM_PLAY_STATE;

	ColorLight_init(&colorlight, &sys);
	sys.game = (Game*)&colorlight;
	sys.state = SYSTEM_PLAY_STATE;

	//SimonSays_init(&simonsays, &sys);
	//sys.game = (Game*)&simonsays;
	//sys.state = SYSTEM_PLAY_STATE;

	//FlappyBird_init(&flappybird, &sys);
	//sys.game = (Game*)&flappybird;
	//sys.state = SYSTEM_PLAY_STATE;

	AdafruitStripView_init(&view, &sys.strip);
	WiredControlPad_init(&pad, &sys, 0);
}

void loop() {
	System_loop(&sys);
	WiredControlPad_loop(&pad);
	AdafruitStripView_update(&view);
}
