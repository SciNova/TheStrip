export class Note {
	static C0 = 0;
	static C_0 = 1;
	static D0 = 2;
	static D_0 = 3;
	static E0 = 4;
	static F0 = 5;
	static F_0 = 6;
	static G0 = 7;
	static G_0 = 8;
	static A0 = 9;
	static A_0 = 10;
	static B0 = 11;
	static C1 = 12;
	static C_1 = 13;
	static D1 = 14;
	static D_1 = 15;
	static E1 = 16;
	static F1 = 17;
	static F_1 = 18;
	static G1 = 19;
	static G_1 = 20;
	static A1 = 21;
	static A_1 = 22;
	static B1 = 23;
	static C2 = 24;
	static C_2 = 25;
	static D2 = 26;
	static D_2 = 27;
	static E2 = 28;
	static F2 = 29;
	static F_2 = 30;
	static G2 = 31;
	static G_2 = 32;
	static A2 = 33;
	static A_2 = 34;
	static B2 = 35;
	static C3 = 36;
	static C_3 = 37;
	static D3 = 38;
	static D_3 = 39;
	static E3 = 40;
	static F3 = 41;
	static F_3 = 42;
	static G3 = 43;
	static G_3 = 44;
	static A3 = 45;
	static A_3 = 46;
	static B3 = 47;
	static C4 = 48;
	static C_4 = 49;
	static D4 = 50;
	static D_4 = 51;
	static E4 = 52;
	static F4 = 53;
	static F_4 = 54;
	static G4 = 55;
	static G_4 = 56;
	static A4 = 57;
	static A_4 = 58;
	static B4 = 59;
	static C5 = 60;
	static C_5 = 61;
	static D5 = 62;
	static D_5 = 63;
	static E5 = 64;
	static F5 = 65;
	static F_5 = 66;
	static G5 = 67;
	static G_5 = 68;
	static A5 = 69;
	static A_5 = 70;
	static B5 = 71;
	static C6 = 72;
	static C_6 = 73;
	static D6 = 74;
	static D_6 = 75;
	static E6 = 76;
	static F6 = 77;
	static F_6 = 78;
	static G6 = 79;
	static G_6 = 80;
	static A6 = 81;
	static A_6 = 82;
	static B6 = 83;
	static C7 = 84;
	static C_7 = 85;
	static D7 = 86;
	static D_7 = 87;
	static E7 = 88;
	static F7 = 89;
	static F_7 = 90;
	static G7 = 91;
	static G_7 = 92;
	static A7 = 93;
	static A_7 = 94;
	static B7 = 95;
	static C8 = 96;
	static C_8 = 97;
	static D8 = 98;
	static D_8 = 99;
	static E8 = 100;
	static F8 = 101;
	static F_8 = 102;
	static G8 = 103;
	static G_8 = 104;
	static A8 = 105;
	static A_8 = 106;
	static B8 = 107;

	static frequency(note) {
		return 440 * Math.pow(2, (note - Note.A4) / 12);
	}

	static value(note, octave) {
		return octave * 12 + note;
	}
}

export const Scale = Object.freeze({
	MAJOR: [Note.C4, Note.D4, Note.E4, Note.F4, Note.G4, Note.A4, Note.B4,
		Note.C5, Note.D5, Note.E5, Note.F5, Note.G5, Note.A5, Note.B5, Note.C6],
	MINOR: [Note.C4, Note.D4, Note.D_4, Note.F4, Note.G4, Note.G_4, Note.A_4,
		Note.C5, Note.D5, Note.D_5, Note.F5, Note.G5, Note.G_5, Note.A_5, Note.C6],
	ARABIC: [Note.C4, Note.C_4, Note.E4, Note.F4, Note.G4, Note.G_4, Note.B4,
		Note.C5, Note.C_5, Note.E5, Note.F5, Note.G5, Note.G_5, Note.B5, Note.C6],
	CHINESE: [Note.C4, Note.D4, Note.E4, Note.G4, Note.A4,
		Note.C5, Note.D5, Note.E5, Note.G5, Note.A5, Note.C6],
	SCARY: [Note.C4, Note.E4, Note.G_4, Note.C5, Note.E5, Note.G_5, Note.C6],
});

export const Waveform = Object.freeze({
	SINUS: 'SINUS',
	SQUARE: 'SQUARE',
	SAWTOOTH: 'SAWTOOTH',
	REVERSE_SAWTOOTH: 'REVERSE_SAWTOOTH',
	NOISE: 'NOISE',
});

export const LFODestination = Object.freeze({
	NONE: 'NONE',
	VOLUME: 'VOLUME',
	PITCH: 'PITCH',
	CUTOFF: 'CUTOFF',
});

export class Audio {
	static CHANNELS = 10;

	constructor(system) {
		this.sampleRate = 48000;
		this.system = system;
		this.timestamp = 0.0;
		this.channels = new Float32Array(Audio.CHANNELS);
		this.data = [];
		this.lfo = new LFO(this);
	}

	playSynth(patch, frequency = null) {
		this.playSynthCustom(undefined, frequency ?? patch.frequency, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, patch);
	}

	playSynthCustom(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, patch = null, offset = null) {
		const sound = new Sound(this);
		sound.playSynth(waveform, frequency, duration, attack, decay, sustain, release, lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, patch, offset);
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
}

export class LFO {
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

export class Filter {
	constructor(audio, cutoff = 800.0, resonance = 0.3) {
		this.audio = audio;
		this.cutoff = cutoff;
		this.resonance = resonance;
		this.low = 0.0;
		this.band = 0.0;
	}

