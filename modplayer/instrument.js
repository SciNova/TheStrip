class Instrument {
	constructor() {
		this.name = '';
		this.length = 0;
		this.finetune = 0;
		this.volume = 64;
		this.loopStart = 0;
		this.loopLength = 0;
		// reserved for future stereo instrument support; mono-only for now
		this.channels = 1;
		// S3M/IT: sample playback rate (Hz) at the reference note - see periodForS3mNote() in note.js.
		// Unused by the MOD loader, which has no per-instrument tuning concept.
		this.c2spd = 8363;
		this.data = null;
	}
}

// see note.js for why this is needed (addModule loads files as isolated ES modules)
globalThis.Instrument = Instrument;
