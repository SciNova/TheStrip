class Song {
	constructor() {
		this.title = '';
		this.instruments = [];
		this.patterns = [];
		// song order: a list of pattern indices
		this.order = [];
		// format-specific tuning/transport fields, read by the engine at load/reset
		// time; the MOD loader leaves them at these defaults (its own fixed Amiga
		// clock and 6/125 speed/tempo, both hardcoded in the engine already)
		this.format = 'mod';
		// Hz constant for period->frequency conversion; null means "use the engine's
		// built-in Amiga clock" (tracker-engine.js falls back when this is null)
		this.periodClock = null;
		this.globalVolume = 64;
		this.initialSpeed = 0;
		this.initialTempo = 0;
	}

	// NOTE: this getter is lost across postMessage's structured clone -
	// derive channelCount from patterns[0].tracks.length directly on that side instead
	get channelCount() {
		return this.patterns.length ? this.patterns[0].tracks.length : 0;
	}
}

// see note.js for why this is needed (addModule loads files as isolated ES modules)
globalThis.Song = Song;
