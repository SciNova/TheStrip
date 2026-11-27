import { SystemSound } from './audio.js';
import { SoundEvent, Track } from './tracker.js';

export class JSONFormat {
	static async load(path) {
		const text = await JSONFormat._readText(path);
		return JSONFormat.parse(text);
	}

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
