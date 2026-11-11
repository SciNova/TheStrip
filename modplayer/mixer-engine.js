/**
 * Owns the shared output buffer and drives however many TrackerEngine
 * instances are currently loaded, each writing into its own reserved slice
 * of the total output list. Runs on the audio render thread (it IS the
 * AudioWorkletProcessor) - the only way in or out is via postMessage. This
 * is the web-specific half of Mixer; its main-thread counterpart is Mixer
 * itself (mixer.js), which this has no knowledge of.
 *
 * Mixing cost is proportional to total track count across all trackers,
 * not to how many TrackerEngine instances exist: the buffer is zeroed once
 * per render quantum, then each tracker accumulates into its own slice.
 */
class MixerEngine extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = this.handleMessage.bind(this);
		this.trackers = new Map();
	}

	handleMessage(event) {
		const data = event.data;

		switch (data.message) {
			case 'init':
				this.mixingRate = data.mixingRate;
				break;

			case 'addTracker':
				this.addTracker(data.trackerId, data.offset);
				break;

			case 'loadSong':
				this.withTracker(data.trackerId, (tracker) => tracker.loadSong(data.song));
				break;

			case 'setPlay':
				this.withTracker(data.trackerId, (tracker) => data.playing ? tracker.play() : tracker.pause());
				break;

			case 'reset':
				this.withTracker(data.trackerId, (tracker) => tracker.reset());
				break;

			case 'setPlayingChannels':
				this.withTracker(data.trackerId, (tracker) => tracker.setPlayingChannels(data.channels));
				break;

			case 'seek':
				this.withTracker(data.trackerId, (tracker) => tracker.seek(data.position));
				break;
		}
	}

	addTracker(trackerId, offset) {
		const tracker = new TrackerEngine(this.mixingRate);
		tracker.offset = offset;
		tracker.onEvent = (message, eventData) => this.postMessage({
			trackerId: trackerId,
			message: message,
			data: eventData
		});
		this.trackers.set(trackerId, tracker);
	}

	withTracker(trackerId, fn) {
		const tracker = this.trackers.get(trackerId);
		if (tracker) {
			fn(tracker);
		}
	}

	postMessage(message) {
		this.port.postMessage(message);
	}

	process(inputs, outputs) {
		this.emptyOutputBuffer(outputs);

		for (const tracker of this.trackers.values()) {
			if (tracker.ready && tracker.playing) {
				tracker.render(outputs, tracker.offset);
			}
		}

		return true;
	}

	emptyOutputBuffer(outputs) {
		const bufLength = outputs[0][0].length;

		for (let chan = 0; chan < outputs.length; ++chan) {
			for (let side = 0; side < outputs[chan].length; ++side) {
				for (let i = 0; i < bufLength; ++i) {
					outputs[chan][side][i] = 0.0;
				}
			}
		}
	}
}

registerProcessor('mixer-processor', MixerEngine);
