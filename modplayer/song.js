class Song {
	constructor() {
		this.title = '';
		this.instruments = [];
		this.patterns = [];
		// song order: a list of pattern indices
		this.order = [];
	}

	// NOTE: this getter is lost across postMessage's structured clone -
	// derive channelCount from patterns[0].tracks.length directly on that side instead
	get channelCount() {
		return this.patterns.length ? this.patterns[0].tracks.length : 0;
	}
}

// see note.js for why this is needed (addModule loads files as isolated ES modules)
globalThis.Song = Song;
