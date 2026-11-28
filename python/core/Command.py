class Command:
	A_PRESS = 0x01
	A_RELEASE = 0x02
	A = 0x01

	B_PRESS = 0x03
	B_RELEASE = 0x04
	B = 0x03

	C_PRESS = 0x05
	C_RELEASE = 0x06
	C = 0x05

	D_PRESS = 0x07
	D_RELEASE = 0x08
	D = 0x07

	X_PRESS = 0x09
	X_RELEASE = 0x0A
	X = 0x09

	Y_PRESS = 0x0B
	Y_RELEASE = 0x0C
	Y = 0x0B

	Z_PRESS = 0x0D
	Z_RELEASE = 0x0E
	Z = 0x0D

	W_PRESS = 0x0F
	W_RELEASE = 0x10
	W = 0x0F

	FIRE_PRESS = 0x11
	FIRE_RELEASE = 0x12
	FIRE = 0x11

	FIRE2_PRESS = 0x13
	FIRE2_RELEASE = 0x14
	FIRE2 = 0x13

	UP_PRESS = 0x15
	UP_RELEASE = 0x16
	UP = 0x15

	DOWN_PRESS = 0x17
	DOWN_RELEASE = 0x18
	DOWN = 0x17

	LEFT_PRESS = 0x19
	LEFT_RELEASE = 0x1A
	LEFT = 0x19

	RIGHT_PRESS = 0x1B
	RIGHT_RELEASE = 0x1C
	RIGHT = 0x1B

	ENCODER_LEFT = 0x1D
	ENCODER_RIGHT = 0x1E
	ENCODER2_LEFT = 0x1F
	ENCODER2_RIGHT = 0x20

	POWER_SHORT_PRESS = 0xFE
	POWER_LONG_PRESS = 0xFF

	MENU_SHORT_PRESS = 0xFC
	MENU_LONG_PRESS = 0xFD

	PAUSE_SHORT_PRESS = 0xFA
	PAUSE_LONG_PRESS = 0xFB

	BT_SHORT_PRESS = 0xF8
	BT_LONG_PRESS = 0xF9

	@staticmethod
	def isGameCommand(command):
		return (command == Command.A_PRESS
			or command == Command.B_PRESS
			or command == Command.C_PRESS
			or command == Command.D_PRESS
			or command == Command.X_PRESS
			or command == Command.Y_PRESS
			or command == Command.Z_PRESS
			or command == Command.W_PRESS
			or command == Command.FIRE_PRESS
			or command == Command.FIRE2_PRESS
			or command == Command.UP_PRESS
			or command == Command.DOWN_PRESS
			or command == Command.LEFT_PRESS
			or command == Command.RIGHT_PRESS)
