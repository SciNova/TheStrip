#include "Game.h"


#ifdef HAS_AUDIO
Sound::Sound() {
	pcm = nullptr;
	length = 0;
	position = 0;
	isPlaying = false;
}

Sound::Sound(const uint8_t* pcm, uint32_t length) {
	this->pcm = pcm;
	this->length = length;
	position = 0;
	isPlaying = false;
}

void Sound::play() {
	position = 0;
	isPlaying = true;
}

void Sound::stop() {
	isPlaying = false;
}
#endif



BaseAudio::BaseAudio() {
	#ifdef HAS_AUDIO
	for (int i = 0; i < 32; i++)
		sounds[i] = Sound();
	#endif
}

void BaseAudio::begin() {
}

void BaseAudio::play(uint8_t soundId) {
	#ifdef HAS_AUDIO
	if (soundId < 32)
		sounds[soundId].play();
	#endif
}

#ifdef HAS_AUDIO
void BaseAudio::fill_buffer(int16_t* output_buffer, int samples) {
	for (int i = 0; i < samples; i++)
		output_buffer[i] = 0;
	int playing_count = 0;
	for (int s = 0; s < 32; s++) {
		if (sounds[s].isPlaying && sounds[s].pcm) {
			playing_count++;
			uint32_t temp_pos = sounds[s].position;  // DECLARE temp_pos
			for (int i = 0; i < samples; i++) {
				if (temp_pos < sounds[s].length) {
					int16_t sample = sounds[s].pcm[temp_pos] | 
									(sounds[s].pcm[temp_pos + 1] << 8);
					output_buffer[i] += sample;
					temp_pos += 2;
					if (temp_pos >= sounds[s].length) {
						sounds[s].isPlaying = false;
						break;
					}
				}
			}
			sounds[s].position = temp_pos;  // FIX TYPO: "position" not "positiont"
		}
	}
	if (playing_count > 0) {
		for (int i = 0; i < samples; i++)
			output_buffer[i] /= playing_count;
	}
}
#endif






#ifdef ARDUINO
	#include <Arduino.h>
	#define SYSTEM_MS() millis()
#else
	#include <sys/time.h>
	static unsigned long SYSTEM_MS() {
		struct timeval tv;
		gettimeofday(&tv, NULL);
		return (unsigned long)(tv.tv_sec * 1000ULL) + (unsigned long)(tv.tv_usec / 1000);
	}
#endif



Switch::Switch(Callback onPress,
	Callback onRelease,
	Callback onHold,
	Callback onHoldRelease,
	unsigned long debounceDuration,
	unsigned long holdDuration) :
	pressHandler(onPress),
	releaseHandler(onRelease),
	holdHandler(onHold),
	holdReleaseHandler(onHoldRelease),
	pressTimestamp(0),
	releaseTimestamp(0),
	debounceDuration(debounceDuration),
	holdDuration(holdDuration),
	hold(false),
	state(IDLE) {}

void Switch::update(bool val) {
	unsigned long now = SYSTEM_MS();
	switch (state) {
		case IDLE:
			if (val) {
				pressTimestamp = now;
				hold = false;
				if (pressHandler)
					pressHandler();
				state = PRESS;
			}
			break;
		case PRESS:
			if (!val) {
				releaseTimestamp = now;
				state = RELEASE;
			} else {
				if (!hold && (now - pressTimestamp) >= holdDuration) {
					if (holdHandler)
						holdHandler();
					hold = true;
					state = HOLD;
				}
			}
			break;
		case HOLD:
			if (!val) {
				releaseTimestamp = now;
				state = RELEASE;
			}
			break;
		case RELEASE:
			if (val) {
				if (hold)
					state = HOLD;
				else
					state = PRESS;
			} else {
				if ((now - releaseTimestamp) >= debounceDuration) {
					if (hold) {
						if (holdReleaseHandler)
							holdReleaseHandler();
					} else {
						if (releaseHandler)
							releaseHandler();
					}
					state = IDLE;
				}
			}
			break;
	}
}

Switch::ButtonState Switch::getState() const {
	return state;
}

Encoder::Encoder(Callback onLeft, Callback onRight, unsigned long debounceDuration) :
	rightHandler(onRight),
	leftHandler(onLeft),
	clkTimestamp(0),
	inputChangeTimestamp(0),
	debounceDuration(debounceDuration),
	previousQuadState(0),
	rawQuadState(0),
	state(IDLE) {}

