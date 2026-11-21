import { Game, Command, Colors } from '../../core/system.js';
import { Tracker } from '../../core/audio.js';
import { MODFormat } from '../../core/mod.js';

export class Test extends Game {
	constructor(system) {
		super('Test', system);
		this.faggotsTracker = new Tracker(this.audio);
		this.faggotsPlaying = false;
		this.thumbknackTracker = new Tracker(this.audio);
		this.thumbknackPlaying = false;

		MODFormat.load('../modplayer/mods/faggots_universe.mod').then((track) => {
			this.faggotsTracker.load(track);
		});
		MODFormat.load('../modplayer/mods/thumbknack.mod').then((track) => {
			this.thumbknackTracker.load(track);
		});
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
	}

	cleanup() {
		this.faggotsTracker.stop();
		this.thumbknackTracker.stop();
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
					this.faggotsTracker.play(0, 0, 27, false);
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
					this.thumbknackTracker.play(4, 0, 63, false);
					this.thumbknackPlaying = true;
				}
				break;
		}
	}
}
