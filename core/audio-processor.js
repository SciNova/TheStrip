import { Note, Waveform, LFODestination } from './audio-common.js';
import { SoundEvent, Track } from './tracker.js';

function reconstructTrack(data) {
	const track = new Track();
	track.tempo = data.tempo;
	track.beatsPerMeasure = data.beatsPerMeasure;
	track.segments = data.segments.map((bars) =>
		bars.map((channels) =>
			channels.map((events) =>
				events.map((e) => new SoundEvent(e.sound, e.note, e.position, e.duration, e.volume, e.offset))
			)
		)
	);
	return track;
}

class Clock {
	constructor() {
		this.time = 0.0;
		this.timestamp = 0.0;
		this.delta = 0.0;
		this.update();
	}

	update() {
		const now = currentTime;
		this.delta = now - this.timestamp;
		this.timestamp = now;
		this.time = now;
	}
}

class Game {
	constructor() {
		this.sounds = new Array(Audio.CHANNELS).fill(null);
		this.trackers = [];
		this.freeChannels = Audio.CHANNELS;
	}
}

class System {
	constructor() {
		this.clock = new Clock();
		this.audio = null;
		this.sounds = new Array(Audio.CHANNELS).fill(null);
		this.trackers = [];
		this.freeChannels = Audio.CHANNELS;
		this.game = null;
		this.games = {};
	}

	loop() {
		this.clock.update();
	}

	loadGame(gameId) {
		if (gameId === null) {
			this.game = null;
			return;
		}
		let instance = this.games[gameId];
		if (!instance) {
			instance = new Game();
			this.games[gameId] = instance;
		}
		this.game = instance;
	}
}

class LFO {
	constructor(audio, waveform = Waveform.SINUS, frequency = 1.0) {
		this.audio = audio;
		this.waveform = waveform;
		this.frequency = frequency;
		this.timestamp = this.audio.timestamp;
	}

	render() {
		const time = this.audio.timestamp - this.timestamp;
		let phase = (time * this.frequency) % 1.0;
		if (phase < 0) {
			phase += 1.0;
		}

		switch (this.waveform) {
			case Waveform.SINUS:
				return Math.sin(2 * Math.PI * phase);
			case Waveform.SQUARE:
				return phase < 0.5 ? 1.0 : -1.0;
			case Waveform.SAWTOOTH:
				return 2 * phase - 1.0;
			case Waveform.REVERSE_SAWTOOTH:
				return 1.0 - 2 * phase;
			case Waveform.NOISE: {
				const step = Math.floor(time * this.frequency);
				const n = Math.sin(step * 12.9898) * 43758.5453;
				return 2.0 * (n - Math.floor(n)) - 1.0;
			}
		}
		return 0.0;
	}
}

class Filter {
	constructor(cutoff = 800.0, resonance = 0.3) {
		this.cutoff = cutoff;
		this.resonance = resonance;
		this.low = 0.0;
		this.band = 0.0;
	}

	process(input, cutoff = this.cutoff) {
		const f = Math.min(2 * Math.sin(Math.PI * cutoff / sampleRate), 1.9);
		const q = 1.0 - this.resonance;
		const high = input - this.low - q * this.band;
		this.band += f * high;
		this.low += f * this.band;
		return this.low;
	}
}

class Sound {
	constructor(audio) {
		this.audio = audio;
		this.playing = false;

		this.timestamp = 0.0;
		this.duration = null;
		this.volume = 0.0;
		this.lfo = new LFO(audio);
		this.lfoDestination = null;
		this.lfoAmount = null;
		this.lfoSync = null;
		this.filter = new Filter();

		this.waveform = null;
		this.frequency = 0.0;
		this.attack = null;
		this.decay = null;
		this.sustain = null;
		this.release = null;
		this.phase = 0.0;
		this.releaseTimestamp = null;
		this.releaseVolume = 0.0;

		this.sample = null;
		this.rate = 1.0;
		this.loop = false;
		this.position = 0.0;
	}

