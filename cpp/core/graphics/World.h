class World : public BaseWorld {
public:
	float size;
	bool wraps;

	World(float size, bool wraps) {
		this->size = size;
		this->wraps = wraps;
	}
};
