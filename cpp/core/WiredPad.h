class WiredPad : public Pad {
public:
	Button* buttons[18];

	WiredPad(System* system, int id) : Pad(system, id) {
		buttons[0] = new Button(system);
		buttons[1] = new Button(system);
		buttons[2] = new Button(system);
		buttons[3] = new Button(system);
		buttons[4] = new Button(system);
		buttons[5] = new Button(system);
		buttons[6] = new Button(system);
		buttons[7] = new Button(system);
		buttons[8] = new Button(system);
		buttons[9] = new Button(system);
		buttons[10] = new Button(system);
		buttons[11] = new Button(system);
		buttons[12] = new Button(system);
		buttons[13] = new Button(system);
		buttons[14] = new Button(system);
		buttons[15] = new Button(system);
		buttons[16] = new Button(system);
		buttons[17] = new Button(system);
	}
};
