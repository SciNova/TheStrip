import { Note, LFODestination, SynthSound as SynthSoundPatches } from './audio-common.js';

const Waveform = Object.freeze({
	SINUS: 'SINUS',
	SQUARE: 'SQUARE',
	SAWTOOTH: 'SAWTOOTH',
	REVERSE_SAWTOOTH: 'REVERSE_SAWTOOTH',
	NOISE: 'NOISE',
});

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

class System {
	constructor() {
		this.clock = new Clock();
		this.audio = null;
	}

	loop() {
		this.clock.update();
	}
}

class Sound {
	constructor() {
		this.playing = false;
	}

	stop() {
		this.playing = false;
	}
}

class LFO {
	constructor(audio, waveform = Waveform.SINUS, frequency = 1.0) {
		this.audio = audio;
		this.waveform = waveform;
		this.frequency = frequency;
		this.timestamp = this.audio.system.clock.time;
	}

	render(offset = 0.0) {
		const time = this.audio.system.clock.time - this.timestamp + offset;
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

class SynthSound extends Sound {
	constructor(synth) {
		super();
		this.synth = synth;
		this.waveform = null;
		this.frequency = 0.0;
		this.attack = null;
		this.decay = null;
		this.sustain = null;
		this.release = null;
		this.duration = null;
		this.timestamp = 0.0;
		this.phase = 0.0;
		this.volume = 0.0;
		this.releaseTimestamp = null;
		this.releaseVolume = 0.0;
		this.lfo = new LFO(this.synth.audio);
		this.lfoDestination = null;
		this.lfoAmount = null;
		this.lfoSync = null;
		this.filter = new Filter();
	}

	play(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, patch = null) {
		const p = patch ?? {};
		this.waveform = waveform ?? p.waveform;
		this.frequency = frequency;
		this.attack = attack ?? p.attack ?? 0.0;
		this.decay = decay ?? p.decay ?? 0.0;
		this.sustain = sustain ?? p.sustain ?? 1.0;
		this.release = release ?? p.release ?? 0.0;
		this.duration = duration ?? p.duration ?? null;
		this.timestamp = this.synth.audio.system.clock.time;
		this.phase = 0.0;
		this.playing = true;
		this.volume = 0.0;
		this.releaseTimestamp = null;
		this.releaseVolume = 0.0;

		const resolvedLfoSync = lfoSync ?? p.lfoSync ?? false;
		const resolvedLfoWaveform = lfoWaveform ?? p.lfoWaveform ?? null;
		const resolvedLfoFrequency = lfoFrequency ?? p.lfoFrequency ?? null;
		const lfoTarget = resolvedLfoSync ? this.lfo : this.synth.lfo;
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
		this.releaseTimestamp = this.synth.audio.system.clock.time;
		this.releaseVolume = this.volume;
	}

	remove() {
		const index = this.synth.sounds.indexOf(this);
		if (index !== -1) {
			this.synth.sounds[index] = null;
		}
	}

	stop() {
		this.playing = false;
		this.volume = 0.0;
		this.remove();
	}

	render(offset = 0.0) {
		const now = this.synth.audio.system.clock.time + offset;

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
			const source = this.lfoSync ? this.lfo : this.synth.lfo;
			const frequency = this.frequency * (1.0 + this.lfoAmount * source.render(offset));
			this.phase = (this.phase + frequency / sampleRate) % 1.0;
			value *= this.volume;
		} else {
			this.phase = (this.phase + this.frequency / sampleRate) % 1.0;

			if (this.lfoDestination === LFODestination.VOLUME) {
				const source = this.lfoSync ? this.lfo : this.synth.lfo;
				value *= this.volume * this.lfoAmount * source.render(offset);
			} else if (this.lfoDestination === LFODestination.CUTOFF) {
				const source = this.lfoSync ? this.lfo : this.synth.lfo;
				const cutoff = this.filter.cutoff * (1.0 + this.lfoAmount * source.render(offset));
				value = this.filter.process(value, cutoff) * this.volume;
			} else {
				value *= this.volume;
			}
		}

		return value;
	}
}

Object.assign(SynthSound, SynthSoundPatches);

class SoundDevice {
	static SOUNDS = 10;

