const HOLD_DURATION = 5.0;

export const ButtonState = Object.freeze({ IDLE: 'IDLE', PRESS: 'PRESS', HOLD: 'HOLD' });
export const ButtonEvent = Object.freeze({ PRESS: 'PRESS', RELEASE: 'RELEASE', HOLD: 'HOLD', HOLDRELEASE: 'HOLDRELEASE' });

export class Button {
	constructor(system) {
		this.system = system;
		this.state = ButtonState.IDLE;
		this.pressTimestamp = 0.0;
		this.held = false;
	}

	process(value) {
		const now = this.system.clock.timestamp;
		if (value && this.state === ButtonState.IDLE) {
			this.state = ButtonState.PRESS;
			this.pressTimestamp = now;
			this.held = false;
			return ButtonEvent.PRESS;
		} else if (!value && (this.state === ButtonState.PRESS || this.state === ButtonState.HOLD)) {
			const event = this.state === ButtonState.HOLD ? ButtonEvent.HOLDRELEASE : ButtonEvent.RELEASE;
			this.state = ButtonState.IDLE;
			return event;
		} else if (this.state === ButtonState.PRESS && !this.held) {
			if ((now - this.pressTimestamp) >= HOLD_DURATION) {
				this.state = ButtonState.HOLD;
				this.held = true;
				return ButtonEvent.HOLD;
			}
		}
		return null;
	}
}
