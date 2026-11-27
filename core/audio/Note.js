export class Note {
	static C0 = 0;
	static C_0 = 1;
	static D0 = 2;
	static D_0 = 3;
	static E0 = 4;
	static F0 = 5;
	static F_0 = 6;
	static G0 = 7;
	static G_0 = 8;
	static A0 = 9;
	static A_0 = 10;
	static B0 = 11;
	static C1 = 12;
	static C_1 = 13;
	static D1 = 14;
	static D_1 = 15;
	static E1 = 16;
	static F1 = 17;
	static F_1 = 18;
	static G1 = 19;
	static G_1 = 20;
	static A1 = 21;
	static A_1 = 22;
	static B1 = 23;
	static C2 = 24;
	static C_2 = 25;
	static D2 = 26;
	static D_2 = 27;
	static E2 = 28;
	static F2 = 29;
	static F_2 = 30;
	static G2 = 31;
	static G_2 = 32;
	static A2 = 33;
	static A_2 = 34;
	static B2 = 35;
	static C3 = 36;
	static C_3 = 37;
	static D3 = 38;
	static D_3 = 39;
	static E3 = 40;
	static F3 = 41;
	static F_3 = 42;
	static G3 = 43;
	static G_3 = 44;
	static A3 = 45;
	static A_3 = 46;
	static B3 = 47;
	static C4 = 48;
	static C_4 = 49;
	static D4 = 50;
	static D_4 = 51;
	static E4 = 52;
	static F4 = 53;
	static F_4 = 54;
	static G4 = 55;
	static G_4 = 56;
	static A4 = 57;
	static A_4 = 58;
	static B4 = 59;
	static C5 = 60;
	static C_5 = 61;
	static D5 = 62;
	static D_5 = 63;
	static E5 = 64;
	static F5 = 65;
	static F_5 = 66;
	static G5 = 67;
	static G_5 = 68;
	static A5 = 69;
	static A_5 = 70;
	static B5 = 71;
	static C6 = 72;
	static C_6 = 73;
	static D6 = 74;
	static D_6 = 75;
	static E6 = 76;
	static F6 = 77;
	static F_6 = 78;
	static G6 = 79;
	static G_6 = 80;
	static A6 = 81;
	static A_6 = 82;
	static B6 = 83;
	static C7 = 84;
	static C_7 = 85;
	static D7 = 86;
	static D_7 = 87;
	static E7 = 88;
	static F7 = 89;
	static F_7 = 90;
	static G7 = 91;
	static G_7 = 92;
	static A7 = 93;
	static A_7 = 94;
	static B7 = 95;
	static C8 = 96;
	static C_8 = 97;
	static D8 = 98;
	static D_8 = 99;
	static E8 = 100;
	static F8 = 101;
	static F_8 = 102;
	static G8 = 103;
	static G_8 = 104;
	static A8 = 105;
	static A_8 = 106;
	static B8 = 107;

	static frequency(note) {
		return 440 * Math.pow(2, (note - Note.A4) / 12);
	}

	static value(note, octave) {
		return octave * 12 + note;
	}
}

export const Scale = Object.freeze({
	MAJOR: [Note.C4, Note.D4, Note.E4, Note.F4, Note.G4, Note.A4, Note.B4,
		Note.C5, Note.D5, Note.E5, Note.F5, Note.G5, Note.A5, Note.B5, Note.C6],
	MINOR: [Note.C4, Note.D4, Note.D_4, Note.F4, Note.G4, Note.G_4, Note.A_4,
		Note.C5, Note.D5, Note.D_5, Note.F5, Note.G5, Note.G_5, Note.A_5, Note.C6],
	ARABIC: [Note.C4, Note.C_4, Note.E4, Note.F4, Note.G4, Note.G_4, Note.B4,
		Note.C5, Note.C_5, Note.E5, Note.F5, Note.G5, Note.G_5, Note.B5, Note.C6],
	CHINESE: [Note.C4, Note.D4, Note.E4, Note.G4, Note.A4,
		Note.C5, Note.D5, Note.E5, Note.G5, Note.A5, Note.C6],
	SCARY: [Note.C4, Note.E4, Note.G_4, Note.C5, Note.E5, Note.G_5, Note.C6],
});
