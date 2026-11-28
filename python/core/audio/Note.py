class Note:
	C0 = 0
	C_0 = 1
	D0 = 2
	D_0 = 3
	E0 = 4
	F0 = 5
	F_0 = 6
	G0 = 7
	G_0 = 8
	A0 = 9
	A_0 = 10
	B0 = 11
	C1 = 12
	C_1 = 13
	D1 = 14
	D_1 = 15
	E1 = 16
	F1 = 17
	F_1 = 18
	G1 = 19
	G_1 = 20
	A1 = 21
	A_1 = 22
	B1 = 23
	C2 = 24
	C_2 = 25
	D2 = 26
	D_2 = 27
	E2 = 28
	F2 = 29
	F_2 = 30
	G2 = 31
	G_2 = 32
	A2 = 33
	A_2 = 34
	B2 = 35
	C3 = 36
	C_3 = 37
	D3 = 38
	D_3 = 39
	E3 = 40
	F3 = 41
	F_3 = 42
	G3 = 43
	G_3 = 44
	A3 = 45
	A_3 = 46
	B3 = 47
	C4 = 48
	C_4 = 49
	D4 = 50
	D_4 = 51
	E4 = 52
	F4 = 53
	F_4 = 54
	G4 = 55
	G_4 = 56
	A4 = 57
	A_4 = 58
	B4 = 59
	C5 = 60
	C_5 = 61
	D5 = 62
	D_5 = 63
	E5 = 64
	F5 = 65
	F_5 = 66
	G5 = 67
	G_5 = 68
	A5 = 69
	A_5 = 70
	B5 = 71
	C6 = 72
	C_6 = 73
	D6 = 74
	D_6 = 75
	E6 = 76
	F6 = 77
	F_6 = 78
	G6 = 79
	G_6 = 80
	A6 = 81
	A_6 = 82
	B6 = 83
	C7 = 84
	C_7 = 85
	D7 = 86
	D_7 = 87
	E7 = 88
	F7 = 89
	F_7 = 90
	G7 = 91
	G_7 = 92
	A7 = 93
	A_7 = 94
	B7 = 95
	C8 = 96
	C_8 = 97
	D8 = 98
	D_8 = 99
	E8 = 100
	F8 = 101
	F_8 = 102
	G8 = 103
	G_8 = 104
	A8 = 105
	A_8 = 106
	B8 = 107

	@staticmethod
	def frequency(note):
		return 440 * 2 ** ((note - Note.A4) / 12)

	@staticmethod
	def value(note, octave):
		return octave * 12 + note


class Scale:
	MAJOR = [
		Note.C4,
		Note.D4,
		Note.E4,
		Note.F4,
		Note.G4,
		Note.A4,
		Note.B4,
		Note.C5,
		Note.D5,
		Note.E5,
		Note.F5,
		Note.G5,
		Note.A5,
		Note.B5,
		Note.C6,
	]
	MINOR = [
		Note.C4,
		Note.D4,
		Note.D_4,
		Note.F4,
		Note.G4,
		Note.G_4,
		Note.A_4,
		Note.C5,
		Note.D5,
		Note.D_5,
		Note.F5,
		Note.G5,
		Note.G_5,
		Note.A_5,
		Note.C6,
	]
	ARABIC = [
		Note.C4,
		Note.C_4,
		Note.E4,
		Note.F4,
		Note.G4,
		Note.G_4,
		Note.B4,
		Note.C5,
		Note.C_5,
		Note.E5,
		Note.F5,
		Note.G5,
		Note.G_5,
		Note.B5,
		Note.C6,
	]
	CHINESE = [
		Note.C4,
		Note.D4,
		Note.E4,
		Note.G4,
		Note.A4,
		Note.C5,
		Note.D5,
		Note.E5,
		Note.G5,
		Note.A5,
		Note.C6,
	]
	SCARY = [
		Note.C4,
		Note.E4,
		Note.G_4,
		Note.C5,
		Note.E5,
		Note.G_5,
		Note.C6,
	]
