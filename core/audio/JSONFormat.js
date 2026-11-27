import { SystemSound } from './SystemSound.js';
import { SoundEvent } from './SoundEvent.js';
import { Track } from './Track.js';

export class JSONFormat {
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
