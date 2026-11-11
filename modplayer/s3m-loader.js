/**
 * Converts a .s3m file (ArrayBuffer) into a format-agnostic Song.
 * Knows nothing about audio playback - only about the .s3m binary layout.
 * Reuses BinUtils from mod-loader.js (plain <script> tags share scope here;
 * this file is never loaded via audioWorklet.addModule, only ModLoader is).
 */
class S3mLoader {
	static load(buffer) {
		if (!S3mLoader.isModule(buffer)) {
			throw new Error('Not a valid .s3m file');
		}

		const header = S3mLoader.readHeader(buffer);

		const song = new Song();
		song.format = 's3m';
		song.title = BinUtils.readAscii(buffer, 28, 0);
		// S3M's own PC-clock tuning reference (14317056 / 4) - see periodForS3mNote() in note.js
		song.periodClock = 3579264;
		song.globalVolume = header.globalVolume;
		song.initialSpeed = header.initialSpeed;
		song.initialTempo = header.initialTempo;

		song.instruments = S3mLoader.readInstruments(buffer, header);
		song.order = S3mLoader.readOrder(buffer, header);

		const pans = S3mLoader.readChannelPans(buffer, header);
		song.patterns = S3mLoader.readPatterns(buffer, header, song.instruments, pans);

		return song;
	}

	static isModule(buffer) {
		return buffer.byteLength > 96 && BinUtils.readAscii(buffer, 4, 44) === 'SCRM';
	}

	static readHeader(buffer) {
		const view = new DataView(buffer);
		const ordNum = BinUtils.readWord(buffer, 32, true);
		const insNum = BinUtils.readWord(buffer, 34, true);
		const patNum = BinUtils.readWord(buffer, 36, true);
		const ffi = BinUtils.readWord(buffer, 42, true);
		const globalVolume = view.getUint8(48);
		const initialSpeed = view.getUint8(49);
		const initialTempo = view.getUint8(50);
		const defaultPan = view.getUint8(53);

		const chSettings = [];
		for (let i = 0; i < 32; ++i) {
			chSettings.push(view.getUint8(66 + i));
		}

		// Active channels are always packed contiguously from index 0; some files
		// leave stray non-0xFF garbage after the real block (seen in the wild), so
		// stop at the first 0xFF rather than counting every non-0xFF entry.
		let channelCount = chSettings.findIndex((c) => c === 0xFF);
		if (channelCount < 0) {
			channelCount = 32;
		}
		channelCount = Math.max(1, channelCount);

		return { ordNum, insNum, patNum, ffi, globalVolume, initialSpeed, initialTempo, defaultPan, chSettings, channelCount };
	}

	static readOrder(buffer, header) {
		const offset = 96;
		const raw = new Uint8Array(buffer, offset, header.ordNum);
		const order = [];

		for (let i = 0; i < header.ordNum; ++i) {
			const pos = raw[i];

			if (pos === 255) {
				// end of song marker
				break;
			}
			if (pos === 254) {
				// "+++" skip marker: not a real pattern, just skip this entry
				continue;
			}

			order.push(pos);
		}

		return order;
	}

	static readChannelPans(buffer, header) {
		const pans = new Array(header.channelCount).fill(0.5);
		let panTable = null;

		if (header.defaultPan === 0xFC) {
			const panTableOffset = 96 + header.ordNum + header.insNum * 2 + header.patNum * 2;
			if (panTableOffset + 32 <= buffer.byteLength) {
				panTable = new Uint8Array(buffer, panTableOffset, 32);
			}
		}

		for (let i = 0; i < header.channelCount; ++i) {
			const entry = panTable ? panTable[i] : 0;

			if (panTable && (entry & 0x80)) {
				pans[i] = (entry & 0x0F) / 15.0;
			} else {
				const type = header.chSettings[i];
				if (type >= 8 && type <= 15) {
					pans[i] = 0.8; // "right" channel (classic ST3 default stereo spread)
				} else if (type <= 7) {
					pans[i] = 0.2; // "left" channel
				}
			}
		}

		return pans;
	}

	static readInstruments(buffer, header) {
		const instruments = [];
		const insPtrOffset = 96 + header.ordNum;

		for (let i = 0; i < header.insNum; ++i) {
			const ptr = BinUtils.readWord(buffer, insPtrOffset + i * 2, true) * 16;
			instruments.push(S3mLoader.readInstrument(buffer, ptr, header.ffi));
		}

		return instruments;
	}

