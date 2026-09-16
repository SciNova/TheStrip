#include "hardware-controller.h"
#include "hardware-strip.h"
//#include "hardware-display.h"
#include "system.h"
#include "graphics.h"

//#include "WhiteLight.h"
//#include "ColorLight.h"
//#include "MoodLight.h"
//#include "FlappyBird.h"
//#include "Slots.h"
//#include "SimonSays.h"
//#include "Dino.h"
#include "DemoScene.h"
//#include "Dices.h"
//#include "DicesClock.h"
//#include "Race.h"
//#include "Stack.h"
//#include "Cars.h"

//WhiteLight whitelight;
//ColorLight colorlight;
//FlappyBird flappybird;
//Moodlight moodlight;
//Slots slots;
//SimonSays simonsays;
//Dino dino;
DemoScene demoscene;
//Dices dices;
//DicesClock dicesclock;
//Race race;
//Stack stack;
//Cars cars;

System sys;
WiredControlPad ctrl;
AdafruitStripView stripView;

void setup() {
	ctrl = WiredControlPad(sys, 0);
	stripView = AdafruitStripView(sys.strip);
	demoscene = DemoScene(&sys);
	sys.game = &demoscene;
}

void loop() {
	ctrl.loop();
	sys.loop();
	stripView.update();
}
