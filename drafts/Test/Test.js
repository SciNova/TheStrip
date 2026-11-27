import { Game, Command, Colors, hsvToRgb } from '../../core/system.js';
import { Audio, Tracker } from '../../browser/audio.js';
import { MODFormat } from '../../core/mod.js';

const SEGMENT_COUNT = 4;
const SEGMENT_SPAN = (2 * Math.PI) / (SEGMENT_COUNT * 2);
const SLICE = 2 * SEGMENT_SPAN;
const ROTATION_SPEED = 0.25;
const MIN_BRIGHTNESS = 0.2;

export class Test extends Game {
	constructor(system) {
		super('Test', system);
		this.faggotsTracker = new Tracker(this.audio, Audio.CHANNELS - this.freeChannels);
		this.freeChannels -= 4;
		this.faggotsPlaying = false;
		this.thumbknackTracker = new Tracker(this.audio, Audio.CHANNELS - this.freeChannels);
		this.freeChannels -= 4;
		this.thumbknackPlaying = false;

		this.system.load('/modplayer/mods/faggots_universe.mod').then((buffer) => {
			this.faggotsTracker.load(new MODFormat(buffer));
		});
		this.system.load('/modplayer/mods/thumbknack.mod').then((buffer) => {
			this.thumbknackTracker.load(new MODFormat(buffer));
		});

		this.radius = this.resolution / 4;
	}

	loop() {
		super.loop();

		let tracker = null;
		if (this.faggotsPlaying) {
			tracker = this.faggotsTracker;
		} else if (this.thumbknackPlaying) {
			tracker = this.thumbknackTracker;
		}

		const quarter = tracker ? Math.floor(tracker.beat / 4) % 4 : -1;
		const segmentSize = this.resolution / 4;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = Math.floor(i / segmentSize) === quarter ? Colors.GREEN : 0;
		}

		this._renderCircle();
	}

	_renderCircle() {
		const center = this.resolution / 2;
		const r = this.radius;
		const turn = this.system.clock.timestamp * ROTATION_SPEED * 2 * Math.PI;

		const litSegment = (angle) => {
			let phase = (angle - turn) % SLICE;
			if (phase < 0) {
				phase += SLICE;
			}
			if (phase >= SEGMENT_SPAN) {
				return -1;
			}
			let k = Math.floor((angle - turn) / SLICE) % SEGMENT_COUNT;
			if (k < 0) {
				k += SEGMENT_COUNT;
			}
			return k;
		};

		for (let x = 0; x < this.resolution; x++) {
			const u = (x - center) / r;
			if (u < -1 || u > 1) {
				continue;
			}
			const frontAngle = Math.asin(u);
			const backAngle = Math.PI - frontAngle;

			let angle;
			let k = litSegment(frontAngle);
			if (k >= 0) {
				angle = frontAngle;
			} else {
				k = litSegment(backAngle);
				if (k < 0) {
					continue;
				}
				angle = backAngle;
			}

			const z = r * Math.cos(angle);
			const brightness = MIN_BRIGHTNESS + (1 - MIN_BRIGHTNESS) * (z + r) / (2 * r);
			this.pixels[x] = hsvToRgb(k / SEGMENT_COUNT, 1.0, brightness);
		}
	}

	handleInput(padId, event) {
		switch (event.command) {
			case Command.FIRE_PRESS:
				if (this.faggotsPlaying) {
					this.faggotsTracker.stop();
					this.faggotsPlaying = false;
				} else {
					this.thumbknackTracker.stop();
					this.thumbknackPlaying = false;
					this.faggotsTracker.play(0, 27, false);
					this.faggotsPlaying = true;
				}
				break;

			case Command.FIRE2_PRESS:
				if (this.thumbknackPlaying) {
					this.thumbknackTracker.stop();
					this.thumbknackPlaying = false;
				} else {
					this.faggotsTracker.stop();
					this.faggotsPlaying = false;
					this.thumbknackTracker.play(0, 63, false);
					this.thumbknackPlaying = true;
				}
				break;
		}
	}
}
