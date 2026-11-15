import { Command, InputEvent, Button, ButtonEvent } from '../core/system.js';

export const PcbPanelModel = Object.freeze({
	NONE: 'NONE',
	ABCD: 'ABCD',
	ABC: 'ABC',
	F: 'F',
	UD: 'UD',
	LR: 'LR',
	LRF: 'LRF',
	UDF: 'UDF',
	LRUDFF: 'LRUDFF',
});

class PcbPanel {
	constructor(model, pressCommands) {
		this.model = model;
		this.pressCommands = pressCommands;
	}
}

export class PcbPanelABCD extends PcbPanel {
	constructor() {
		super(PcbPanelModel.ABCD, [Command.A_PRESS, Command.B_PRESS, Command.C_PRESS, Command.D_PRESS]);
	}
}

export class PcbPanelABC extends PcbPanel {
	constructor() {
		super(PcbPanelModel.ABC, [Command.A_PRESS, Command.B_PRESS, Command.C_PRESS]);
	}
}

export class PcbPanelF extends PcbPanel {
	constructor() {
		super(PcbPanelModel.F, [Command.FIRE_PRESS]);
	}
}

export class PcbPanelUD extends PcbPanel {
	constructor() {
		super(PcbPanelModel.UD, [Command.UP_PRESS, Command.DOWN_PRESS]);
	}
}

export class PcbPanelLR extends PcbPanel {
	constructor() {
		super(PcbPanelModel.LR, [Command.LEFT_PRESS, Command.RIGHT_PRESS]);
	}
}

export class PcbPanelLRF extends PcbPanel {
	constructor() {
		super(PcbPanelModel.LRF, [Command.LEFT_PRESS, Command.RIGHT_PRESS, Command.FIRE_PRESS]);
	}
}

export class PcbPanelUDF extends PcbPanel {
	constructor() {
		super(PcbPanelModel.UDF, [Command.UP_PRESS, Command.DOWN_PRESS, Command.FIRE_PRESS]);
	}
}

export class PcbPanelLRUDFF extends PcbPanel {
	constructor() {
		super(PcbPanelModel.LRUDFF, [
			Command.LEFT_PRESS, Command.RIGHT_PRESS, Command.UP_PRESS, Command.DOWN_PRESS,
			Command.FIRE_PRESS, Command.FIRE2_PRESS,
		]);
	}
}

export const PANEL_CLASSES = Object.freeze({
	ABCD: PcbPanelABCD,
	ABC: PcbPanelABC,
	F: PcbPanelF,
	UD: PcbPanelUD,
	LR: PcbPanelLR,
	LRF: PcbPanelLRF,
	UDF: PcbPanelUDF,
	LRUDFF: PcbPanelLRUDFF,
});

const DIRECTION_COMMANDS = [
	Command.UP_PRESS, Command.DOWN_PRESS, Command.LEFT_PRESS, Command.RIGHT_PRESS,
	Command.FIRE_PRESS, Command.FIRE2_PRESS,
];

// Always available regardless of which panel (if any) is selected — a
// keyboard shortcut just injects a raw press/release, the same as clicking
// a panel's own on-screen button. Neither path knows about the other.
const NAMED_COMMANDS = [
	Command.A_PRESS, Command.B_PRESS, Command.C_PRESS, Command.D_PRESS,
];

export class ControlPad {
	constructor(system) {
		this.system = system;
		this.id = 0;
		this.panel = null;
		this.buttons = [];
		this.pressedState = [];
		this.directionButtons = DIRECTION_COMMANDS.map(() => new Button());
		this.directionPressedState = new Array(DIRECTION_COMMANDS.length).fill(false);
		this.namedButtons = NAMED_COMMANDS.map(() => new Button());
		this.namedPressedState = new Array(NAMED_COMMANDS.length).fill(false);
	}

	update() {
		this.buttons = this.panel ? this.panel.pressCommands.map(() => new Button()) : [];
		this.pressedState = new Array(this.buttons.length).fill(false);
	}

	setButtonPressed(index, pressed) {
		this.pressedState[index] = pressed;
	}

	setDirectionPressed(index, pressed) {
		this.directionPressedState[index] = pressed;
	}

	setNamedButtonPressed(index, pressed) {
		this.namedPressedState[index] = pressed;
	}

	poll(now) {
		if (this.panel) {
			for (let i = 0; i < this.buttons.length; i++) {
				const event = this.buttons[i].process(this.pressedState[i], now);
				if (event === ButtonEvent.PRESS) {
					this.system.handleCommand(this.id, new InputEvent(this.panel.pressCommands[i]));
				} else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) {
					this.system.handleCommand(this.id, new InputEvent(this.panel.pressCommands[i] + 1));
				}
			}
		}

		for (let i = 0; i < this.directionButtons.length; i++) {
			const event = this.directionButtons[i].process(this.directionPressedState[i], now);
			if (event === ButtonEvent.PRESS) {
				this.system.handleCommand(this.id, new InputEvent(DIRECTION_COMMANDS[i]));
			} else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) {
				this.system.handleCommand(this.id, new InputEvent(DIRECTION_COMMANDS[i] + 1));
			}
		}

		for (let i = 0; i < this.namedButtons.length; i++) {
			const event = this.namedButtons[i].process(this.namedPressedState[i], now);
			if (event === ButtonEvent.PRESS) {
				this.system.handleCommand(this.id, new InputEvent(NAMED_COMMANDS[i]));
			} else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) {
				this.system.handleCommand(this.id, new InputEvent(NAMED_COMMANDS[i] + 1));
			}
		}
	}
}
