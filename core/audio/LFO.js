import { Waveform } from './Waveform.js';

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
