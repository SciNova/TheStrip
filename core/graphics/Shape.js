import { System } from '../system.js';
import { Alignment } from './Alignment.js';
import { EdgeMode } from './EdgeMode.js';

export class Shape {
	constructor(game, size, alignment = Alignment.CENTER) {
		this.game = game;
		this.alignment = alignment;
		this.pixels = new Array(size).fill(null);
		this.rotation = 0.0;
		this.viewAngle = 0.0;
	}

	update() {
	}

	render(position, edge = EdgeMode.CLIP, scale = 1.0) {
		if (scale <= 0) {
			return;
		}

		const srcLen = this.pixels.length;
		let scaledLen = Math.ceil(srcLen * scale);
		if (scaledLen % 2 === 0) {
			scaledLen += 1;
		}

		const temp = new Array(scaledLen).fill(null);
		for (let i = 0; i < scaledLen; i++) {
			const offset = i - (scaledLen - 1) / 2.0;
			const srcIndex = Math.round((srcLen - 1) / 2.0 + offset / scale);
			if (srcIndex >= 0 && srcIndex < srcLen && this.pixels[srcIndex] !== null) {
				temp[i] = System.balanceColors(this.pixels[srcIndex]);
			}
		}

		const half = Math.floor((scaledLen - 1) / 2);
		let drawStart;
		if (this.alignment === Alignment.CENTER) {
			drawStart = Math.round(position) - half;
		} else if (this.alignment === Alignment.FORWARD) {
			drawStart = Math.round(position);
		} else {
			drawStart = Math.round(position) - scaledLen + 1;
		}

		for (let i = 0; i < temp.length; i++) {
			const px = temp[i];
			if (px === null) {
				continue;
			}
			let pixelPos = drawStart + i;

			if (edge === EdgeMode.CLIP) {
				if (pixelPos >= 0 && pixelPos < this.game.resolution) {
					this.game.pixels[pixelPos] = px;
				}
			} else if (edge === EdgeMode.MIRROR) {
				while (pixelPos < 0) {
					pixelPos = -pixelPos;
				}
				while (pixelPos >= this.game.resolution) {
					pixelPos = 2 * (this.game.resolution - 1) - pixelPos;
				}
				this.game.pixels[pixelPos] = px;
			} else {
				pixelPos = ((pixelPos % this.game.resolution) + this.game.resolution) % this.game.resolution;
				this.game.pixels[pixelPos] = px;
			}
		}
	}
}
