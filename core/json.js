import { SystemSound } from './audio-common.js';
import { SoundEvent, Track } from './tracker.js';

export class JSONFormat {
	static async load(path) {
		const text = await JSONFormat._readText(path);
		return JSONFormat.parse(text);
	}

	// path is resolved relative to this file, same in Node (reads the real
	// file) and in a browser (fetches it) - branching on the resolved URL's
	// own protocol rather than checking which environment this is.
	static async _readText(path) {
		const url = new URL(path, import.meta.url);
		if (url.protocol === 'file:') {
			const { readFile } = await import('fs/promises');
			const { fileURLToPath } = await import('url');
			return readFile(fileURLToPath(url), 'utf8');
		}
		const response = await fetch(url);
		return response.text();
	}

	static parse(text) {
		return JSONFormat.fromObject(JSON.parse(text));
	}

	static stringify(track) {
		return JSON.stringify(JSONFormat.toObject(track));
	}

	// Plain, structured-clone/JSON-safe object - this is the thing that
	// actually crosses a postMessage boundary or gets written to a file.
	// Each event's sound is stored as a key name (looked up against the
	// shared SystemSound dictionary by identity), never as an embedded patch.
	static toObject(track) {
		return {
			tempo: track.tempo,
			beatsPerMeasure: track.beatsPerMeasure,
			segments: track.segments.map((bars) =>
				bars.map((channels) =>
					channels.map((events) =>
						events.map((e) => ({
							sound: JSONFormat._soundName(e.sound),
							note: e.note,
							position: e.position,
							duration: e.duration,
							volume: e.volume,
							offset: e.offset,
						}))
					)
				)
			),
		};
	}

	static fromObject(object) {
		const track = new Track();
		track.tempo = object.tempo;
		track.beatsPerMeasure = object.beatsPerMeasure;
		track.segments = object.segments.map((bars) =>
			bars.map((channels) =>
				channels.map((events) =>
					events.map((e) => new SoundEvent(e.sound ? SystemSound[e.sound] : null, e.note, e.position, e.duration, e.volume, e.offset))
				)
			)
		);
		return track;
	}

	static _soundName(sound) {
		if (!sound) {
			return null;
		}
		for (const key in SystemSound) {
			if (SystemSound[key] === sound) {
				return key;
			}
		}
		return null;
	}
}
