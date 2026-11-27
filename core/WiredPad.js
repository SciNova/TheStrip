import { Button } from './Button.js';
import { Pad } from './Pad.js';

export class WiredPad extends Pad {
	constructor(system, id) {
		super(system, id);
		this.buttons = {
			A: new Button(system), B: new Button(system), C: new Button(system), D: new Button(system),
			X: new Button(system), Y: new Button(system), Z: new Button(system), W: new Button(system),
			FIRE: new Button(system), FIRE2: new Button(system),
			UP: new Button(system), DOWN: new Button(system), LEFT: new Button(system), RIGHT: new Button(system),
			POWER: new Button(system), MENU: new Button(system), PAUSE: new Button(system), BT: new Button(system),
		};
	}
}
