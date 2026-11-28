export const ButtonState = Object.freeze({
	IDLE: 'IDLE',
	PRESS: 'PRESS',
	HOLD: 'HOLD',
});
export const ButtonEvent = Object.freeze({
	PRESS: 'PRESS',
	RELEASE: 'RELEASE',
	HOLD: 'HOLD',
	HOLDRELEASE: 'HOLDRELEASE',
});

export class Button {
	static HOLD_DURATION = 5.0;

	static A = 0;
	static B = 1;
	static C = 2;
	static D = 3;
	static X = 4;
	static Y = 5;
	static Z = 6;
	static W = 7;
	static FIRE = 8;
	static FIRE2 = 9;
	static UP = 10;
	static DOWN = 11;
	static LEFT = 12;
	static RIGHT = 13;
	static POWER = 14;
	static MENU = 15;
	static PAUSE = 16;
	static BT = 17;

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
			if ((now - this.pressTimestamp) >= Button.HOLD_DURATION) {
				this.state = ButtonState.HOLD;
				this.held = true;
				return ButtonEvent.HOLD;
			}
		}
		return null;
	}
}
