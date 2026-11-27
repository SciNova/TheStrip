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