	playSynth(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, patch = null, offset = null) {
		const p = patch ?? {};
		this.waveform = waveform ?? p.waveform;
		this.frequency = frequency;
		this.attack = attack ?? p.attack ?? 0.0;
		this.decay = decay ?? p.decay ?? 0.0;
		this.sustain = sustain ?? p.sustain ?? 1.0;
		this.release = release ?? p.release ?? 0.0;
		this.duration = duration ?? p.duration ?? null;
		this.timestamp = this.audio.timestamp;
		this.phase = offset !== null ? (offset * this.frequency) % 1.0 : 0.0;
		this.playing = true;
		this.volume = 0.0;
		this.releaseTimestamp = null;
		this.releaseVolume = 0.0;

		this._applyLfoAndFilter(lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, p);
	}

	playSample(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, offset = null) {
		this.sample = id;
		if (rate !== null) {
			this.rate = rate;
		} else if (note !== null) {
			this.rate = Note.frequency(note) / Note.frequency(Note.C2);
		}
		this.loop = loop;
		this.volume = volume;

		const data = this.audio.data[id];
		const naturalDuration = data ? (data.length / this.rate) / sampleRate : 0.0;
		this.duration = duration !== null ? duration : naturalDuration;

		this.timestamp = this.audio.timestamp;
		this.position = offset !== null ? offset * sampleRate : 0.0;
		this.playing = true;

		this._applyLfoAndFilter(lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, null);
	}

	_applyLfoAndFilter(lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, patch) {
		const p = patch ?? {};
		const resolvedLfoSync = lfoSync ?? p.lfoSync ?? false;
		const resolvedLfoWaveform = lfoWaveform ?? p.lfoWaveform ?? null;
		const resolvedLfoFrequency = lfoFrequency ?? p.lfoFrequency ?? null;
		const lfoTarget = resolvedLfoSync ? this.lfo : this.audio.lfo;
		if (resolvedLfoWaveform !== null) {
			lfoTarget.waveform = resolvedLfoWaveform;
		}
		if (resolvedLfoFrequency !== null) {
			lfoTarget.frequency = resolvedLfoFrequency;
		}
		this.lfoDestination = lfoDestination ?? p.lfoDestination ?? LFODestination.NONE;
		this.lfoAmount = lfoAmount ?? p.lfoAmount ?? 1.0;
		this.lfoSync = resolvedLfoSync;

		const resolvedCutoff = cutoff ?? p.cutoff ?? null;
		const resolvedResonance = resonance ?? p.resonance ?? null;
		if (resolvedCutoff !== null) {
			this.filter.cutoff = resolvedCutoff;
		}
		if (resolvedResonance !== null) {
			this.filter.resonance = resolvedResonance;
		}
	}

	noteOff() {
		if (!this.playing) {
			return;
		}
		this.playing = false;
		this.releaseTimestamp = this.audio.timestamp;
		this.releaseVolume = this.volume;
	}

	remove() {
		const sounds = (this.audio.system.game ?? this.audio.system).sounds;
		const index = sounds.indexOf(this);
		if (index !== -1) {
			sounds[index] = null;
		}
	}

	stop() {
		this.playing = false;
		this.volume = 0.0;
		this.remove();
	}

	render() {
		if (this.waveform !== null) {
			return this._renderSynth();
		}
		return this._renderSample();
	}

