class DebouncedPin {
public:
	static constexpr float DEBOUNCE_DURATION = 0.0;

	bool state;
	float timestamp;

	DebouncedPin() {
		state = false;
		timestamp = 0.0;
	}

	bool process(bool value, float now) {
		if (value != state) {
			timestamp = now;
		}
		if ((now - timestamp) >= DEBOUNCE_DURATION && value != state) {
			state = value;
		}
		return state;
	}
};