	static readInstrument(buffer, ptr, ffi) {
		const instrument = new Instrument();
		instrument.data = new Float32Array(0);

		if (ptr === 0 || ptr + 80 > buffer.byteLength) {
			return instrument;
		}

		const view = new DataView(buffer);
		const type = view.getUint8(ptr);

		if (type !== 1) {
			// not a PCM sample (empty slot, or an Adlib instrument) - leave silent
			return instrument;
		}

		instrument.name = BinUtils.readAscii(buffer, 28, ptr + 48);

		const memsegHi = view.getUint8(ptr + 13);
		const memsegLo = BinUtils.readWord(buffer, ptr + 14, true);
		const dataOffset = ((memsegHi << 16) | memsegLo) * 16;

		const length = BinUtils.readDword(buffer, ptr + 16, true);
		const loopBegin = BinUtils.readDword(buffer, ptr + 20, true);
		const loopEnd = BinUtils.readDword(buffer, ptr + 24, true);
		instrument.volume = view.getUint8(ptr + 28);
		const flags = view.getUint8(ptr + 31);
		instrument.c2spd = BinUtils.readDword(buffer, ptr + 32, true) || 8363;

		if (flags & 0x1) {
			instrument.loopStart = loopBegin;
			instrument.loopLength = Math.max(0, loopEnd - loopBegin);
		}

		const is16Bit = !!(flags & 0x4);
		const isStereo = !!(flags & 0x2);

		if (!is16Bit && !isStereo && length > 0) {
			instrument.length = length;
			instrument.data = S3mLoader.readSampleData(buffer, dataOffset, length, ffi);
		} else if (length > 0) {
			console.warn(`S3mLoader: skipping unsupported sample "${instrument.name}" (16-bit=${is16Bit}, stereo=${isStereo})`);
		}

		return instrument;
	}

	static readSampleData(buffer, offset, length, ffi) {
		const data = new Float32Array(length);
		const maxLength = Math.max(0, Math.min(length, buffer.byteLength - offset));
		const bytes = new Uint8Array(buffer, offset, maxLength);

		if (ffi === 1) {
			// signed 8-bit (old/rare) - same convention as MOD, read directly
			for (let i = 0; i < maxLength; ++i) {
				data[i] = (bytes[i] << 24 >> 24) / 128.0;
			}
		} else {
			// unsigned 8-bit (standard default): center around 128 first
			for (let i = 0; i < maxLength; ++i) {
				data[i] = (bytes[i] - 128) / 128.0;
			}
		}

		return data;
	}

	static readPatterns(buffer, header, instruments, pans) {
		const patPtrOffset = 96 + header.ordNum + header.insNum * 2;
		const patterns = [];

		for (let p = 0; p < header.patNum; ++p) {
			const ptr = BinUtils.readWord(buffer, patPtrOffset + p * 2, true) * 16;
			patterns.push(S3mLoader.readPattern(buffer, ptr, instruments, header.channelCount, pans));
		}

		return patterns;
	}

	static readPattern(buffer, ptr, instruments, channelCount, pans) {
		const tracks = [];
		for (let i = 0; i < channelCount; ++i) {
			const track = new Track();
			track.pan = pans[i];
			tracks.push(track);
		}

		if (ptr === 0 || ptr + 2 > buffer.byteLength) {
			// empty pattern slot
			return new Pattern(tracks);
		}

		const packedLength = BinUtils.readWord(buffer, ptr, true);
		const data = new Uint8Array(buffer, ptr + 2, Math.max(0, Math.min(packedLength, buffer.byteLength - ptr - 2)));

		let pos = 0,
			row = 0;

		while (pos < data.length && row < 64) {
			const what = data[pos++];

			if (what === 0) {
				row++;
				continue;
			}

			const chan = what & 0x1F;
			let noteByte = null,
				insByte = 0,
				volByte = null,
				cmdByte = 0,
				infoByte = 0;

			if (what & 0x20) {
				noteByte = data[pos++];
				insByte = data[pos++];
			}
			if (what & 0x40) {
				volByte = data[pos++];
			}
			if (what & 0x80) {
				cmdByte = data[pos++];
				infoByte = data[pos++];
			}

			if (chan >= channelCount) {
				// channel beyond what the header declared active: ignore
				continue;
			}

			const track = tracks[chan];
			let note = track.notes[row];
			if (!note) {
				note = new Note();
				track.notes[row] = note;
			}

			if (noteByte !== null && noteByte !== 255) {
				note.note = noteByte === 254 ? Pitch.CUT : (noteByte >> 4) * 12 + (noteByte & 0x0F);
			}
			if (insByte > 0) {
				note.instrument = instruments[insByte - 1] || null;
			}
			if (volByte !== null) {
				note.volume = Math.min(64, volByte);
			}
			if (cmdByte > 0) {
				S3mLoader.decodeEffect(note, cmdByte, infoByte);
			}
		}

		return new Pattern(tracks);
	}

