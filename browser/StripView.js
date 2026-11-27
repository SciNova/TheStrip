import { SystemState } from '../core/system.js';

export class StripView {
	constructor(container, system) {
		this.container = container;
		this.system = system;
		this.pixelElements = [];
		this.container.innerHTML = '';
		for (let i = 0; i < this.system.strip.length; i++) {
			const div = document.createElement('div');
			div.className = 'pixel';
			this.container.appendChild(div);
			this.pixelElements.push(div);
		}
	}

	begin() {}

	update() {
		const dark = this.system.state === SystemState.OFF;
		for (let i = 0; i < this.system.strip.length; i++) {
			const packed = dark ? 0x000000 : this.system.strip.pixels[i];
			const r = (packed >> 16) & 0xFF;
			const g = (packed >> 8) & 0xFF;
			const b = packed & 0xFF;
			const toHex = (n) => n.toString(16).padStart(2, '0');
			const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
			this.pixelElements[i].style.backgroundColor = color;
		}
	}

	cleanup() {
		this.container.innerHTML = '';
	}
}
