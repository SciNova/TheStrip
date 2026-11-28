class Strip {
public:
	int length;
	int* pixels;

	Strip(int length) {
		this->length = length;
		pixels = new int[length];
		for (int i = 0; i < length; i++) {
			pixels[i] = 0;
		}
	}

	void clear() {
		for (int i = 0; i < length; i++) {
			pixels[i] = 0;
		}
	}
};
