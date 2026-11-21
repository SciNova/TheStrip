import { LFODestination } from './audio-common.js';

// Fixed, system-level samples, loaded once at boot in this exact order - the
// position in this list IS the sample id (SystemSound.BOOING.sample === 0,
// SystemSound.CHEERING.sample === 1), not a separately maintained mapping.
const SYSTEM_SAMPLE_FILES = ['CROWD_BOOING.wav', 'CROWD_CHEERING.wav'];

export class Sample {
	constructor(path) {
		this.path = path;
		this.data = null;
	}

	get ready() {
		return this.data !== null;
	}

	static async load(path, context) {
		const sample = new Sample(path);
		const response = await fetch(path, { cache: 'no-store' });
		const arrayBuffer = await response.arrayBuffer();
		const audioBuffer = await context.decodeAudioData(arrayBuffer);
		sample.data = audioBuffer.getChannelData(0).slice();
		return sample;
	}
}

class Synth {
	constructor(audio) {
		this.audio = audio;
		this.enabled = false;
	}

	start() {
		this.enabled = true;
		this.audio.postMessage({ action: 'start', target: 'synth' });
	}

	play(instrument, frequency = null, channel = null) {
		this.play2(undefined, frequency ?? instrument.frequency, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, instrument, channel);
	}

	play2(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, instrument = null, channel = null, offset = null) {
		if (!this.enabled) {
			return;
		}
		this.audio.postMessage({
			action: 'play', target: 'synth', waveform, frequency, duration, attack, decay, sustain, release,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, instrument, channel, offset,
		});
	}

	noteOff(channel = null) {
		this.audio.postMessage({ action: 'noteOff', target: 'synth', channel });
	}

	stop(channel = null) {
		if (channel === null) {
			this.enabled = false;
		}
		this.audio.postMessage({ action: 'stop', target: 'synth', channel });
	}
}

class Sampler {
	constructor(audio) {
		this.audio = audio;
		this.samples = [];
		// Custom (non-system) sample ids, handed out to Trackers whose
		// tracks carry their own sample data (e.g. a MOD file) - starts
		// right after the fixed system samples, in the same flat id space.
		this._nextCustomId = SYSTEM_SAMPLE_FILES.length;
	}

	allocateSampleId() {
		return this._nextCustomId++;
	}

	get ready() {
		return this.samples.length > 0 && this.samples.every((sample) => sample && sample.ready);
	}

	start() {
		this.audio.postMessage({ action: 'start', target: 'sampler' });
		this.load();
	}

	load() {
		if (this.samples.length > 0) {
			return;
		}

		this.samples = new Array(SYSTEM_SAMPLE_FILES.length).fill(null);
		SYSTEM_SAMPLE_FILES.forEach((file, id) => {
			Sample.load('/sounds/' + file, this.audio.context).then((sample) => {
				this.samples[id] = sample;
				console.log('loaded sample', id, sample.path, sample.data.length, 'frames');
				this.audio.postMessage({ type: 'sampleData', id, data: sample.data }, [sample.data.buffer]);
			}).catch((error) => {
				console.error('failed to load sample', id, file, error);
			});
		});
	}

	play(id, channel = null) {
		this.play2(id, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, channel);
	}

	play2(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, channel = null, offset = null) {
		this.audio.postMessage({
			action: 'play', target: 'sampler', id, note, rate, loop, duration, volume,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, channel, offset,
		});
	}

	stop(channel = null) {
		this.audio.postMessage({ action: 'stop', target: 'sampler', channel });
	}
}

// A thin handle for a Track playing on the real (worklet-side) engine -
// this class holds no playback state and does no rendering itself, it
// just ships the Track's data over once and then posts play/stop.
export class Tracker {
	static _nextId = 0;

	constructor(audio) {
		this.audio = audio;
		this.id = Tracker._nextId++;
		this.track = null;
		this.timestamp = 0.0;
		this.startSegment = 0;
		this.segmentCount = 1;
		this.loop = false;
	}

