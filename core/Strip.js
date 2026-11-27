export class Strip {
	constructor(length) {
		this.length = length;
		this.pixels = new Array(length).fill(0);
	}

	clear() {
		for (let i = 0; i < this.length; i++) {
			this.pixels[i] = 0;
		}
	}
}
