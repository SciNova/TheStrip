import { Note, Waveform, Audio } from './audio.js';

export class SoundEvent {
	constructor(sound, note, position, duration, volume = 1.0, offset = null) {
		this.sound = sound;
		this.note = note;
		this.position = position;
		this.duration = duration;
		this.volume = volume;
		this.offset = offset;
		this.tracker = null;
		this.samplePosition = offset ?? 0.0;
	}

	render() {
		const secondsPerBeat = 60 / this.tracker.track.tempo;
		const now = this.tracker.audio.timestamp;
		const delta = now - this.tracker.timestamp - (this.position * secondsPerBeat);

		if (delta < 0) {
			return 0.0;
		}
		if (this.duration !== null && delta >= this.duration * secondsPerBeat) {
			return 0.0;
		}

		if (this.sound?.sample !== null && this.sound?.sample !== undefined) {
			return this._renderSample();
		}
		return this._renderSynth(delta);
	}

	_renderSynth(delta) {
		const note = typeof this.note === 'number' ? this.note : Note[this.note];
		const frequency = Note.frequency(note);

		const attack = this.sound?.attack ?? 0.0;
		const decay = this.sound?.decay ?? 0.0;
		const sustain = this.sound?.sustain ?? 1.0;

		let envelope;
		if (attack > 0 && delta < attack) {
			envelope = delta / attack;
		} else if (decay > 0 && delta < attack + decay) {
			envelope = 1.0 + (sustain - 1.0) * ((delta - attack) / decay);
		} else {
			envelope = sustain;
		}

		const phaseTime = delta + (this.offset ?? 0.0);
		let phase = (phaseTime * frequency) % 1.0;
		if (phase < 0) {
			phase += 1.0;
		}

		let value;
		switch (this.sound?.waveform) {
			case Waveform.SQUARE:
				value = phase < 0.5 ? 1.0 : -1.0;
				break;
			case Waveform.SAWTOOTH:
				value = 2 * phase - 1.0;
				break;
			case Waveform.REVERSE_SAWTOOTH:
				value = 1.0 - 2 * phase;
				break;
			case Waveform.NOISE: {
				const step = Math.floor(phaseTime * frequency);
				const n = Math.sin(step * 12.9898) * 43758.5453;
				value = 2.0 * (n - Math.floor(n)) - 1.0;
				break;
			}
			default:
				value = Math.sin(2 * Math.PI * phase);
		}

		return value * envelope * this.volume;
	}

	_renderSample() {
		const data = this.tracker.audio.data[this.sound.sample];
		if (!data) {
			return 0.0;
		}

		const note = typeof this.note === 'number' ? this.note : Note[this.note];
		const rate = Note.frequency(note) / Note.frequency(Note.C2);
		this.samplePosition += rate;

		if (this.samplePosition < 0 || this.samplePosition >= data.length) {
			return 0.0;
		}

		const index = Math.floor(this.samplePosition);
		const fraction = this.samplePosition - index;
		const a = data[index];
		const b = index + 1 < data.length ? data[index + 1] : 0.0;
		return (a + (b - a) * fraction) * this.volume;
	}
}

export class Track {
	constructor() {
		this.tempo = 0;
		this.beatsPerMeasure = 0;
		this.segments = [];
	}
}

export class Tracker {
	constructor(audio, track, channel) {
		this.audio = audio;
		this.track = track;
		this.channel = channel;
		this.channelCount = track.segments[0]?.[0]?.length ?? 0;
		(audio.system.game ?? audio.system).trackers.push(this);
		(audio.system.game ?? audio.system).freeChannels -= this.channelCount;
		this.playing = false;
		this.startSegment = 0;
		this.segmentCount = 1;
		this.loop = false;
		this.position = 0.0;
		this.segment = 0;
		this.bar = 0;
		this.beat = 0;
		this.active = new Array(this.channelCount).fill(null);

		for (const bars of track.segments) {
			for (const bar of bars) {
				for (const channelEvents of bar) {
					for (const event of channelEvents) {
						event.tracker = this;
					}
				}
			}
		}
	}

	play(segment = 0, segments = 1, loop = false) {
		this.startSegment = segment;
		this.segmentCount = segments;
		this.loop = loop;
		this.playing = true;
		this.position = 0.0;
		this.segment = segment;
		this.bar = 0;
		this.beat = 0;
		this.active.fill(null);
	}

	pause() {
		this.playing = false;
		for (let c = 0; c < this.channelCount; c++) {
			this.audio.channels[Audio.CHANNELS - 1 - (this.channel + c)] = 0.0;
		}
	}

	resume() {
		this.playing = true;
	}

	stop() {
		this.playing = false;
		this.active.fill(null);
		for (let c = 0; c < this.channelCount; c++) {
			this.audio.channels[Audio.CHANNELS - 1 - (this.channel + c)] = 0.0;
		}
	}

	render() {
		const secondsPerBeat = 60 / this.track.tempo;
		const barDuration = this.track.beatsPerMeasure * secondsPerBeat;

		let totalBars = 0;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			totalBars += this.track.segments[s]?.length ?? 0;
		}
		const totalDuration = totalBars * barDuration;

		this.position += 1 / this.audio.sampleRate;

		if (totalDuration <= 0 || (!this.loop && this.position >= totalDuration)) {
			this.stop();
			return;
		}
		if (this.loop && this.position >= totalDuration) {
			this.position -= totalDuration;
			this.active.fill(null);
		}

		let barIndex = Math.floor(this.position / barDuration);
		const beatPosition = (this.position - barIndex * barDuration) / secondsPerBeat;
		this.beat = Math.floor(beatPosition);

		let bar = null;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			const bars = this.track.segments[s] ?? [];
			if (barIndex < bars.length) {
				this.segment = s;
				this.bar = barIndex;
				bar = bars[barIndex];
				break;
			}
			barIndex -= bars.length;
		}

		for (let c = 0; c < this.channelCount; c++) {
			const events = bar?.[c] ?? [];
			let candidate = null;
			for (const event of events) {
				if (event.position <= beatPosition && (candidate === null || event.position > candidate.position)) {
					candidate = event;
				}
			}
			if (candidate !== null) {
				this.active[c] = candidate;
			}
			this.audio.channels[Audio.CHANNELS - 1 - (this.channel + c)] = this.active[c] ? this.active[c].render() : 0.0;
		}
	}
}
