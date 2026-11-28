class ProgressBar : public Widget {
public:
	int color;
	float value;

	ProgressBar(Game* game, int location, int size, int color, bool inverted = false) : Widget(game, location, size, inverted) {
		this->color = color;
		value = 0.0;
	}

	int renderPixel(int i) override {
		int filled = fmin(round(value * size), size);
		return i < filled ? color : 0x000000;
	}
};
