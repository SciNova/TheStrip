import { WidgetState } from './WidgetState.js';

export class Widget {
	constructor(game, location, size, inverted = false, fade = 0.5) {
		this.game = game;
		this.location = location;
		this.size = size;
		this.inverted = inverted;
		this.fade = fade;
		this.state = WidgetState.OFF;
		this.timestamp = 0.0;
		this.startTime = 0.0;
		this.alpha = 0.0;
		this.blend = false;
	}

	start() {
		this.startTime = this.game.time;
	}

	show() {
		this.state = WidgetState.ON;
		this.alpha = 1.0;
		this.start();
	}

	hide() {
		this.state = WidgetState.OFF;
		this.alpha = 0.0;
	}

	fadeIn() {
		this.state = WidgetState.FADE_IN;
		this.timestamp = this.game.time;
	}

	fadeOut() {
		this.state = WidgetState.FADE_OUT;
		this.timestamp = this.game.time;
	}

	update() {
		if (this.state === WidgetState.OFF || this.state === WidgetState.ON) {
			return;
		}

		const elapsed = this.game.time - this.timestamp;
		const t = Math.min(elapsed / this.fade, 1.0);

		if (this.state === WidgetState.FADE_IN) {
			this.alpha = t;
			if (t >= 1.0) {
				this.state = WidgetState.ON;
				this.start();
			}
		} else {
			this.alpha = 1.0 - t;
			if (t >= 1.0) {
				this.state = WidgetState.OFF;
			}
		}

		this.render();
	}

	render() {
		const step = this.inverted ? -1 : 1;

		for (let i = 0; i < this.size; i++) {
			const pos = this.location + i * step;
			if (pos < 0 || pos >= this.game.resolution) {
				continue;
			}

			const value = this.renderPixel(i);
			if (this.blend) {
				this.game.blend(pos, value, this.alpha);
			} else {
				this.game.pixels[pos] = value;
			}
		}
	}

	renderPixel(i) {
		return 0x000000;
	}
}
