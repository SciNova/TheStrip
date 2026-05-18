#ifndef HARDWARE_H
#define HARDWARE_H

#include "Game.h"
#include <Adafruit_NeoPixel.h>

#ifndef __AVR__
#define HAS_I2S
#endif

class Audio : public BaseAudio {
public:

	Audio();
	void begin();

	#if HAS_I2S
	void fill_buffer(int16_t* buffer, int samples);
	#endif
};







class Strip {
private:
	Game* game;

public:
	Strip(Game* g);
	void begin();
	void update();
};
#endif
