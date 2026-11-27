import { Command, WiredPad, InputEvent, ButtonEvent } from '../core/system.js';

export class WiredPadView {
	static COMMANDS = {
		UP: { press: Command.UP_PRESS, release: Command.UP_RELEASE },
		DOWN: { press: Command.DOWN_PRESS, release: Command.DOWN_RELEASE },
		LEFT: { press: Command.LEFT_PRESS, release: Command.LEFT_RELEASE },
		RIGHT: { press: Command.RIGHT_PRESS, release: Command.RIGHT_RELEASE },
		FIRE: { press: Command.FIRE_PRESS, release: Command.FIRE_RELEASE },
		FIRE2: { press: Command.FIRE2_PRESS, release: Command.FIRE2_RELEASE },
		A: { press: Command.A_PRESS, release: Command.A_RELEASE },
		B: { press: Command.B_PRESS, release: Command.B_RELEASE },
		C: { press: Command.C_PRESS, release: Command.C_RELEASE },
		D: { press: Command.D_PRESS, release: Command.D_RELEASE },
		POWER: { release: Command.POWER_SHORT_PRESS, hold: Command.POWER_LONG_PRESS },
		MENU: { release: Command.MENU_SHORT_PRESS, hold: Command.MENU_LONG_PRESS },
		PAUSE: { release: Command.PAUSE_SHORT_PRESS, hold: Command.PAUSE_LONG_PRESS },
		BT: { release: Command.BT_SHORT_PRESS, hold: Command.BT_LONG_PRESS },
	};

	static DIRECTION_NAMES = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'FIRE', 'FIRE2'];
	static NAMED_NAMES = ['A', 'B', 'C', 'D'];
	static SYSTEM_NAMES = ['POWER', 'MENU', 'PAUSE', 'BT'];

	static PANEL_BUTTON_NAMES = {
		[Command.A_PRESS]: 'A',
		[Command.B_PRESS]: 'B',
		[Command.C_PRESS]: 'C',
		[Command.D_PRESS]: 'D',
		[Command.FIRE_PRESS]: 'FIRE',
		[Command.FIRE2_PRESS]: 'FIRE2',
		[Command.UP_PRESS]: 'UP',
		[Command.DOWN_PRESS]: 'DOWN',
		[Command.LEFT_PRESS]: 'LEFT',
		[Command.RIGHT_PRESS]: 'RIGHT',
	};

	constructor(system, id) {
		this.system = system;
		this.id = id;
		this.panel = null;
		this.pad = new WiredPad(system, id);
		this.pressed = {};
	}

	update() {
	}

	setButtonPressed(index, pressed) {
		if (!this.panel) {
			return;
		}
		this.pressed[WiredPadView.PANEL_BUTTON_NAMES[this.panel.pressCommands[index]]] = pressed;
	}

	setDirectionPressed(index, pressed) {
		this.pressed[WiredPadView.DIRECTION_NAMES[index]] = pressed;
	}

	setNamedButtonPressed(index, pressed) {
		this.pressed[WiredPadView.NAMED_NAMES[index]] = pressed;
	}

	setSystemButtonPressed(index, pressed) {
		this.pressed[WiredPadView.SYSTEM_NAMES[index]] = pressed;
	}

	loop() {
		for (const name in this.pad.buttons) {
			const commands = WiredPadView.COMMANDS[name];
			const event = this.pad.buttons[name].process(this.pressed[name] ?? false);
			if (!event) {
				continue;
			}
			this.system.log(`pad ${this.id}: ${name} ${event}`);
			if (event === ButtonEvent.PRESS && commands.press) {
				this.system.handleCommand(this.id, new InputEvent(commands.press));
			} else if (event === ButtonEvent.RELEASE && commands.release) {
				this.system.handleCommand(this.id, new InputEvent(commands.release));
			} else if (event === ButtonEvent.HOLDRELEASE && commands.release && !commands.hold) {
				this.system.handleCommand(this.id, new InputEvent(commands.release));
			} else if (event === ButtonEvent.HOLD && commands.hold) {
				this.system.handleCommand(this.id, new InputEvent(commands.hold));
			}
		}
	}
}
