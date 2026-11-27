export class Clock {
	constructor() {
		this.time = 0.0;
		this.timestamp = 0.0;
		this.delta = 0.0;
		this.now = null;
	}

	update() {
		const now = this.now();
		this.delta = this.timestamp === 0.0 ? 0.0 : now - this.timestamp;
		this.timestamp = now;
		this.time = now;
	}
}
