class Command {
public:
	static constexpr int A_PRESS = 0x01;
	static constexpr int A_RELEASE = 0x02;
	static constexpr int A = 0x01;

	static constexpr int B_PRESS = 0x03;
	static constexpr int B_RELEASE = 0x04;
	static constexpr int B = 0x03;

	static constexpr int C_PRESS = 0x05;
	static constexpr int C_RELEASE = 0x06;
	static constexpr int C = 0x05;

	static constexpr int D_PRESS = 0x07;
	static constexpr int D_RELEASE = 0x08;
	static constexpr int D = 0x07;

	static constexpr int X_PRESS = 0x09;
	static constexpr int X_RELEASE = 0x0A;
	static constexpr int X = 0x09;

	static constexpr int Y_PRESS = 0x0B;
	static constexpr int Y_RELEASE = 0x0C;
	static constexpr int Y = 0x0B;

	static constexpr int Z_PRESS = 0x0D;
	static constexpr int Z_RELEASE = 0x0E;
	static constexpr int Z = 0x0D;

	static constexpr int W_PRESS = 0x0F;
	static constexpr int W_RELEASE = 0x10;
	static constexpr int W = 0x0F;

	static constexpr int FIRE_PRESS = 0x11;
	static constexpr int FIRE_RELEASE = 0x12;
	static constexpr int FIRE = 0x11;

	static constexpr int FIRE2_PRESS = 0x13;
	static constexpr int FIRE2_RELEASE = 0x14;
	static constexpr int FIRE2 = 0x13;

	static constexpr int UP_PRESS = 0x15;
	static constexpr int UP_RELEASE = 0x16;
	static constexpr int UP = 0x15;

	static constexpr int DOWN_PRESS = 0x17;
	static constexpr int DOWN_RELEASE = 0x18;
	static constexpr int DOWN = 0x17;

	static constexpr int LEFT_PRESS = 0x19;
	static constexpr int LEFT_RELEASE = 0x1A;
	static constexpr int LEFT = 0x19;

	static constexpr int RIGHT_PRESS = 0x1B;
	static constexpr int RIGHT_RELEASE = 0x1C;
	static constexpr int RIGHT = 0x1B;

	static constexpr int ENCODER_LEFT = 0x1D;
	static constexpr int ENCODER_RIGHT = 0x1E;
	static constexpr int ENCODER2_LEFT = 0x1F;
	static constexpr int ENCODER2_RIGHT = 0x20;

	static constexpr int POWER_SHORT_PRESS = 0xFE;
	static constexpr int POWER_LONG_PRESS = 0xFF;

	static constexpr int MENU_SHORT_PRESS = 0xFC;
	static constexpr int MENU_LONG_PRESS = 0xFD;

	static constexpr int PAUSE_SHORT_PRESS = 0xFA;
	static constexpr int PAUSE_LONG_PRESS = 0xFB;

	static constexpr int BT_SHORT_PRESS = 0xF8;
	static constexpr int BT_LONG_PRESS = 0xF9;

	static bool isGameCommand(int command) {
		return command == A_PRESS
			|| command == B_PRESS
			|| command == C_PRESS
			|| command == D_PRESS
			|| command == X_PRESS
			|| command == Y_PRESS
			|| command == Z_PRESS
			|| command == W_PRESS
			|| command == FIRE_PRESS
			|| command == FIRE2_PRESS
			|| command == UP_PRESS
			|| command == DOWN_PRESS
			|| command == LEFT_PRESS
			|| command == RIGHT_PRESS;
	}
};