void Encoder::update(bool clk, bool dir) {
	unsigned long now = SYSTEM_MS();  // Replaced millis() with SYSTEM_MS()
	int currentRawQuadState = (clk << 1) | dir;
	if (currentRawQuadState != rawQuadState) {
		rawQuadState = currentRawQuadState;
		inputChangeTimestamp = now;
	}
	int debouncedQuadState = previousQuadState;
	if ((now - inputChangeTimestamp) >= debounceDuration)
		debouncedQuadState = rawQuadState;

	if (debouncedQuadState != previousQuadState) {
		int transition = (previousQuadState << 2) | debouncedQuadState;
		bool stepDetected = false;
		switch (state) {
			case IDLE:
				if (transition == 0x01 || transition == 0x07 || transition == 0x0E || transition == 0x08) {
					if (rightHandler) {
						rightHandler();
					}
					stepDetected = true;
				}
				else if (transition == 0x02 || transition == 0x0B || transition == 0x0D || transition == 0x04) {
					if (leftHandler)
						leftHandler();
					stepDetected = true;
				}
				if (stepDetected) {
					clkTimestamp = now;
					state = DEBOUNCING;
				}
				break;
			case DEBOUNCING:
				break;
			default:
				break;
		}
	}
	previousQuadState = debouncedQuadState;
	if (state == DEBOUNCING && (now - clkTimestamp) >= debounceDuration)
		state = IDLE;
}



Game::~Game() {
}

Game::Game(BaseAudio* a) {
	audio = a;

	#ifdef HAS_AUDIO
	for (int i = 0; i < NUM_SOUNDS; i++) {
		audio->sounds[i].pcm = SOUNDS[i];
		audio->sounds[i].length = DURATIONS[i] * 44100 * 2; // seconds × sample rate × 2 bytes
		audio->sounds[i].position = 0;
		audio->sounds[i].isPlaying = false;
	}
	#endif

	for (int i = 0; i < 120; i++) {
		pixels[i][0] = 0;
		pixels[i][1] = 0;
		pixels[i][2] = 0;
	}
	uptime = 0;
	time = 0;
	levelTime = 0;
	level = 0;
	isPaused = false;
	isSuspended = false;
	pendingHandler = nullptr;
	handlerTime = 0;
	lastFrameTime = millis() / 1000.0f;
}




void Game::startLevel(int lvl) {
	level = lvl;
	levelTime = 0;
	isPaused = false;
	isSuspended = false;
}

void Game::nextLevel() {
	level++;
	levelTime = 0;
	isPaused = false;
	isSuspended = false;
}

void Game::restartLevel() {
	levelTime = 0;
	isPaused = false;
	isSuspended = false;
}

void Game::pause() {
	isPaused = true;
}

void Game::play() {
	isPaused = false;
}

void Game::defer(void (*handler)(), float seconds) {
	isSuspended = true;
	pendingHandler = handler;
	handlerTime = uptime + seconds;
}

void Game::loop() {
	float now = millis() / 1000.0f;
	float delta = now - lastFrameTime;
	lastFrameTime = now;
	uptime += delta;
	if (!isPaused && !isSuspended) {
		time += delta;
		levelTime += delta;
	}
	if (isSuspended && uptime >= handlerTime) {
		void (*handler)() = pendingHandler;
		pendingHandler = nullptr;
		handlerTime = 0;
		isSuspended = false;
		if (handler) {
			handler();
		}
	}
}

void Game::buttonPress(Signal signal) {
}

void Game::buttonHold(Signal signal) {
}

void Game::buttonRelease(Signal signal) {
}

void Game::buttonReleaseHold(Signal signal) {
}

void Game::log(const char* message) {
	Serial.println(message);
}

Game* gameptr = nullptr;

void onButtonAPress() {
	gameptr->buttonPress(Signal::BA);
}

void onButtonARelease() {
	gameptr->buttonRelease(Signal::BA);
}

void onButtonBPress() {
	gameptr->buttonPress(Signal::BB);
}

void onButtonBRelease() {
	gameptr->buttonRelease(Signal::BB);
}

void onButtonCPress() {
	gameptr->buttonPress(Signal::BC);
}

void onButtonCRelease() {
	gameptr->buttonRelease(Signal::BC);
}

Controller::Controller(Game* game, 
		uint8_t pinA, Signal sigA,
		uint8_t pinB, Signal sigB,
		uint8_t pinC, Signal sigC) {
	gameptr = game;
	pins[0] = pinA;
	pins[1] = pinB;
	pins[2] = pinC;
	buttons[0] = new Switch(onButtonAPress, onButtonARelease, nullptr, nullptr, 50, 1000);
	buttons[1] = new Switch(onButtonBPress, onButtonBRelease, nullptr, nullptr, 50, 1000);
	buttons[2] = new Switch(onButtonCPress, onButtonCRelease, nullptr, nullptr, 50, 1000);
	pinMode(pinA, INPUT_PULLUP);
	pinMode(pinB, INPUT_PULLUP);
	pinMode(pinC, INPUT_PULLUP);
}

void Controller::loop() {
	for (int i = 0; i < 3; i++) {
		bool pressed = digitalRead(pins[i]) == LOW;
		buttons[i]->update(pressed);
	}
}
