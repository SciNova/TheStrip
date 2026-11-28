import { Button, ButtonEvent } from './Button.js';
import { Pad } from './Pad.js';
import { Command } from './Command.js';
import { InputEvent } from './InputEvent.js';

export class WiredPad extends Pad {
	constructor(console, id) {
		super(console.system, id);
		this.console = console;
		this.buttons = [
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
			new Button(console.system),
		];
	}
}
