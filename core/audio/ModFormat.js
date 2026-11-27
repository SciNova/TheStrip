import { Note } from './Note.js';
import { Sample } from './Sample.js';
import { SoundEvent } from './SoundEvent.js';
import { Track } from './Track.js';

export class MODFormat {
	static PERIODS = new Float32Array([
		856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
		428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
		214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
	]);

	static NATIVE_SAMPLE_RATE = 8363;
	static RESAMPLED_RATE = 48000;
	static CHANNEL_COUNT = 4;
	static ROWS_PER_PATTERN = 64;
	static PATTERN_LENGTH = 1024;
	static SAMPLE_HEADER_LENGTH = 30;

	static DEFAULT_TEMPO = 125;
	static DEFAULT_SPEED = 6;

	static Effect = Object.freeze({
		SET_SAMPLE_OFFSET: 0x9,
		SET_VOLUME: 0xC,
		SET_SPEED: 0xF,
	});

	constructor(buffer) {
		this.buffer = buffer;
		this.maxSamples = MODFormat._readAscii(buffer, 4, 1080) === 'M.K.' ? 31 : 15;
		this.patternOffset = this.maxSamples === 15 ? 600 : 1084;

		const { order, patternCount } = MODFormat._readOrder(buffer, this.maxSamples);
		this.patternCount = patternCount;
		const { tempo, speed } = MODFormat._readInitialTiming(buffer, this.patternOffset, order);
		const patterns = MODFormat._readPatterns(buffer, this.patternOffset, patternCount);
		const samples = this.readSamples();

		const rowDuration = (2.5 / tempo) * speed;

		const track = new Track();
		track.tempo = 60 / rowDuration;
		track.beatsPerMeasure = MODFormat.ROWS_PER_PATTERN;
		track.segments = order.map((patternIndex) => [patterns[patternIndex]]);
		track.customSamples = samples;
		const secondsPerBeat = 60 / track.tempo;
		const barDuration = track.beatsPerMeasure * secondsPerBeat;
		const totalBars = track.segments.reduce((sum, bars) => sum + bars.length, 0);
		track.duration = totalBars * barDuration;

		return track;
	}

	static _readAscii(buffer, maxLength, offset) {
		const bytes = new Uint8Array(buffer);
		let text = '';
		for (let i = 0; i < maxLength; i++) {
			const byte = bytes[offset + i];
			if (!byte) {
				break;
			}
			text += String.fromCharCode(byte);
		}
		return text;
	}

	static _readWord(buffer, offset) {
		return new DataView(buffer).getUint16(offset, false);
	}

	readSamples() {
		const samples = [];
		let offset = this.patternOffset + this.patternCount * MODFormat.PATTERN_LENGTH;

		for (let i = 0; i < this.maxSamples; i++) {
			const headerOffset = 20 + i * MODFormat.SAMPLE_HEADER_LENGTH;
			let length = MODFormat._readWord(this.buffer, headerOffset + 22) * 2;
			const loopLength = MODFormat._readWord(this.buffer, headerOffset + 28) * 2;
			if (loopLength === 2 && length === 2) {
				length = 0;
			}

			const maxLength = Math.max(0, Math.min(length, this.buffer.byteLength - offset));
			const pcm = new Int8Array(this.buffer, offset, maxLength);
			const data = new Float32Array(length);
			for (let j = 0; j < maxLength; j++) {
				data[j] = pcm[j] / 128.0;
			}
			samples.push(new Sample(MODFormat._resample(data, MODFormat.NATIVE_SAMPLE_RATE, MODFormat.RESAMPLED_RATE)));
			offset += maxLength;
		}

		return samples;
	}

