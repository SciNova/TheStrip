class Widget {
public:
	Game* game;
	int location;
	int size;
	bool inverted;
	float fade;
	WidgetState state;
	float timestamp;
	float startTime;
	float alpha;
	bool blend;

	Widget(Game* game, int location, int size, bool inverted = false, float fade = 0.5) {
		this->game = game;
		this->location = location;
		this->size = size;
		this->inverted = inverted;
		this->fade = fade;
		state = WidgetState::OFF;
		timestamp = 0.0;
		startTime = 0.0;
		alpha = 0.0;
		blend = false;
	}

	void start() {
		startTime = game->time;
	}

	void show() {
		state = WidgetState::ON;
		alpha = 1.0;
		start();
	}

	void hide() {
		state = WidgetState::OFF;
		alpha = 0.0;
	}

	void fadeIn() {
		state = WidgetState::FADE_IN;
		timestamp = game->time;
	}

	void fadeOut() {
		state = WidgetState::FADE_OUT;
		timestamp = game->time;
	}

	void update() {
		if (state == WidgetState::OFF || state == WidgetState::ON) {
			return;
		}

		float elapsed = game->time - timestamp;
		float t = fmin(elapsed / fade, 1.0);

		if (state == WidgetState::FADE_IN) {
			alpha = t;
			if (t >= 1.0) {
				state = WidgetState::ON;
				start();
			}
		} else {
			alpha = 1.0 - t;
			if (t >= 1.0) {
				state = WidgetState::OFF;
			}
		}

		render();
	}

	void render() {
		int step = inverted ? -1 : 1;

		for (int i = 0; i < size; i++) {
			int pos = location + i * step;
			if (pos < 0 || pos >= game->resolution) {
				continue;
			}

			int value = renderPixel(i);
			if (blend) {
				game->blend(pos, value, alpha);
			} else {
				game->pixels[pos] = value;
			}
		}
	}

	virtual int renderPixel(int i) {
		return 0x000000;
	}
};
