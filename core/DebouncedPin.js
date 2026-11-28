export class DebouncedPin {
	static DEBOUNCE_DURATION = 0.0;

	constructor() {
		this.state = false;
		this.timestamp = 0.0;
	}

	process(value, now) {
		if (value !== this.state) {
			this.timestamp = now;
		}
		if ((now - this.timestamp) >= DebouncedPin.DEBOUNCE_DURATION && value !== this.state) {
			this.state = value;
		}
		return this.state;
	}
}
