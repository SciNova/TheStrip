const BinUtils = {
	readAscii(buffer, maxLength, offset = 0) {
		const uint8buf = new Uint8Array(buffer);
		// we could have used the new TextDecoder interface, if only
		// it was available in webkit/Safari...
		let str = '',
			eof = false;

		for (let i = 0; i < maxLength && !eof; ++i) {
			const char = uint8buf[offset + i];
			eof = char === 0;
			if (!eof) {
				str += String.fromCharCode(char);
			}
		}

		return str;
	},
	readWord(buffer, offset = 0, littleEndian = false) {
		const view = new DataView(buffer);

		return view.getUint16(offset, littleEndian);
	},
	readDword(buffer, offset = 0, littleEndian = true) {
		const view = new DataView(buffer);

		return view.getUint32(offset, littleEndian);
	}
};

/**
 * Converts a .mod file (ArrayBuffer) into a format-agnostic Song.
 * Knows nothing about audio playback - only about the .mod binary layout.
 */
class ModLoader {
	static load(buffer) {
		if (!ModLoader.isModule(buffer)) {
			throw new Error('Not a valid .mod file');
		}

		const song = new Song();
		song.title = BinUtils.readAscii(buffer, 20);

		const maxSamples = ModLoader.detectMaxSamples(buffer);
		const patternOffset = maxSamples === 15 ? (1080 - 480) : 1084;

		song.instruments = ModLoader.readInstruments(buffer, maxSamples);

		const { order, patternCount } = ModLoader.readOrder(buffer, maxSamples);
		song.order = order;

		song.patterns = ModLoader.readPatterns(buffer, patternOffset, patternCount, song.instruments);

		ModLoader.readSampleData(buffer, patternOffset, patternCount, song.instruments);

		return song;
	}

	static isModule(buffer) {
		// Very basic mod file detection, maybe we could check for M.K signature
		// at offset 1080 instead
		return buffer.byteLength > 20 && new DataView(buffer).getUint8(0x13) === 0;
	}

	static detectMaxSamples(buffer) {
		// first modules were limited to 15 samples
		// later it was extended to 31 and the 'M.K.'
		// marker was added at offset 1080
		// new module format even use other markers
		// but we stick to good old ST/NT modules
		const str = BinUtils.readAscii(buffer, 4, 1080);

		return str.match('M.K.') ? 31 : 15;
	}

	static readInstruments(buffer, maxSamples) {
		const instruments = [];
		const uint8buffer = new Uint8Array(buffer);
		const headerLength = 30;
		let offset = 20;

		for (let i = 0; i < maxSamples; ++i) {
			const instrument = new Instrument();
			instrument.name = BinUtils.readAscii(buffer, 22, offset);
			instrument.length = BinUtils.readWord(buffer, offset + 22) * 2;
			instrument.finetune = uint8buffer[offset + 24] & 0xF0;
			instrument.volume = uint8buffer[offset + 25];
			instrument.loopStart = BinUtils.readWord(buffer, offset + 26) * 2;
			instrument.loopLength = BinUtils.readWord(buffer, offset + 28) * 2;

			// Existing mod players seem to play a sample only once if repeatLength is set to 2
			if (instrument.loopLength === 2) {
				instrument.loopLength = 0;
				// some modules seem to skip the first two bytes for length
				if (instrument.length === 2) {
					instrument.length = 0;
				}
			}

			if (instrument.loopLength > instrument.length) {
				instrument.loopLength = 0;
				instrument.loopStart = 0;
			}

			instruments.push(instrument);

			offset += headerLength;
		}

		return instruments;
	}

	static readOrder(buffer, maxSamples) {
		// pattern order table always starts at offset 950 (or 470 for old 15-sample modules)
		const offset = maxSamples === 15 ? 470 : 950;
		const uint8buffer = new Uint8Array(buffer, offset);
		const songLength = uint8buffer[0];
		const order = [];
		let max = 0;

		for (let i = 0; i < songLength; ++i) {
			const pos = uint8buffer[2 + i];
			order.push(pos);
			if (pos > max) {
				max = pos;
			}
		}

		return { order, patternCount: max + 1 };
	}

	static readPatterns(buffer, patternOffset, patternCount, instruments) {
		const patterns = [];
		const patternLength = 1024;
		const channelCount = 4;
		let position = patternOffset;

		for (let p = 0; p < patternCount; ++p) {
			const raw = new Uint8Array(buffer, position, patternLength);
			const tracks = [];

			for (let chan = 0; chan < channelCount; ++chan) {
				tracks.push(ModLoader.readTrack(raw, chan, instruments));
			}

			patterns.push(new Pattern(tracks));
			position += patternLength;
		}

		return patterns;
	}

	static readTrack(raw, chan, instruments) {
		const track = new Track();

		for (let row = 0; row < 64; ++row) {
			const offset = row * 16 + chan * 4;
			const period = (raw[offset] & 0x0F) << 8 | raw[1 + offset],
				sampleIndex = (raw[offset] & 0xF0 | raw[2 + offset] >> 4) - 1,
				cmd = raw[2 + offset] & 0xF,
				cmdData = raw[3 + offset];

			if (!period && sampleIndex < 0 && !cmd) {
				// nothing happens on this row for this track: leave the slot null
				continue;
			}

			const note = new Note();

			if (period) {
				note.note = ModLoader.periodToPitch(period);
			}

			if (sampleIndex >= 0) {
				note.instrument = instruments[sampleIndex] || null;
			}

			if (cmd) {
				if (cmd === 0xE) {
					// extended command: high nibble selects the sub-command,
					// low nibble is the (narrower) parameter
					note.effect = 0xE0 + (cmdData >> 4);
					note.effectParam = cmdData & 0x0F;
				} else {
					note.effect = cmd;
					note.effectParam = cmdData;
				}
			}

			track.notes[row] = note;
		}

		return track;
	}

	static periodToPitch(period) {
		let closest = 0,
			bestDiff = Infinity;

		for (let i = 0; i < PitchPeriods.length; ++i) {
			const diff = Math.abs(PitchPeriods[i] - period);
			if (diff < bestDiff) {
				bestDiff = diff;
				closest = i;
			}
		}

		return closest;
	}

	static readSampleData(buffer, patternOffset, patternCount, instruments) {
		// samples start right after patterns
		let offset = patternOffset + patternCount * 1024;

		for (const instrument of instruments) {
			const length = instrument.length,
				data = new Float32Array(length),
				maxLength = (offset + length) > buffer.byteLength ? buffer.byteLength - offset : length,
				pcm = new Int8Array(buffer, offset, maxLength);

			// convert 8bit pcm format to webaudio format
			for (let j = 0; j < length; ++j) {
				data[j] = pcm[j] / 128.0;
			}

			instrument.data = data;

			offset += maxLength;
		}
	}
}
