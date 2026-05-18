#ifndef GAME_H
#define GAME_H

#include <stdint.h>

#ifndef __AVR__
#define HAS_AUDIO
#endif

#ifdef HAS_AUDIO
class Sound {
public:
	const uint8_t* pcm;
	uint32_t length;
	uint32_t position;
	bool isPlaying;

	Sound();
	Sound(const uint8_t* pcm, uint32_t length);
	void play();
	void stop();
};
#endif

class BaseAudio {
protected:
	#ifdef HAS_AUDIO
	Sound sounds[32];
	int16_t buffers[2][512];
	bool altBuffer;
	#endif
	
public:
	BaseAudio();
	void begin();
	void play(uint8_t soundId);
	#ifdef HAS_AUDIO
	void fill_buffer(int16_t* buffer, int samples);
	#endif
};



typedef void (*Callback)(void);

class Switch {
	private:
		Callback pressHandler;
		Callback releaseHandler;
		Callback holdHandler;
		Callback holdReleaseHandler;

		unsigned long pressTimestamp;
		unsigned long releaseTimestamp;
		
		unsigned long debounceDuration;
		unsigned long holdDuration;

		bool hold;

		enum ButtonState {
			IDLE,
			PRESS,
			HOLD,
			RELEASE
		} state;

	public:
		Switch(Callback onPress,
			Callback onRelease = nullptr,
			Callback onHold = nullptr,
			Callback onHoldRelease = nullptr,
			unsigned long debounceDuration = 50,
			unsigned long holdDuration = 1000);

		void update(bool val);
		ButtonState getState() const;
};

class Encoder {
	private:
		Callback rightHandler;
		Callback leftHandler;

		unsigned long clkTimestamp;
		unsigned long inputChangeTimestamp;
		unsigned long debounceDuration;

		int previousQuadState;
		int rawQuadState;

		enum State {
			IDLE,
			DEBOUNCING
		} state;

	public:
		Encoder(Callback onLeft, Callback onRight, unsigned long debounceDuration = 50);
		void update(bool clk, bool dir); 
};




namespace Color {
	const uint8_t Red[3] = {255, 0, 0};
	const uint8_t Green[3] = {0, 255, 0};
	const uint8_t Blue[3] = {0, 0, 255};
	const uint8_t White[3] = {255, 255, 255};
	const uint8_t Silver[3] = {192, 192, 192};
	const uint8_t None[3] = {0, 0, 0};
}

enum class Signal : uint8_t {
	None = 0,
	L = 1,
	R = 2,
	U = 3,
	D = 4,
	L2 = 5,
	R2 = 6,
	U2 = 7,
	D2 = 8,
	BA = 9,
	BB = 10,
	BC = 11,
	BX = 12,
	BY = 13,
	BZ = 14,
	A = 15,
	A2 = 16,
	EA1 = 17,
	EA2 = 18,
	EAB = 19,
	EB1 = 20,
	EB2 = 21,
	EBB = 22,
	EC1 = 23,
	EC2 = 24,
	ECB = 25
};


class Game;
extern Game* gameptr;

void onButtonAPress();
void onButtonARelease();
void onButtonBPress();
void onButtonBRelease();
void onButtonCPress();
void onButtonCRelease();

class Game {
public:
	uint8_t pixels[120][3];
	BaseAudio* audio;
	float uptime;
	float time;
	float levelTime;
	int level;
	bool isPaused;
	bool isSuspended;
	Game(BaseAudio* audio = nullptr);
	virtual ~Game();

	virtual void startLevel(int level = 0);
	virtual void nextLevel();
	virtual void restartLevel();

	void pause();
	void play();
	void defer(void (*handler)(), float seconds = 0);

	virtual void loop();

	virtual void buttonPress(Signal signal);
	virtual void buttonHold(Signal signal);
	virtual void buttonRelease(Signal signal);
	virtual void buttonReleaseHold(Signal signal);
	void log(const char* message);

private:
	float lastFrameTime;
	void (*pendingHandler)();
	float handlerTime;
};

class Controller {
public:
	Controller(Game* game,
			uint8_t pinA, Signal sigA,
			uint8_t pinB, Signal sigB,
			uint8_t pinC, Signal sigC);
	void loop();
private:
	uint8_t pins[3];
	Switch* buttons[3];
};

#endif
