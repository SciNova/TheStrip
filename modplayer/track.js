class Track {
	constructor() {
		this.notes = new Array(64).fill(null);
		this.pan = 0.5;
	}
}

// see note.js for why this is needed (addModule loads files as isolated ES modules)
globalThis.Track = Track;
