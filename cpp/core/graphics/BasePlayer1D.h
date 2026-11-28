class BasePlayer1D : public BasePlayer {
public:
	float location;

	BasePlayer1D(Game* game) : BasePlayer(game) {
		location = 0.0;
	}

	float distance(float location) {
		World* world = game->world;
		float d = this->location - location;
		if (world->wraps) {
			float half = world->size * game->resolution / 2.0;
			d = fmod(fmod(d + half, 2 * half) + 2 * half, 2 * half) - half;
		}
		return fabs(d);
	}
};
