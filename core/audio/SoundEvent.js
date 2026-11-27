import { Note } from './Note.js';
import { Waveform } from './Waveform.js';

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