	static _readInitialTiming(buffer, patternOffset, order) {
		let tempo = null;
		let speed = null;

		for (const patternIndex of order) {
			const raw = new Uint8Array(buffer, patternOffset + patternIndex * MODFormat.PATTERN_LENGTH, MODFormat.PATTERN_LENGTH);
			for (let row = 0; row < MODFormat.ROWS_PER_PATTERN; row++) {
				for (let chan = 0; chan < MODFormat.CHANNEL_COUNT; chan++) {
					const offset = row * 16 + chan * 4;
					const cmd = raw[2 + offset] & 0xF;
					const cmdData = raw[3 + offset];
					if (cmd !== MODFormat.Effect.SET_SPEED || !cmdData) {
						continue;
					}
					if (cmdData < 32) {
						speed ??= cmdData;
					} else {
						tempo ??= cmdData;
					}
				}
			}
			if (tempo !== null && speed !== null) {
				break;
			}
		}

		return { tempo: tempo ?? MODFormat.DEFAULT_TEMPO, speed: speed ?? MODFormat.DEFAULT_SPEED };
	}

	static _readOrder(buffer, maxSamples) {
		const offset = maxSamples === 15 ? 470 : 950;
		const bytes = new Uint8Array(buffer, offset);
		const songLength = bytes[0];
		const order = [];
		let max = 0;

		for (let i = 0; i < songLength; i++) {
			const pos = bytes[2 + i];
			order.push(pos);
			if (pos > max) {
				max = pos;
			}
		}

		return { order, patternCount: max + 1 };
	}

	static _readPatterns(buffer, patternOffset, patternCount) {
		const patterns = [];
		let position = patternOffset;

		for (let p = 0; p < patternCount; p++) {
			const raw = new Uint8Array(buffer, position, MODFormat.PATTERN_LENGTH);
			const channels = [];
			for (let chan = 0; chan < MODFormat.CHANNEL_COUNT; chan++) {
				channels.push(MODFormat._readChannel(buffer, raw, chan));
			}
			patterns.push(channels);
			position += MODFormat.PATTERN_LENGTH;
		}

		return patterns;
	}

	static _readChannel(buffer, raw, chan) {
		const events = [];
		const bytes = new Uint8Array(buffer);

		for (let row = 0; row < MODFormat.ROWS_PER_PATTERN; row++) {
			const offset = row * 16 + chan * 4;
			const period = (raw[offset] & 0x0F) << 8 | raw[1 + offset];
			const sampleIndex = (raw[offset] & 0xF0 | raw[2 + offset] >> 4) - 1;

			if (!period || sampleIndex < 0) {
				continue;
			}

			const cmd = raw[2 + offset] & 0xF;
			const cmdData = raw[3 + offset];
			const sound = { sample: sampleIndex, waveform: null };
			const note = Note.C1 + MODFormat._periodToPitch(period);

			const sampleHeaderOffset = 20 + sampleIndex * MODFormat.SAMPLE_HEADER_LENGTH;
			const sampleVolume = bytes[sampleHeaderOffset + 25];

			let volume = sampleVolume / 64;
			let noteOffset = null;
			if (cmd === MODFormat.Effect.SET_VOLUME) {
				volume = Math.min(1.0, cmdData / 64);
			} else if (cmd === MODFormat.Effect.SET_SAMPLE_OFFSET) {
				noteOffset = (cmdData * 256) / MODFormat.NATIVE_SAMPLE_RATE;
			}

			events.push(new SoundEvent(sound, note, row, null, volume, noteOffset));
		}

		return events;
	}

	static _periodToPitch(period) {
		let closest = 0;
		let bestDiff = Infinity;
		for (let i = 0; i < MODFormat.PERIODS.length; i++) {
			const diff = Math.abs(MODFormat.PERIODS[i] - period);
			if (diff < bestDiff) {
				bestDiff = diff;
				closest = i;
			}
		}
		return closest;
	}

	static _resample(data, fromRate, toRate) {
		const length = Math.round(data.length * (toRate / fromRate));
		const resampled = new Float32Array(length);
		for (let i = 0; i < length; i++) {
			const sourcePosition = i * (fromRate / toRate);
			const index = Math.floor(sourcePosition);
			const fraction = sourcePosition - index;
			const a = data[index] ?? 0.0;
			const b = data[index + 1] ?? 0.0;
			resampled[i] = a + (b - a) * fraction;
		}
		return resampled;
	}
}
