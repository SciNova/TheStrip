import { Audio as CoreAudio } from '../core/audio/Audio.js';
import { LFODestination } from '../core/audio/LFODestination.js';
import { Sample } from '../core/audio/Sample.js';

const SYSTEM_SAMPLE_FILES = ['CROWD_BOOING.wav', 'CROWD_CHEERING.wav'];

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
				const id = this.audio.allocateSampleId();
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

export class Audio extends CoreAudio {
	constructor(system) {
		super(system);
		this.context = null;
		this.node = null;
		this.samples = [];
		this._nextCustomId = SYSTEM_SAMPLE_FILES.length;
	}

	allocateSampleId() {
		return this._nextCustomId++;
	}

	loadSamples() {
		if (this.samples.length > 0) {
			return;
		}

		this.samples = new Array(SYSTEM_SAMPLE_FILES.length).fill(null);
		SYSTEM_SAMPLE_FILES.forEach((file, id) => {
			Sample.load('/sounds/' + file).then((sample) => {
				this.samples[id] = sample;
				console.log('loaded sample', id, file, sample.data.length, 'frames');
				this.postMessage({ type: 'sampleData', id, data: sample.data }, [sample.data.buffer]);
			}).catch((error) => {
				console.error('failed to load sample', id, file, error);
			});
		});
	}

	playSynth(patch, frequency = null) {
		this.postMessage({ action: 'playSynth', patch, frequency });
	}

	playSynthCustom(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, instrument = null, offset = null) {
		this.postMessage({
			action: 'playSynthCustom', waveform, frequency, duration, attack, decay, sustain, release,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, instrument, offset,
		});
	}

	noteOff() {
		this.postMessage({ action: 'noteOff' });
	}

	playSampleCustom(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, offset = null) {
		this.postMessage({
			action: 'playSample', id, note, rate, loop, duration, volume,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, offset,
		});
	}

	handleMessage(event) {
	}

	postMessage(message, transfer) {
		this.node.port.postMessage(message, transfer);
	}

	stop() {
		this.postMessage({ action: 'stop' });
	}

	play(sound) {
		this.playSampleCustom(sound.sample);
	}
}
