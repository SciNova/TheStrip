/**
 * Converts a format-agnostic Song back into a .s3m file (ArrayBuffer).
 * The exact inverse of S3mLoader: same header/parapointer/packed-pattern
 * byte layout, validated against it by round-tripping real files (load,
 * save, reload, diff the two Songs) rather than by inspection.
 *
 * Deliberate, named gaps (things that don't survive a round trip because
 * the engine/loader never needed them in the first place):
 *  - samples are always written 8-bit mono (ffi=2, unsigned) - this is all
 *    S3mLoader itself ever reads; 16-bit/stereo instruments were already
 *    silent/empty after loading, so they stay that way after a round trip
 *  - an unmappable effect (one decodeEffect() never produces from any real
 *    S3M command letter) is dropped with a console.warn rather than
 *    guessed at - shouldn't occur for a Song that came from S3mLoader
 *  - RETRIGGER's original upper nibble (volume-slide-while-retriggering)
 *    is lost, because decodeEffect() already discards it on load
 *  - SET_SPEED round-trips to the same runtime behaviour but always as
 *    S3M command letter 'A', even if the original byte was 'T' (Set
 *    Tempo) - the engine's own effect handler picks speed-vs-tempo from
 *    the parameter value either way, so playback is unaffected
 *  - a cell whose only content was one of those unmapped command letters
 *    loads as a Note object with every field at its default (already a
 *    no-op to the engine) and write()s back to nothing at all, which
 *    reloads as null instead of an empty Note - a difference only visible
 *    by inspecting the Song's shape, never in anything the engine plays
 */
class S3mWriter {
	static save(song) {
		const channelCount = song.patterns.length ? song.patterns[0].tracks.length : 0;
		const ordNum = song.order.length;
		const insNum = song.instruments.length;
		const patNum = song.patterns.length;

		const instrumentIndex = new Map();
		song.instruments.forEach((instrument, i) => instrumentIndex.set(instrument, i));

		const patternBlobs = song.patterns.map((pattern) => S3mWriter.encodePattern(pattern, channelCount, instrumentIndex));

		const tablesEnd = 96 + ordNum + insNum * 2 + patNum * 2 + 32 /* pan table, always emitted */;
		const instrumentAreaStart = S3mWriter.align16(tablesEnd);

		const headerOffsets = song.instruments.map((_, i) => instrumentAreaStart + i * 80);
		const instrumentHeadersEnd = instrumentAreaStart + insNum * 80;

		let cursor = instrumentHeadersEnd;
		const dataOffsets = song.instruments.map((instrument) => {
			if (!instrument.data || !instrument.data.length) {
				return 0;
			}
			cursor = S3mWriter.align16(cursor);
			const offset = cursor;
			cursor += instrument.data.length;
			return offset;
		});

		cursor = S3mWriter.align16(cursor);
		const patternOffsets = patternBlobs.map((blob) => {
			cursor = S3mWriter.align16(cursor);
			const offset = cursor;
			cursor += 2 + blob.length;
			return offset;
		});

		const w = new ByteWriter();

		S3mWriter.writeHeader(w, song, { ordNum, insNum, patNum, channelCount });
		song.order.forEach((pos) => w.pushByte(pos));
		headerOffsets.forEach((offset, i) => w.pushWord((song.instruments[i].data && song.instruments[i].data.length ? offset : 0) / 16));
		patternOffsets.forEach((offset) => w.pushWord(offset / 16));
		S3mWriter.writePanTable(w, song, channelCount);

		song.instruments.forEach((instrument, i) => {
			w.padTo(headerOffsets[i]);
			S3mWriter.writeInstrument(w, instrument, dataOffsets[i]);
		});

		song.instruments.forEach((instrument, i) => {
			if (dataOffsets[i]) {
				w.padTo(dataOffsets[i]);
				S3mWriter.writeSampleData(w, instrument.data);
			}
		});

		patternBlobs.forEach((blob, p) => {
			w.padTo(patternOffsets[p]);
			w.pushWord(blob.length);
			w.pushBytes(blob);
		});

		return w.toArrayBuffer();
	}

	static align16(offset) {
		return Math.ceil(offset / 16) * 16;
	}