	constructor(audio) {
		this.audio = audio;
		this.enabled = true;
		this.sounds = new Array(SoundDevice.SOUNDS).fill(null);
		this.lfo = new LFO(audio);
	}
}

class Synth extends SoundDevice {
	constructor(audio) {
		super(audio);
	}

	start() {
		this.enabled = true;
	}

	play(patch, frequency = null, slot = null) {
		this.play2(undefined, frequency ?? patch.frequency, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, patch, slot);
	}

	play2(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, patch = null, slot = null) {
		let index;
		if (slot !== null) {
			index = SoundDevice.SOUNDS - slot;
		} else {
			index = this.sounds.findIndex((sound) => !sound);
			if (index === -1) {
				index = 0;
				for (let i = 1; i < this.sounds.length; i++) {
					if (this.sounds[i].timestamp < this.sounds[index].timestamp) {
						index = i;
					}
				}
			}
		}

		const sound = new SynthSound(this);
		sound.play(waveform, frequency, duration, attack, decay, sustain, release, lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, patch);
		this.sounds[index] = sound;
	}

	noteOff(slot = null) {
		if (slot === null) {
			for (const sound of this.sounds) {
				if (sound) {
					sound.noteOff();
				}
			}
			return;
		}

		const index = SoundDevice.SOUNDS - slot;
		if (this.sounds[index]) {
			this.sounds[index].noteOff();
		}
	}

	stop(slot = null) {
		if (slot === null) {
			this.enabled = false;
			for (const sound of this.sounds) {
				if (sound) {
					sound.stop();
				}
			}
			return;
		}

		const index = SoundDevice.SOUNDS - slot;
		if (this.sounds[index]) {
			this.sounds[index].stop();
		}
	}

	render(offset = 0.0) {
		const values = [];
		for (const sound of this.sounds) {
			if (sound) {
				values.push(sound.render(offset));
			}
		}
		return values;
	}
}

class SamplerSound extends Sound {
	constructor(sampler) {
		super();
		this.sampler = sampler;
		this.id = null;
		this.rate = 1.0;
		this.loop = false;
		this.duration = 0.0;
		this.timestamp = 0.0;
		this.position = 0.0;
		this.volume = 1.0;
		this.lfo = new LFO(this.sampler.audio);
		this.lfoDestination = LFODestination.NONE;
		this.lfoAmount = 1.0;
		this.lfoSync = false;
		this.filter = new Filter();
	}

	play(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null) {
		this.id = id;
		if (rate !== null) {
			this.rate = rate;
		} else if (note !== null) {
			this.rate = note / Note.C2;
		}
		this.loop = loop;
		this.volume = volume;

		const data = this.sampler.data.get(id);
		const naturalDuration = data ? (data.length / this.rate) / sampleRate : 0.0;
		this.duration = duration !== null ? duration : naturalDuration;

		this.timestamp = this.sampler.audio.system.clock.time;
		this.position = 0.0;
		this.playing = true;
		const lfoTarget = lfoSync ? this.lfo : this.sampler.lfo;
		if (lfoWaveform !== null) {
			lfoTarget.waveform = lfoWaveform;
		}
		if (lfoFrequency !== null) {
			lfoTarget.frequency = lfoFrequency;
		}
		this.lfoDestination = lfoDestination;
		this.lfoAmount = lfoAmount;
		this.lfoSync = lfoSync;
		if (cutoff !== null) {
			this.filter.cutoff = cutoff;
		}
		if (resonance !== null) {
			this.filter.resonance = resonance;
		}
	}

	remove() {
		const index = this.sampler.sounds.indexOf(this);
		if (index !== -1) {
			this.sampler.sounds[index] = null;
		}
	}

	stop() {
		this.playing = false;
		this.remove();
	}

