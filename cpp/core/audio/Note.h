class Note {
public:
	static constexpr int C0 = 0;
	static constexpr int C_0 = 1;
	static constexpr int D0 = 2;
	static constexpr int D_0 = 3;
	static constexpr int E0 = 4;
	static constexpr int F0 = 5;
	static constexpr int F_0 = 6;
	static constexpr int G0 = 7;
	static constexpr int G_0 = 8;
	static constexpr int A0 = 9;
	static constexpr int A_0 = 10;
	static constexpr int B0 = 11;
	static constexpr int C1 = 12;
	static constexpr int C_1 = 13;
	static constexpr int D1 = 14;
	static constexpr int D_1 = 15;
	static constexpr int E1 = 16;
	static constexpr int F1 = 17;
	static constexpr int F_1 = 18;
	static constexpr int G1 = 19;
	static constexpr int G_1 = 20;
	static constexpr int A1 = 21;
	static constexpr int A_1 = 22;
	static constexpr int B1 = 23;
	static constexpr int C2 = 24;
	static constexpr int C_2 = 25;
	static constexpr int D2 = 26;
	static constexpr int D_2 = 27;
	static constexpr int E2 = 28;
	static constexpr int F2 = 29;
	static constexpr int F_2 = 30;
	static constexpr int G2 = 31;
	static constexpr int G_2 = 32;
	static constexpr int A2 = 33;
	static constexpr int A_2 = 34;
	static constexpr int B2 = 35;
	static constexpr int C3 = 36;
	static constexpr int C_3 = 37;
	static constexpr int D3 = 38;
	static constexpr int D_3 = 39;
	static constexpr int E3 = 40;
	static constexpr int F3 = 41;
	static constexpr int F_3 = 42;
	static constexpr int G3 = 43;
	static constexpr int G_3 = 44;
	static constexpr int A3 = 45;
	static constexpr int A_3 = 46;
	static constexpr int B3 = 47;
	static constexpr int C4 = 48;
	static constexpr int C_4 = 49;
	static constexpr int D4 = 50;
	static constexpr int D_4 = 51;
	static constexpr int E4 = 52;
	static constexpr int F4 = 53;
	static constexpr int F_4 = 54;
	static constexpr int G4 = 55;
	static constexpr int G_4 = 56;
	static constexpr int A4 = 57;
	static constexpr int A_4 = 58;
	static constexpr int B4 = 59;
	static constexpr int C5 = 60;
	static constexpr int C_5 = 61;
	static constexpr int D5 = 62;
	static constexpr int D_5 = 63;
	static constexpr int E5 = 64;
	static constexpr int F5 = 65;
	static constexpr int F_5 = 66;
	static constexpr int G5 = 67;
	static constexpr int G_5 = 68;
	static constexpr int A5 = 69;
	static constexpr int A_5 = 70;
	static constexpr int B5 = 71;
	static constexpr int C6 = 72;
	static constexpr int C_6 = 73;
	static constexpr int D6 = 74;
	static constexpr int D_6 = 75;
	static constexpr int E6 = 76;
	static constexpr int F6 = 77;
	static constexpr int F_6 = 78;
	static constexpr int G6 = 79;
	static constexpr int G_6 = 80;
	static constexpr int A6 = 81;
	static constexpr int A_6 = 82;
	static constexpr int B6 = 83;
	static constexpr int C7 = 84;
	static constexpr int C_7 = 85;
	static constexpr int D7 = 86;
	static constexpr int D_7 = 87;
	static constexpr int E7 = 88;
	static constexpr int F7 = 89;
	static constexpr int F_7 = 90;
	static constexpr int G7 = 91;
	static constexpr int G_7 = 92;
	static constexpr int A7 = 93;
	static constexpr int A_7 = 94;
	static constexpr int B7 = 95;
	static constexpr int C8 = 96;
	static constexpr int C_8 = 97;
	static constexpr int D8 = 98;
	static constexpr int D_8 = 99;
	static constexpr int E8 = 100;
	static constexpr int F8 = 101;
	static constexpr int F_8 = 102;
	static constexpr int G8 = 103;
	static constexpr int G_8 = 104;
	static constexpr int A8 = 105;
	static constexpr int A_8 = 106;
	static constexpr int B8 = 107;

	static float frequency(int note) {
		return 440 * pow(2, (note - Note::A4) / 12.0);
	}

	static int value(int note, int octave) {
		return octave * 12 + note;
	}
};

class Scale {
public:
	static constexpr int MAJOR[] = {
		Note::C4,
		Note::D4,
		Note::E4,
		Note::F4,
		Note::G4,
		Note::A4,
		Note::B4,
		Note::C5,
		Note::D5,
		Note::E5,
		Note::F5,
		Note::G5,
		Note::A5,
		Note::B5,
		Note::C6,
	};
	static constexpr int MINOR[] = {
		Note::C4,
		Note::D4,
		Note::D_4,
		Note::F4,
		Note::G4,
		Note::G_4,
		Note::A_4,
		Note::C5,
		Note::D5,
		Note::D_5,
		Note::F5,
		Note::G5,
		Note::G_5,
		Note::A_5,
		Note::C6,
	};
	static constexpr int ARABIC[] = {
		Note::C4,
		Note::C_4,
		Note::E4,
		Note::F4,
		Note::G4,
		Note::G_4,
		Note::B4,
		Note::C5,
		Note::C_5,
		Note::E5,
		Note::F5,
		Note::G5,
		Note::G_5,
		Note::B5,
		Note::C6,
	};
	static constexpr int CHINESE[] = {
		Note::C4,
		Note::D4,
		Note::E4,
		Note::G4,
		Note::A4,
		Note::C5,
		Note::D5,
		Note::E5,
		Note::G5,
		Note::A5,
		Note::C6,
	};
	static constexpr int SCARY[] = {
		Note::C4,
		Note::E4,
		Note::G_4,
		Note::C5,
		Note::E5,
		Note::G_5,
		Note::C6,
	};
};
