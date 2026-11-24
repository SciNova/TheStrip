import { Sample } from './audio.js';
import { Note } from './audio-common.js';
import { SoundEvent, Track } from './tracker.js';

const PERIODS = new Float32Array([
	856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
	428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
	214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
]);

const NATIVE_SAMPLE_RATE = 8363;
const RESAMPLED_RATE = 48000;
const CHANNEL_COUNT = 4;
const ROWS_PER_PATTERN = 64;
const PATTERN_LENGTH = 1024;

const DEFAULT_TEMPO = 125;
const DEFAULT_SPEED = 6;

const Effect = Object.freeze({
	SET_SAMPLE_OFFSET: 0x9,
	SET_VOLUME: 0xC,
	SET_SPEED: 0xF,
});

export class MODFormat {
	static async load(path) {
		const buffer = await MODFormat._readBinary(path);
		return new MODFormat(buffer);
	}

	static async _readBinary(path) {
		const url = new URL(path, import.meta.url);
		if (url.protocol === 'file:') {
			const { readFile } = await import('fs/promises');
			const { fileURLToPath } = await import('url');
			const data = await readFile(fileURLToPath(url));
			return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
		}
		const response = await fetch(url);
		return response.arrayBuffer();
	}

	constructor(buffer) {
		const maxSamples = MODFormat._readAscii(buffer, 4, 1080) === 'M.K.' ? 31 : 15;
		const patternOffset = maxSamples === 15 ? 600 : 1084;
		const samples = MODFormat._readSamples(buffer, maxSamples);
		const { order, patternCount } = MODFormat._readOrder(buffer, maxSamples);
		const { tempo, speed } = MODFormat._readInitialTiming(buffer, patternOffset, order);
		const patterns = MODFormat._readPatterns(buffer, patternOffset, patternCount, samples);
		MODFormat._readSampleData(buffer, patternOffset, patternCount, samples);

		const rowDuration = (2.5 / tempo) * speed;

		const track = new Track();
		track.tempo = 60 / rowDuration;
		track.beatsPerMeasure = ROWS_PER_PATTERN;
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

	static _readSamples(buffer, maxSamples) {
		const bytes = new Uint8Array(buffer);
		const headerLength = 30;
		const samples = [];
		let offset = 20;

		for (let i = 0; i < maxSamples; i++) {
			const sample = new Sample(MODFormat._readAscii(buffer, 22, offset));
			let length = MODFormat._readWord(buffer, offset + 22) * 2;
			let loopLength = MODFormat._readWord(buffer, offset + 28) * 2;

			if (loopLength === 2) {
				loopLength = 0;
				if (length === 2) {
					length = 0;
				}
			}

			sample.rate = NATIVE_SAMPLE_RATE;
			sample.length = length;
			sample.volume = bytes[offset + 25];
			samples.push(sample);

			offset += headerLength;
		}

		return samples;
	}

	static _readInitialTiming(buffer, patternOffset, order) {
		let tempo = null;
		let speed = null;

		for (const patternIndex of order) {
			const raw = new Uint8Array(buffer, patternOffset + patternIndex * PATTERN_LENGTH, PATTERN_LENGTH);
			for (let row = 0; row < ROWS_PER_PATTERN; row++) {
				for (let chan = 0; chan < CHANNEL_COUNT; chan++) {
					const offset = row * 16 + chan * 4;
					const cmd = raw[2 + offset] & 0xF;
					const cmdData = raw[3 + offset];
					if (cmd !== Effect.SET_SPEED || !cmdData) {
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

		return { tempo: tempo ?? DEFAULT_TEMPO, speed: speed ?? DEFAULT_SPEED };
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

	static _readPatterns(buffer, patternOffset, patternCount, samples) {
		const patterns = [];
		let position = patternOffset;

		for (let p = 0; p < patternCount; p++) {
			const raw = new Uint8Array(buffer, position, PATTERN_LENGTH);
			const channels = [];
			for (let chan = 0; chan < CHANNEL_COUNT; chan++) {
				channels.push(MODFormat._readChannel(raw, chan, samples));
			}
			patterns.push(channels);
			position += PATTERN_LENGTH;
		}

		return patterns;
	}

	static _readChannel(raw, chan, samples) {
		const events = [];

		for (let row = 0; row < ROWS_PER_PATTERN; row++) {
			const offset = row * 16 + chan * 4;
			const period = (raw[offset] & 0x0F) << 8 | raw[1 + offset];
			const sampleIndex = (raw[offset] & 0xF0 | raw[2 + offset] >> 4) - 1;

			if (!period || sampleIndex < 0) {
				continue;
			}

			const cmd = raw[2 + offset] & 0xF;
			const cmdData = raw[3 + offset];
			const sample = samples[sampleIndex];
			const sound = { sample: sampleIndex, waveform: null };
			const note = Note.C1 + MODFormat._periodToPitch(period);

			let volume = sample.volume / 64;
			let noteOffset = null;
			if (cmd === Effect.SET_VOLUME) {
				volume = Math.min(1.0, cmdData / 64);
			} else if (cmd === Effect.SET_SAMPLE_OFFSET) {
				noteOffset = (cmdData * 256) / sample.rate;
			}

			events.push(new SoundEvent(sound, note, row, null, volume, noteOffset));
		}

		return events;
	}

	static _periodToPitch(period) {
		let closest = 0;
		let bestDiff = Infinity;
		for (let i = 0; i < PERIODS.length; i++) {
			const diff = Math.abs(PERIODS[i] - period);
			if (diff < bestDiff) {
				bestDiff = diff;
				closest = i;
			}
		}
		return closest;
	}

	static _readSampleData(buffer, patternOffset, patternCount, samples) {
		let offset = patternOffset + patternCount * PATTERN_LENGTH;

		for (const sample of samples) {
			const maxLength = Math.max(0, Math.min(sample.length, buffer.byteLength - offset));
			const pcm = new Int8Array(buffer, offset, maxLength);
			const data = new Float32Array(sample.length);
			for (let i = 0; i < maxLength; i++) {
				data[i] = pcm[i] / 128.0;
			}
			sample.data = MODFormat._resample(data, NATIVE_SAMPLE_RATE, RESAMPLED_RATE);
			offset += maxLength;
		}
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
