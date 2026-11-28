enum class ButtonState {
	IDLE,
	PRESS,
	HOLD,
};

enum class ButtonEvent {
	PRESS,
	RELEASE,
	HOLD,
	HOLDRELEASE,
};

class Button {
public:
	static constexpr float HOLD_DURATION = 5.0;

	static constexpr int A = 0;
	static constexpr int B = 1;
	static constexpr int C = 2;
	static constexpr int D = 3;
	static constexpr int X = 4;
	static constexpr int Y = 5;
	static constexpr int Z = 6;
	static constexpr int W = 7;
	static constexpr int FIRE = 8;
	static constexpr int FIRE2 = 9;
	static constexpr int UP = 10;
	static constexpr int DOWN = 11;
	static constexpr int LEFT = 12;
	static constexpr int RIGHT = 13;
	static constexpr int POWER = 14;
	static constexpr int MENU = 15;
	static constexpr int PAUSE = 16;
	static constexpr int BT = 17;

	System* system;
	ButtonState state;
	float pressTimestamp;
	bool held;

	Button(System* system) {
		this->system = system;
		state = ButtonState::IDLE;
		pressTimestamp = 0.0;
		held = false;
	}

	bool process(bool value, ButtonEvent* outEvent) {
		float now = system->clock.timestamp;
		if (value && state == ButtonState::IDLE) {
			state = ButtonState::PRESS;
			pressTimestamp = now;
			held = false;
			*outEvent = ButtonEvent::PRESS;
			return true;
		} else if (!value && (state == ButtonState::PRESS || state == ButtonState::HOLD)) {
			ButtonEvent event = state == ButtonState::HOLD ? ButtonEvent::HOLDRELEASE : ButtonEvent::RELEASE;
			state = ButtonState::IDLE;
			*outEvent = event;
			return true;
		} else if (state == ButtonState::PRESS && !held) {
			if ((now - pressTimestamp) >= HOLD_DURATION) {
				state = ButtonState::HOLD;
				held = true;
				*outEvent = ButtonEvent::HOLD;
				return true;
			}
		}
		return false;
	}
};
