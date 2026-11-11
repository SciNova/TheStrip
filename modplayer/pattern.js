class Pattern {
	constructor(tracks = []) {
		this.tracks = tracks;
	}
}

// see note.js for why this is needed (addModule loads files as isolated ES modules)
globalThis.Pattern = Pattern;