	_renderSynth() {
		const now = this.audio.timestamp;

		if (this.playing && this.duration !== null && (now - this.timestamp) >= this.duration) {
			this.noteOff();
		}

		if (this.playing) {
			const elapsed = now - this.timestamp;
			if (this.attack > 0 && elapsed < this.attack) {
				this.volume = elapsed / this.attack;
			} else if (this.decay > 0 && elapsed < this.attack + this.decay) {
				const decayElapsed = elapsed - this.attack;
				this.volume = 1.0 + (this.sustain - 1.0) * (decayElapsed / this.decay);
			} else {
				this.volume = this.sustain;
			}
		} else {
			const released = now - this.releaseTimestamp;
			if (this.release <= 0 || released >= this.release) {
				this.volume = 0.0;
				this.remove();
				return 0.0;
			}
			this.volume = this.releaseVolume * (1.0 - released / this.release);
		}

		let value;
		switch (this.waveform) {
			case Waveform.SINUS:
				value = Math.sin(2 * Math.PI * this.phase);
				break;
			case Waveform.SQUARE:
				value = this.phase < 0.5 ? 1.0 : -1.0;
				break;
			case Waveform.SAWTOOTH:
				value = 2 * this.phase - 1.0;
				break;
			case Waveform.REVERSE_SAWTOOTH:
				value = 1.0 - 2 * this.phase;
				break;
			case Waveform.NOISE: {
				const step = Math.floor((now - this.timestamp) * this.frequency);
				const n = Math.sin(step * 12.9898) * 43758.5453;
				value = 2.0 * (n - Math.floor(n)) - 1.0;
				break;
			}
		}

		if (this.lfoDestination === LFODestination.PITCH) {
			const source = this.lfoSync ? this.lfo : this.audio.lfo;
			const frequency = this.frequency * (1.0 + this.lfoAmount * source.render());
			this.phase = (this.phase + frequency / sampleRate) % 1.0;
			value *= this.volume;
		} else {
			this.phase = (this.phase + this.frequency / sampleRate) % 1.0;

			if (this.lfoDestination === LFODestination.VOLUME) {
				const source = this.lfoSync ? this.lfo : this.audio.lfo;
				value *= this.volume * this.lfoAmount * source.render();
			} else if (this.lfoDestination === LFODestination.CUTOFF) {
				const source = this.lfoSync ? this.lfo : this.audio.lfo;
				const cutoff = this.filter.cutoff * (1.0 + this.lfoAmount * source.render());
				value = this.filter.process(value, cutoff) * this.volume;
			} else {
				value *= this.volume;
			}
		}

		return value;
	}

	_renderSample() {
		if (!this.playing) {
			return 0.0;
		}

		const data = this.audio.data[this.sample];
		if (!data) {
			this.stop();
			return 0.0;
		}

		const now = this.audio.timestamp;
		let elapsed = now - this.timestamp;
		if (elapsed >= this.duration) {
			if (!this.loop) {
				this.stop();
				return 0.0;
			}
			this.timestamp = now;
			this.position = 0.0;
			elapsed = 0.0;
		}

		if (this.position >= data.length) {
			return 0.0;
		}

		const index = Math.floor(this.position);
		const fraction = this.position - index;
		const a = data[index];
		const b = index + 1 < data.length ? data[index + 1] : 0.0;
		let value = a + (b - a) * fraction;

		this.position += this.rate;

		if (this.lfoDestination === LFODestination.VOLUME) {
			const source = this.lfoSync ? this.lfo : this.audio.lfo;
			value *= this.volume * this.lfoAmount * source.render();
		} else if (this.lfoDestination === LFODestination.CUTOFF) {
			const source = this.lfoSync ? this.lfo : this.audio.lfo;
			const cutoff = this.filter.cutoff * (1.0 + this.lfoAmount * source.render());
			value = this.filter.process(value, cutoff) * this.volume;
		} else if (this.lfoDestination === LFODestination.PITCH) {
			const source = this.lfoSync ? this.lfo : this.audio.lfo;
			const rate = this.rate * (1.0 + this.lfoAmount * source.render());
			this.position += rate - this.rate;
			value *= this.volume;
		} else {
			value *= this.volume;
		}

		return value;
	}
}

class Tracker {
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

		this.position += 1 / sampleRate;

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

class Audio extends AudioWorkletProcessor {
	static CHANNELS = 10;

	constructor() {
		super();
		this.port.onmessage = this.handleMessage.bind(this);

		this.enabled = true;

		this.system = new System();
		this.system.audio = this;
		this.timestamp = 0.0;

		this.channels = new Float32Array(Audio.CHANNELS);
		this.lfo = new LFO(this);
		this.data = [];

		this._samples = new Float32Array(128);
	}

	playSynth(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, patch = null, offset = null) {
		const sound = new Sound(this);
		sound.playSynth(waveform, frequency, duration, attack, decay, sustain, release, lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, patch, offset);
		(this.system.game ?? this.system).sounds[this.freeChannel()] = sound;
	}

