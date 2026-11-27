import { Audio } from './Audio.js';

export class Tracker {
	constructor(audio, track, channel) {
		this.audio = audio;
		this.track = track;
		this.channel = channel;
		this.channelCount = track.segments[0]?.[0]?.length ?? 0;
		(audio.system.game ?? audio.system).trackers.push(this);
		(audio.system.game ?? audio.system).freeChannels -= this.channelCount;
		this.playing = false;
		this.startSegment = 0;
		this.segmentCount = 1;
		this.loop = false;
		this.position = 0.0;
		this.segment = 0;
		this.bar = 0;
		this.beat = 0;
		this.active = new Array(this.channelCount).fill(null);

		for (const bars of track.segments) {
			for (const bar of bars) {
				for (const channelEvents of bar) {
					for (const event of channelEvents) {
						event.tracker = this;
					}
				}
			}
		}
	}

	play(segment = 0, segments = 1, loop = false) {
		this.startSegment = segment;
		this.segmentCount = segments;
		this.loop = loop;
		this.playing = true;
		this.position = 0.0;
		this.segment = segment;
		this.bar = 0;
		this.beat = 0;
		this.active.fill(null);
	}

	pause() {
		this.playing = false;
		for (let c = 0; c < this.channelCount; c++) {
			this.audio.channels[Audio.CHANNELS - 1 - (this.channel + c)] = 0.0;
		}
	}

	resume() {
		this.playing = true;
	}

	stop() {
		this.playing = false;
		this.active.fill(null);
		for (let c = 0; c < this.channelCount; c++) {
			this.audio.channels[Audio.CHANNELS - 1 - (this.channel + c)] = 0.0;
		}
	}

	render() {
		const secondsPerBeat = 60 / this.track.tempo;
		const barDuration = this.track.beatsPerMeasure * secondsPerBeat;

		let totalBars = 0;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			totalBars += this.track.segments[s]?.length ?? 0;
		}
		const totalDuration = totalBars * barDuration;

		this.position += 1 / this.audio.sampleRate;

		if (totalDuration <= 0 || (!this.loop && this.position >= totalDuration)) {
			this.stop();
			return;
		}
		if (this.loop && this.position >= totalDuration) {
			this.position -= totalDuration;
			this.active.fill(null);
		}

		let barIndex = Math.floor(this.position / barDuration);
		const beatPosition = (this.position - barIndex * barDuration) / secondsPerBeat;
		this.beat = Math.floor(beatPosition);

		let bar = null;
		for (let s = this.startSegment; s < this.startSegment + this.segmentCount; s++) {
			const bars = this.track.segments[s] ?? [];
			if (barIndex < bars.length) {
				this.segment = s;
				this.bar = barIndex;
				bar = bars[barIndex];
				break;
			}
			barIndex -= bars.length;
		}

		for (let c = 0; c < this.channelCount; c++) {
			const events = bar?.[c] ?? [];
			let candidate = null;
			for (const event of events) {
				if (event.position <= beatPosition && (candidate === null || event.position > candidate.position)) {
					candidate = event;
				}
			}
			if (candidate !== null) {
				this.active[c] = candidate;
			}
			this.audio.channels[Audio.CHANNELS - 1 - (this.channel + c)] = this.active[c] ? this.active[c].render() : 0.0;
		}
	}
}
