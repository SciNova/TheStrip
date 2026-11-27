const DEBOUNCE_DURATION = 0.0;

export const EncoderState = Object.freeze({ IDLE: 'IDLE', DEBOUNCING: 'DEBOUNCING' });
export const EncoderEvent = Object.freeze({ LEFT: 'LEFT', RIGHT: 'RIGHT' });

export class Encoder {
	constructor() {
		this.state = EncoderState.IDLE;
		this.rawQuadState = 0;
		this.previousQuadState = 0;
		this.clkTimestamp = 0.0;
		this.inputChangeTimestamp = 0.0;
	}

	update(clk, direction, now) {
		const currentRaw = (clk << 1) | direction;
		if (currentRaw !== this.rawQuadState) {
			this.rawQuadState = currentRaw;
			this.inputChangeTimestamp = now;
		}

		let debounced = this.previousQuadState;
		if ((now - this.inputChangeTimestamp) >= DEBOUNCE_DURATION) {
			debounced = this.rawQuadState;
		}

		let event = null;
		if (debounced !== this.previousQuadState) {
			const transition = (this.previousQuadState << 2) | debounced;
			if (this.state === EncoderState.IDLE) {
				if ([0x01, 0x07, 0x0E, 0x08].includes(transition)) {
					event = EncoderEvent.RIGHT;
				} else if ([0x02, 0x0B, 0x0D, 0x04].includes(transition)) {
					event = EncoderEvent.LEFT;
				}
				if (event !== null) {
					this.clkTimestamp = now;
					this.state = EncoderState.DEBOUNCING;
				}
			}
		}

		this.previousQuadState = debounced;
		if (this.state === EncoderState.DEBOUNCING && (now - this.clkTimestamp) >= DEBOUNCE_DURATION) {
			this.state = EncoderState.IDLE;
		}

		return event;
	}
}
