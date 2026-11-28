import { System } from './System.js';
import { Audio } from './audio/Audio.js';
import { WiredPad } from './WiredPad.js';
import { Button, ButtonEvent } from './Button.js';
import { Command } from './Command.js';
import { InputEvent } from './InputEvent.js';

export class WiredConsole {
	constructor(resolution) {
		this.system = new System(resolution);
		this.system.audio = new Audio(this.system);
		this.pads = [
			new WiredPad(this, 0),
			new WiredPad(this, 1),
		];
		this.inputs = [
			[false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
			[false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
		];
	}

	loop() {
		this.system.loop();

		const pad0 = this.pads[0];

		let event = pad0.buttons[Button.A].process(this.inputs[0][Button.A]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.A_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.A_RELEASE));

		event = pad0.buttons[Button.B].process(this.inputs[0][Button.B]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.B_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.B_RELEASE));

		event = pad0.buttons[Button.C].process(this.inputs[0][Button.C]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.C_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.C_RELEASE));

		event = pad0.buttons[Button.D].process(this.inputs[0][Button.D]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.D_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.D_RELEASE));

		pad0.buttons[Button.X].process(this.inputs[0][Button.X]);
		pad0.buttons[Button.Y].process(this.inputs[0][Button.Y]);
		pad0.buttons[Button.Z].process(this.inputs[0][Button.Z]);
		pad0.buttons[Button.W].process(this.inputs[0][Button.W]);

		event = pad0.buttons[Button.FIRE].process(this.inputs[0][Button.FIRE]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.FIRE_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.FIRE_RELEASE));

		event = pad0.buttons[Button.FIRE2].process(this.inputs[0][Button.FIRE2]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.FIRE2_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.FIRE2_RELEASE));

		event = pad0.buttons[Button.UP].process(this.inputs[0][Button.UP]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.UP_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.UP_RELEASE));

		event = pad0.buttons[Button.DOWN].process(this.inputs[0][Button.DOWN]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.DOWN_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.DOWN_RELEASE));

		event = pad0.buttons[Button.LEFT].process(this.inputs[0][Button.LEFT]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.LEFT_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.LEFT_RELEASE));

		event = pad0.buttons[Button.RIGHT].process(this.inputs[0][Button.RIGHT]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad0.id, new InputEvent(Command.RIGHT_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.RIGHT_RELEASE));

		event = pad0.buttons[Button.POWER].process(this.inputs[0][Button.POWER]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.POWER_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad0.id, new InputEvent(Command.POWER_LONG_PRESS));

		event = pad0.buttons[Button.MENU].process(this.inputs[0][Button.MENU]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.MENU_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad0.id, new InputEvent(Command.MENU_LONG_PRESS));

		event = pad0.buttons[Button.PAUSE].process(this.inputs[0][Button.PAUSE]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.PAUSE_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad0.id, new InputEvent(Command.PAUSE_LONG_PRESS));

		event = pad0.buttons[Button.BT].process(this.inputs[0][Button.BT]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad0.id, new InputEvent(Command.BT_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad0.id, new InputEvent(Command.BT_LONG_PRESS));

		const pad1 = this.pads[1];

		event = pad1.buttons[Button.A].process(this.inputs[1][Button.A]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.A_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.A_RELEASE));

		event = pad1.buttons[Button.B].process(this.inputs[1][Button.B]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.B_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.B_RELEASE));

		event = pad1.buttons[Button.C].process(this.inputs[1][Button.C]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.C_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.C_RELEASE));

		event = pad1.buttons[Button.D].process(this.inputs[1][Button.D]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.D_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.D_RELEASE));

		pad1.buttons[Button.X].process(this.inputs[1][Button.X]);
		pad1.buttons[Button.Y].process(this.inputs[1][Button.Y]);
		pad1.buttons[Button.Z].process(this.inputs[1][Button.Z]);
		pad1.buttons[Button.W].process(this.inputs[1][Button.W]);

		event = pad1.buttons[Button.FIRE].process(this.inputs[1][Button.FIRE]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.FIRE_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.FIRE_RELEASE));

		event = pad1.buttons[Button.FIRE2].process(this.inputs[1][Button.FIRE2]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.FIRE2_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.FIRE2_RELEASE));

		event = pad1.buttons[Button.UP].process(this.inputs[1][Button.UP]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.UP_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.UP_RELEASE));

		event = pad1.buttons[Button.DOWN].process(this.inputs[1][Button.DOWN]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.DOWN_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.DOWN_RELEASE));

		event = pad1.buttons[Button.LEFT].process(this.inputs[1][Button.LEFT]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.LEFT_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.LEFT_RELEASE));

		event = pad1.buttons[Button.RIGHT].process(this.inputs[1][Button.RIGHT]);
		if (event === ButtonEvent.PRESS) this.system.handleCommand(pad1.id, new InputEvent(Command.RIGHT_PRESS));
		else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.RIGHT_RELEASE));

		event = pad1.buttons[Button.POWER].process(this.inputs[1][Button.POWER]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.POWER_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad1.id, new InputEvent(Command.POWER_LONG_PRESS));

		event = pad1.buttons[Button.MENU].process(this.inputs[1][Button.MENU]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.MENU_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad1.id, new InputEvent(Command.MENU_LONG_PRESS));

		event = pad1.buttons[Button.PAUSE].process(this.inputs[1][Button.PAUSE]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.PAUSE_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad1.id, new InputEvent(Command.PAUSE_LONG_PRESS));

		event = pad1.buttons[Button.BT].process(this.inputs[1][Button.BT]);
		if (event === ButtonEvent.RELEASE) this.system.handleCommand(pad1.id, new InputEvent(Command.BT_SHORT_PRESS));
		else if (event === ButtonEvent.HOLD) this.system.handleCommand(pad1.id, new InputEvent(Command.BT_LONG_PRESS));
	}
}