	process(input, cutoff = this.cutoff) {
		const f = Math.min(2 * Math.sin(Math.PI * cutoff / this.audio.sampleRate), 1.9);
		const q = 1.0 - this.resonance;
		const high = input - this.low - q * this.band;
		this.band += f * high;
		this.low += f * this.band;
		return this.low;
	}
}

export class Sound {
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
		this.filter = new Filter(audio);

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
		const naturalDuration = data ? (data.length / this.rate) / this.audio.sampleRate : 0.0;
		this.duration = duration !== null ? duration : naturalDuration;

		this.timestamp = this.audio.timestamp;
		this.position = offset !== null ? offset * this.audio.sampleRate : 0.0;
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
			this.phase = (this.phase + frequency / this.audio.sampleRate) % 1.0;
			value *= this.volume;
		} else {
			this.phase = (this.phase + this.frequency / this.audio.sampleRate) % 1.0;

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

export class Sample {
	static system = null;

	constructor(data) {
		this.data = data;
	}

	get ready() {
		return this.data !== null;
	}

	static decodeWav(buffer) {
		const view = new DataView(buffer);
		let offset = 12;
		let numChannels = 1;
		let bitsPerSample = 16;
		let dataOffset = 0;
		let dataLength = 0;

		while (offset < buffer.byteLength) {
			const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
			const size = view.getUint32(offset + 4, true);
			if (id === 'fmt ') {
				numChannels = view.getUint16(offset + 10, true);
				bitsPerSample = view.getUint16(offset + 22, true);
			} else if (id === 'data') {
				dataOffset = offset + 8;
				dataLength = size;
			}
			offset += 8 + size + (size % 2);
		}

		const frameCount = dataLength / (numChannels * (bitsPerSample / 8));
		const data = new Float32Array(frameCount);
		for (let i = 0; i < frameCount; i++) {
			const sampleOffset = dataOffset + i * numChannels * (bitsPerSample / 8);
			data[i] = view.getInt16(sampleOffset, true) / 32768;
		}
		return data;
	}

	static async load(path) {
		const buffer = await Sample.system.load(path);
		return new Sample(Sample.decodeWav(buffer));
	}
}

export const SystemSound = Object.freeze({
	BOOING: Object.freeze({
		sample: 0,
		waveform: null,
		duration: null,
	}),
	CHEERING: Object.freeze({
		sample: 1,
		waveform: null,
		duration: null,
	}),
	BASS: Object.freeze({
		sample: null,
		waveform: 'SINUS',
		frequency: 110,
		duration: null,
		attack: 0.01,
		decay: 0.1,
		sustain: 0.8,
		release: 0.2,
	}),
	PIANO: Object.freeze({
		sample: null,
		waveform: 'SQUARE',
		frequency: 440,
		duration: null,
		attack: 0.0,
		decay: 0.3,
		sustain: 0.3,
		release: 0.3,
	}),
	SYNTH: Object.freeze({
		sample: null,
		waveform: 'SAWTOOTH',
		frequency: 440,
		duration: null,
		attack: 0.0,
		decay: 0.1,
		sustain: 0.6,
		release: 0.15,
	}),
	TICK: Object.freeze({
		sample: null,
		waveform: 'NOISE',
		frequency: 7000,
		duration: 0.015,
		attack: 0.0,
		decay: 0.01,
		sustain: 0.0,
		release: 0.0,
	}),
	SHOOT: Object.freeze({
		sample: null,
		waveform: 'SAWTOOTH',
		frequency: 1200,
		duration: 0.07,
		attack: 0.0,
		decay: 0.05,
		sustain: 0.3,
		release: 0.03,
		lfoWaveform: 'REVERSE_SAWTOOTH',
		lfoFrequency: 6,
		lfoDestination: LFODestination.PITCH,
		lfoAmount: 0.9,
		lfoSync: true,
	}),
	WARNING: Object.freeze({
		sample: null,
		waveform: 'SQUARE',
		frequency: 150,
		duration: 0.4,
		attack: 0.0,
		decay: 0.05,
		sustain: 0.8,
		release: 0.05,
		lfoWaveform: 'SQUARE',
		lfoFrequency: 30,
		lfoDestination: LFODestination.VOLUME,
		lfoAmount: 0.8,
		lfoSync: true,
	}),
	EXPLOSION: Object.freeze({
		sample: null,
		waveform: 'NOISE',
		frequency: 1200,
		duration: 0.9,
		attack: 0.0,
		decay: 0.7,
		sustain: 0.0,
		release: 0.15,
		lfoWaveform: 'REVERSE_SAWTOOTH',
		lfoFrequency: 1.2,
		lfoDestination: LFODestination.CUTOFF,
		lfoAmount: 0.9,
		lfoSync: true,
		cutoff: 3000,
		resonance: 0.3,
	}),
	SPAWN: Object.freeze({
		sample: null,
		waveform: 'SINUS',
		frequency: 1800,
		duration: 0.08,
		attack: 0.0,
		decay: 0.06,
		sustain: 0.0,
		release: 0.02,
		lfoWaveform: 'SAWTOOTH',
		lfoFrequency: 8,
		lfoDestination: LFODestination.PITCH,
		lfoAmount: 0.7,
		lfoSync: true,
	}),
	CHECKPOINT: Object.freeze({
		sample: null,
		waveform: 'SINUS',
		frequency: 1700,
		duration: 0.3,
		attack: 0.0,
		decay: 0.3,
		sustain: 0.0,
		release: 0.02,
	}),
});
