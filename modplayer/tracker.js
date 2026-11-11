/**
 * Game-facing handle for one independent song/voice inside a shared Mixer.
 * This is what game code actually holds and calls play()/pause()/seek() on.
 * It knows nothing about AudioWorkletNodes - that's Mixer's job - which is
 * what keeps this class's shape the same regardless of platform; a game's
 * equivalent object on the ESP32 would expose the same play/pause/seek
 * surface even though nothing underneath resembles a Web Audio worklet.
 */
class Tracker {
	constructor(mixer, id) {
		this.mixer = mixer;
		this.id = id;
		this.song = null;
		this.channelCount = 0;
		this.offset = 0;
		this.loaded = false;
		this.playing = false;
		this.onSongLoaded = null;
	}

	/**
	 * Takes raw file bytes - however the caller got them, fetch() or
	 * FileReader here, an SD-card read on the ESP32 - and parses them into
	 * a Song. Byte-sourcing is deliberately not this class's job.
	 */
	async loadSong(bytes) {
		this.loaded = false;
		this.playing = false;

		const song = S3mLoader.isModule(bytes) ? S3mLoader.load(bytes) : ModLoader.load(bytes);

		await this.mixer.loadSongIntoTracker(this, song);
	}

	play() {
		if (!this.loaded) {
			return;
		}

		if (this.mixer.context.state === 'suspended') {
			this.mixer.context.resume();
		}

		this.playing = true;
		this.mixer.postMessage({
			message: 'setPlay',
			trackerId: this.id,
			playing: true
		});
	}

	pause() {
		this.playing = false;
		this.mixer.postMessage({
			message: 'setPlay',
			trackerId: this.id,
			playing: false
		});
	}

	togglePlay() {
		if (this.playing) {
			this.pause();
		} else {
			this.play();
		}
	}

	seek(position) {
		if (!this.loaded) {
			return;
		}

		this.mixer.postMessage({
			message: 'seek',
			trackerId: this.id,
			position: position
		});
	}
}
