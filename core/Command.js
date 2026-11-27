export class Command {
	static NONE = 0;

	static A_PRESS = 0x01;
	static A_RELEASE = 0x02;
	static A = 0x01;

	static B_PRESS = 0x03;
	static B_RELEASE = 0x04;
	static B = 0x03;

	static C_PRESS = 0x05;
	static C_RELEASE = 0x06;
	static C = 0x05;

	static D_PRESS = 0x07;
	static D_RELEASE = 0x08;
	static D = 0x07;

	static X_PRESS = 0x09;
	static X_RELEASE = 0x0A;
	static X = 0x09;

	static Y_PRESS = 0x0B;
	static Y_RELEASE = 0x0C;
	static Y = 0x0B;

	static Z_PRESS = 0x0D;
	static Z_RELEASE = 0x0E;
	static Z = 0x0D;

	static W_PRESS = 0x0F;
	static W_RELEASE = 0x10;
	static W = 0x0F;

	static FIRE_PRESS = 0x11;
	static FIRE_RELEASE = 0x12;
	static FIRE = 0x11;

	static FIRE2_PRESS = 0x13;
	static FIRE2_RELEASE = 0x14;
	static FIRE2 = 0x13;

	static UP_PRESS = 0x15;
	static UP_RELEASE = 0x16;
	static UP = 0x15;

	static DOWN_PRESS = 0x17;
	static DOWN_RELEASE = 0x18;
	static DOWN = 0x17;

	static LEFT_PRESS = 0x19;
	static LEFT_RELEASE = 0x1A;
	static LEFT = 0x19;

	static RIGHT_PRESS = 0x1B;
	static RIGHT_RELEASE = 0x1C;
	static RIGHT = 0x1B;

	static ENCODER_LEFT = 0x1D;
	static ENCODER_RIGHT = 0x1E;
	static ENCODER2_LEFT = 0x1F;
	static ENCODER2_RIGHT = 0x20;

	static POWER_SHORT_PRESS = 0xFE;
	static POWER_LONG_PRESS = 0xFF;

	static MENU_SHORT_PRESS = 0xFC;
	static MENU_LONG_PRESS = 0xFD;

	static PAUSE_SHORT_PRESS = 0xFA;
	static PAUSE_LONG_PRESS = 0xFB;

	static BT_SHORT_PRESS = 0xF8;
	static BT_LONG_PRESS = 0xF9;

	static GAME_COMMANDS = [
		Command.A_PRESS,
		Command.B_PRESS,
		Command.C_PRESS,
		Command.D_PRESS,
		Command.X_PRESS,
		Command.Y_PRESS,
		Command.Z_PRESS,
		Command.W_PRESS,
		Command.FIRE_PRESS,
		Command.FIRE2_PRESS,
		Command.UP_PRESS,
		Command.DOWN_PRESS,
		Command.LEFT_PRESS,
		Command.RIGHT_PRESS,
	];

	static isGameCommand(command) {
		return Command.GAME_COMMANDS.includes(command);
	}
}
