class World2D : public BaseWorld {
public:
	float width;
	float depth;
	bool wrapsX;
	bool wrapsZ;

	World2D(float width, float depth, bool wrapsX, bool wrapsZ) {
		this->width = width;
		this->depth = depth;
		this->wrapsX = wrapsX;
		this->wrapsZ = wrapsZ;
	}
};
