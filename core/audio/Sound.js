import { Note } from './Note.js';
import { Waveform } from './Waveform.js';
import { LFODestination } from './LFODestination.js';
import { LFO } from './LFO.js';
import { Filter } from './Filter.js';

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
