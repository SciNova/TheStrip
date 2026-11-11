const Pitch = Object.freeze({
	NONE: -1,
	C1: 0, CS1: 1, D1: 2, DS1: 3, E1: 4, F1: 5, FS1: 6, G1: 7, GS1: 8, A1: 9, AS1: 10, B1: 11,
	C2: 12, CS2: 13, D2: 14, DS2: 15, E2: 16, F2: 17, FS2: 18, G2: 19, GS2: 20, A2: 21, AS2: 22, B2: 23,
	C3: 24, CS3: 25, D3: 26, DS3: 27, E3: 28, F3: 29, FS3: 30, G3: 31, GS3: 32, A3: 33, AS3: 34, B3: 35
});

// Amiga/Paula hardware timer periods, index-aligned with Pitch (C1..B3)
const PitchPeriods = new Float32Array([
	856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
	428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
	214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113
]);

const Effect = Object.freeze({
	NONE: -1,
	SLIDE_UP: 0x1,
	SLIDE_DOWN: 0x2,
	PORTAMENTO: 0x3,
	VIBRATO: 0x4,
	VOLUME_SLIDE_PORTAMENTO: 0x5,
	VOLUME_SLIDE_VIBRATO: 0x6,
	SET_SAMPLE_OFFSET: 0x9,
	VOLUME_SLIDE: 0xA,
	POSITION_JUMP: 0xB,
	SET_VOLUME: 0xC,
	ROW_JUMP: 0xD,
	TOGGLE_LOWPASS: 0xE0,
	SET_VIBRATO_WAVEFORM: 0xE4,
	LOOP_PATTERN: 0xE6,
	RETRIGGER: 0xE9,
	FINE_VOLUME_UP: 0xEA,
	FINE_VOLUME_DOWN: 0xEB,
	DELAY_SAMPLE: 0xED,
	REPEAT_ROW: 0xEE,
	SET_SPEED: 0xF
});

class Note {
	constructor() {
		this.note = Pitch.NONE;
		this.instrument = null;
		this.volume = null;
		this.effect = Effect.NONE;
		this.effectParam = 0;
	}
}

// addModule() always loads this file as an ES module, which scopes the
// declarations above to this file alone - publish them onto globalThis so
// mod-processor.js (loaded via a separate addModule call) can see them too.
// Harmless on the main thread too, where classic <script> tags already share scope.
globalThis.Pitch = Pitch;
globalThis.PitchPeriods = PitchPeriods;
globalThis.Effect = Effect;
globalThis.Note = Note;