	// Same computation as the worklet-side Tracker.render(), run here
	// independently against this.audio.context.currentTime - the same
	// underlying clock the worklet's own currentTime reads from, so the
	// two naturally agree (modulo the short lag of the play message
	// actually reaching the worklet).
	_current() {
		if (!this.track) {
			return { position: 0.0, segment: this.startSegment, bar: 0, beat: 0.0 };
		}

		const secondsPerBeat = 60 / this.track.tempo;
		const barDuration = this.track.beatsPerMeasure * secondsPerBeat;

		let totalBars = 0;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			totalBars += this.track.segments[s]?.length ?? 0;
		}
		const totalDuration = totalBars * barDuration;

		let position = this.audio.context.currentTime - this.timestamp;
		if (totalDuration <= 0) {
			return { position: 0.0, segment: this.startSegment, bar: 0, beat: 0.0 };
		}
		if (this.loop) {
			position = position % totalDuration;
		} else if (position >= totalDuration) {
			position = totalDuration;
		}

		let barIndex = Math.floor(position / barDuration);
		const beat = (position - barIndex * barDuration) / secondsPerBeat;

		let segment = this.startSegment;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			const bars = this.track.segments[s] ?? [];
			if (barIndex < bars.length) {
				segment = s;
				break;
			}
			barIndex -= bars.length;
		}

		return { position, segment, bar: Math.max(0, barIndex), beat };
	}

	get position() {
		return this._current().position;
	}

	get segment() {
		return this._current().segment;
	}

	get bar() {
		return this._current().bar;
	}

	get beat() {
		return this._current().beat;
	}

	// Sends any custom (non-system) sample data the track carries - e.g. a
	// MOD file's own instruments - assigning each a real global sample id
	// and rewriting the track's local sample indices to match, then sends
	// the track itself. Safe to call once per Track instance; the sample
	// buffers are transferred, not copied.
	load(track) {
		this.track = track;
		const remap = {};
		for (const sample of track.customSamples ?? []) {
			if (sample.data && sample.data.length > 0) {
				const id = this.audio.sampler.allocateSampleId();
				remap[track.customSamples.indexOf(sample)] = id;
				this.audio.postMessage({ type: 'sampleData', id, data: sample.data }, [sample.data.buffer]);
			}
		}

		const remapSound = (sound) => {
			if (sound && sound.sample !== null && sound.sample !== undefined && remap[sound.sample] !== undefined) {
				return { ...sound, sample: remap[sound.sample] };
			}
			return sound;
		};

		const data = {
			tempo: track.tempo,
			beatsPerMeasure: track.beatsPerMeasure,
			segments: track.segments.map((bars) =>
				bars.map((channels) =>
					channels.map((events) =>
						events.map((e) => ({
							sound: remapSound(e.sound),
							note: e.note,
							position: e.position,
							duration: e.duration,
							volume: e.volume,
							offset: e.offset,
						}))
					)
				)
			),
		};

		this.audio.postMessage({ type: 'track', id: this.id, data });
	}

	play(channel, segment = 0, segments = 1, loop = false) {
		this.timestamp = this.audio.context.currentTime;
		this.startSegment = segment;
		this.segmentCount = segments;
		this.loop = loop;
		this.audio.postMessage({ action: 'playTrack', id: this.id, channel, segment, segments, loop });
	}

	stop() {
		this.audio.postMessage({ action: 'stopTrack', id: this.id });
	}
}

export class Audio {
	constructor(system) {
		this.context = null;
		this.node = null;
		this.system = system;
		this.synth = new Synth(this);
		this.sampler = new Sampler(this);
	}

	async init() {
		this.context = new AudioContext();
		await this.context.audioWorklet.addModule('/core/audio-processor.js?v=' + Date.now());
		this.node = new AudioWorkletNode(this.context, 'audio-processor', {
			numberOfInputs: 0,
			numberOfOutputs: 1,
			outputChannelCount: [2],
		});
		this.node.port.onmessage = this.handleMessage.bind(this);
		this.node.connect(this.context.destination);
		await this.context.resume();
	}

	handleMessage(event) {
	}

	postMessage(message, transfer) {
		this.node.port.postMessage(message, transfer);
	}

	stop() {
		this.synth.stop();
		this.sampler.stop();
	}

	play(sound) {
		this.sampler.play(sound.sample);
	}
}