	render(offset = 0.0) {
		if (!this.playing) {
			return 0.0;
		}

		const data = this.sampler.data.get(this.id);
		if (!data) {
			this.stop();
			return 0.0;
		}

		const now = this.sampler.audio.system.clock.time + offset;
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
			const source = this.lfoSync ? this.lfo : this.sampler.lfo;
			value *= this.volume * this.lfoAmount * source.render(offset);
		} else if (this.lfoDestination === LFODestination.CUTOFF) {
			const source = this.lfoSync ? this.lfo : this.sampler.lfo;
			const cutoff = this.filter.cutoff * (1.0 + this.lfoAmount * source.render(offset));
			value = this.filter.process(value, cutoff) * this.volume;
		} else if (this.lfoDestination === LFODestination.PITCH) {
			const source = this.lfoSync ? this.lfo : this.sampler.lfo;
			const rate = this.rate * (1.0 + this.lfoAmount * source.render(offset));
			this.position += rate - this.rate;
			value *= this.volume;
		} else {
			value *= this.volume;
		}

		return value;
	}
}

class Sampler extends SoundDevice {
	constructor(audio) {
		super(audio);
		this.data = new Map();
	}

	load() {
		this.enabled = true;
	}

	play(id, slot = null) {
		this.play2(id, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, slot);
	}

	play2(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, slot = null) {
		let index;
		if (slot !== null) {
			index = SoundDevice.SOUNDS - slot;
		} else {
			index = this.sounds.findIndex((sound) => !sound);
			if (index === -1) {
				index = 0;
				for (let i = 1; i < this.sounds.length; i++) {
					if (this.sounds[i].timestamp < this.sounds[index].timestamp) {
						index = i;
					}
				}
			}
		}

		const sound = new SamplerSound(this);
		sound.play(id, note, rate, loop, duration, volume, lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance);
		this.sounds[index] = sound;
	}

	stop(slot = null) {
		if (slot === null) {
			this.enabled = false;
			for (const sound of this.sounds) {
				if (sound) {
					sound.stop();
				}
			}
			return;
		}

		const index = SoundDevice.SOUNDS - slot;
		if (this.sounds[index]) {
			this.sounds[index].stop();
		}
	}

	render(offset = 0.0) {
		const values = [];
		for (const sound of this.sounds) {
			if (sound) {
				values.push(sound.render(offset));
			}
		}
		return values;
	}
}

class Audio extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = this.handleMessage.bind(this);

		this.enabled = true;

		this.system = new System();
		this.system.audio = this;

		this.synth = new Synth(this);
		this.sampler = new Sampler(this);
	}

	handleMessage(event) {
		try {
			const message = event.data;

			if (message.type === 'sampleData') {
				console.log('received sample data', message.id, message.data.length, 'frames');
				this.sampler.data.set(message.id, message.data);
				return;
			}

			const subsystem = message.target === 'synth' ? this.synth : this.sampler;

			if (message.action === 'start') {
				if (subsystem.start) {
					subsystem.start();
				} else if (subsystem.load) {
					subsystem.load();
				}
			} else if (message.action === 'play') {
				if (message.target === 'synth') {
					subsystem.play2(message.waveform, message.frequency, message.duration, message.attack, message.decay, message.sustain, message.release,
						message.lfoWaveform, message.lfoFrequency, message.lfoDestination, message.lfoAmount, message.lfoSync,
						message.cutoff, message.resonance, message.patch, message.slot);
				} else {
					subsystem.play2(message.id, message.note, message.rate, message.loop, message.duration, message.volume,
						message.lfoWaveform, message.lfoFrequency, message.lfoDestination, message.lfoAmount, message.lfoSync,
						message.cutoff, message.resonance, message.slot);
				}
			} else if (message.action === 'noteOff') {
				subsystem.noteOff(message.slot);
			} else if (message.action === 'stop') {
				subsystem.stop(message.slot);
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
			const samples = new Float32Array(frameCount);
			for (let i = 0; i < frameCount; i++) {
				const offset = i / sampleRate;
				const values = [
					...(this.synth.enabled ? this.synth.render(offset) : []),
					...(this.sampler.enabled ? this.sampler.render(offset) : []),
				];
				let sum = 0.0;
				for (const value of values) {
					sum += value;
				}
				samples[i] = sum;
			}

			for (const output of outputs) {
				for (const channel of output) {
					channel.set(samples);
				}
			}
		} catch (error) {
			console.error('process error:', error);
		}

		return true;
	}
}

registerProcessor('audio-processor', Audio);
