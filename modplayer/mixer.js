/**
 * Game-facing owner of the shared audio graph. Its worklet-side counterpart
 * is MixerEngine (mixer-engine.js), which this relays messages to over
 * postMessage - a detail that stays entirely inside this class. Hands out
 * Tracker handles, one per independent song, and (re)builds the single
 * AudioWorkletNode whenever the total track capacity needed by all
 * currently-loaded trackers changes.
 */
class Mixer {
	constructor() {
		this.context = null;
		this.workletNode = null;
		this.filterNode = null;
		this.gainNode = null;
		this.mixingRate = 44100;
		this.moduleAdded = false;
		this.trackers = [];
		this.nextTrackerId = 0;
		this._volume = 1.0;
		this.analysers = [];
	}

	get volume() {
		return this._volume;
	}

	set volume(v) {
		this._volume = Math.max(0, Math.min(1, v));
		if (this.gainNode) {
			this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
			this.gainNode.gain.value = this._volume;
		}
	}

	init() {
		this.context = new (window.AudioContext || window.webkitAudioContext)();
		this.mixingRate = this.context.sampleRate;

		return Promise.resolve();
	}

	/**
	 * Returns a new, empty Tracker. It has no reserved capacity in the
	 * mixer until a song is actually loaded into it.
	 */
	createTracker() {
		const tracker = new Tracker(this, this.nextTrackerId++);
		this.trackers.push(tracker);
		return tracker;
	}

	/**
	 * Called by a Tracker once it has parsed a Song. Rebuilds the shared
	 * graph if the total reserved track count changed, then (re-)registers
	 * every tracker that currently has a song, since rebuilding the node
	 * means a brand new MixerEngine instance on the audio thread.
	 */
	async loadSongIntoTracker(tracker, song) {
		tracker.song = song;
		tracker.channelCount = song.channelCount;

		await this.rebuildGraph();

		for (const t of this.trackers) {
			if (!t.song) {
				continue;
			}

			this.postMessage({
				message: 'addTracker',
				trackerId: t.id,
				offset: t.offset
			});

			this.postMessage({
				message: 'loadSong',
				trackerId: t.id,
				song: t.song
			});

			// a fresh worklet-side TrackerEngine starts paused regardless of
			// what this handle's own play/pause state was before the rebuild
			t.playing = false;
		}
	}

	/**
	 * Assigns each loaded tracker a contiguous offset into the total output
	 * list and, if that total changed, tears down and recreates the
	 * AudioWorkletNode (and its analysers) to match.
	 */
	async rebuildGraph() {
		let offset = 0;
		for (const t of this.trackers) {
			if (!t.song) {
				continue;
			}
			t.offset = offset;
			offset += t.channelCount;
		}

		const totalChannels = offset;

		if (totalChannels === this.currentCapacity) {
			return;
		}

		this.currentCapacity = totalChannels;

		if (this.workletNode) {
			this.workletNode.disconnect();
		}
		this.analysers.forEach((analyser) => analyser.disconnect());
		this.analysers = [];

		if (totalChannels === 0) {
			this.workletNode = null;
			return;
		}

		if (!this.moduleAdded) {
			await this.context.audioWorklet.addModule('note.js');
			await this.context.audioWorklet.addModule('instrument.js');
			await this.context.audioWorklet.addModule('track.js');
			await this.context.audioWorklet.addModule('pattern.js');
			await this.context.audioWorklet.addModule('song.js');
			await this.context.audioWorklet.addModule('tracker-engine.js');
			await this.context.audioWorklet.addModule('mixer-engine.js');
			this.moduleAdded = true;
		}

		if (!this.filterNode) {
			this.filterNode = this.context.createBiquadFilter();
			this.filterNode.frequency.value = 22050;
		}

		if (!this.gainNode) {
			this.gainNode = this.context.createGain();
			this.gainNode.gain.value = this._volume;
			this.filterNode.connect(this.gainNode);
			this.gainNode.connect(this.context.destination);
		}

		this.workletNode = new AudioWorkletNode(this.context, 'mixer-processor', {
			outputChannelCount: new Array(totalChannels).fill(2),
			numberOfInputs: 0,
			numberOfOutputs: totalChannels
		});

		this.workletNode.port.onmessage = this.handleMessage.bind(this);
		this.workletNode.port.start();

		for (let i = 0; i < totalChannels; ++i) {
			this.workletNode.connect(this.filterNode, i);

			const analyser = this.context.createAnalyser();
			analyser.fftSize = 256;
			analyser.minDecibels = -90;
			analyser.maxDecibels = -10;
			analyser.smoothingTimeConstant = 0.65;

			this.workletNode.connect(analyser, i, 0);
			this.analysers.push(analyser);
		}

		this.postMessage({
			message: 'init',
			mixingRate: this.mixingRate
		});
	}

	handleMessage(message) {
		const data = message.data;
		const tracker = this.trackers.find((t) => t.id === data.trackerId);

		if (!tracker) {
			return;
		}

		switch (data.message) {
			case 'songLoaded':
				tracker.loaded = true;
				tracker.onSongLoaded && tracker.onSongLoaded(data.data);
				break;

			default:
				break;
		}
	}

	postMessage(message) {
		// no-op before the first loadSongIntoTracker() call has built the graph
		if (!this.workletNode) {
			return;
		}

		this.workletNode.port.postMessage(message);
	}
}
