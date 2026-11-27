const DEBOUNCE_DURATION = 0.0;

export class DebouncedPin {
	constructor() {
		this.state = false;
		this.timestamp = 0.0;
	}

	process(value, now) {
		if (value !== this.state) {
			this.timestamp = now;
		}
		if ((now - this.timestamp) >= DEBOUNCE_DURATION && value !== this.state) {
			this.state = value;
		}
		return this.state;
	}
}
