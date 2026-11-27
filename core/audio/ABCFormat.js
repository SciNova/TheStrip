import { Note } from './Note.js';
import { SystemSound } from './SystemSound.js';
import { SoundEvent } from './SoundEvent.js';
import { Track } from './Track.js';

export class ABCFormat {
	static DEFAULT_BEATS_PER_MEASURE = 4;
	static DEFAULT_BEAT_UNIT = 1 / 4;
	static DEFAULT_TEMPO = 120;
	static CHANNEL_COUNT = 10;
	static NATURAL_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
	static PITCH_TOKEN = /(\^\^|\^|__|_|=)?([A-Ga-g])([,']*)/g;
	static TOKEN = /\[([^\]]*)\]([\d/]*)|(\^\^|\^|__|_|=)?([A-Ga-gZz])([,']*)([\d/]*)/g;

	constructor(abc) {
		const track = new Track();

		const meter = ABCFormat._parseMeter(abc);
		track.tempo = ABCFormat._parseTempo(abc, meter.beatUnit);
		track.beatsPerMeasure = meter.beatsPerMeasure;

		const defaultLength = ABCFormat._parseDefaultLength(abc, meter.beatsPerMeasure, meter.beatUnit);
		const baseDurationInBeats = defaultLength / meter.beatUnit;
		const segmentsByVoice = ABCFormat._parseVoiceSegments(abc);
		const voiceNames = ABCFormat._parseVoiceNames(abc);
		const built = ABCFormat._buildSegments(segmentsByVoice, baseDurationInBeats, voiceNames);
		track.segments = built.segments;

		return track;
	}

	static _parseVoiceNames(abc) {
		const names = new Map();
		const regex = /^V:\s*(\S+).*\bname="([^"]*)"/gm;
		let match;
		while ((match = regex.exec(abc)) !== null) {
			names.set(match[1], match[2]);
		}
		return names;
	}

	static _parseMeter(abc) {
		const match = abc.match(/^M:\s*(.+)$/m);
		if (!match) {
			return { beatsPerMeasure: ABCFormat.DEFAULT_BEATS_PER_MEASURE, beatUnit: ABCFormat.DEFAULT_BEAT_UNIT };
		}

		const value = match[1].trim();
		if (value === 'C') {
			return { beatsPerMeasure: 4, beatUnit: 1 / 4 };
		}
		if (value === 'C|') {
			return { beatsPerMeasure: 2, beatUnit: 1 / 2 };
		}

		const fraction = value.match(/^(\d+)\/(\d+)$/);
		if (!fraction) {
			return { beatsPerMeasure: ABCFormat.DEFAULT_BEATS_PER_MEASURE, beatUnit: ABCFormat.DEFAULT_BEAT_UNIT };
		}

		const numerator = parseInt(fraction[1], 10);
		const denominator = parseInt(fraction[2], 10);
		return { beatsPerMeasure: numerator, beatUnit: 1 / denominator };
	}

	static _parseTempo(abc, beatUnit) {
		const match = abc.match(/^Q:\s*(.+)$/m);
		if (!match) {
			return ABCFormat.DEFAULT_TEMPO;
		}

		const value = match[1].trim();

		const explicit = value.match(/^(\d+)\/(\d+)\s*=\s*(\d+(?:\.\d+)?)$/);
		if (explicit) {
			const noteValue = parseInt(explicit[1], 10) / parseInt(explicit[2], 10);
			const bpm = parseFloat(explicit[3]);
			return bpm * (noteValue / beatUnit);
		}

		const bare = value.match(/^(\d+(?:\.\d+)?)$/);
		if (bare) {
			return parseFloat(bare[1]);
		}

		return ABCFormat.DEFAULT_TEMPO;
	}

	static _parseDefaultLength(abc, beatsPerMeasure, beatUnit) {
		const match = abc.match(/^L:\s*(\d+)\/(\d+)$/m);
		if (match) {
			return parseInt(match[1], 10) / parseInt(match[2], 10);
		}
		const ratio = beatsPerMeasure * beatUnit;
		return ratio >= 0.75 ? 1 / 8 : 1 / 16;
	}

	static _bodyAfterHeader(abc) {
		const match = abc.match(/^K:.*$/m);
		if (!match) {
			return '';
		}
		const newline = abc.indexOf('\n', match.index);
		return newline === -1 ? '' : abc.slice(newline + 1);
	}

	static _splitBars(text) {
		return text.split('|').map((bar) => bar.trim()).filter((bar) => bar.length > 0);
	}

	static _resolveNote(accidental, letter, octaveMarks) {
		const shift = { '^^': 2, '^': 1, '': 0, '=': 0, '_': -1, '__': -2 }[accidental ?? ''];
		const baseOctave = letter === letter.toLowerCase() ? 4 : 3;
		const octaveShift = (octaveMarks.match(/'/g) || []).length - (octaveMarks.match(/,/g) || []).length;

		const semitone = ABCFormat.NATURAL_SEMITONE[letter.toUpperCase()] + shift;
		const normalizedSemitone = ((semitone % 12) + 12) % 12;
		const octaveCarry = Math.floor(semitone / 12);

		return Note.value(normalizedSemitone, baseOctave + octaveShift + octaveCarry);
	}

	static _parseLengthMultiplier(suffix) {
		const match = suffix.match(/^(\d+)?(\/+)?(\d+)?$/);
		if (!match) {
			return 1;
		}
		const [, numeratorDigits, slashes, denominatorDigits] = match;
		const numerator = numeratorDigits ? parseInt(numeratorDigits, 10) : 1;
		if (!slashes) {
			return numerator;
		}
		if (denominatorDigits) {
			return numerator / parseInt(denominatorDigits, 10);
		}
		return numerator / (2 ** slashes.length);
	}

	static _parseChordPitches(content) {
		const pitches = [];
		let match;
		ABCFormat.PITCH_TOKEN.lastIndex = 0;
		while ((match = ABCFormat.PITCH_TOKEN.exec(content)) !== null) {
			const [, accidental, letter, octaveMarks] = match;
			pitches.push(ABCFormat._resolveNote(accidental, letter, octaveMarks));
		}
		return pitches;
	}

	static _countVoiceChannels(voiceText) {
		let max = 1;
		const regex = /\[([^\]]*)\]/g;
		let match;
		while ((match = regex.exec(voiceText)) !== null) {
			const count = ABCFormat._parseChordPitches(match[1]).length;
			if (count > max) {
				max = count;
			}
		}
		return max;
	}

	static _parseVoiceEvents(barText, baseDurationInBeats, channelCount, sound) {
		const channelEvents = new Array(channelCount).fill(null).map(() => []);
		let position = 0;
		let match;
		ABCFormat.TOKEN.lastIndex = 0;
		while ((match = ABCFormat.TOKEN.exec(barText)) !== null) {
			const [, chordContent, chordLengthSuffix, accidental, letter, octaveMarks, lengthSuffix] = match;

			if (chordContent !== undefined) {
				const duration = ABCFormat._parseLengthMultiplier(chordLengthSuffix) * baseDurationInBeats;
				ABCFormat._parseChordPitches(chordContent).forEach((note, i) => {
					if (i < channelCount) {
						channelEvents[i].push(new SoundEvent(sound, note, position, duration));
					}
				});
				position += duration;
				continue;
			}

			const duration = ABCFormat._parseLengthMultiplier(lengthSuffix) * baseDurationInBeats;
			if (letter !== 'z' && letter !== 'Z') {
				const note = ABCFormat._resolveNote(accidental, letter, octaveMarks);
				channelEvents[0].push(new SoundEvent(sound, note, position, duration));
			}
			position += duration;
		}
		return channelEvents;
	}

	static _parseVoiceSegments(abc) {
		const body = ABCFormat._bodyAfterHeader(abc);
		const lines = body.split('\n');
		const segmentsByVoice = new Map();
		let currentId = null;
		let currentLines = [];

		function flush() {
			const content = currentLines.join('\n').trim();
			if (content.length > 0) {
				const id = currentId ?? '1';
				if (!segmentsByVoice.has(id)) {
					segmentsByVoice.set(id, []);
				}
				segmentsByVoice.get(id).push(content);
			}
			currentLines = [];
		}

		for (const line of lines) {
			const match = line.match(/^V:\s*(\S+)/);
			if (match) {
				flush();
				currentId = match[1];
			} else {
				currentLines.push(line);
			}
		}
		flush();

		return segmentsByVoice;
	}

	static _buildSegments(segmentsByVoice, baseDurationInBeats, voiceNames) {
		const voiceIds = [...segmentsByVoice.keys()];
		const voiceChannelCounts = voiceIds.map((id) => ABCFormat._countVoiceChannels(segmentsByVoice.get(id).join('\n')));
		const totalChannels = voiceChannelCounts.reduce((sum, count) => sum + count, 0);
		if (totalChannels > ABCFormat.CHANNEL_COUNT) {
			throw new Error(`track needs ${totalChannels} channels, only ${ABCFormat.CHANNEL_COUNT} available`);
		}

		const channelStarts = [];
		const voiceSounds = voiceIds.map((id) => ABCFormat._resolveSound(voiceNames.get(id)));
		for (let i = 0, cursor = 0; i < voiceChannelCounts.length; i++) {
			channelStarts.push(cursor);
			cursor += voiceChannelCounts[i];
		}

		const voiceBars = new Map(voiceIds.map((id) => [id, segmentsByVoice.get(id).map((text) => ABCFormat._splitBars(text))]));

		const segmentCount = Math.max(0, ...voiceIds.map((id) => voiceBars.get(id).length));
		const segments = [];

		for (let s = 0; s < segmentCount; s++) {
			const barCount = Math.max(0, ...voiceIds.map((id) => (voiceBars.get(id)[s] ?? []).length));
			const bars = [];

			for (let b = 0; b < barCount; b++) {
				const channels = new Array(totalChannels).fill(null).map(() => []);
				voiceIds.forEach((id, voiceIndex) => {
					const barText = voiceBars.get(id)[s]?.[b];
					if (barText !== undefined) {
						const channelCount = voiceChannelCounts[voiceIndex];
						const channelEvents = ABCFormat._parseVoiceEvents(barText, baseDurationInBeats, channelCount, voiceSounds[voiceIndex]);
						const start = channelStarts[voiceIndex];
						for (let i = 0; i < channelCount; i++) {
							channels[start + i] = channelEvents[i];
						}
					}
				});
				bars.push(channels);
			}

			segments.push(bars);
		}

		return { segments };
	}

	static _resolveSound(name) {
		if (!name) {
			return null;
		}
		return SystemSound[name.toUpperCase()] ?? null;
	}

}