	static writeHeader(w, song, { ordNum, insNum, patNum, channelCount }) {
		w.pushAscii(song.title, 28);
		w.pushByte(0x1A);
		w.pushByte(0x10);
		w.pushWord(0); // reserved
		w.pushWord(ordNum);
		w.pushWord(insNum);
		w.pushWord(patNum);
		w.pushWord(0); // flags - never read by S3mLoader
		w.pushWord(0); // "created with tracker version" - never read
		w.pushWord(2); // ffi: samples are always written unsigned 8-bit
		w.pushAscii('SCRM', 4);
		w.pushByte(Math.min(64, song.globalVolume != null ? song.globalVolume : 64));
		w.pushByte(song.initialSpeed || 6);
		w.pushByte(song.initialTempo || 125);
		w.pushByte(0); // master volume - never read
		w.pushByte(0); // ultra-click removal - never read
		w.pushByte(0xFC); // default pan: 0xFC = "read the explicit pan table that follows"
		for (let i = 0; i < 12; ++i) {
			w.pushByte(0); // reserved + "special" pointer - never read
		}
		for (let i = 0; i < 30; ++i) {
			// channel settings: only used by S3mLoader to find channelCount
			// (first 0xFF) when there's no explicit pan table - harmless here
			// since we always provide one, but keep it honest/playable by any
			// other S3M player too
			w.pushByte(i < channelCount ? i % 16 : 0xFF);
		}
	}

	static writePanTable(w, song, channelCount) {
		for (let i = 0; i < 32; ++i) {
			if (i >= channelCount) {
				w.pushByte(0);
				continue;
			}
			const pan = Math.max(0, Math.min(1, song.patterns[0].tracks[i].pan));
			w.pushByte(0x80 | Math.round(pan * 15));
		}
	}

	static writeInstrument(w, instrument, dataOffset) {
		const hasData = !!(instrument.data && instrument.data.length);

		w.pushByte(hasData ? 1 : 0);
		for (let i = 0; i < 12; ++i) {
			w.pushByte(0); // DOS filename - never read
		}

		const memseg = dataOffset / 16;
		w.pushByte((memseg >> 16) & 0xFF);
		w.pushWord(memseg & 0xFFFF);

		w.pushDword(hasData ? instrument.data.length : 0);
		w.pushDword(instrument.loopLength ? instrument.loopStart : 0);
		w.pushDword(instrument.loopLength ? instrument.loopStart + instrument.loopLength : 0);
		w.pushByte(Math.max(0, Math.min(64, instrument.volume)));
		w.pushByte(0); // reserved
		w.pushByte(0); // packing: always unpacked
		w.pushByte(instrument.loopLength ? 0x1 : 0); // flags: loop only - mono, 8-bit always
		w.pushDword(instrument.c2spd || 8363);
		for (let i = 0; i < 12; ++i) {
			w.pushByte(0); // reserved
		}
		w.pushAscii(instrument.name, 28);
		w.pushAscii('SCRS', 4);
	}

	static writeSampleData(w, data) {
		for (let i = 0; i < data.length; ++i) {
			const byte = Math.round(data[i] * 128) + 128;
			w.pushByte(Math.max(0, Math.min(255, byte)));
		}
	}

	/**
	 * Packs one pattern's 64 rows into the "what byte" format S3mLoader
	 * decodes: one byte per channel-with-something-to-say per row (channel
	 * index in bits 0-4, bits 5/6/7 flagging note+instrument/volume/effect
	 * presence), terminated by a single 0x00 per row.
	 */
	static encodePattern(pattern, channelCount, instrumentIndex) {
		const bytes = [];

		for (let row = 0; row < 64; ++row) {
			for (let chan = 0; chan < channelCount; ++chan) {
				const note = pattern.tracks[chan].notes[row];
				if (!note) {
					continue;
				}

				const hasNote = note.note !== Pitch.NONE || note.instrument !== null;
				const hasVolume = note.volume !== null;
				const effectBytes = S3mWriter.encodeEffect(note);
				const hasEffect = note.effect !== Effect.NONE && effectBytes !== null;

				if (!hasNote && !hasVolume && !hasEffect) {
					continue;
				}

				let what = chan & 0x1F;
				if (hasNote) what |= 0x20;
				if (hasVolume) what |= 0x40;
				if (hasEffect) what |= 0x80;

				bytes.push(what);

				if (hasNote) {
					let noteByte;
					if (note.note === Pitch.CUT) {
						noteByte = 254;
					} else if (note.note === Pitch.NONE) {
						noteByte = 255;
					} else {
						noteByte = ((Math.floor(note.note / 12) << 4) | (note.note % 12)) & 0xFF;
					}
					bytes.push(noteByte);
					bytes.push(note.instrument && instrumentIndex.has(note.instrument) ? instrumentIndex.get(note.instrument) + 1 : 0);
				}

				if (hasVolume) {
					bytes.push(Math.max(0, Math.min(64, note.volume)));
				}

				if (hasEffect) {
					bytes.push(effectBytes.cmd, effectBytes.param);
				}
			}

			bytes.push(0);
		}

		return Uint8Array.from(bytes);
	}

