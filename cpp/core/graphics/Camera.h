class Camera {
public:
	float x;
	float z;
	float rotation;

	Camera(float x = 0.0, float z = 0.0, float rotation = 0.0) {
		this->x = x;
		this->z = z;
		this->rotation = rotation;
	}
};
