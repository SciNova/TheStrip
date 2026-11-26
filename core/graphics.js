import { balanceColors } from './system.js';

export const Alignment = Object.freeze({ CENTER: 'CENTER', FORWARD: 'FORWARD', BACKWARD: 'BACKWARD' });
export const EdgeMode = Object.freeze({ CLIP: 'CLIP', MIRROR: 'MIRROR', WRAP: 'WRAP' });

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
				temp[i] = balanceColors(this.pixels[srcIndex]);
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

export class Shape2D extends Shape {
	constructor(game, size, alignment = Alignment.CENTER) {
		super(game, size, alignment);
		this.z = 0.0;
		this.x = 0.0;
	}

	collides(z, x) {
		const radius = this.pixels.length / 2.0;
		let dx = this.x - x;
		let dz = this.z - z;
		const world = this.game.world;
		if (world.wrapsZ) {
			const halfZ = world.width * this.game.resolution / 2.0;
			dz = (((dz + halfZ) % (2 * halfZ)) + (2 * halfZ)) % (2 * halfZ) - halfZ;
		}
		if (world.wrapsX) {
			const halfX = world.depth * this.game.resolution / 2.0;
			dx = (((dx + halfX) % (2 * halfX)) + (2 * halfX)) % (2 * halfX) - halfX;
		}
		return (dx * dx + dz * dz) < (radius * radius);
	}
}

export class SquareView {
	static update(obj) {
		for (let i = 0; i < obj.pixels.length; i++) {
			obj.pixels[i] = null;
		}

		const faceSize = obj.faces[0].length;
		const faceCount = obj.faces.length;

		let eff = obj.rotation - obj.viewAngle;
		if (obj.invert) {
			eff += 0.5;
		}
		eff = eff % 1.0;
		if (eff < 0) {
			eff += 1.0;
		}

		const quarterRotation = (eff * faceCount) % 1.0;
		const angle = quarterRotation * Math.PI / 2.0;
		const cosA = Math.cos(angle);
		const sinA = Math.sin(angle);

		const length1 = Math.floor(cosA * faceSize);
		const length2 = Math.floor(sinA * faceSize);
		const totalWidth = length1 + length2;
		const startPos = Math.floor((obj.pixels.length - totalWidth) / 2);

		const faceIndex = Math.floor(eff * faceCount) % faceCount;
		const nextFaceIndex = (faceIndex + 1) % faceCount;
		const pattern1 = obj.faces[faceIndex];
		const pattern2 = obj.faces[nextFaceIndex];

		const maxY = faceSize * Math.sqrt(2) / 2.0;

		if (length1 > 0) {
			for (let p = 0; p < length1; p++) {
				const xFace = (p / length1 - 0.5) * faceSize;
				const y = xFace * sinA;
				let intensity = (y + maxY) / (2.0 * maxY);
				if (intensity < 0) intensity = 0;
				if (intensity > 1) intensity = 1;
				const patternPos = Math.min(faceSize - 1, Math.max(0, Math.floor(p / length1 * faceSize)));
				const src = pattern1[patternPos];
				if (src !== null && src !== undefined) {
					const r = (src >> 16) & 0xFF;
					const g = (src >> 8) & 0xFF;
					const b = src & 0xFF;
					obj.pixels[startPos + p] = (Math.floor(r * intensity) << 16) | (Math.floor(g * intensity) << 8) | Math.floor(b * intensity);
				}
			}
		}

		if (length2 > 0) {
			for (let p = 0; p < length2; p++) {
				const yFace = (p / length2 - 0.5) * faceSize;
				const y = yFace * cosA;
				const rawIntensity = (y + maxY) / (2.0 * maxY);
				let intensity = 1.0 - rawIntensity;
				if (intensity < 0) intensity = 0;
				if (intensity > 1) intensity = 1;
				const patternPos = Math.min(faceSize - 1, Math.max(0, Math.floor(p / length2 * faceSize)));
				const src = pattern2[patternPos];
				if (src !== null && src !== undefined) {
					const r = (src >> 16) & 0xFF;
					const g = (src >> 8) & 0xFF;
					const b = src & 0xFF;
					obj.pixels[startPos + length1 + p] = (Math.floor(r * intensity) << 16) | (Math.floor(g * intensity) << 8) | Math.floor(b * intensity);
				}
			}
		}
	}
}

export class Square extends Shape {
	constructor(game, faces, invert = false) {
		const faceSize = faces[0].length;
		let size = Math.ceil(faceSize * Math.sqrt(2));
		if (size % 2 === 0) {
			size += 1;
		}
		super(game, size, Alignment.CENTER);
		this.faces = faces;
		this.invert = invert;
	}

	update() {
		SquareView.update(this);
	}
}

export class Square2D extends Shape2D {
	constructor(game, faces, invert = false) {
		const faceSize = faces[0].length;
		let size = Math.ceil(faceSize * Math.sqrt(2));
		if (size % 2 === 0) {
			size += 1;
		}
		super(game, size, Alignment.CENTER);
		this.faces = faces;
		this.invert = invert;
	}

	update() {
		SquareView.update(this);
	}
}

export class Camera {
	constructor(x = 0.0, z = 0.0, rotation = 0.0) {
		this.x = x;
		this.z = z;
		this.rotation = rotation;
	}
}

export class BasePlayer {
	constructor(game) {
		this.game = game;
	}
}

export class BasePlayer1D extends BasePlayer {
	constructor(game) {
		super(game);
		this.location = 0.0;
	}

	distance(location) {
		const world = this.game.world;
		let d = this.location - location;
		if (world.wraps) {
			const half = world.size * this.game.resolution / 2.0;
			d = (((d + half) % (2 * half)) + (2 * half)) % (2 * half) - half;
		}
		return Math.abs(d);
	}
}

export class BasePlayer2D extends BasePlayer {
	constructor(game) {
		super(game);
		this.z = 0.0;
		this.x = 0.0;
		this.rotation = 0.0;
	}

	distance(z, x) {
		const world = this.game.world;
		let dx = this.x - x;
		let dz = this.z - z;
		if (world.wrapsZ) {
			const halfZ = world.width * this.game.resolution / 2.0;
			dz = (((dz + halfZ) % (2 * halfZ)) + (2 * halfZ)) % (2 * halfZ) - halfZ;
		}
		if (world.wrapsX) {
			const halfX = world.depth * this.game.resolution / 2.0;
			dx = (((dx + halfX) % (2 * halfX)) + (2 * halfX)) % (2 * halfX) - halfX;
		}
		return Math.sqrt(dx * dx + dz * dz);
	}

	direction(z, x) {
		const dx = x - this.x;
		const dz = z - this.z;
		const angle = Math.atan2(dz, dx);
		return ((angle / (2 * Math.PI) + 1) % 1 + 1) % 1;
	}
}

export class BaseWorld {
}

export class World extends BaseWorld {
	constructor(size, wraps) {
		super();
		this.size = size;
		this.wraps = wraps;
	}
}

export class World2D extends BaseWorld {
	constructor(width, depth, wrapsX, wrapsZ) {
		super();
		this.width = width;
		this.depth = depth;
		this.wrapsX = wrapsX;
		this.wrapsZ = wrapsZ;
	}
}

export const WidgetState = Object.freeze({ OFF: 'OFF', FADE_IN: 'FADE_IN', ON: 'ON', FADE_OUT: 'FADE_OUT' });

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
