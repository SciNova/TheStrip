import { Widget } from './Widget.js';

export class ProgressBar extends Widget {
	constructor(game, location, size, color, inverted = false) {
		super(game, location, size, inverted);
		this.color = color;
		this.value = 0.0;
	}

	renderPixel(i) {
		const filled = Math.min(Math.round(this.value * this.size), this.size);
		return i < filled ? this.color : 0x000000;
	}
}