	/**
	 * Inverse of S3mLoader.decodeEffect(): shared Effect enum value -> S3M
	 * command letter (1=A..26=Z) + parameter byte. Returns null for an
	 * effect decodeEffect() never actually produces (nothing to invert).
	 */
	static encodeEffect(note) {
		const data = note.effectParam;

		switch (note.effect) {
			case Effect.SET_SPEED: return { cmd: 1, param: data };
			case Effect.POSITION_JUMP: return { cmd: 2, param: data };
			case Effect.ROW_JUMP: {
				const tens = (data >> 4) & 0xF, ones = data & 0xF;
				return { cmd: 3, param: tens * 10 + ones };
			}
			case Effect.VOLUME_SLIDE: return { cmd: 4, param: data };
			case Effect.SLIDE_DOWN: return { cmd: 5, param: data };
			case Effect.FINE_SLIDE_DOWN: return { cmd: 5, param: 0xE0 | (data & 0x0F) };
			case Effect.SLIDE_UP: return { cmd: 6, param: data };
			case Effect.FINE_SLIDE_UP: return { cmd: 6, param: 0xE0 | (data & 0x0F) };
			case Effect.PORTAMENTO: return { cmd: 7, param: data };
			case Effect.VIBRATO: return { cmd: 8, param: data };
			case Effect.VOLUME_SLIDE_VIBRATO: return { cmd: 11, param: data };
			case Effect.VOLUME_SLIDE_PORTAMENTO: return { cmd: 12, param: data };
			case Effect.SET_SAMPLE_OFFSET: return { cmd: 15, param: data };
			case Effect.RETRIGGER: return { cmd: 17, param: data & 0x0F };
			case Effect.LOOP_PATTERN: return { cmd: 19, param: (0xB << 4) | data };
			case Effect.DELAY_SAMPLE: return { cmd: 19, param: (0xD << 4) | data };
			case Effect.SET_GLOBAL_VOLUME: return { cmd: 22, param: data };
			case Effect.SET_PANNING: return { cmd: 24, param: data };
			case Effect.NONE: return null;
			default:
				console.warn(`S3mWriter: effect 0x${note.effect.toString(16)} has no S3M command letter, dropping it`);
				return null;
		}
	}
}

/**
 * Minimal growable byte buffer with the handful of primitives S3M writing
 * needs. Lives here rather than in mod-loader.js's BinUtils because that
 * one only ever reads from an existing ArrayBuffer.
 */
class ByteWriter {
	constructor() {
		this.bytes = [];
	}

	pushByte(value) {
		this.bytes.push(value & 0xFF);
	}

	pushBytes(values) {
		for (let i = 0; i < values.length; ++i) {
			this.bytes.push(values[i] & 0xFF);
		}
	}

	pushWord(value) {
		this.bytes.push(value & 0xFF, (value >> 8) & 0xFF);
	}

	pushDword(value) {
		this.bytes.push(value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF);
	}

	pushAscii(str, length) {
		for (let i = 0; i < length; ++i) {
			this.bytes.push(i < str.length ? str.charCodeAt(i) & 0xFF : 0);
		}
	}

	padTo(offset) {
		while (this.bytes.length < offset) {
			this.bytes.push(0);
		}
	}

	toArrayBuffer() {
		return Uint8Array.from(this.bytes).buffer;
	}
}

// see note.js for why this is needed (addModule loads files as isolated ES modules)
// - harmless here too, since this class is author-time tooling, never loaded
// inside the worklet realm at all
globalThis.S3mWriter = S3mWriter;