	/**
	 * Translates an S3M command letter (1=A, 2=B, ... 26=Z) + parameter byte
	 * into the shared, format-agnostic Effect enum. Most letters reuse the
	 * exact same handler MOD's effects already use - see tracker-engine.js.
	 * Letters with no mapping here (I, J, M, N, P, R, U, W, Y, Z, and most S
	 * sub-commands) have no equivalent yet and are silently left unset; the
	 * engine already handles an unset effect gracefully (no-op).
	 */
	static decodeEffect(note, cmd, param) {
		switch (cmd) {
			case 1: // A: Set Speed
				note.effect = Effect.SET_SPEED;
				note.effectParam = param;
				break;
			case 2: // B: Position Jump
				note.effect = Effect.POSITION_JUMP;
				note.effectParam = param;
				break;
			case 3: // C: Pattern Break - target row is plain binary here, but the
				// shared ROW_JUMP handler was written for MOD's BCD-encoded Dxx
				note.effect = Effect.ROW_JUMP;
				note.effectParam = (Math.floor(param / 10) << 4) | (param % 10);
				break;
			case 4: // D: Volume Slide
				note.effect = Effect.VOLUME_SLIDE;
				note.effectParam = param;
				break;
			case 5: // E: Slide pitch down (+ fine/extra-fine variants)
				if (param >= 0xE0) {
					note.effect = Effect.FINE_SLIDE_DOWN;
					note.effectParam = param & 0x0F;
				} else {
					note.effect = Effect.SLIDE_DOWN;
					note.effectParam = param;
				}
				break;
			case 6: // F: Slide pitch up (+ fine/extra-fine variants)
				if (param >= 0xE0) {
					note.effect = Effect.FINE_SLIDE_UP;
					note.effectParam = param & 0x0F;
				} else {
					note.effect = Effect.SLIDE_UP;
					note.effectParam = param;
				}
				break;
			case 7: // G: Tone Portamento
				note.effect = Effect.PORTAMENTO;
				note.effectParam = param;
				break;
			case 8: // H: Vibrato
				note.effect = Effect.VIBRATO;
				note.effectParam = param;
				break;
			case 11: // K: Vibrato + Volume Slide
				note.effect = Effect.VOLUME_SLIDE_VIBRATO;
				note.effectParam = param;
				break;
			case 12: // L: Tone Portamento + Volume Slide
				note.effect = Effect.VOLUME_SLIDE_PORTAMENTO;
				note.effectParam = param;
				break;
			case 15: // O: Sample Offset
				note.effect = Effect.SET_SAMPLE_OFFSET;
				note.effectParam = param;
				break;
			case 17: // Q: Retrigger + Volume Slide - only the retrigger-every-N-ticks part
				note.effect = Effect.RETRIGGER;
				note.effectParam = param & 0x0F;
				break;
			case 19: { // S: special sub-commands - only the ones with a direct equivalent
				const sub = param >> 4,
					subParam = param & 0x0F;

				if (sub === 0xB) { // SBx: pattern loop
					note.effect = Effect.LOOP_PATTERN;
					note.effectParam = subParam;
				} else if (sub === 0xD) { // SDx: note delay
					note.effect = Effect.DELAY_SAMPLE;
					note.effectParam = subParam;
				}
				break;
			}
			case 20: // T: Set Tempo
				note.effect = Effect.SET_SPEED;
				note.effectParam = param;
				break;
			case 22: // V: Set Global Volume
				note.effect = Effect.SET_GLOBAL_VOLUME;
				note.effectParam = param;
				break;
			case 24: // X: Set Panning
				note.effect = Effect.SET_PANNING;
				note.effectParam = param;
				break;
		}
	}
}
