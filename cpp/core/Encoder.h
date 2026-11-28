enum class EncoderState {
	IDLE,
	DEBOUNCING,
};

enum class EncoderEvent {
	LEFT,
	RIGHT,
};

class Encoder {
public:
	static constexpr float DEBOUNCE_DURATION = 0.0;

	EncoderState state;
	int rawQuadState;
	int previousQuadState;
	float clkTimestamp;
	float inputChangeTimestamp;

	Encoder() {
		state = EncoderState::IDLE;
		rawQuadState = 0;
		previousQuadState = 0;
		clkTimestamp = 0.0;
		inputChangeTimestamp = 0.0;
	}

	bool update(int clk, int direction, float now, EncoderEvent* outEvent) {
		int currentRaw = (clk << 1) | direction;
		if (currentRaw != rawQuadState) {
			rawQuadState = currentRaw;
			inputChangeTimestamp = now;
		}

		int debounced = previousQuadState;
		if ((now - inputChangeTimestamp) >= DEBOUNCE_DURATION) {
			debounced = rawQuadState;
		}

		bool hasEvent = false;
		if (debounced != previousQuadState) {
			int transition = (previousQuadState << 2) | debounced;
			if (state == EncoderState::IDLE) {
				if (transition == 0x01 || transition == 0x07 || transition == 0x0E || transition == 0x08) {
					*outEvent = EncoderEvent::RIGHT;
					hasEvent = true;
				} else if (transition == 0x02 || transition == 0x0B || transition == 0x0D || transition == 0x04) {
					*outEvent = EncoderEvent::LEFT;
					hasEvent = true;
				}
				if (hasEvent) {
					clkTimestamp = now;
					state = EncoderState::DEBOUNCING;
				}
			}
		}

		previousQuadState = debounced;
		if (state == EncoderState::DEBOUNCING && (now - clkTimestamp) >= DEBOUNCE_DURATION) {
			state = EncoderState::IDLE;
		}

		return hasEvent;
	}
};
