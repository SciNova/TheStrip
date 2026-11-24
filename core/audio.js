import { LFODestination } from './audio-common.js';

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

	play(instrument, frequency = null) {
		this.play2(undefined, frequency ?? instrument.frequency, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, instrument);
	}

	play2(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, instrument = null, offset = null) {
		if (!this.enabled) {
			return;
		}
		this.audio.postMessage({
			action: 'playSynth', waveform, frequency, duration, attack, decay, sustain, release,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, instrument, offset,
		});
	}

	noteOff() {
		this.audio.postMessage({ action: 'noteOff' });
	}

	stop() {
		this.enabled = false;
		this.audio.postMessage({ action: 'stop' });
	}
}

class Sampler {
	constructor(audio) {
		this.audio = audio;
		this.samples = [];
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

	play(id) {
		this.play2(id, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined);
	}

	play2(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, offset = null) {
		this.audio.postMessage({
			action: 'playSample', id, note, rate, loop, duration, volume,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, offset,
		});
	}

	stop() {
		this.audio.postMessage({ action: 'stop' });
	}
}

export class Tracker {
	static _nextId = 0;

	constructor(audio, channel) {
		this.audio = audio;
		this.channel = channel;
		this.id = Tracker._nextId++;
		this.track = null;
		this.playing = false;
		this.position = 0.0;
		this.startSegment = 0;
		this.segmentCount = 1;
		this.loop = false;
	}

	_locate() {
		if (!this.track) {
			return { segment: this.startSegment, bar: 0, beat: 0 };
		}

		const secondsPerBeat = 60 / this.track.tempo;
		const barDuration = this.track.beatsPerMeasure * secondsPerBeat;

		let barIndex = Math.floor(this.position / barDuration);
		const beat = Math.floor((this.position - barIndex * barDuration) / secondsPerBeat);

		let segment = this.startSegment;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			const bars = this.track.segments[s] ?? [];
			if (barIndex < bars.length) {
				segment = s;
				break;
			}
			barIndex -= bars.length;
		}

		return { segment, bar: Math.max(0, barIndex), beat };
	}

	get segment() {
		return this._locate().segment;
	}

	get bar() {
		return this._locate().bar;
	}

	get beat() {
		return this._locate().beat;
	}

	render() {
		if (!this.track) {
			return;
		}

		const secondsPerBeat = 60 / this.track.tempo;
		const barDuration = this.track.beatsPerMeasure * secondsPerBeat;
		let totalBars = 0;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			totalBars += this.track.segments[s]?.length ?? 0;
		}
		const totalDuration = totalBars * barDuration;
		if (totalDuration <= 0) {
			return;
		}

		this.position += this.audio.system.clock.delta;
		if (this.loop) {
			this.position = this.position % totalDuration;
		} else if (this.position >= totalDuration) {
			this.position = totalDuration;
			this.playing = false;
		}
	}

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

		this.audio.postMessage({ type: 'track', id: this.id, channel: this.channel, data });
	}

	play(segment, segments = 1, loop = false) {
		const trackers = (this.audio.system.game ?? this.audio.system).trackers;
		if (!trackers.includes(this)) {
			trackers.push(this);
		}

		if (segment === undefined && !this.playing && this.track) {
			this.playing = true;
			this.audio.postMessage({ action: 'resumeTrack', id: this.id });
			return;
		}

		this.position = 0.0;
		this.startSegment = segment ?? 0;
		this.segmentCount = segments;
		this.loop = loop;
		this.playing = true;
		this.audio.postMessage({ action: 'playTrack', id: this.id, channel: this.channel, segment: this.startSegment, segments, loop });
	}

	pause() {
		this.playing = false;
		this.audio.postMessage({ action: 'pauseTrack', id: this.id });
	}

	stop() {
		this.playing = false;
		this.audio.postMessage({ action: 'stopTrack', id: this.id });
	}
}

export class Audio {
	static CHANNELS = 10;

	constructor(system) {
		this.context = null;
		this.node = null;
		this.system = system;
		this.synth = new Synth(this);
		this.sampler = new Sampler(this);
	}

	loop() {
		const trackers = this.system.game ? this.system.game.trackers : this.system.trackers;
		for (const tracker of trackers) {
			if (tracker.playing) {
				tracker.render();
			}
		}
	}

	async on() {
		if (!this.context) {
			this.context = new AudioContext();
			await this.context.audioWorklet.addModule('/core/audio-processor.js?v=' + Date.now());
			this.node = new AudioWorkletNode(this.context, 'audio-processor', {
				numberOfInputs: 0,
				numberOfOutputs: 1,
				outputChannelCount: [2],
			});
			this.node.port.onmessage = this.handleMessage.bind(this);
			this.node.connect(this.context.destination);
			this.synth.start();
			this.sampler.start();
		}
		await this.context.resume();
	}

	async off() {
		if (this.context) {
			await this.context.suspend();
		}
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