	playSample(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, offset = null) {
		const sound = new Sound(this);
		sound.playSample(id, note, rate, loop, duration, volume, lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, offset);
		(this.system.game ?? this.system).sounds[this.freeChannel()] = sound;
	}

	freeChannel() {
		const sounds = (this.system.game ?? this.system).sounds;
		const freeChannels = (this.system.game ?? this.system).freeChannels;
		let index = -1;
		for (let i = 0; i < freeChannels; i++) {
			if (!sounds[i]) {
				index = i;
				break;
			}
		}
		if (index === -1) {
			index = 0;
			for (let i = 1; i < freeChannels; i++) {
				if (sounds[i].timestamp < sounds[index].timestamp) {
					index = i;
				}
			}
		}
		return index;
	}

	noteOff() {
		const sounds = (this.system.game ?? this.system).sounds;
		for (const sound of sounds) {
			if (sound) {
				sound.noteOff();
			}
		}
	}

	stop() {
		const sounds = (this.system.game ?? this.system).sounds;
		for (const sound of sounds) {
			if (sound) {
				sound.stop();
			}
		}
	}

	render() {
		const sounds = (this.system.game ?? this.system).sounds;
		for (let i = 0; i < sounds.length; i++) {
			this.channels[i] = sounds[i] ? sounds[i].render() : 0.0;
		}
		for (const tracker of (this.system.game ?? this.system).trackers) {
			if (tracker.playing) {
				tracker.render();
			}
		}

		let sum = 0.0;
		for (const value of this.channels) {
			sum += value;
		}

		this.timestamp += 1 / sampleRate;
		return sum;
	}

	handleMessage(event) {
		try {
			const message = event.data;

			if (message.type === 'sampleData') {
				console.log('received sample data', message.id, message.data.length, 'frames');
				this.data[message.id] = message.data;
				return;
			}

			if (message.type === 'track') {
				const tracker = new Tracker(this, reconstructTrack(message.data), message.channel);
				tracker.id = message.id;
				return;
			}

			if (message.action === 'playTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				tracker.play(message.segment, message.segments, message.loop);
				return;
			}

			if (message.action === 'stopTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				if (tracker) {
					tracker.stop();
				}
				return;
			}

			if (message.action === 'pauseTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				if (tracker) {
					tracker.pause();
				}
				return;
			}

			if (message.action === 'resumeTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				if (tracker) {
					tracker.resume();
				}
				return;
			}

			if (message.action === 'start') {
				this.enabled = true;
			} else if (message.action === 'loadGame') {
				this.system.loadGame(message.id);
			} else if (message.action === 'playSynth') {
				this.playSynth(message.waveform, message.frequency, message.duration, message.attack, message.decay, message.sustain, message.release,
					message.lfoWaveform, message.lfoFrequency, message.lfoDestination, message.lfoAmount, message.lfoSync,
					message.cutoff, message.resonance, message.instrument, message.offset);
			} else if (message.action === 'playSample') {
				this.playSample(message.id, message.note, message.rate, message.loop, message.duration, message.volume,
					message.lfoWaveform, message.lfoFrequency, message.lfoDestination, message.lfoAmount, message.lfoSync,
					message.cutoff, message.resonance, message.offset);
			} else if (message.action === 'noteOff') {
				this.noteOff();
			} else if (message.action === 'stop') {
				this.stop();
			}
		} catch (error) {
			console.error('handleMessage error:', error, JSON.stringify(event.data));
		}
	}

	process(inputs, outputs) {
		if (!this.enabled) {
			return true;
		}

		try {
			this.system.loop();

			const frameCount = (outputs[0] && outputs[0][0]) ? outputs[0][0].length : 0;
			const samples = this._samples;
			for (let i = 0; i < frameCount; i++) {
				samples[i] = this.render();
			}

			for (const output of outputs) {
				for (const channel of output) {
					channel.set(samples.subarray(0, frameCount));
				}
			}
		} catch (error) {
			console.error('process error:', error);
		}

		return true;
	}
}

registerProcessor('audio-processor', Audio);
