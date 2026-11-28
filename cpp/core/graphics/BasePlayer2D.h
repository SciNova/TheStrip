class BasePlayer2D : public BasePlayer {
public:
	float z;
	float x;
	float rotation;

	BasePlayer2D(Game* game) : BasePlayer(game) {
		z = 0.0;
		x = 0.0;
		rotation = 0.0;
	}

	float distance(float z, float x) {
		World2D* world = game->world;
		float dx = this->x - x;
		float dz = this->z - z;
		if (world->wrapsZ) {
			float halfZ = world->width * game->resolution / 2.0;
			dz = fmod(fmod(dz + halfZ, 2 * halfZ) + 2 * halfZ, 2 * halfZ) - halfZ;
		}
		if (world->wrapsX) {
			float halfX = world->depth * game->resolution / 2.0;
			dx = fmod(fmod(dx + halfX, 2 * halfX) + 2 * halfX, 2 * halfX) - halfX;
		}
		return sqrt(dx * dx + dz * dz);
	}

	float direction(float z, float x) {
		float dx = x - this->x;
		float dz = z - this->z;
		float angle = atan2(dz, dx);
		return fmod(fmod(angle / (2 * M_PI) + 1, 1) + 1, 1);
	}
};
